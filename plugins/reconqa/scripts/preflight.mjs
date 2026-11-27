#!/usr/bin/env node
// Pre-flight check before an explore run: is the app reachable, and may we explore it?
//   node preflight.mjs --project <dir> [--env <name>]
// Exit 0 = go (prints JSON), 1 = stop (prints the reason). No model calls, no installs.
import { load } from './lib/kit.mjs';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { settings, parseDevices, isEmulator } from '../drivers/android/core.mjs';
import { settings as apiSettings } from '../drivers/api/core.mjs';

const adbRun = (args) => new Promise((res) => execFile(process.env.RECONQA_ADB || 'adb', args, { timeout: 15000 },
  (err, stdout, stderr) => res({ code: err ? (typeof err.code === 'number' ? err.code : 127) : 0, stdout: String(stdout), stderr: String(stderr || err?.message || '') })));

// Android: the configured device is connected and ready, and the test app is installed on it.
async function preflightAndroid(app, env, adb) {
  let st;
  try { st = settings({ app }); } catch (e) { return { ok: false, reason: e.message }; }
  if (env?.kind === 'production') return { ok: false, reason: `"${env.name}" is a production environment. Explore only runs on local, test or staging.` };
  const list = await adb(['devices']);
  if (list.code !== 0) return { ok: false, reason: `adb is not working (${list.stderr.trim().slice(0, 120)}). Install Android platform-tools. No tokens were spent.` };
  const state = parseDevices(list.stdout).get(st.device);
  if (!state) return { ok: false, reason: `Device ${st.device} is not connected. Start the emulator (or plug in the test phone) and check "adb devices". No tokens were spent.` };
  if (state !== 'device') return { ok: false, reason: `Device ${st.device} is "${state}". Accept the USB debugging prompt, or wait for the emulator to start. No tokens were spent.` };
  const pm = await adb(['-s', st.device, 'shell', 'pm', 'path', st.pkg]);
  if (!/package:/.test(pm.stdout)) return { ok: false, reason: `${st.pkg} is not installed on ${st.device}. Install the test build first. No tokens were spent.` };
  return { ok: true, target: 'android', device: st.device, package: st.pkg, emulator: isEmulator(st.device), env: env?.name ?? null, kind: env?.kind ?? (isEmulator(st.device) ? 'local' : 'unknown'),
    allow_create: app.test_data?.allow_create === true && (isEmulator(st.device) || ['local', 'test', 'staging'].includes(env?.kind)),
    prefix: app.test_data?.prefix, email_domain: app.test_data?.email_domain };
}

const isLoopback = (u) => { try { return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(u).hostname); } catch { return false; } };

// API: the server answers (any status below 500 counts; 401 and 404 on the base path are normal).
async function preflightApi(app, fetchImpl, timeoutMs) {
  let st;
  try { st = apiSettings({ app }); } catch (e) { return { ok: false, reason: e.message }; }
  const url = st.base.href;
  let status;
  try { status = (await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) })).status; }
  catch (err) { return { ok: false, reason: `API not reachable at ${url} (${err.cause?.code ?? err.name}). Start it, then try again. No tokens were spent.` }; }
  if (status >= 500) return { ok: false, reason: `API at ${url} answered ${status}. Fix the server first. No tokens were spent.` };
  return { ok: true, target: 'api', url, status, env: st.env?.name ?? null, kind: st.env?.kind ?? (st.testServer ? 'local' : 'unknown'),
    allow_create: st.allowWrite, prefix: app.test_data?.prefix, email_domain: app.test_data?.email_domain };
}

export async function preflight(project, envName, { fetchImpl = fetch, timeoutMs = 5000, adb = adbRun } = {}) {
  const { config, errors } = load(project);
  if (errors.length) return { ok: false, reason: `Config has errors; run the validator. First: ${errors[0].message ?? errors[0]}` };
  const app = config.app ?? {};
  const envs = app.environments ?? [];
  const env = envName ? envs.find((e) => e.name === envName) : envs.find((e) => e.url === app.url) ?? null;
  if (envName && !env) return { ok: false, reason: `No environment named "${envName}" in kit.yml.` };
  if (app.target === 'android') return preflightAndroid(app, env, adb);
  if (app.target === 'api') return preflightApi(app, fetchImpl, timeoutMs);
  const url = env?.url ?? app.url;
  if (!url) return { ok: false, reason: 'No app URL. Set app.url in .reconqa/kit.yml.' };
  if (env?.kind === 'production') return { ok: false, reason: `"${env.name}" is a production environment. Explore only runs on local, test or staging.` };
  let status;
  try {
    const res = await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    status = res.status;
  } catch (err) {
    return { ok: false, reason: `App not reachable at ${url} (${err.cause?.code ?? err.name}). Start it, then try again. No tokens were spent.` };
  }
  if (status >= 500) return { ok: false, reason: `App at ${url} answered ${status}. Fix the app first. No tokens were spent.` };
  return { ok: true, url, status, env: env?.name ?? null, kind: env?.kind ?? 'unknown',
    // Creating data needs a labelled non-production env, or the app on this machine.
    allow_create: app.test_data?.allow_create === true && env?.kind !== 'production'
      && (['local', 'test', 'staging'].includes(env?.kind) || isLoopback(url)),
    prefix: app.test_data?.prefix, email_domain: app.test_data?.email_domain };
}

// The driver guide the skills read for tool names (absolute path, so no variable has to be expanded).
const ADAPTERS = join(dirname(fileURLToPath(import.meta.url)), '..', 'adapters', 'app');
export function driverGuide(config) {
  const tool = config?.capabilities?.app_driver?.tool ?? 'playwright';
  const f = join(ADAPTERS, `${tool}.md`);
  return tool !== 'none' && existsSync(f) ? f : null;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('preflight.mjs')) {
  const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
  const r = await preflight(arg('--project') ?? '.', arg('--env'));
  if (r.ok) { try { const c = load(arg('--project') ?? '.').config; r.driver_guide = driverGuide(c); r.max_steps = c?.explore?.max_steps ?? 80; } catch { /* optional */ } console.log(JSON.stringify(r)); } else console.error(r.reason);
  process.exit(r.ok ? 0 : 1);
}
