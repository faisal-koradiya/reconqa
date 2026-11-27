import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preflight } from '../plugins/reconqa/scripts/preflight.mjs';

function project(kit) {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-pf-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), kit);
  return dir;
}
const ok = async () => ({ status: 200 });
const KIT = 'version: 1\napp:\n  url: http://localhost:9\n  environments:\n    - name: prod\n      url: https://example.com\n      kind: production\n    - name: qa\n      url: http://localhost:9\n      kind: test\n';

test('no URL stops before any network call', async () => {
  const r = await preflight(project('version: 1\n'), undefined, { fetchImpl: () => assert.fail('no fetch') });
  assert.equal(r.ok, false); assert.match(r.reason, /No app URL/);
});
test('production is refused', async () => {
  const r = await preflight(project(KIT), 'prod', { fetchImpl: ok });
  assert.equal(r.ok, false); assert.match(r.reason, /production/);
});
test('unknown env name is refused', async () => {
  assert.equal((await preflight(project(KIT), 'nope', { fetchImpl: ok })).ok, false);
});
test('unreachable app and 5xx stop with "no tokens spent"', async () => {
  const down = await preflight(project(KIT), 'qa', { fetchImpl: async () => { throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } }); } });
  assert.equal(down.ok, false); assert.match(down.reason, /ECONNREFUSED.*No tokens/);
  const err = await preflight(project(KIT), 'qa', { fetchImpl: async () => ({ status: 503 }) });
  assert.equal(err.ok, false);
});
test('go: test env, creation off by default', async () => {
  const r = await preflight(project(KIT), 'qa', { fetchImpl: ok });
  assert.equal(r.ok, true); assert.equal(r.kind, 'test'); assert.equal(r.allow_create, false);
});

test('allow_create is off on an unlabelled remote host, on for unlabelled localhost', async () => {
  const remote = await preflight(project('version: 1\napp:\n  url: https://qa.example.com\n  test_data:\n    allow_create: true\n'), undefined, { fetchImpl: ok });
  assert.equal(remote.ok, true); assert.equal(remote.allow_create, false);
  const local = await preflight(project('version: 1\napp:\n  url: http://localhost:9\n  test_data:\n    allow_create: true\n'), undefined, { fetchImpl: ok });
  assert.equal(local.allow_create, true);
});
