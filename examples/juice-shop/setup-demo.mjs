#!/usr/bin/env node
// One-command demo setup for the Juice Shop example.
//   node examples/juice-shop/setup-demo.mjs [--url http://localhost:3000]
// 1. Checks Juice Shop answers (prints how to start it if not).
// 2. Creates a fresh demo customer through the app's public API.
// 3. Logs in and saves a pre-authenticated browser state to .reconqa/auth/state.json
//    (gitignored), with the welcome and cookie banners already dismissed.
// The password is random, never printed and never saved: only the session is kept.
// Juice Shop is a deliberately insecure training app. Run it on localhost only.
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const i = process.argv.indexOf('--url');
const URL_ = (i > 0 ? process.argv[i + 1] : 'http://localhost:3000').replace(/\/$/, '');
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(URL_).hostname) && !process.argv.includes('--force')) {
  console.error(`Refusing ${URL_}: the demo setup only runs against a local Juice Shop (add --force if you really mean it).`);
  process.exit(1);
}
const START = `Juice Shop is not running at ${URL_}. Start it on localhost only, e.g.:
  docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop:v20.4.0
or follow https://github.com/juice-shop/juice-shop#setup, then run this again.`;

async function api(path, body) {
  const res = await fetch(URL_ + path, { method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

try { await fetch(URL_, { signal: AbortSignal.timeout(5000) }); } catch { console.error(START); process.exit(1); }

const version = (await api('/rest/admin/application-version').catch(() => ({}))).version ?? 'unknown';
const email = `reconqa-demo-${randomBytes(3).toString('hex')}@example.test`;
const password = randomBytes(12).toString('base64url') + 'aA1!';
await api('/api/Users', { email, password, passwordRepeat: password,
  securityQuestion: { id: 1 }, securityAnswer: randomBytes(6).toString('hex') });
const { authentication } = await api('/rest/user/login', { email, password });

const host = new URL(URL_).hostname;
const cookie = (name, value) => ({ name, value, domain: host, path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' });
const state = {
  cookies: [cookie('token', authentication.token), cookie('welcomebanner_status', 'dismiss'), cookie('cookieconsent_status', 'dismiss')],
  origins: [{ origin: URL_, localStorage: [{ name: 'token', value: authentication.token }] }],
};
const dir = join(HERE, '.reconqa', 'auth');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'state.json'), JSON.stringify(state, null, 2), { mode: 0o600 });
console.log(`Juice Shop ${version} at ${URL_}
Demo customer: ${email} (password not kept)
Logged-in browser state: examples/juice-shop/.reconqa/auth/state.json (gitignored)
Next: open Claude Code in examples/juice-shop and run /reconqa:explore <area>`);
