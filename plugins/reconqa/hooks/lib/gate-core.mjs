// ReconQA write gate: pure decision logic, shared by the PreToolUse and PostToolUse hooks.
// decide(input, { projectDir }) -> { decision: 'none'|'allow'|'ask'|'deny', reason, fingerprint? }
// 'none' = ReconQA has no opinion (normal Claude Code permissions apply).
// Threat model: stops mistakes (wrong target, duplicate, delete, unreviewed write, leaked secret),
// not a determined attacker with a shell.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCompiled, looksSecret } from '../../scripts/lib/kit.mjs';
import { findProject } from './find-project.mjs';
import { loadAppMaps, driverPrefixes, TM_ADAPTERS } from '../../scripts/lib/app-maps.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ADAPTERS = resolve(HERE, '..', '..', 'adapters', 'tracker');
export const USED_FILE = join('.reconqa', 'pending', 'used.jsonl');

const FILE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const PENDING = /\.reconqa[\\/]+pending\b/;
const KIT_FILE = /\.reconqa[\\/]+kit(\.local)?\.ya?ml\b/;
const SHELL_FILE_WRITE = /(>|\btee\b|\bsed\s+-i|\bperl\s+-[a-z]*i|\bmv\b|\bcp\b|\brm\b|\btruncate\b|Set-Content|Out-File|Add-Content|\b(node|nodejs|python3?|perl|ruby|deno|bun|php)\b[^|;&]*\s(-e|-c|-p|-r|--eval|--print)\b)/i;
// ReconQA's own scripts that write the knowledge base or convert pre-UI text. They are asked like a
// file edit (the skill shows a dry run first; the gate makes sure the user really saw it).
const SCRIPT_WRITES = [
  [/\bkb\.mjs\b[^|;&]*\s(add-decision|add-issue|new-feature|init)\b/, 'kb'],
  [/\breconcile\.mjs\b[^|;&]*\sapply\b/, 'reconcile'],
];
// Shell routes that write to a tracker or repo host. Pattern checks stop mistakes, not attackers.
const SHELL_WRITES = [
  /\bgh\s+issue\s+(create|edit|close|reopen|delete|comment|transfer|lock|unlock|pin|unpin|develop)\b/i,
  /\bgh\s+pr\s+(create|edit|close|merge|comment|review|ready|reopen)\b/i,
  /\bgh\s+(repo|release|label|gist|secret|variable|ssh-key|gpg-key|cache|ruleset|project)\s+(create|edit|delete|remove|set|upload|rename|archive|clone-to|sync|transfer|add)\b/i,
  /\bgh\s+(workflow\s+(run|enable|disable)|run\s+(rerun|cancel|delete))\b/i,
  /\bgh\s+api\b[^|;&]*(-X\s*|--method[\s=]+)(POST|PUT|PATCH|DELETE)\b/i,
  /\bgh\s+api\b[^|;&]*\s(-f|-F|--field|--raw-field|--input)(\s|=)/i,
  /\bcurl\b[^|;&]*(-X\s*|--request[\s=]+)(POST|PUT|PATCH|DELETE)\b/i,
  /\bcurl\b[^|;&]*\s(-d|--data[a-z-]*|-F|--form|--json|-T|--upload-file)(\s|=)/i,
  /\bwget\b[^|;&]*--(post-data|post-file|method|body-data|body-file)\b/i,
  /\b(http|https|xh|xhs)\s+(POST|PUT|PATCH|DELETE)\s/i,
  /\b(Invoke-RestMethod|Invoke-WebRequest|irm|iwr)\b[^|;&]*-Method\s+(Post|Put|Patch|Delete)\b/i,
];
// Shell routes that write to a device or message broker. ReconQA drives devices only through a
// driver whose tool map the gate checks (after launch), never through raw shell commands.
const DEVICE_WRITES = [
  // adb: anything that installs, pushes, pulls files, runs a shell, reads all logs or changes the device.
  // Only devices, get-state and version pass (logcat and bugreport can hold other apps' personal data).
  /\badb\b[^|;&]*\s(install|install-multiple|install-multi-package|uninstall|push|sync|shell|exec-out|exec-in|reboot|reboot-bootloader|root|unroot|remount|sideload|disable-verity|enable-verity|emu|restore|tcpip|usb|forward|reverse|pull|backup|bugreport|connect|pair|jdwp|logcat)\b/i,
  // MQTT publish clients.
  /\b(mosquitto_pub|mosquitto_rr)\b/i,
  /\b(mqtt|mqttx|mqtt-cli)\s+(pub|publish)\b/i,
  // Serial ports: redirect, tee or dd into a port device; terminal programs opened on a port; port setup.
  /(>|\btee\b(\s+-a)?|\bof=)\s*\/dev\/(tty(USB|ACM|S|AMA|THS|SAC|mxc)\w*|(tty|cu)\.[\w.-]+|serial\/\S+|rfcomm\d+)/i,
  /(^|[\s;&|(])(picocom|minicom|microcom|screen|cu|socat|miniterm(\.py)?|pyserial-miniterm|putty|plink)\s[^|;&]*(\/dev\/(tty|cu|serial|rfcomm)|\bCOM\d+\b)/i,
  /\bstty\b[^|;&]*\s-[fF]\s*\/dev\//,
  />\s*\\?\\?\.?\\?COM\d+\b/i,
  /\bmode\s+COM\d+/i,
  /\bSystem\.IO\.Ports\.SerialPort\b/i,
];
// Shell commands that print environment variables. The API driver's test-account values may be in
// the environment; Claude must never read them (they are for the driver only).
const ENV_DUMP = /\bprintenv\b|(^|[;&|(]\s*)((\/usr)?(\/bin\/)?env|set|export|typeset|declare|compgen)(\s+-[a-z]+)*\s*($|[;&|)>])|\bdeclare\s+-[a-z]*[px]|\btypeset\s+-[a-z]*x|\bcompgen\s+-[a-z]*[ev]|\bps\b[^|;&]*\s-?[a-z]*e[a-z]*w|\bps\s+[a-z]*e[a-z]*\b|environ|process\s*(\.|\[)\s*['"`]?env|os\.environ|getenv|%ENV|\bENV\s*[\[.]|\bp\s+ENV\b|\$env:|\benv:[\\/]|Get-ChildItem\s+env:|\bdir\s+env:|\[Environment\]::/i;
const ENV_DENY = 'ReconQA blocks shell commands that print environment variables: they can hold the API test account\'s login. The API driver reads them itself; nothing else needs them.';
function credentialNames(project) {
  const c = readCompiled(project);
  if (!c.ok) return [];
  const a = c.config.app?.api ?? {};
  // Names were validated by the schema; re-check so a bad value cannot become a broken regex.
  return [a.token_env, ...Object.values(a.login?.body_env ?? {})].filter((n) => typeof n === 'string' && /^[A-Z_][A-Z0-9_]*$/.test(n));
}

const EMAIL = /\b[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}\b/g;

const canonical = (v) => Array.isArray(v) ? v.map(canonical)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])])) : v;
// Content fingerprint: the same payload sent through two different tools is still a duplicate.
export const fingerprint = (input, ignore = []) => createHash('sha256')
  .update(JSON.stringify(canonical(Object.fromEntries(Object.entries(input).filter(([k]) => !ignore.includes(k)))))).digest('hex');

const deny = (reason) => ({ decision: 'deny', reason: `ReconQA: ${reason}` });
const none = () => ({ decision: 'none' });

function adapters() {
  const out = {};
  for (const f of readdirSync(ADAPTERS).filter((x) => x.endsWith('.json'))) out[f.slice(0, -5)] = JSON.parse(readFileSync(join(ADAPTERS, f), 'utf8'));
  return out;
}
const opName = (tool) => tool.slice(tool.lastIndexOf('__') + 2);

function summarise(op, input, repo) {
  const parts = [`${op} on ${repo}`];
  for (const [k, v] of Object.entries(input)) {
    if (k === 'owner' || k === 'repo' || k === 'cloudId') continue;
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    const max = k === 'body' ? 1500 : 200;
    parts.push(`${k}: ${s.length > max ? s.slice(0, max).replace(/\s+/g, ' ') + ` … (${s.length} chars)` : s.replace(/\s+/g, ' ')}`);
  }
  return parts.join(' · ');
}

// Secrets and real people's email addresses must not leave the machine in a filed issue.
export function sensitive(input, testDomain = 'example.test') {
  const strings = [];
  const walk = (v) => { if (typeof v === 'string') strings.push(v); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  walk(input);
  for (const s of strings) {
    if (looksSecret(s)) return 'it contains something that looks like a secret (token, key or password in a URL)';
    for (const m of s.matchAll(EMAIL)) {
      const domain = m[0].split('@')[1].toLowerCase();
      if (domain !== testDomain && !domain.endsWith(`.${testDomain}`) && !/(^|\.)users\.noreply\.github\.com$/.test(domain)) return `it contains an email address that is not test data (${m[0].replace(/^(.).*@/, '$1…@')})`;
    }
  }
  return null;
}

// The knowledge base steers future cases and bug checks, so every change to it is shown first.
const KB_ASK = 'ReconQA: this changes the knowledge base (decisions, known issues, feature rules). What is written there steers future test cases, so check the change before approving.';
function kbPattern(project) {
  let dir = 'qa/kb';
  try { const c = readCompiled(project); if (c.ok && c.config.output?.kb) dir = c.config.output.kb; } catch { /* default */ }
  const parts = dir.split(/[\\/]+/).filter(Boolean).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(^|[\\\\/\\s'"=])${parts.join('[\\\\/]+')}([\\\\/]|$|[\\s'"])`);
}

// Cases written before the screen existed (header "Atlas: none yet") carry ‹expected: …› text from
// the ticket. Only reconcile.mjs may turn it into «…» after finding it in the atlas.
const PRE_UI_ASK = 'ReconQA: this adds «…» screen text to (or removes the "Atlas: none yet" header from) cases written before the screen existed. Only /reconqa:reconcile should do that, after finding the text in the atlas. Approve only if you checked the text on the real screen.';
const marks = (s) => (String(s ?? '').match(/«[^»\n]+»/g) ?? []).length;
function addsUiMarksToPreUi(tool, args, target, project) {
  const preUi = (t) => /\bAtlas:\s*none yet\b/i.test(String(t ?? '').split('\n').slice(0, 6).join('\n'));
  let current = null;
  try { const f = resolve(project, target); if (existsSync(f)) current = readFileSync(f, 'utf8'); } catch { /* unreadable: treat as new */ }
  if (tool === 'Write') return (preUi(current) && (!preUi(args.content) || marks(args.content) > marks(current))) || (preUi(args.content) && marks(args.content) > marks(current));
  if (!preUi(current)) return false;
  // Removing the "Atlas: none yet" header is how a later edit could add «» unasked: ask for that too.
  const dropsHeader = (o, n) => /Atlas:\s*none yet/i.test(String(o ?? '')) && !/Atlas:\s*none yet/i.test(String(n ?? ''));
  if (tool === 'Edit') return marks(args.new_string) > marks(args.old_string) || dropsHeader(args.old_string, args.new_string);
  if (tool === 'MultiEdit') return (args.edits ?? []).some((e) => marks(e?.new_string) > marks(e?.old_string) || dropsHeader(e?.old_string, e?.new_string));
  return false;
}

// App driver tools: deny by default. Returns a decision, or null when the tool is on no driver prefix.
function appDriverDecision(tool, cfg, appAdapterDir, args = {}, project = null) {
  const maps = { ...loadAppMaps(TM_ADAPTERS), ...loadAppMaps(appAdapterDir) };
  const details = Object.keys(args).length ? ` Details: ${JSON.stringify(args).slice(0, 300)}` : '';
  const hit = driverPrefixes(maps, cfg.capabilities?.app_driver ?? {}).find((x) => tool.startsWith(x.prefix));
  if (!hit) {
    // A driver installed under another name (e.g. through another plugin): its risky tools are still
    // recognised by name, whatever the prefix.
    const op = tool.slice(tool.lastIndexOf('__') + 2);
    for (const [name, map] of Object.entries(maps)) {
      if (map.deny.includes(op)) return deny(`${tool} looks like the ${name} driver's ${op}, which is blocked: ${map.deny_reasons?.[op] ?? 'it is on the deny list'}.`);
      if (map.ask.includes(op)) return { decision: 'ask', reason: `ReconQA: ${tool} looks like the ${name} driver's ${op}, which ${map.ask_reasons?.[op] ?? "changes the browser's stored state"}. Check it before approving.` };
    }
    return null;
  }
  const op = tool.slice(hit.prefix.length);
  const { map, name } = hit;
  // A TestRail upload is asked with the batch summary the helper saved at preview time (in
  // .reconqa/pending/, which the model cannot write), so the question shows what will be sent.
  if (name === 'testrail' && op === 'testrail_upload') {
    const id = String(args.batch ?? '');
    const f = project && /^(cases|results)-[0-9a-f]{8}$/.test(id) ? join(project, '.reconqa', 'pending', `testrail-${id}.json`) : null;
    if (!f || !existsSync(f)) return deny('this upload has no saved preview. Run the preview first.');
    let s; try { s = JSON.parse(readFileSync(f, 'utf8')); } catch { return deny('the saved preview for this upload cannot be read.'); }
    const list = (s.titles ?? s.results ?? []).join('; ');
    return { decision: 'ask', reason: `ReconQA upload to TestRail, check before approving: ${s.what} from ${s.file}${list ? `: ${list.slice(0, 900)}` : ''}${(s.titles ?? s.results ?? []).length >= 12 ? ' …' : ''}` };
  }
  if (map.deny.includes(op)) return deny(`${op} is blocked for the ${name} driver: ${map.deny_reasons?.[op] ?? 'it is on the deny list'}.`);
  if (map.ask.includes(op)) return { decision: 'ask', reason: `ReconQA: ${op} ${map.ask_reasons?.[op] ?? "changes the browser's stored state (cookies, storage or login)"}. Check it before approving.${details}` };
  if (map.allow.includes(op)) return none();
  return deny(`${op} is not in the ${name} tool map, so it is blocked. A newer driver version may have added it; update adapters/app/${name}.json after checking what it does.`);
}

export function decide(input, { projectDir, appAdapterDir } = {}) {
  const tool = String(input?.tool_name ?? '');
  const args = input?.tool_input && typeof input.tool_input === 'object' ? input.tool_input : {};
  const project = findProject([projectDir, input?.cwd]);
  if (!project) return none(); // not inside a ReconQA project

  // Rules that need no config.
  if (FILE_TOOLS.has(tool)) {
    const target = String(args.file_path ?? args.notebook_path ?? '');
    if (PENDING.test(target)) return deny('only the approval hooks write to .reconqa/pending/.');
    if (KIT_FILE.test(target)) return { decision: 'ask', reason: 'ReconQA: this changes the ReconQA config (tracker, filing and safety settings live here). Check the change before approving.' };
    if (kbPattern(project).test(target)) return { decision: 'ask', reason: KB_ASK };
    if (addsUiMarksToPreUi(tool, args, target, project)) return { decision: 'ask', reason: PRE_UI_ASK };
    return none();
  }
  if (tool === 'Bash' || tool === 'PowerShell') {
    const cmd = String(args.command ?? '');
    if (PENDING.test(cmd)) return deny('shell access to .reconqa/pending/ is blocked.');
    if (SHELL_WRITES.some((re) => re.test(cmd))) return deny('writes to an external tool through the shell are blocked. Use the tracker tool so the write can be checked and approved.');
    if (DEVICE_WRITES.some((re) => re.test(cmd))) return deny('writes to a device through the shell (adb, MQTT publish, serial port) are blocked. ReconQA drives devices only through a driver tool that the gate checks.');
    if (ENV_DUMP.test(cmd)) return deny(ENV_DENY);
    if (/[A-Z_]{3,}/.test(cmd)) {
      const hit = credentialNames(project).find((n) => new RegExp(`\\b${n}\\b`).test(cmd));
      if (hit) return deny(`${hit} holds the API test account's login (app.api in kit.yml); only the API driver may read it.`);
    }
    for (const [re, what] of SCRIPT_WRITES) {
      if (re.test(cmd) && !/\s--dry-run\b/.test(cmd)) return { decision: 'ask', reason: what === 'kb' ? KB_ASK : 'ReconQA: this converts expected texts in a cases file to confirmed screen text. Approve only after you saw the dry run and agreed with it.' };
    }
    if (kbPattern(project).test(cmd) && SHELL_FILE_WRITE.test(cmd)) return { decision: 'ask', reason: KB_ASK };
    if (/[«‹›]/.test(cmd) && SHELL_FILE_WRITE.test(cmd)) return { decision: 'ask', reason: PRE_UI_ASK };
    if (KIT_FILE.test(cmd) && SHELL_FILE_WRITE.test(cmd)) return { decision: 'ask', reason: 'ReconQA: this shell command may change the ReconQA config. Check it before approving.' };
    return none();
  }
  if (!tool.startsWith('mcp__')) return none();

  const compiled = readCompiled(project);
  if (!compiled.ok) return deny(`${compiled.reason} (MCP tools are blocked until the config is valid.)`);
  const cfg = compiled.config;
  const driver = appDriverDecision(tool, cfg, appAdapterDir, args, project);
  if (driver) return driver;
  const tracker = cfg.capabilities?.tracker ?? {};
  const maps = adapters();
  const adapter = tracker.tool && tracker.tool !== 'none' ? maps[tracker.tool] : null;
  if (tracker.tool && tracker.tool !== 'none' && !adapter) return deny(`no tool map for tracker "${tracker.tool}".`);
  const prefix = adapter ? (tracker.server_prefix || adapter.default_prefix) : null;
  const op = opName(tool);

  // A tracker-like tool that is NOT on the configured tracker server: a wrong server_prefix, a second
  // install of the same server, or a tracker ReconQA doesn't manage. Never let it through silently.
  if (!prefix || !tool.startsWith(prefix)) {
    const all = Object.values(maps);
    if (all.some((m) => m.deletes.includes(op))) return deny(`${tool} looks like a tracker delete. Deletes are never allowed.`);
    if (all.some((m) => m.writes.includes(op))) {
      return deny(`${tool} looks like a tracker write, but it is not on the configured tracker server${prefix ? ` (${prefix})` : ''}, so its target cannot be checked. Use the configured server, or set capabilities.tracker.server_prefix to this one.`);
    }
    return none();
  }

  // Where does this call write? GitHub: owner/repo fields. Jira: a project key, or an issue key "QA-12".
  let onRepo, target, targetLabel;
  if (adapter.target_fields) {
    const tf = adapter.target_fields;
    const proj = (tf.project ?? []).map((f) => args[f]).find((v) => v !== undefined && v !== null && v !== '');
    const key = (tf.issue_key ?? []).map((f) => args[f]).find((v) => v !== undefined && v !== null && v !== '');
    const fromKey = key !== undefined ? (String(key).match(/^([A-Z][A-Z0-9_]*)-\d+$/) ?? [])[1] : undefined;
    const got = [proj, fromKey].filter((v) => v !== undefined).map(String);
    target = tracker.project ?? null;
    targetLabel = got.join(' / ') || '?';
    onRepo = !!target && got.length > 0 && got.every((g) => g === target) && (key === undefined || fromKey !== undefined);
    // The same project key can exist on another site: the site must match too.
    if (tf.site) {
      const site = tf.site.map((f) => args[f]).find((v) => v !== undefined && v !== null && v !== '');
      const want = tracker.site ?? null;
      const siteOk = !!want && site !== undefined && String(site).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') === String(want).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!siteOk) { onRepo = false; targetLabel = `${targetLabel} on site ${site ?? '?'}`; if (!want) target = target && null; }
    }
  } else {
    const [owner, name] = String(tracker.repo ?? '/').split('/');
    const rf = adapter.repo_fields ?? {};
    target = tracker.repo ?? null;
    targetLabel = `${args[rf.owner] ?? '?'}/${args[rf.name] ?? '?'}`;
    onRepo = String(args[rf.owner] ?? '').toLowerCase() === owner.toLowerCase() && String(args[rf.name] ?? '').toLowerCase() === name.toLowerCase();
  }

  if (adapter.deletes.includes(op)) return deny(`${op} is a delete. Deletes are never allowed.`);
  if (adapter.reads.includes(op)) return onRepo ? { decision: 'allow', reason: 'ReconQA: tracker read on the configured repo.' } : none();
  if (!adapter.writes.includes(op)) return deny(`${op} is not in the ${tracker.tool} tool map, so it is blocked.`);

  const method = adapter.write_methods_field ? String(args[adapter.write_methods_field] ?? '') : '';
  if (/delete|remove/i.test(method)) return deny(`${op} with ${adapter.write_methods_field} "${method}" is a delete.`);
  for (const d of adapter.delete_like ?? []) if (d.values.includes(String(args[d.field] ?? '').toLowerCase())) return deny(`setting ${d.field} to "${args[d.field]}" counts as a delete and is not allowed.`);

  const policy = cfg.tracker_policy ?? {};
  if (policy.filing !== 'file-after-approval') return deny('tracker_policy.filing is draft-only: drafts stay local. Set it to file-after-approval to file.');
  const targetKey = adapter.target_fields ? `capabilities.tracker.project${adapter.target_fields.site ? ' and capabilities.tracker.site' : ''}` : 'capabilities.tracker.repo';
  if (!target) return deny(`${targetKey} is not set, so writes have no allowed target.`);
  if (!onRepo) return deny(`writes are only allowed to ${target}; this call targets ${targetLabel}.`);
  if (policy.assignee !== 'allowed') {
    for (const f of adapter.assignee_fields ?? []) {
      const v = args[f];
      if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)) return deny(`assigning people is off (tracker_policy.assignee: never). Remove "${f}".`);
    }
  }
  const leak = sensitive(args, cfg.app?.test_data?.email_domain);
  if (leak) return deny(`not sending this: ${leak}. Remove it from the draft first.`);

  const fp = fingerprint(args, [adapter.write_methods_field].filter(Boolean));
  const used = join(project, USED_FILE);
  if (existsSync(used) && readFileSync(used, 'utf8').split('\n').some((l) => l.includes(fp))) {
    return deny('this exact write was already sent once. Change the content if a second write is really needed.');
  }
  const local = join(project, '.reconqa', 'kit.local.yml');
  const personal = existsSync(local) && /^\s*(tracker_policy|capabilities)\s*:/m.test(readFileSync(local, 'utf8'))
    ? ' NOTE: your personal kit.local.yml changes tracker settings.' : '';
  return { decision: 'ask', reason: `ReconQA write, check before approving: ${summarise(op, args, target)}${personal}`, fingerprint: fp, op, project };
}
