// Built-in Android driver (plugins/reconqa/drivers/android): parsing, safety rules, gate map, preflight.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  settings, parseDevices, parseFocus, parseDump, renderSnapshot, escapeInputText, parseVersion, filterLogcat,
  createDriver, TOOL_LIST, DriverError,
} from '../plugins/reconqa/drivers/android/core.mjs';
import { loadAppMaps } from '../plugins/reconqa/scripts/lib/app-maps.mjs';
import { compile, load } from '../plugins/reconqa/scripts/lib/kit.mjs';
import { decide } from '../plugins/reconqa/hooks/lib/gate-core.mjs';
import { preflight } from '../plugins/reconqa/scripts/preflight.mjs';

const APP = { target: 'android', android: { device: 'emulator-5554', package: 'org.example.habits' } };
const cfg = (android = {}) => ({ app: { ...APP, android: { ...APP.android, ...android } } });

const DUMP = `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?><displays><display id="0">
<window index="0" title="" type="TYPE_SYSTEM"><hierarchy rotation="0"><node text="10:49" class="android.widget.TextView" bounds="[0,0][100,50]" /></hierarchy></window>
<window index="1" title="Keyboard" type="TYPE_INPUT_METHOD"><hierarchy rotation="0"><node text="q" class="android.widget.Button" clickable="true" bounds="[0,0][10,10]" /></hierarchy></window>
<window index="2" title="Popup Window" type="TYPE_APPLICATION"><hierarchy rotation="0"><node text="Cannot be blank" class="android.widget.TextView" bounds="[484,413][846,559]" /></hierarchy></window>
<window index="3" title="Habits" type="TYPE_APPLICATION">
  <window index="0" title="Popup Window" type="TYPE_APPLICATION"><hierarchy rotation="0"><node text="Cannot be blank" class="android.widget.TextView" bounds="[484,413][846,559]" /></hierarchy></window>
  <hierarchy rotation="0">
    <node text="Create habit" class="android.widget.TextView" bounds="[189,166][486,237]">
      <node text="SAVE" resource-id="org.example.habits:id/buttonSave" class="android.widget.Button" clickable="true" bounds="[807,138][1038,264]" />
    </node>
    <node text="" resource-id="org.example.habits:id/nameInput" class="android.widget.EditText" clickable="true" focused="true" bounds="[22,321][848,462]" />
    <node text="secret1" resource-id="org.example.habits:id/pin" class="android.widget.EditText" password="true" clickable="true" bounds="[22,500][848,600]" />
    <node text="Tom &amp; Jerry &#233;" class="android.widget.TextView" bounds="[0,700][100,800]" />
    <node text="" class="android.widget.FrameLayout" bounds="[0,0][1,1]" />
  </hierarchy>
</window></display></displays>`;
const FOCUS_APP = 'mCurrentFocus=Window{1316e7b u0 org.example.habits/org.example.habits.EditActivity}\n  mFocusedApp=ActivityRecord{d53 u0 org.example.habits/.EditActivity t8}';

// Fake adb: records every call; answers from a table.
function fakeAdb({ devices = 'List of devices attached\nemulator-5554\tdevice\nR58M123ABC\tdevice\n', focus = FOCUS_APP, dump = DUMP } = {}) {
  const calls = [];
  const run = async (args) => {
    calls.push(args);
    const a = args.join(' ');
    if (a === 'devices') return { code: 0, stdout: devices, stderr: '' };
    if (a.endsWith('dumpsys window')) return { code: 0, stdout: focus, stderr: '' };
    if (a.includes('exec-out cat')) return { code: 0, stdout: dump, stderr: '' };
    if (a.includes('pm path')) return { code: 0, stdout: 'package:/data/app/base.apk', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  };
  return { calls, run };
}
const driver = (fake, c = cfg()) => createDriver({ config: () => c, run: fake.run, settleMs: 0 });

test('settings: target, device and package are required; real phones need allow_real_device', () => {
  assert.throws(() => settings({ app: { target: 'web' } }), /not "android"/);
  assert.throws(() => settings({ app: { target: 'android', android: { package: 'a.b' } } }), /app.android.device/);
  assert.throws(() => settings({ app: { target: 'android', android: { device: 'emulator-5554' } } }), /app.android.package/);
  assert.throws(() => settings(cfg({ device: 'R58M123ABC' })), /real phone/);
  assert.equal(settings(cfg({ device: 'R58M123ABC', allow_real_device: true })).device, 'R58M123ABC');
  assert.throws(() => settings(cfg({ device: 'emu; rm -rf /' })), /app.android.device/);
  assert.throws(() => settings(cfg({ extra_packages: ['bad pkg'] })), /extra_packages/);
});

test('parsers: devices, focus (popup uses the app, system windows are named), version, logcat', () => {
  assert.equal(parseDevices('List of devices attached\nemulator-5554\tdevice\nX\tunauthorized\n').get('X'), 'unauthorized');
  assert.deepEqual(parseFocus(FOCUS_APP), { pkg: 'org.example.habits', activity: 'org.example.habits.EditActivity' });
  assert.equal(parseFocus('mCurrentFocus=Window{a u0 PopupWindow:4a5b}\n mFocusedApp=ActivityRecord{d u0 org.example.habits/.Main t1}').pkg, 'org.example.habits');
  assert.equal(parseFocus('mCurrentFocus=Window{a u0 NotificationShade}\n mFocusedApp=ActivityRecord{d u0 org.example.habits/.Main t1}').pkg, 'NotificationShade');
  assert.deepEqual(parseVersion('versionCode=20302 minSdk=23\n versionName=2.3.2'), { name: '2.3.2', code: '20302' });
  const log = '11-27 10:49:01.000  1234  1240 E Habits: boom\n11-27 10:49:01.000  1234  1240 I Habits: fine\n11-27 10:49:01.000  999  999 E Other: not ours';
  assert.deepEqual(filterLogcat(log, '1234'), ['11-27 10:49:01.000  1234  1240 E Habits: boom']);
});

test('dump: popups first and once, keyboard and status bar skipped, passwords hidden, entities decoded', () => {
  const w = parseDump(DUMP);
  assert.deepEqual(w.map((x) => x.title), ['Popup Window', 'Habits']);
  assert.equal(w[1].nodes.length, 5, 'nested popup copy is not filed under the parent window');
  const { text, refs } = renderSnapshot(w, { pkg: 'org.example.habits', activity: 'X' });
  assert.match(text, /\[e1\] TextView "Cannot be blank"/);
  assert.equal((text.match(/Cannot be blank/g) ?? []).length, 1);
  assert.doesNotMatch(text, /secret1|"q"|10:49/);
  assert.match(text, /••• \(hidden\)/);
  assert.match(text, /"Tom & Jerry é"/);
  assert.equal(refs.get('e3').id, 'buttonSave');
});

test('typing: shell characters escaped, spaces as %s, non-ASCII refused', () => {
  assert.equal(escapeInputText('Read 10 pages & stretch'), 'Read%s10%spages%s\\&%sstretch');
  assert.equal(escapeInputText("a;b`c$(d)'"), "a\\;b\\`c\\$\\(d\\)\\'");
  assert.throws(() => escapeInputText('café'), DriverError);
  assert.throws(() => escapeInputText('line\nbreak'), DriverError);
  assert.throws(() => escapeInputText(''), DriverError);
});

test('every device call names the configured device; the other phone is never touched', async () => {
  const fake = fakeAdb();
  const t = driver(fake);
  await t.android_snapshot();
  await t.android_tap({ ref: 'e3' });
  await t.android_type({ ref: 'e4', text: 'Walk' });
  await t.android_press({ key: 'back' });
  await t.android_launch();
  for (const c of fake.calls) {
    if (c[0] === 'devices') continue;
    assert.deepEqual(c.slice(0, 2), ['-s', 'emulator-5554'], c.join(' '));
  }
  assert.ok(!fake.calls.some((c) => c.includes('R58M123ABC')));
  assert.ok(fake.calls.some((c) => c.join(' ') === '-s emulator-5554 shell input tap 923 201'), 'tap uses the ref centre');
});

test('device must be connected and ready', async () => {
  await assert.rejects(driver(fakeAdb({ devices: 'List of devices attached\n' })).android_snapshot(), /not connected/);
  await assert.rejects(driver(fakeAdb({ devices: 'List of devices attached\nemulator-5554\toffline\n' })).android_snapshot(), /"offline"/);
});

test('taps, typing and swipes only inside the test app; back still works', async () => {
  const fake = fakeAdb({ focus: 'mCurrentFocus=Window{1 u0 com.android.settings/com.android.settings.Settings}' });
  const t = driver(fake);
  await assert.rejects(t.android_tap({ x: 10, y: 10 }), /not the test app/);
  await assert.rejects(t.android_type({ text: 'x' }), /not the test app/);
  await assert.rejects(t.android_swipe({ direction: 'up' }), /not the test app/);
  await assert.rejects(t.android_press({ key: 'enter' }), /not the test app/);
  assert.match(await t.android_press({ key: 'back' }), /Pressed back/);
  const shade = driver(fakeAdb({ focus: 'mCurrentFocus=Window{a u0 NotificationShade}\n mFocusedApp=ActivityRecord{d u0 org.example.habits/.Main t1}' }));
  await assert.rejects(shade.android_tap({ x: 1, y: 1 }), /NotificationShade/);
  const perm = driver(fakeAdb({ focus: 'mCurrentFocus=Window{1 u0 com.google.android.permissioncontroller/x.GrantPermissionsActivity}' }),
    cfg({ extra_packages: ['com.google.android.permissioncontroller'] }));
  assert.match(await perm.android_tap({ x: 1, y: 1 }), /Tapped/);
});

test('no home key, unknown refs refused, bad points refused', async () => {
  const t = driver(fakeAdb());
  await assert.rejects(t.android_press({ key: 'home' }), /Home and app switching are not offered/);
  await assert.rejects(t.android_tap({ ref: 'e99' }), /Unknown ref/);
  await assert.rejects(t.android_tap({ x: -1, y: 2 }), /whole-number/);
});

test('clear app data: off by default; when allowed, clears only the test app', async () => {
  await assert.rejects(driver(fakeAdb()).android_clear_app_data(), /allow_reset/);
  const fake = fakeAdb();
  await driver(fake, cfg({ allow_reset: true })).android_clear_app_data();
  assert.ok(fake.calls.some((c) => c.join(' ') === '-s emulator-5554 shell pm clear org.example.habits'));
});

test('tool map lists every driver tool; the gate asks before clearing data and denies unknown tools', () => {
  const map = loadAppMaps()['android-adb'];
  assert.equal(map.target, 'android');
  const listed = new Set([...map.allow, ...map.ask, ...map.deny]);
  assert.deepEqual(TOOL_LIST.map((t) => t.name).filter((n) => !listed.has(n)), []);
  assert.deepEqual([...listed].filter((n) => !TOOL_LIST.some((t) => t.name === n)), []);
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-and-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\napp:\n  target: android\n  android:\n    device: emulator-5554\n    package: org.example.habits\ncapabilities:\n  app_driver:\n    tool: android-adb\n');
  assert.deepEqual(load(dir).errors, []);
  compile(dir);
  const d = (tool) => decide({ tool_name: `mcp__reconqa-android__${tool}`, tool_input: {} }, { projectDir: dir });
  assert.equal(d('android_tap').decision, 'none');
  assert.equal(d('android_clear_app_data').decision, 'ask');
  assert.equal(d('android_shell').decision, 'deny');
});

test('kit: android works with the android driver; web driver on android and planned targets are refused', () => {
  const kit = (body) => {
    const dir = mkdtempSync(join(tmpdir(), 'reconqa-and-'));
    mkdirSync(join(dir, '.reconqa'));
    writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\n' + body);
    return load(dir).errors.map((e) => e.message).join('\n');
  };
  assert.match(kit('app:\n  target: android\ncapabilities:\n  app_driver:\n    tool: playwright\n'), /drives web, but app.target is android/);
  assert.match(kit('app:\n  target: mqtt\n'), /planned but not available/);
  assert.match(kit('app:\n  target: android\n  android:\n    package: not a package\n'), /android/);
});

test('preflight (android): stops without spending tokens when the device or app is missing', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-and-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\napp:\n  target: android\n  android:\n    device: emulator-5554\n    package: org.example.habits\n  test_data:\n    allow_create: true\ncapabilities:\n  app_driver:\n    tool: android-adb\n');
  const adb = (devices, installed = true) => async (args) => (args[0] === 'devices'
    ? { code: 0, stdout: devices, stderr: '' } : { code: 0, stdout: installed ? 'package:/x.apk' : '', stderr: '' });
  assert.match((await preflight(dir, undefined, { adb: adb('List of devices attached\n') })).reason, /not connected/);
  assert.match((await preflight(dir, undefined, { adb: adb('List of devices attached\nemulator-5554\tdevice\n', false) })).reason, /not installed/);
  const ok = await preflight(dir, undefined, { adb: adb('List of devices attached\nemulator-5554\tdevice\n') });
  assert.equal(ok.ok, true);
  assert.equal(ok.allow_create, true);
  assert.equal(ok.target, 'android');
});

test('screenshot: saved inside the project when a filename is given; bad paths refused', async () => {
  const saved = [];
  const fake = fakeAdb();
  const t = createDriver({ config: () => cfg(), run: fake.run, settleMs: 0, saveFile: (f, b) => saved.push(f) });
  assert.match(await t.android_screenshot({ filename: 'qa/atlas/shots/habits/create.png' }), /Saved/);
  assert.deepEqual(saved, ['qa/atlas/shots/habits/create.png']);
  for (const bad of ['../out.png', '/tmp/x.png', 'C:/x.png', 'shot.jpg', 'a/../../b.png']) {
    await assert.rejects(t.android_screenshot({ filename: bad }), /filename/, bad);
  }
  assert.ok((await t.android_screenshot()).image !== undefined);
});

test('security review fixes (Android): logcat needs the app pid and hides personal data; typing re-checks the app; no capture outside the app', async () => {
  assert.deepEqual(filterLogcat('11-27 10:49:01.000  999  999 E Other: x@y.com', null), []);
  const row = filterLogcat('11-27 10:49:01.000  12  12 E App: user a.b@example.org token=abc123 eyJa.eyJb.c', '12')[0];
  assert.doesNotMatch(row, /a\.b@example\.org|abc123|eyJa/);
  assert.equal(parseFocus('mFocusedApp=ActivityRecord{d u0 org.example.habits/.Main t1}').pkg, null, 'no focused window: refuse');
  // a tap that opens another app stops the typing
  let n = 0;
  const run = async (args) => {
    const a = args.join(' ');
    if (a === 'devices') return { code: 0, stdout: 'List of devices attached\nemulator-5554\tdevice\n', stderr: '' };
    if (a.endsWith('dumpsys window')) return { code: 0, stdout: n++ === 0 ? FOCUS_APP : 'mCurrentFocus=Window{1 u0 com.android.chrome/x.Main}', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  };
  const calls = [];
  const t = createDriver({ config: () => cfg(), run: async (a) => { calls.push(a.join(' ')); return run(a); }, settleMs: 0 });
  await assert.rejects(t.android_type({ x: 5, y: 5, text: 'hello' }), /com.android.chrome/);
  assert.ok(!calls.some((c) => c.includes('input text')), 'nothing typed into the other app');
  const other = driver(fakeAdb({ focus: 'mCurrentFocus=Window{1 u0 com.android.chrome/x.Main}' }));
  await assert.rejects(other.android_screenshot(), /not the test app/);
  assert.match(await other.android_snapshot(), /not the test app\). Its screen is not read/);
});

test('monkey (extreme mode): seeded, stays in the content area, only back as a key, stops if it keeps leaving the app; crashes found', async () => {
  const { rng, findCrashes } = await import('../plugins/reconqa/drivers/android/core.mjs');
  const a = rng(7), b = rng(7);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
  const calls = [];
  const run = async (args) => {
    const s = args.join(' ');
    calls.push(s);
    if (s === 'devices') return { code: 0, stdout: 'List of devices attached\nemulator-5554\tdevice\n', stderr: '' };
    if (s.endsWith('dumpsys window')) return { code: 0, stdout: FOCUS_APP, stderr: '' };
    if (s.endsWith('wm size')) return { code: 0, stdout: 'Physical size: 1000x2000', stderr: '' };
    if (s.endsWith('date +%s')) return { code: 0, stdout: '1795750000', stderr: '' };
    if (s.includes('logcat -d -b crash,main')) return { code: 0, stdout: '11-27 E AndroidRuntime: FATAL EXCEPTION: main\n11-27 E AndroidRuntime: Process: org.example.habits, PID: 12\n11-27 E AndroidRuntime: java.lang.NumberFormatException: x@y.com', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  };
  const withData = () => ({ app: { ...cfg().app, test_data: { allow_create: true } } });
  const t = createDriver({ config: withData, run, settleMs: 0 });
  const out = await t.android_monkey({ events: 200, seed: 42 });
  assert.match(out, /seed 42/);
  assert.match(out, /FOUND 1 problem\(s\):\n1\. crash/);
  assert.doesNotMatch(out, /x@y\.com/);
  for (const c of calls.filter((c) => / input (tap|swipe) /.test(c))) {
    const n = c.split(' input ')[1].split(' ').slice(1).map(Number);
    const ys = c.includes(' tap ') ? [n[1]] : [n[1], n[3]];
    assert.ok(ys.every((y) => y >= 120 && y <= 1840), c);
  }
  const keys = calls.filter((c) => c.includes('keyevent')).map((c) => c.split('keyevent ')[1]);
  assert.ok(keys.every((k) => k === 'KEYCODE_BACK'), keys.join(','));
  assert.ok(calls.some((c) => c.includes('-T 1795750000.000')));
  // keeps leaving the app -> stops
  const away = createDriver({ config: withData, settleMs: 0, run: async (args) => {
    const s = args.join(' ');
    if (s === 'devices') return { code: 0, stdout: 'List of devices attached\nemulator-5554\tdevice\n', stderr: '' };
    if (s.endsWith('dumpsys window')) return { code: 0, stdout: away.n++ === 0 ? FOCUS_APP : 'mCurrentFocus=Window{1 u0 com.android.chrome/x.Main}', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  } });
  away.n = 0;
  assert.match(await away.android_monkey({ events: 500, seed: 1 }), /stopped: (still outside the test app|the app was left more than 5 times)/);
  // limits: emulator only, and only with allow_create
  await assert.rejects(createDriver({ config: () => cfg(), run, settleMs: 0 }).android_monkey({ events: 5 }), /allow_create/);
  const phone = () => ({ app: { ...withData().app, android: { ...APP.android, device: 'R58M123ABC', allow_real_device: true } } });
  await assert.rejects(createDriver({ config: phone, run: async (a) => (a.join(' ') === 'devices' ? { code: 0, stdout: 'List of devices attached\nR58M123ABC\tdevice\n', stderr: '' } : run(a)), settleMs: 0 }).android_monkey({ events: 5 }), /emulator only/);
  // a tap that opens another app: nothing more is done there
  const seen = [];
  let k = 0;
  const esc = createDriver({ config: withData, settleMs: 0, run: async (args) => {
    const s = args.join(' '); seen.push(s);
    if (s === 'devices') return { code: 0, stdout: 'List of devices attached\nemulator-5554\tdevice\n', stderr: '' };
    if (s.endsWith('dumpsys window')) return { code: 0, stdout: k++ < 1 ? FOCUS_APP : 'mCurrentFocus=Window{1 u0 com.android.chrome/x.Main}', stderr: '' };
    if (s.endsWith('wm size')) return { code: 0, stdout: 'Physical size: 1000x2000', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  } });
  const r2 = await esc.android_monkey({ events: 50, seed: 3 });
  assert.match(r2, /stopped: still outside the test app \(com.android.chrome\)/);
  const actions = seen.filter((c) => / input (tap|swipe|text) /.test(c));
  assert.ok(actions.length <= 2, `at most the escaping tap and nothing after it (${actions.length})`);
  assert.equal(findCrashes('ANR in org.example.habits (org.example.habits/.Main)', 'org.example.habits')[0].kind, 'not responding (ANR)');
  assert.deepEqual(findCrashes('FATAL EXCEPTION: main\nProcess: com.other.app, PID: 1', 'org.example.habits'), []);
});
