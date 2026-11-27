// Built-in API driver (plugins/reconqa/drivers/api): paths, write rules, secrets, login, spec, gate, preflight.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { settings, resolvePath, redact, summariseSpec, createDriver, TOOL_LIST, DriverError } from '../plugins/reconqa/drivers/api/core.mjs';
import { loadAppMaps } from '../plugins/reconqa/scripts/lib/app-maps.mjs';
import { compile, load } from '../plugins/reconqa/scripts/lib/kit.mjs';
import { decide } from '../plugins/reconqa/hooks/lib/gate-core.mjs';
import { preflight } from '../plugins/reconqa/scripts/preflight.mjs';

const cfg = (api = {}, extra = {}) => ({ app: { target: 'api', api: { base_url: 'http://localhost:3101', ...api }, test_data: { allow_create: true, prefix: 'reconqa' }, ...extra } });

// Fake fetch: records requests, answers from a handler.
function fakeFetch(handler = () => ({ status: 200, body: { ok: true } })) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    calls.push({ url: u, method: init.method ?? 'GET', headers: init.headers ?? {}, body: init.body });
    const r = handler(u, init) ?? {};
    const h = new Headers({ 'content-type': 'application/json', ...(r.headers ?? {}) });
    return new Response(typeof r.body === 'string' ? r.body : JSON.stringify(r.body ?? {}), { status: r.status ?? 200, headers: h });
  };
  return { calls, fetchImpl };
}
const driver = (c, f, env = {}) => createDriver({ config: () => c, fetchImpl: f.fetchImpl, env });

test('settings: api target and base URL required; production refused; writes only on a test server', () => {
  assert.throws(() => settings({ app: { target: 'web' } }), /not "api"/);
  assert.throws(() => settings({ app: { target: 'api', api: {} } }), /base_url/);
  assert.throws(() => settings(cfg({ base_url: 'http://u:p@localhost:1' })), /user:password/);
  assert.equal(settings(cfg()).allowWrite, true);
  assert.equal(settings(cfg({ base_url: 'https://api.example.com' })).allowWrite, false, 'remote host without a test environment');
  const staging = cfg({ base_url: 'https://api.example.com' }, { environments: [{ name: 'stg', url: 'https://api.example.com', kind: 'staging' }] });
  assert.equal(settings(staging).allowWrite, true);
  const prod = cfg({ base_url: 'https://api.example.com' }, { environments: [{ name: 'live', url: 'https://api.example.com', kind: 'production' }] });
  assert.throws(() => settings(prod), /production/);
  assert.throws(() => settings(cfg({ token_env: 'my token' })), /environment variable name/);
});

test('paths stay on the API server', () => {
  const st = settings(cfg({ base_url: 'http://localhost:3101/api/v1' }));
  assert.equal(resolvePath(st, '/users/1', { a: 1 }).href, 'http://localhost:3101/api/v1/users/1?a=1');
  for (const bad of ['users', 'http://evil.test/x', '//evil.test/x', '/a/../b', '/a\\b', '/a b', '/..']) {
    assert.throws(() => resolvePath(st, bad), DriverError, bad);
  }
});

test('secrets are hidden: password-like keys, JWTs, set-cookie never shown', async () => {
  assert.deepEqual(redact({ user: { name: 'a', password: 'x', apiKey: 'k', nested: [{ token: 't' }] }, empty: { password: '' } }),
    { user: { name: 'a', password: '[hidden]', apiKey: '[hidden]', nested: [{ token: '[hidden]' }] }, empty: { password: '' } });
  const f = fakeFetch(() => ({ body: { id: 1, note: 'eyJhbGciOi.eyJzdWIi.sig' }, headers: { 'set-cookie': 'sid=abc; HttpOnly' } }));
  const out = await driver(cfg(), f).api_get({ path: '/me' });
  assert.doesNotMatch(out, /abc|eyJ|set-cookie/i);
  assert.match(out, /GET \/me → 200/);
});

test('writes: off without allow_create; PUT, PATCH and DELETE only on records this run created', async () => {
  const f = fakeFetch((u, init) => (init.method === 'POST' ? { status: 201, body: { transaction: { id: 'abc123', title: 'reconqa-x' } } } : { status: 200, body: {} }));
  const off = driver(cfg({}, { test_data: { allow_create: false } }), f);
  await assert.rejects(off.api_send({ method: 'POST', path: '/items', body: {} }), /allow_create/);
  const t = driver(cfg(), f);
  await assert.rejects(t.api_send({ method: 'PATCH', path: '/items/seeded-1', body: {} }), /records this run created/);
  await assert.rejects(t.api_delete({ path: '/items/seeded-1' }), /records this run created/);
  await assert.rejects(t.api_send({ method: 'DELETE', path: '/items/1' }), /POST, PUT or PATCH/);
  await assert.rejects(t.api_get({ method: 'POST', path: '/items' }), /api_send/);
  const created = await t.api_send({ method: 'POST', path: '/items', body: { title: 'reconqa-x' } });
  assert.match(created, /Created \/items\/abc123/);
  assert.doesNotMatch(created, /Warning/);
  assert.match(await t.api_send({ method: 'PATCH', path: '/items/abc123', body: { title: 'reconqa-y' } }), /PATCH \/items\/abc123 → 200/);
  assert.match(await t.api_delete({ path: '/items/abc123' }), /DELETE \/items\/abc123 → 200/);
  assert.match(await t.api_created(), /No records/);
  const loc = driver(cfg(), fakeFetch(() => ({ status: 201, body: {}, headers: { location: 'http://localhost:3101/things/9' } })));
  assert.match(await loc.api_send({ method: 'POST', path: '/things', body: { n: 1 } }), /Created \/things\/9[\s\S]*Warning: the request had no "reconqa"/);
});

test('remote server without a test environment: no writes even with allow_create', async () => {
  const t = driver(cfg({ base_url: 'https://api.example.com' }), fakeFetch());
  await assert.rejects(t.api_send({ method: 'POST', path: '/x', body: {} }), /local or test server/);
});

test('login: credentials from environment variables, session kept, never shown; token header from env', async () => {
  const f = fakeFetch((u) => (u.pathname === '/login' ? { status: 200, body: { user: { id: 1, password: 'hash' } }, headers: { 'set-cookie': 'connect.sid=s%3Aabc; Path=/; HttpOnly' } } : { body: {} }));
  const c = cfg({ login: { path: '/login', body_env: { username: 'QA_USER', password: 'QA_PASS' } } });
  await assert.rejects(driver(c, f, {}).api_login(), /QA_USER is empty/);
  const t = driver(c, f, { QA_USER: 'tester', QA_PASS: 'pw-123' });
  const out = await t.api_login();
  assert.match(out, /Logged in \(200\)/);
  assert.doesNotMatch(out, /pw-123|abc|hash/);
  assert.equal(JSON.parse(f.calls[0].body).password, 'pw-123');
  await t.api_get({ path: '/me' });
  assert.equal(f.calls[1].headers.cookie, 'connect.sid=s%3Aabc');
  const tok = fakeFetch();
  await driver(cfg({ token_env: 'QA_TOKEN' }), tok, { QA_TOKEN: 't0k' }).api_get({ path: '/me' });
  assert.equal(tok.calls[0].headers.authorization, 'Bearer t0k');
  await assert.rejects(driver(cfg({ token_env: 'QA_TOKEN' }), tok, {}).api_get({ path: '/me' }), /QA_TOKEN/);
});

test('spec summary: paths, required fields, limits, $ref and responses', () => {
  const spec = {
    openapi: '3.0.0', info: { title: 'Demo', version: '1' },
    components: { schemas: { Item: { type: 'object', required: ['title'], properties: { title: { type: 'string', maxLength: 40 }, qty: { type: 'integer', minimum: 1 } } } } },
    paths: { '/items': { post: { summary: 'Add', requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } }, responses: { 201: { description: 'Created' }, 422: { description: 'Invalid' } } }, get: {} } },
  };
  const s = summariseSpec(spec);
  assert.match(s, /POST \/items — Add required: title fields: title \(string max 40\), qty \(integer ≥1\) \| responses: 201 Created; 422 Invalid/);
  assert.match(s, /GET \/items/);
  assert.throws(() => summariseSpec({}), /paths/);
});

test('tool map lists every API tool; the gate asks before deletes and denies unknown tools', () => {
  const map = loadAppMaps()['http-api'];
  assert.equal(map.target, 'api');
  const listed = new Set([...map.allow, ...map.ask, ...map.deny]);
  assert.deepEqual(TOOL_LIST.map((t) => t.name).filter((n) => !listed.has(n)), []);
  assert.deepEqual([...listed].filter((n) => !TOOL_LIST.some((t) => t.name === n)), []);
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-api-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\napp:\n  target: api\n  api:\n    base_url: http://localhost:3101\n    login:\n      path: /login\n      body_env:\n        username: QA_USER\n        password: QA_PASS\ncapabilities:\n  app_driver:\n    tool: http-api\n');
  assert.deepEqual(load(dir).errors, []);
  compile(dir);
  const d = (tool) => decide({ tool_name: `mcp__reconqa-api__${tool}`, tool_input: {} }, { projectDir: dir });
  assert.equal(d('api_get').decision, 'none');
  assert.equal(d('api_delete').decision, 'ask');
  assert.equal(d('api_raw').decision, 'deny');
});

test('kit: login values must be environment variable names, not passwords', () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-api-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\napp:\n  target: api\n  api:\n    base_url: http://localhost:3101\n    login:\n      path: /login\n      body_env:\n        password: s3cret!\n');
  assert.ok(load(dir).errors.length > 0);
});

test('preflight (api): reachable server passes, 5xx and no answer stop', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-api-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\napp:\n  target: api\n  api:\n    base_url: http://localhost:3101\n  test_data:\n    allow_create: true\ncapabilities:\n  app_driver:\n    tool: http-api\n');
  const ok = await preflight(dir, undefined, { fetchImpl: async () => new Response('', { status: 404 }) });
  assert.equal(ok.ok, true);
  assert.equal(ok.allow_create, true);
  assert.match((await preflight(dir, undefined, { fetchImpl: async () => new Response('', { status: 503 }) })).reason, /503/);
  assert.match((await preflight(dir, undefined, { fetchImpl: async () => { throw Object.assign(new Error('x'), { cause: { code: 'ECONNREFUSED' } }); } })).reason, /ECONNREFUSED/);
});

test('gate: shell commands that print environment variables or name the login variables are blocked', () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-api-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\napp:\n  target: api\n  api:\n    base_url: http://localhost:3101\n    login:\n      path: /login\n      body_env:\n        username: QA_USER\n        password: QA_PASS\ncapabilities:\n  app_driver:\n    tool: http-api\n');
  compile(dir);
  const bash = (command) => decide({ tool_name: 'Bash', tool_input: { command } }, { projectDir: dir }).decision;
  for (const c of ['printenv', 'env', 'env | grep QA', 'echo $QA_PASS', 'echo "${QA_USER}"', 'node -p "process.env"', 'cat /proc/self/environ',
    'python3 -c "import os; print(os.environ)"', 'export -p', 'ls; set', '$env:QA_PASS', 'Get-ChildItem env:']) {
    assert.equal(bash(c), 'deny', c);
  }
  for (const c of ['node plugins/reconqa/scripts/kit.mjs validate --project .', 'npm test', 'env FOO=1 node x.mjs', 'git status', 'echo setting']) {
    assert.notEqual(bash(c), 'deny', c);
  }
});

test('security review fixes (API): risky POSTs refused, own-record detection is strict, encoded paths, secrets', async () => {
  const f = fakeFetch((u, init) => {
    if (u.pathname === '/orders') return { status: 201, body: { customer: { id: 3 }, total: 1 } };
    if (u.pathname === '/things') return { status: 201, body: {}, headers: { location: 'http://localhost:3101/' } };
    if (u.pathname === '/echo') return { status: 200, body: 'your password is pw-123 ok', headers: { 'content-type': 'text/plain', location: '/next?token=abc' } };
    return { status: 201, body: { id: 'n1' } };
  });
  const t = driver(cfg({ login: { path: '/login', body_env: { password: 'QA_PASS' } } }), f, { QA_PASS: 'pw-123' });
  for (const p of ['/users/1/reset-password', '/graphql', '/admin/roles', '/payments', '/orders/9/refund']) {
    await assert.rejects(t.api_send({ method: 'POST', path: p, body: {} }), /does not send POST|existing record/, p);
  }
  await assert.rejects(t.api_send({ method: 'POST', path: '/users/42/comments', body: {} }), /existing record/);
  assert.match(await t.api_send({ method: 'POST', path: '/v1/items', body: { n: 'reconqa' } }), /Created \/v1\/items\/n1/);
  // nested id next to other keys, and a Location at or above the collection, are not "own records"
  await t.api_send({ method: 'POST', path: '/things', body: { n: 'reconqa' } });
  assert.doesNotMatch(await t.api_created(), /^\/$|\/things\n|customer/m);
  await assert.rejects(t.api_delete({ path: '/users/1' }), /records this run created/);
  await assert.rejects(t.api_send({ method: 'PUT', path: '/v1/items/n1/%2E%2E%2Fn2', body: {} }), /path must be relative/);
  const echo = await t.api_get({ path: '/echo' });
  assert.doesNotMatch(echo, /pw-123|token=abc/);
  assert.deepEqual(redact({ jwt: 'x', access_token: 'y', csrf: 'z', otp: '1' }), { jwt: '[hidden]', access_token: '[hidden]', csrf: '[hidden]', otp: '[hidden]' });
  await assert.rejects(driver(cfg({}, { test_data: { allow_create: false } }), f).api_delete({ path: '/x/1' }), /Deleting is off/);
});

test('security review fixes (gate): more env-printing forms and adb file and log reads blocked', () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-api-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\n');
  compile(dir);
  const bash = (command) => decide({ tool_name: 'Bash', tool_input: { command } }, { projectDir: dir }).decision;
  for (const c of ['export', 'declare -p', 'typeset -x', '/usr/bin/env', 'compgen -e', 'ps eww', 'ps auxe', "perl -e 'print %ENV'", "ruby -e 'p ENV'",
    `node -p "process['env']"`, 'cat /proc/1/environ', '[Environment]::GetEnvironmentVariables()',
    'adb pull /sdcard/DCIM', 'adb -s emulator-5554 backup -all', 'adb bugreport', 'adb logcat -d', 'adb connect 10.0.0.2']) {
    assert.equal(bash(c), 'deny', c);
  }
  for (const c of ['npm test', 'git status', 'adb devices', 'adb version', 'ps aux', 'export FOO=1']) assert.notEqual(bash(c), 'deny', c);
});

test('a nested id next to other keys never becomes an own record; a single wrapper does', async () => {
  const nested = driver(cfg(), fakeFetch(() => ({ status: 201, body: { widget: { name: 'reconqa' }, owner: { id: 3 } } })));
  assert.doesNotMatch(await nested.api_send({ method: 'POST', path: '/widgets', body: { name: 'reconqa' } }), /Created/);
  assert.match(await nested.api_created(), /No records/);
  const wrapped = driver(cfg(), fakeFetch(() => ({ status: 200, body: { account: { id: 'Ab12cd', name: 'reconqa' } } })));
  assert.match(await wrapped.api_send({ method: 'POST', path: '/bankAccounts', body: { name: 'reconqa' } }), /Created \/bankAccounts\/Ab12cd/);
});
