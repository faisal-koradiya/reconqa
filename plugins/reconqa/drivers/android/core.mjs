// ReconQA Android driver core: everything except the MCP wire protocol, so tests can run it with a
// fake adb. The driver talks to ONE device (app.android.device) and ONE app (app.android.package).
// It never offers a raw shell: each tool maps to a fixed adb command built here.
//
// Safety rules (checked on every call, not only at start):
//   - the device must be set in the kit and be connected; it is passed to adb with -s every time,
//     so another connected phone is never touched
//   - a real phone (serial not "emulator-NNNN") needs app.android.allow_real_device: true
//   - taps, typing and swipes only happen while the test app (or a listed extra package, such as
//     the permission dialog) is in front; otherwise the call is refused and "back" or "launch" is
//     the way out
//   - "clear_app_data" only clears the test app, and only with app.android.allow_reset: true

export const KEYS = { back: 'KEYCODE_BACK', enter: 'KEYCODE_ENTER', tab: 'KEYCODE_TAB', del: 'KEYCODE_DEL', escape: 'KEYCODE_ESCAPE' };
const SERIAL = /^[A-Za-z0-9._:-]+$/;
const PACKAGE = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/;

export class DriverError extends Error {}

// ---- settings ---------------------------------------------------------------

export function settings(config) {
  const a = config?.app?.android ?? {};
  const s = {
    device: a.device ?? null,
    pkg: a.package ?? null,
    extra: Array.isArray(a.extra_packages) ? a.extra_packages : [],
    allowReal: a.allow_real_device === true,
    allowReset: a.allow_reset === true,
  };
  if (config?.app?.target !== 'android') throw new DriverError('app.target is not "android" in .reconqa/kit.yml, so the Android driver is off.');
  if (!s.device || !SERIAL.test(s.device)) throw new DriverError('Set app.android.device in .reconqa/kit.yml (the serial from "adb devices", for example emulator-5554).');
  if (!s.pkg || !PACKAGE.test(s.pkg)) throw new DriverError('Set app.android.package in .reconqa/kit.yml (the test app, for example org.example.app).');
  for (const p of s.extra) if (!PACKAGE.test(p)) throw new DriverError(`app.android.extra_packages has a bad package name: ${p}`);
  if (!isEmulator(s.device) && !s.allowReal) {
    throw new DriverError(`${s.device} looks like a real phone. ReconQA drives emulators by default; set app.android.allow_real_device: true if this is a test phone.`);
  }
  return s;
}

export const isEmulator = (serial) => /^emulator-\d+$/.test(serial);

// ---- adb output parsing -----------------------------------------------------

// "adb devices" -> Map serial -> state
export function parseDevices(out) {
  const m = new Map();
  for (const line of String(out).split(/\r?\n/).slice(1)) {
    const [serial, state] = line.trim().split(/\s+/);
    if (serial && state) m.set(serial, state);
  }
  return m;
}

// Foreground app from "dumpsys window". mCurrentFocus is the window that gets taps. An app's own
// popup (PopupWindow:...) has no package name, so the focused app is used; any other window
// without a package (notification shade, system dialog) is reported by its name and so refused.
export function parseFocus(out) {
  const txt = String(out);
  const cur = txt.match(/mCurrentFocus=Window\{\S+ \S+ ([^}\s]+)\}/)?.[1];
  const app = txt.match(/mFocusedApp=\S*\{\S+ \S+ ([A-Za-z0-9_.]+)\/([A-Za-z0-9_.$]+)/);
  if (cur && cur.includes('/')) { const [pkg, activity] = cur.split('/'); return { pkg, activity }; }
  if (cur && /^PopupWindow:/.test(cur) && app) return { pkg: app[1], activity: app[2], popup: true };
  if (cur) return { pkg: cur, activity: null };
  return { pkg: null, activity: null }; // nothing has focus: refuse rather than guess
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const unescapeXml = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e.toLowerCase()]);
const attr = (tag, k) => { const m = tag.match(new RegExp(`\\s${k}="([^"]*)"`)); return m ? unescapeXml(m[1]) : ''; };

// Parses "uiautomator dump --windows" (or a plain dump) into windows with useful nodes.
// Keyboard and system bar windows are skipped: they are not part of the app.
export function parseDump(xml) {
  const windows = [];
  const plain = !/<window\s/.test(xml);
  const stack = plain ? [{ title: 'app', type: 'TYPE_APPLICATION', nodes: [] }] : [];
  if (plain) windows.push(stack[0]);
  // A window can list its child windows again inside itself; only top-level windows count, so a
  // popup is not shown twice and the parent's own nodes are not filed under it.
  for (const m of String(xml).matchAll(/<(\/?)(window)\b[^>]*>|<node\s[^>]*>/g)) {
    const tag = m[0];
    if (m[2] === 'window') {
      if (m[1]) { stack.pop(); continue; }
      const w = { title: attr(tag, 'title'), type: attr(tag, 'type'), nodes: [] };
      if (!stack.length) windows.push(w); else w.nested = true;
      if (!tag.endsWith('/>')) stack.push(w);
      continue;
    }
    const cur = stack[stack.length - 1];
    if (!cur || cur.nested) continue;
    const n = {
      text: attr(tag, 'text'), desc: attr(tag, 'content-desc'), id: attr(tag, 'resource-id').split('/').pop(),
      cls: attr(tag, 'class').split('.').pop(), pkg: attr(tag, 'package'),
      clickable: attr(tag, 'clickable') === 'true', editable: /EditText|AutoCompleteTextView/.test(attr(tag, 'class')),
      checkable: attr(tag, 'checkable') === 'true', checked: attr(tag, 'checked') === 'true',
      enabled: attr(tag, 'enabled') !== 'false', focused: attr(tag, 'focused') === 'true',
      password: attr(tag, 'password') === 'true', scrollable: attr(tag, 'scrollable') === 'true',
      bounds: parseBounds(attr(tag, 'bounds')),
    };
    if (n.text || n.desc || n.clickable || n.editable || n.checkable || n.scrollable) cur.nodes.push(n);
  }
  return windows.filter((w) => !/INPUT_METHOD|SYSTEM|ACCESSIBILITY_OVERLAY/.test(w.type) && w.nodes.length);
}

export function parseBounds(b) {
  const m = String(b).match(/\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/);
  if (!m) return null;
  const [x1, y1, x2, y2] = m.slice(1).map(Number);
  return { x1, y1, x2, y2, cx: Math.round((x1 + x2) / 2), cy: Math.round((y1 + y2) / 2) };
}

// Text snapshot with refs (e1, e2, ...). Popups and dialogs come first: they hold the error
// messages. A password field's text is never shown.
export function renderSnapshot(windows, focus) {
  const refs = new Map();
  const lines = [`App in front: ${focus.pkg ?? 'unknown'}${focus.activity ? ' / ' + focus.activity : ''}`];
  const ordered = [...windows].sort((a, b) => (a.title === 'Popup Window' ? -1 : 0) - (b.title === 'Popup Window' ? -1 : 0));
  let i = 0;
  for (const w of ordered) {
    lines.push(`Window: ${w.title || w.type}${w.title === 'Popup Window' ? ' (popup: error messages and menus show here)' : ''}`);
    for (const n of w.nodes) {
      const ref = `e${++i}`;
      refs.set(ref, n);
      const text = n.password && n.text ? '••• (hidden)' : n.text;
      const bits = [n.cls];
      if (text) bits.push(JSON.stringify(text));
      if (n.desc) bits.push(`desc=${JSON.stringify(n.desc)}`);
      if (n.id) bits.push(`id=${n.id}`);
      if (n.editable) bits.push('editable');
      if (n.clickable && !n.editable) bits.push('clickable');
      if (n.checkable) bits.push(n.checked ? 'checked' : 'unchecked');
      if (n.scrollable) bits.push('scrollable');
      if (!n.enabled) bits.push('disabled');
      if (n.focused) bits.push('focused');
      lines.push(`  [${ref}] ${bits.join(' ')}`);
    }
  }
  lines.push('Note: a field error often shows only as an icon. Tap the field to open its message popup, then snapshot again.');
  return { text: lines.join('\n'), refs };
}

// "adb shell input text" goes through the device shell: escape everything but letters and digits;
// a space must be %s. Non-ASCII text cannot be typed this way.
export function escapeInputText(s) {
  const str = String(s);
  if (!str.length) throw new DriverError('Nothing to type.');
  if (/[^\x20-\x7e]/.test(str)) throw new DriverError('Only plain ASCII text can be typed through adb. Use a value without accents, emoji or line breaks.');
  return str.replace(/[^A-Za-z0-9]/g, (c) => (c === ' ' ? '%s' : '\\' + c));
}

// Version line from "dumpsys package <pkg>".
export function parseVersion(out) {
  const name = String(out).match(/versionName=(\S+)/)?.[1] ?? null;
  const code = String(out).match(/versionCode=(\d+)/)?.[1] ?? null;
  return { name, code };
}

// Keeps logcat lines of the app's process id with level W, E or F.
// Without a pid nothing is returned: other apps' logs can hold personal data. Emails and
// token-like strings are hidden in what is returned.
export function filterLogcat(out, pid, max = 60) {
  if (!pid) return [];
  const rows = String(out).split(/\r?\n/).filter((l) => {
    const m = l.match(/^\S+\s+\S+\s+(\d+)\s+\d+\s+([VDIWEF])\s/);
    return m && m[1] === String(pid) && /[WEF]/.test(m[2]);
  });
  return rows.slice(-max).map(redactLog);
}

// Emails, JWTs and "token=…"-style values hidden in log text.
export const redactLog = (l) => String(l)
  .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
  .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]*/g, '[token]')
  .replace(/\b(token|password|passwd|secret|session|cookie|bearer|api[-_]?key|auth\w*)(\s*[=:]\s*|\s+)\S+/gi, '$1$2[hidden]');

// ---- monkey (extreme mode) ------------------------------------------------------

// Small seeded random generator, so a run can be replayed with the same seed.
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Odd but typeable (ASCII) inputs for random typing.
export const MONKEY_TEXT = ['0', '-1', '99999999999999999999', '1e309', ' ', '   x   ', 'a'.repeat(300), 'null', 'undefined', '%s%n', "O'Brien", '"quoted"', '<b>x</b>', '../../', '\\', '1/0', 'NaN', '#$%^&*()'];

export function parseSize(out) {
  const m = String(out).match(/Override size:\s*(\d+)x(\d+)/) ?? String(out).match(/Physical size:\s*(\d+)x(\d+)/);
  return m ? { w: Number(m[1]), h: Number(m[2]) } : { w: 1080, h: 2400 };
}

// Crash and freeze lines for the app, from "logcat -b crash,main".
export function findCrashes(out, pkg) {
  const lines = String(out).split(/\r?\n/);
  const found = [];
  lines.forEach((l, i) => {
    if (/FATAL EXCEPTION/.test(l) && lines.slice(i, i + 3).some((x) => x.includes(`Process: ${pkg}`))) found.push({ kind: 'crash', text: lines.slice(i, i + 8).join('\n') });
    if (new RegExp(`ANR in ${pkg.replace(/\./g, '\\.')}`).test(l)) found.push({ kind: 'not responding (ANR)', text: lines.slice(i, i + 4).join('\n') });
  });
  return found.map((f) => ({ ...f, text: redactLog(f.text) }));
}

// ---- the driver -------------------------------------------------------------

// run(args[]) -> Promise<{ stdout, stderr, code }>, runs adb with the given args.
export function createDriver({ config, run, now = () => Date.now(), settleMs = 700, saveFile = null }) {
  const settle = () => (settleMs ? new Promise((r) => setTimeout(r, settleMs)) : undefined);
  let refs = new Map();
  const s = () => settings(config());
  const adb = async (st, args, { ok = true } = {}) => {
    const r = await run(['-s', st.device, ...args]);
    if (ok && r.code !== 0) throw new DriverError(`adb failed: ${(r.stderr || r.stdout || '').trim().slice(0, 300)}`);
    return r;
  };
  const shell = (st, ...args) => adb(st, ['shell', ...args]);

  async function ready() {
    const st = s();
    const list = parseDevices((await run(['devices'])).stdout);
    const state = list.get(st.device);
    if (!state) throw new DriverError(`Device ${st.device} is not connected. Start the emulator (or plug in the test phone) and check "adb devices".`);
    if (state !== 'device') throw new DriverError(`Device ${st.device} is "${state}". Accept the USB debugging prompt on the device, or wait for the emulator to finish starting.`);
    return st;
  }
  async function focus(st) { return parseFocus((await shell(st, 'dumpsys', 'window')).stdout); }
  // Right after a tap the new window may not have focus yet: re-check a few times before deciding.
  async function settledFocus(st) {
    let f = await focus(st);
    for (let k = 0; k < 3 && !f.pkg; k++) { await new Promise((r) => setTimeout(r, settleMs ? 400 : 0)); f = await focus(st); }
    return f;
  }
  const isHome = (pkg) => /launcher/i.test(pkg ?? '');
  async function inApp(st) {
    const f = await focus(st);
    const allowed = [st.pkg, ...st.extra];
    if (!allowed.includes(f.pkg)) {
      throw new DriverError(`The app in front is ${f.pkg ?? 'unknown'}, not the test app ${st.pkg}. ReconQA only taps and types inside the test app. Use android_press with key "back", or android_launch.`);
    }
    return f;
  }
  const point = (args) => {
    if (args.ref) {
      const n = refs.get(args.ref);
      if (!n?.bounds) throw new DriverError(`Unknown ref ${args.ref}. Take a new android_snapshot first; refs change after every snapshot.`);
      return { x: n.bounds.cx, y: n.bounds.cy };
    }
    const x = Number(args.x), y = Number(args.y);
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) throw new DriverError('Give a ref from android_snapshot, or whole-number x and y.');
    return { x, y };
  };

  const tools = {
    async android_snapshot() {
      const st = await ready();
      await shell(st, 'uiautomator', 'dump', '--windows', '/sdcard/reconqa-ui.xml');
      const xml = (await adb(st, ['exec-out', 'cat', '/sdcard/reconqa-ui.xml'])).stdout;
      const f = await focus(st);
      const allowed = [st.pkg, ...st.extra];
      if (!allowed.includes(f.pkg)) {
        refs = new Map();
        return `App in front: ${f.pkg ?? 'unknown'} (not the test app). Its screen is not read. Use android_press with key "back", or android_launch.`;
      }
      // Only the test app's own windows (and listed dialogs); a split-screen app or a notification is left out.
      const windows = parseDump(xml).map((w) => ({ ...w, nodes: w.nodes.filter((n) => !n.pkg || allowed.includes(n.pkg)) })).filter((w) => w.nodes.length);
      const snap = renderSnapshot(windows, f);
      refs = snap.refs;
      return snap.text;
    },
    async android_launch() {
      const st = await ready();
      await shell(st, 'monkey', '-p', st.pkg, '-c', 'android.intent.category.LAUNCHER', '1');
      await settle(); await settle();
      return `Started ${st.pkg}. Take an android_snapshot to see the screen.`;
    },
    async android_tap(args = {}) {
      const st = await ready(); await inApp(st);
      const p = point(args);
      await shell(st, 'input', args.long ? 'swipe' : 'tap', ...(args.long ? [p.x, p.y, p.x, p.y, 800] : [p.x, p.y]).map(String));
      await settle();
      return `Tapped ${args.ref ?? `${p.x},${p.y}`}${args.long ? ' (long press)' : ''}.`;
    },
    async android_type(args = {}) {
      const st = await ready(); await inApp(st);
      const text = escapeInputText(args.text);
      if (args.ref || args.x !== undefined) { const p = point(args); await shell(st, 'input', 'tap', String(p.x), String(p.y)); await settle(); await inApp(st); }
      if (args.clear) {
        await shell(st, 'input', 'keyevent', 'KEYCODE_MOVE_END');
        await shell(st, 'input', 'keyevent', '--longpress', ...Array(80).fill('KEYCODE_DEL'));
      }
      await shell(st, 'input', 'text', text);
      await settle();
      return `Typed ${String(args.text).length} character(s).`;
    },
    async android_press(args = {}) {
      const st = await ready();
      const key = KEYS[args.key];
      if (!key) throw new DriverError(`Key must be one of: ${Object.keys(KEYS).join(', ')}. Home and app switching are not offered: they leave the test app.`);
      if (args.key !== 'back') await inApp(st);
      await shell(st, 'input', 'keyevent', key);
      await settle();
      return `Pressed ${args.key}.`;
    },
    async android_swipe(args = {}) {
      const st = await ready(); await inApp(st);
      const dir = args.direction;
      const m = { up: [540, 1700, 540, 700], down: [540, 700, 540, 1700], left: [900, 1200, 180, 1200], right: [180, 1200, 900, 1200] }[dir];
      if (!m) throw new DriverError('direction must be up, down, left or right ("up" scrolls the list down).');
      await shell(st, 'input', 'swipe', ...m.map(String), '300');
      await settle();
      return `Swiped ${dir}.`;
    },
    async android_wait_for(args = {}) {
      const want = String(args.text ?? '');
      if (!want) throw new DriverError('Give the text to wait for.');
      const until = now() + Math.min(Number(args.seconds) || 5, 30) * 1000;
      let last = '';
      do {
        last = await tools.android_snapshot();
        if (last.includes(want)) return `Found "${want}".\n${last}`;
        await new Promise((r) => setTimeout(r, 500));
      } while (now() < until);
      return `Did not see "${want}" in time.\n${last}`;
    },
    async android_screenshot(args = {}) {
      const st = await ready();
      await inApp(st); // never capture another app or the notification shade
      const file = args.filename === undefined ? null : String(args.filename);
      if (file !== null && !/^(?![/\\])(?![A-Za-z]:)(?!.*\.\.)[A-Za-z0-9 ._/-]+\.png$/.test(file)) {
        throw new DriverError('filename must be a .png path inside the project, e.g. qa/atlas/shots/habits/create.png');
      }
      const r = await run(['-s', st.device, 'exec-out', 'screencap', '-p'], { binary: true });
      if (r.code !== 0) throw new DriverError('screencap failed');
      if (file !== null) {
        if (!saveFile) throw new DriverError('Saving screenshots is not available here.');
        await saveFile(file, Buffer.from(r.stdout));
        return `Saved ${file}.`;
      }
      return { image: Buffer.from(r.stdout).toString('base64') };
    },
    async android_app_info() {
      const st = await ready();
      const v = parseVersion((await shell(st, 'dumpsys', 'package', st.pkg)).stdout);
      const rel = (await shell(st, 'getprop', 'ro.build.version.release')).stdout.trim();
      const model = (await shell(st, 'getprop', 'ro.product.model')).stdout.trim();
      return `App ${st.pkg} version ${v.name ?? '?'} (${v.code ?? '?'}); Android ${rel}; device ${model} (${st.device}${isEmulator(st.device) ? ', emulator' : ''}).`;
    },
    async android_logcat(args = {}) {
      const st = await ready();
      const pid = (await adb(st, ['shell', 'pidof', st.pkg], { ok: false })).stdout.trim().split(/\s+/)[0];
      const out = (await adb(st, ['logcat', '-d', '-v', 'threadtime', '-t', String(Math.min(Number(args.lines) || 500, 2000))])).stdout;
      const rows = filterLogcat(out, pid || null);
      return rows.length ? rows.join('\n') : `No warnings or errors from ${st.pkg}${pid ? '' : ' (app not running)'}.`;
    },
    // Random taps, swipes, typing and back presses inside the test app only (never the status bar
    // or navigation bar area), checked every 10 events; then the app's crashes and freezes.
    async android_monkey(args = {}) {
      const st = await ready();
      if (!isEmulator(st.device)) throw new DriverError('The monkey runs on an emulator only: random taps on a real phone can reach real accounts, payments or settings.');
      if (config()?.app?.test_data?.allow_create !== true) throw new DriverError('The monkey creates and changes data in the test app. Turn on app.test_data.allow_create for this test setup first.');
      const events = Math.min(Math.max(Number(args.events) || 100, 1), 500);
      const seed = Number.isInteger(args.seed) ? args.seed : Math.floor(Math.random() * 1e6);
      const rand = rng(seed);
      const pick = (arr) => arr[Math.floor(rand() * arr.length)];
      await inApp(st);
      const { w, h } = parseSize((await shell(st, 'wm', 'size')).stdout);
      const top = Math.round(h * 0.06), bottom = Math.round(h * 0.92);
      const since = `${(await shell(st, 'date', '+%s')).stdout.trim() || '0'}.000`;
      const log = [];
      let left = 0;
      for (let i = 1; i <= events; i++) {
        if (i % 10 === 1) {
          const f = await focus(st);
          if (![st.pkg, ...st.extra].includes(f.pkg)) {
            left++; log.push(`#${i} left the app (${f.pkg ?? 'unknown'} in front): back, then relaunch`);
            await shell(st, 'input', 'keyevent', 'KEYCODE_BACK');
            const g = await focus(st);
            if (![st.pkg, ...st.extra].includes(g.pkg)) await shell(st, 'monkey', '-p', st.pkg, '-c', 'android.intent.category.LAUNCHER', '1');
            if (left > 5) { log.push('stopped: the app was left more than 5 times'); break; }
            continue;
          }
        }
        const x = Math.round(w * (0.05 + rand() * 0.9)), y = Math.round(top + rand() * (bottom - top));
        const r = rand();
        if (r < 0.75) {
          if (r < 0.6) { await shell(st, 'input', 'tap', String(x), String(y)); log.push(`#${i} tap ${x},${y}`); }
          else { const y2 = Math.round(top + rand() * (bottom - top)); await shell(st, 'input', 'swipe', String(x), String(y), String(x), String(y2), '200'); log.push(`#${i} swipe ${x},${y}→${x},${y2}`); }
          // A tap can open another app (browser, share sheet, dialer): check at once, never act there.
          const g = await settledFocus(st);
          if (![st.pkg, ...st.extra].includes(g.pkg)) {
            left++;
            if (isHome(g.pkg)) {
              log.push(`#${i} home screen in front: relaunched the test app`);
              await shell(st, 'monkey', '-p', st.pkg, '-c', 'android.intent.category.LAUNCHER', '1');
            } else {
              log.push(`#${i} opened ${g.pkg ?? 'unknown'}: back`);
              await shell(st, 'input', 'keyevent', 'KEYCODE_BACK');
              const h2 = await settledFocus(st);
              if (![st.pkg, ...st.extra].includes(h2.pkg)) { log.push(`stopped: still outside the test app (${h2.pkg ?? 'unknown'})`); break; }
            }
          }
        }
        else if (r < 0.92) { const t = pick(MONKEY_TEXT); await shell(st, 'input', 'text', escapeInputText(t)); log.push(`#${i} type ${JSON.stringify(t.length > 20 ? t.slice(0, 20) + '…' : t)}`); }
        else {
          await shell(st, 'input', 'keyevent', 'KEYCODE_BACK'); log.push(`#${i} back`);
          // Back on the app's first screen goes home: expected, so relaunch without counting it.
          const g = await focus(st);
          if (![st.pkg, ...st.extra].includes(g.pkg)) { await shell(st, 'monkey', '-p', st.pkg, '-c', 'android.intent.category.LAUNCHER', '1'); log.push(`#${i} back closed the app: relaunched`); }
        }
        if (settleMs) await new Promise((res) => setTimeout(res, Math.min(settleMs, 250)));
      }
      const out = (await adb(st, ['logcat', '-d', '-b', 'crash,main', '-v', 'threadtime', '-T', since], { ok: false })).stdout;
      const crashes = findCrashes(out, st.pkg);
      return [
        `Monkey: ${log.length} step(s), seed ${seed} (run again with the same seed to repeat), left the app ${left} time(s).`,
        crashes.length ? `FOUND ${crashes.length} problem(s):\n${crashes.map((c, n) => `${n + 1}. ${c.kind}\n${c.text}`).join('\n\n')}` : 'No crash or freeze found.',
        ...(log.some((l) => /opened|left the app|stopped/.test(l)) ? ['Leaving the app:', ...log.filter((l) => /opened|left the app|stopped/.test(l)).slice(0, 20)] : []),
        'Last steps:', ...log.slice(-25),
      ].join('\n');
    },
    async android_clear_app_data() {
      const st = await ready();
      if (!st.allowReset) throw new DriverError('Clearing app data is off. Set app.android.allow_reset: true in .reconqa/kit.yml to allow it for the test app.');
      await shell(st, 'pm', 'clear', st.pkg);
      refs = new Map();
      return `Cleared the data of ${st.pkg} (only the test app).`;
    },
  };
  return tools;
}

// MCP tool list (names, descriptions, input schemas).
const REF = { ref: { type: 'string', description: 'Element ref from the last android_snapshot, e.g. e5' }, x: { type: 'integer' }, y: { type: 'integer' } };
export const TOOL_LIST = [
  ['android_snapshot', 'Read the current screen as text: every window (popups first), each element with a ref, its text, id and state.', {}],
  ['android_launch', 'Start (or bring to front) the test app set in app.android.package.', {}],
  ['android_tap', 'Tap an element by ref, or a point. long: true for a long press.', { ...REF, long: { type: 'boolean' } }],
  ['android_type', 'Type plain ASCII text, optionally into a ref (tapped first). clear: true empties the field first.', { ...REF, text: { type: 'string' }, clear: { type: 'boolean' } }, ['text']],
  ['android_press', 'Press a key: back, enter, tab, del, escape.', { key: { type: 'string', enum: Object.keys(KEYS) } }, ['key']],
  ['android_swipe', 'Swipe the screen: up, down, left or right.', { direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] } }, ['direction']],
  ['android_wait_for', 'Wait until a text shows on screen (up to 30 s), then return the snapshot.', { text: { type: 'string' }, seconds: { type: 'number' } }, ['text']],
  ['android_screenshot', 'Screenshot of the device screen (evidence). Give filename (a .png path in the project) to save it instead of returning the image.', { filename: { type: 'string' } }],
  ['android_app_info', 'App version, Android version and device, for bug reports.', {}],
  ['android_logcat', 'Recent warnings and errors logged by the test app.', { lines: { type: 'integer' } }],
  ['android_monkey', 'Extreme mode: random taps, swipes, odd text and back presses inside the test app only (up to 500 events, seeded so it can be repeated), then report crashes and freezes.', { events: { type: 'integer' }, seed: { type: 'integer' } }],
  ['android_clear_app_data', 'Clear the test app\'s data (fresh start). Only with app.android.allow_reset: true.', {}],
].map(([name, description, properties, required = []]) => ({ name, description, inputSchema: { type: 'object', properties, required, additionalProperties: false } }));
