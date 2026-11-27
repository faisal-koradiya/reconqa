#!/usr/bin/env node
// Save a logged-in browser session for exploring, without ReconQA ever seeing the password.
//   node playwright-login.mjs [--project <dir>] [--url <start url>] [--minutes 9]
// Opens a visible Chrome window on the app. The user logs in with a test account and closes the
// window. The session (cookies + local storage) is written to app.auth.browser_state.
// Nothing the user types is printed or stored by this script; the browser's output is discarded.
// Exit 0 = saved, 1 = not saved (reason printed). An older saved session is kept until a new one is valid.
import { existsSync, mkdirSync, renameSync, rmSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { load } from '../../scripts/lib/kit.mjs';
import { preflight } from '../../scripts/preflight.mjs';
import { summariseState } from '../../scripts/lib/auth-state.mjs';
import { PLAYWRIGHT_MCP } from '../../scripts/lib/versions.mjs';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const project = arg('--project') ?? '.';
const minutes = Number(arg('--minutes') ?? 9);
const stop = (msg) => { console.error(msg); process.exit(1); };

const { config, errors } = load(project);
if (errors.length) stop('Settings have errors. Run the doctor first: node <plugin>/scripts/doctor.mjs');
const pre = await preflight(project);
if (!pre.ok) stop(pre.reason);
const url = arg('--url') ?? pre.url;
const statePath = config.app?.auth?.browser_state ?? '.reconqa/auth/state.json';
const target = join(project, statePath);
const temp = target + '.new';

const manual = `npx -y -p ${PLAYWRIGHT_MCP} playwright open --channel chrome --save-storage=${statePath} ${url}`;
if (process.platform === 'linux' && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) {
  stop(`No screen is available here, so a browser window can't open.\nOn a computer with a screen, in this project folder, run:\n  ${manual}\nlog in, close the window, and copy ${statePath} here.`);
}

mkdirSync(dirname(target), { recursive: true });
rmSync(temp, { force: true });
console.log(`A Chrome window is opening at ${url}.\nLog in with a TEST account, wait until you see you are logged in, then close the window.\nWaiting up to ${minutes} minutes...`);

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(npx, ['-y', '-p', PLAYWRIGHT_MCP, 'playwright', 'open', '--channel', 'chrome', `--save-storage=${temp}`, url],
  { stdio: ['ignore', 'ignore', 'pipe'], shell: process.platform === 'win32', detached: process.platform !== 'win32' });
let err = '';
child.stderr.on('data', (d) => { err += d; });
let timedOut = false;
// SIGINT makes the browser save the session and close. Send it to the whole process group,
// because npx does not pass signals on to the browser it started.
const interrupt = () => { try { process.platform === 'win32' ? child.kill() : process.kill(-child.pid, 'SIGINT'); } catch { /* already gone */ } };
const timer = setTimeout(() => { timedOut = true; interrupt(); }, minutes * 60_000);
process.on('SIGINT', interrupt);
process.on('SIGTERM', interrupt);
const code = await new Promise((r) => child.on('close', r));
clearTimeout(timer);

if (!existsSync(temp)) {
  if (/is not found|Executable doesn't exist|chrome.*not.*found/i.test(err)) {
    stop(`Google Chrome was not found. Install it from https://www.google.com/chrome or run:\n  npx -y -p ${PLAYWRIGHT_MCP} playwright install chrome\nthen try again. Nothing was saved.`);
  }
  stop(`The browser closed without saving a session (exit ${code}). Nothing was changed.${err ? '\nBrowser said: ' + err.split('\n').find((l) => l.trim())?.slice(0, 200) : ''}`);
}
const s = summariseState(temp, url);
if (!s.ok) { rmSync(temp, { force: true }); stop(`Not saved: ${s.problems.join('; ')}. ${existsSync(target) ? 'The previous session was kept.' : ''}\nTry again and finish logging in before closing the window.`); }
renameSync(temp, target);
try { chmodSync(target, 0o600); } catch { /* Windows: file permissions work differently */ }
const exp = s.earliestExpiry ? `, earliest expiry ${s.earliestExpiry.toISOString().slice(0, 16).replace('T', ' ')} UTC` : '';
console.log(`Saved ${statePath}: ${s.cookies} cookie(s) and ${s.storage} storage item(s) for the app${exp}.${timedOut ? '\nThe window was closed for you after the time limit. If you had not finished logging in, run this again.' : ''}`);
const ig = spawnSync('git', ['check-ignore', '-q', statePath], { cwd: project });
if (ig.status === 1) console.log(`WARNING: ${statePath} is not ignored by git. Add the line  .reconqa/auth/  to .gitignore so it is never committed.`);
console.log('This file is a login session: keep it private. Next: run the doctor to make sure the browser helper uses it.');
