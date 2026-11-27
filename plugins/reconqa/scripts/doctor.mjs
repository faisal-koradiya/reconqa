#!/usr/bin/env node
// ReconQA doctor: checks everything a project needs and says exactly how to fix what's missing.
//   node doctor.mjs [--project <dir>] [--json]
// Exit 0 = nothing blocking, 1 = at least one problem. No model calls, no installs, no secrets printed.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { load, formatError, PLUGIN_ROOT } from './lib/kit.mjs';
import { preflight } from './preflight.mjs';
import { summariseState } from './lib/auth-state.mjs';
import { findServers, isPlaywright, isGithub, isAtlassian, checkPlaywright, playwrightAddCommand, playwrightArgs } from './lib/mcp-config.mjs';
import { PLAYWRIGHT_MCP, NODE_MIN_MAJOR } from './lib/versions.mjs';

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };

// The browser helper drives Google Chrome by default. Where Chrome's stable channel installs itself.
export function chromeCandidates(env = process.env, platform = process.platform, home = homedir()) {
  if (platform === 'win32') return [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA]
    .filter(Boolean).map((d) => join(d, 'Google', 'Chrome', 'Application', 'chrome.exe'));
  if (platform === 'darwin') return ['/Applications/Google Chrome.app', join(home, 'Applications', 'Google Chrome.app')];
  return ['/opt/google/chrome/chrome'];
}

// Is there an allow rule for this MCP server's tools in any settings file Claude Code reads?
export function hasAllowRule(projectDir, serverName, home = homedir()) {
  const files = [join(projectDir, '.claude', 'settings.json'), join(projectDir, '.claude', 'settings.local.json'), join(home, '.claude', 'settings.json')];
  const want = `mcp__${serverName}`;
  return files.some((f) => (readJson(f)?.permissions?.allow ?? []).some((r) => r === want || r === `${want}__*` || r.startsWith(`${want}__`)));
}

export async function doctor(projectDir, { home = homedir(), fetchImpl = fetch } = {}) {
  const project = resolve(projectDir);
  const checks = [];
  const add = (level, title, detail = '', fix = '') => checks.push({ level, title, detail, fix });

  const major = Number(process.versions.node.split('.')[0]);
  if (major < NODE_MIN_MAJOR) add('fail', `Node.js ${process.versions.node}`, `ReconQA needs Node.js ${NODE_MIN_MAJOR} or newer.`, 'Install the LTS version from https://nodejs.org');
  else add('ok', `Node.js ${process.versions.node}`, 'The write gate and the checks can run.');

  if (!existsSync(join(project, '.reconqa', 'kit.yml'))) {
    add('fail', 'No ReconQA settings in this folder', `${join(project, '.reconqa', 'kit.yml')} does not exist.`, 'Run /reconqa:setup here (or start Claude Code in your project folder).');
    return checks;
  }
  const { config, errors } = load(project);
  if (errors.length) {
    add('fail', 'Settings have errors', errors.slice(0, 5).map((e) => formatError(e, project)).join('\n'), 'Fix the lines above in .reconqa/kit.yml, or run /reconqa:setup again.');
    return checks;
  }
  add('ok', 'Settings are valid', '.reconqa/kit.yml');

  // App
  const pre = await preflight(project, undefined, { fetchImpl });
  const android = config.app?.target === 'android';
  const api = config.app?.target === 'api';
  if (pre.ok && api) add('ok', `API answers at ${pre.url}`, `HTTP ${pre.status}, environment: ${pre.kind}. ${pre.allow_create ? 'Creating test records is on.' : 'Only reads (GET) unless allow_create is on and this is a test server.'}`);
  else if (pre.ok && android) add('ok', `Device ${pre.device} is ready and ${pre.package} is installed`, pre.emulator ? 'Emulator.' : 'Real phone (allow_real_device is on): use a test phone only.');
  else if (pre.ok) add('ok', `App answers at ${pre.url}`, `HTTP ${pre.status}, environment: ${pre.kind}.`);
  else add('fail', 'App check failed', pre.reason, android ? 'Start the emulator or connect the test phone, install the app, or correct app.android in .reconqa/kit.yml.' : api ? 'Start the API, or correct app.api.base_url in .reconqa/kit.yml.' : 'Start the app, or correct app.url in .reconqa/kit.yml.');

  // Saved login
  const statePath = config.app?.auth?.browser_state;
  const stateFile = statePath ? join(project, statePath) : null;
  const stateExists = !!stateFile && existsSync(stateFile);
  if (api) {
    const a = config.app?.api ?? {};
    const names = [a.token_env, ...Object.values(a.login?.body_env ?? {})].filter(Boolean);
    const apiServer = findServers(project, { home }).find((x) => x.args.some((y) => /drivers[\\/]api[\\/]server\.mjs$/.test(y)));
    const missing = names.filter((n) => !process.env[n] && !apiServer?.envKeys?.includes(n));
    if (!names.length) add('info', 'No API login set', 'Requests are sent without a login.', 'If the API needs one, add app.api.token_env or app.api.login to .reconqa/kit.yml.');
    else if (missing.length) add('warn', 'API login values are not set', `Not given to the API driver: ${missing.join(', ')}.`, `Register the driver with them (see adapters/app/http-api.md), e.g.  claude mcp add reconqa-api --scope local -e ${missing[0]}=… -- node <plugin>/drivers/api/server.mjs  (never in kit.yml).`);
    else add('ok', 'API login values are set', `${names.join(', ')} (values not shown).`);
  } else if (android) add('info', 'Login on Android', 'ReconQA uses the test account already signed in to the app on the device.', 'Sign in on the device yourself once, with a test account.');
  else if (!stateExists) add('info', 'No saved login', 'Exploring starts logged out. That is fine for public pages and sign-up.', 'If the area needs a login, run /reconqa:login.');
  else {
    const s = summariseState(stateFile, config.app?.url);
    const exp = s.earliestExpiry ? ` Earliest expiry: ${s.earliestExpiry.toISOString().slice(0, 16).replace('T', ' ')} UTC.` : '';
    if (s.ok) add('ok', 'Saved login found', `${s.cookies} cookie(s) and ${s.storage} storage item(s) for the app.${exp}`);
    else add('fail', 'Saved login is not usable', s.problems.join('; ') + '.', 'Run /reconqa:login to save a fresh one.');
    if (s.worldReadable) add('warn', 'Saved login can be read by other users of this computer', statePath, `chmod 600 ${statePath}`);
    const ig = spawnSync('git', ['check-ignore', '-q', statePath], { cwd: project });
    if (ig.status === 1) add('fail', 'Saved login is not ignored by git', 'It could be committed and shared.', 'Add the line  .reconqa/auth/  to .gitignore');
  }

  // Browser helper
  const servers = findServers(project, { home });
  const driver = config.capabilities?.app_driver?.tool ?? 'playwright';
  const pw = driver === 'playwright' ? servers.filter(isPlaywright) : [];
  if (driver === 'none') add('info', 'No browser helper chosen', 'capabilities.app_driver.tool is none: exploring and running cases are off.', 'Set capabilities.app_driver.tool: playwright (or claude-in-chrome) in .reconqa/kit.yml');
  else if (driver === 'claude-in-chrome') {
    add('info', 'Browser helper: your own Chrome (Claude in Chrome extension)', 'ReconQA cannot see from here whether the extension is connected.',
      'Start Claude Code with  claude --chrome  (or type /chrome), and connect the extension. Use a separate Chrome profile that only has test logins.');
    if (!hasAllowRule(project, 'claude-in-chrome', home)) add('warn', 'Claude Code will ask before every browser step', 'Exploring works, but you will see many permission questions.', 'Add to .claude/settings.local.json:  {"permissions": {"allow": ["mcp__claude-in-chrome__*"]}}');
  } else if (driver === 'http-api') {
    const srv = servers.find((x) => x.args.some((a) => /drivers[\\/]api[\\/]server\.mjs$/.test(a)));
    const addCmd = `claude mcp add reconqa-api --scope project -- node "${join(PLUGIN_ROOT, 'drivers', 'api', 'server.mjs')}"`;
    if (!srv) add('fail', 'API driver is not set up for this project', 'Exploring and running cases need it.', `Run in this folder, then restart Claude Code:\n  ${addCmd}`);
    else {
      add('ok', `API driver "${srv.name}" (${srv.scope} scope)`, 'Built in; talks only to app.api.base_url.');
      const prefix = config.capabilities?.app_driver?.server_prefix;
      if (srv.name !== 'reconqa-api' && prefix !== `mcp__${srv.name}__`) add('fail', 'API driver name does not match the settings', `Server is "${srv.name}", settings expect mcp__reconqa-api__.`, `Set capabilities.app_driver.server_prefix: mcp__${srv.name}__ in .reconqa/kit.yml`);
      if (!hasAllowRule(project, srv.name, home)) add('warn', 'Claude Code will ask before every API request', 'Exploring works, but you will see many permission questions.', `Add to .claude/settings.local.json:  {"permissions": {"allow": ["mcp__${srv.name}__*"]}}`);
    }
  } else if (driver === 'android-adb') {
    const srv = servers.find((x) => x.args.some((a) => /drivers[\\/]android[\\/]server\.mjs$/.test(a)));
    const addCmd = `claude mcp add reconqa-android --scope project -- node "${join(PLUGIN_ROOT, 'drivers', 'android', 'server.mjs')}"`;
    if (!srv) add('fail', 'Android driver is not set up for this project', 'Exploring and running cases need it.', `Run in this folder, then restart Claude Code:\n  ${addCmd}`);
    else {
      add('ok', `Android driver "${srv.name}" (${srv.scope} scope)`, 'Built in; talks only to app.android.device and app.android.package.');
      const prefix = config.capabilities?.app_driver?.server_prefix;
      if (srv.name !== 'reconqa-android' && prefix !== `mcp__${srv.name}__`) add('fail', 'Android driver name does not match the settings', `Server is "${srv.name}", settings expect mcp__reconqa-android__.`, `Set capabilities.app_driver.server_prefix: mcp__${srv.name}__ in .reconqa/kit.yml`);
      if (!hasAllowRule(project, srv.name, home)) add('warn', 'Claude Code will ask before every Android step', 'Exploring works, but you will see many permission questions.', `Add to .claude/settings.local.json:  {"permissions": {"allow": ["mcp__${srv.name}__*"]}}`);
    }
  } else if (driver !== 'playwright') {
    add('info', `Browser helper: ${driver} (your own tool map)`, `ReconQA checks its tools with adapters/app/${driver}.json but cannot check how the helper is installed.`, `Make sure its MCP server is connected (/mcp in Claude Code).`);
  }
  if (driver !== 'playwright') { /* the Playwright checks below do not apply */ } else {
  const addCmd = playwrightAddCommand(config, { stateExists });
  if (!pw.length) add('fail', 'Browser helper (Playwright MCP) is not set up for this project', 'Exploring and bug drafts need it.', `Run in this folder, then restart Claude Code:\n  ${addCmd}`);
  else {
    const s = pw[0];
    const r = checkPlaywright(s, config, { stateExists });
    const where = `"${s.name}" (${s.scope} scope)`;
    if (r.problems.length) add('fail', `Browser helper ${where} needs a change`, r.problems.join('; ') + '.',
      s.scope === 'project' ? `In .mcp.json, set "command" to "npx" and the "args" of "${s.name}" to:\n  ${JSON.stringify(playwrightArgs(config, { stateExists }))}\nthen restart Claude Code.` : `Run in this folder, then restart Claude Code:\n  claude mcp remove ${s.name} -s ${s.scope}\n  ${addCmd.replace('claude mcp add playwright', `claude mcp add ${s.name}`)}`);
    else add('ok', `Browser helper ${where}`, s.args.find((a) => a.startsWith('@playwright/mcp')));
    for (const w of r.warnings) add('warn', 'Browser helper', w);
    const prefix = config.capabilities?.app_driver?.server_prefix;
    if (prefix && prefix !== `mcp__${s.name}__`) add('fail', 'Browser helper name does not match the settings', `Server is "${s.name}", settings expect ${prefix}.`, `Set capabilities.app_driver.server_prefix: mcp__${s.name}__ in .reconqa/kit.yml`);
    if (!hasAllowRule(project, s.name, home)) add('warn', 'Claude Code will ask before every browser step', 'Exploring works, but you will see many permission questions.', `Add to .claude/settings.local.json:  {"permissions": {"allow": ["mcp__${s.name}__*"]}}`);
  }
  }
  if (driver !== 'none' && !android && !api && !chromeCandidates().some((p) => existsSync(p))) add('warn', 'Google Chrome not found', 'The browser helper and /reconqa:login use Chrome.', `Install it from https://www.google.com/chrome, or run: npx -y -p ${PLAYWRIGHT_MCP} playwright install chrome`);

  // Test management
  const tm = config.capabilities?.test_management ?? {};
  if (tm.tool === 'testrail') {
    const srv = servers.find((x) => x.args.some((a) => /drivers[\\/]testrail[\\/]server\.mjs$/.test(a)));
    const addCmd = `claude mcp add reconqa-testrail --scope local -e ${tm.user_env ?? 'TESTRAIL_USER'}=<your email> -e ${tm.key_env ?? 'TESTRAIL_API_KEY'}=<your key> -- node "${join(PLUGIN_ROOT, 'drivers', 'testrail', 'server.mjs')}"`;
    if (!srv) add('fail', 'TestRail helper is not set up', '/reconqa:upload needs it.', `Run in this folder, then restart Claude Code:\n  ${addCmd}`);
    else {
      const missing = [tm.user_env, tm.key_env].filter((n) => n && !srv.envKeys?.includes(n) && !process.env[n]);
      if (missing.length) add('warn', 'TestRail login not given to the helper', `Missing: ${missing.join(', ')}.`, `Register it again with them:\n  claude mcp remove ${srv.name} -s ${srv.scope}\n  ${addCmd}`);
      else add('ok', `TestRail helper "${srv.name}" (${srv.scope} scope)`, `Project ${tm.project_id}, section ${tm.section_id}; uploads are previewed and asked.`);
    }
  }

  // Tracker
  const tr = config.capabilities?.tracker ?? {};
  const filing = config.tracker_policy?.filing ?? 'draft-only';
  if (!tr.tool || tr.tool === 'none') add('info', 'No tracker connected', 'Bug drafts are saved as files in qa/bugs; you copy them into your tracker.');
  else {
    const name = (tr.server_prefix ?? '').replace(/^mcp__|__$/g, '');
    const jira = tr.tool === 'jira';
    const gh = servers.find((s) => (name && s.name === name) || (jira ? isAtlassian(s) : isGithub(s)));
    if (!gh) add(filing === 'draft-only' ? 'warn' : 'fail', `Tracker helper for ${tr.tool} not found`, `Filing mode: ${filing}.`, `See plugins/reconqa/adapters/tracker/${tr.tool}.md in the ReconQA folder.`);
    else add('ok', `Tracker helper "${gh.name}" (${gh.scope} scope)`, `${jira ? 'Project' : 'Repo'}: ${(jira ? tr.project : tr.repo) ?? 'not set'}; filing mode: ${filing}.`);
    if (jira && !tr.site) add('fail', 'Jira site not set', 'The write gate refuses every filing without it.', 'Set capabilities.tracker.site: <yourteam.atlassian.net or the cloudId> in .reconqa/kit.yml');
    if (jira && !tr.project) add('fail', 'Jira project not set', 'The write gate refuses every filing without it.', 'Set capabilities.tracker.project: <project key, e.g. QA> in .reconqa/kit.yml');
    if (!jira && !tr.repo) add('fail', 'Tracker repo not set', 'The write gate refuses every filing without it.', 'Set capabilities.tracker.repo: owner/name in .reconqa/kit.yml');
  }

  // Write gate
  if (existsSync(join(PLUGIN_ROOT, 'hooks', 'hooks.json'))) add('ok', 'Write gate installed', 'It asks before any tracker write and blocks deletes.');
  else add('fail', 'Write gate files missing', 'hooks/hooks.json not found in the plugin.', 'Reinstall the plugin.');
  return checks;
}

const ICON = { ok: '[ok]  ', warn: '[warn]', fail: '[FAIL]', info: '[info]' };
export function render(checks) {
  const lines = [];
  for (const c of checks) {
    lines.push(`${ICON[c.level]} ${c.title}`);
    if (c.detail) for (const l of c.detail.split('\n')) lines.push(`       ${l}`);
    if (c.fix) { const [first, ...rest] = c.fix.split('\n'); lines.push(`       Fix: ${first}`); for (const l of rest) lines.push(`       ${l}`); }
  }
  const n = (l) => checks.filter((c) => c.level === l).length;
  lines.push('', n('fail') ? `${n('fail')} problem(s) to fix, ${n('warn')} warning(s).` : `Ready. ${n('warn')} warning(s).`);
  return lines.join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const i = process.argv.indexOf('--project');
  const checks = await doctor(i > 0 ? process.argv[i + 1] : '.');
  console.log(process.argv.includes('--json') ? JSON.stringify(checks, null, 2) : render(checks));
  process.exit(checks.some((c) => c.level === 'fail') ? 1 : 0);
}
