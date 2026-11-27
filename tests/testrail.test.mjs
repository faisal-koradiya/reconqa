// Built-in TestRail helper (plugins/reconqa/drivers/testrail): settings, payloads, preview → upload, gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { settings, casePayloads, runResults, priorityMap, createDriver, TOOL_LIST } from '../plugins/reconqa/drivers/testrail/core.mjs';
import { loadAppMaps, TM_ADAPTERS } from '../plugins/reconqa/scripts/lib/app-maps.mjs';
import { compile, load } from '../plugins/reconqa/scripts/lib/kit.mjs';
import { decide } from '../plugins/reconqa/hooks/lib/gate-core.mjs';

const CASES = readFileSync('examples/juice-shop/qa/cases/new-customer-registration.md', 'utf8');
const RUN = readFileSync('examples/juice-shop/qa/runs/new-customer-registration-2026-11-26.md', 'utf8');
const TM = { tool: 'testrail', base_url: 'https://testrail.example.test', project_id: 3, section_id: 7, user_env: 'TR_USER', key_env: 'TR_KEY' };
const cfg = (tm = {}, filing = 'file-after-approval') => ({ capabilities: { test_management: { ...TM, ...tm } }, cases: { priority_scale: ['P1', 'P2', 'P3'] }, tracker_policy: { filing }, app: { test_data: { email_domain: 'example.test' } } });
const PRI = [{ id: 1, name: 'Low', priority: 1 }, { id: 2, name: 'Medium', priority: 2 }, { id: 3, name: 'High', priority: 3 }, { id: 4, name: 'Critical', priority: 4 }];

function fakeTestRail({ existing = [] } = {}) {
  const calls = [];
  let nextCase = 100;
  const fetchImpl = async (url, init) => {
    const u = String(url); const method = init.method;
    calls.push({ url: u, method, body: init.body ? JSON.parse(init.body) : null, auth: init.headers.authorization });
    const path = u.split('index.php?/api/v2/')[1];
    const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } });
    if (path.startsWith('get_priorities')) return json(PRI);
    if (path.startsWith('get_project/')) return json({ id: 3, name: 'Shop' });
    if (path.startsWith('get_sections/')) return json({ sections: [{ id: 7, name: 'Registration' }] });
    if (path.startsWith('get_cases/')) return json({ cases: existing.map((t) => ({ title: t })) });
    if (path.startsWith('add_case/7')) return json({ id: nextCase++ });
    if (path.startsWith('add_run/3')) return json({ id: 55, url: 'https://testrail.example.test/index.php?/runs/view/55' });
    if (path.startsWith('add_results_for_cases/55')) return json([]);
    return json({ error: 'unexpected' }, 400);
  };
  return { calls, fetchImpl };
}
function driver(fake, { env = { TR_USER: 'qa@example.test', TR_KEY: 'k3y-secret' }, maps = {}, pending = {}, filing, text } = {}) {
  return createDriver({ config: () => cfg({}, filing), fetchImpl: fake.fetchImpl, env, readText: async (f) => text ?? (f.includes('runs/') ? RUN : CASES),
    readMap: async (f) => maps[f] ?? {}, writeMap: async (f, m) => { maps[f] = m; }, today: () => '2026-11-27',
    writePending: async (id, x) => { pending[id] = x; }, readPending: async (id) => pending[id] ?? null, dropPending: async (id) => { delete pending[id]; } });
}
const batchOf = (preview) => preview.match(/Preview ((cases|results)-[0-9a-f]{8})/)[1];

test('settings: https only (or localhost), ids and env names required', () => {
  assert.throws(() => settings({ capabilities: { test_management: { tool: 'csv' } } }), /not "testrail"/);
  assert.throws(() => settings(cfg({ base_url: 'http://team.testrail.io' })), /https/);
  assert.doesNotThrow(() => settings(cfg({ base_url: 'http://localhost:8080' })));
  assert.throws(() => settings(cfg({ section_id: undefined })), /section_id/);
  assert.throws(() => settings(cfg({ key_env: 'my key' })), /key_env/);
});

test('payloads: steps separated, markup made plain, priorities mapped high to low, ids in titles', () => {
  const pr = priorityMap(PRI, ['P1', 'P2', 'P3']);
  assert.deepEqual(pr, { P1: 4, P2: 3, P3: 2 });
  const p = casePayloads(CASES, { priorities: pr });
  assert.equal(p[0].reconqa_id, 'TC-REG-001');
  assert.match(p[0].payload.title, /^TC-REG-001 Open the registration page/);
  assert.equal(p[0].payload.priority_id, 4);
  assert.ok(p[0].payload.custom_steps_separated.length >= 2);
  assert.doesNotMatch(JSON.stringify(p), /[«»‹›]/);
  const r = runResults(RUN);
  assert.equal(r.find((x) => x.reconqa_id === 'TC-REG-012').status_id, 5);
  assert.equal(r.find((x) => x.reconqa_id === 'TC-REG-001').status_id, 1);
});

test('preview then upload: nothing sent before upload; existing cases skipped; mapping saved; key never shown; a batch is sent once', async () => {
  const fake = fakeTestRail({ existing: ['TC-REG-001 Open the registration page from the login page'] });
  const maps = {}, pending = {};
  const t = driver(fake, { maps, pending });
  const pv = await t.testrail_preview_cases({ file: 'qa/cases/new-customer-registration.md', refs: 'SHOP-1' });
  const id = batchOf(pv);
  assert.match(pv, /\d+ case\(s\).*1 already in TestRail, skipped \(TC-REG-001\)/);
  assert.ok(!fake.calls.some((c) => c.method === 'POST'), 'preview sends nothing');
  assert.doesNotMatch(pv, /k3y-secret/);
  assert.match(pending[id].what, /add \d+ case\(s\) to TestRail section 7/);
  assert.match(await t.testrail_upload({ batch: id }), /Added \d+ case\(s\): TC-REG-002 → C100/);
  assert.equal(maps['qa/cases/new-customer-registration.md']['TC-REG-002'], 100);
  assert.equal(pending[id], undefined, 'saved preview removed after upload');
  assert.equal(fake.calls[0].auth, `Basic ${Buffer.from('qa@example.test:k3y-secret').toString('base64')}`);
  await assert.rejects(t.testrail_upload({ batch: id }), /Unknown batch/);
});

test('upload refused when the saved preview changed or is missing, or filing is draft-only', async () => {
  const pending = {};
  const t = driver(fakeTestRail(), { pending });
  const id = batchOf(await t.testrail_preview_cases({ file: 'qa/cases/new-customer-registration.md' }));
  pending[id] = { ...pending[id], hash: 'tampered' };
  await assert.rejects(t.testrail_upload({ batch: id }), /missing or changed/);
  const off = driver(fakeTestRail(), { filing: 'draft-only' });
  const id2 = batchOf(await off.testrail_preview_cases({ file: 'qa/cases/new-customer-registration.md' }));
  await assert.rejects(off.testrail_upload({ batch: id2 }), /draft-only/);
});

test('secrets and real people\'s emails are never sent', async () => {
  const leaky = CASES.replace('reconqa-user-001@example.test', 'jane.doe@realcompany.com');
  await assert.rejects(driver(fakeTestRail(), { text: leaky }).testrail_preview_cases({ file: 'qa/cases/x.md' }), /not test data/);
});

test('results: a run for mapped cases only, once per report; bad paths and missing login refused', async () => {
  const fake = fakeTestRail();
  const maps = { 'qa/cases/new-customer-registration.md': { 'TC-REG-001': 100, 'TC-REG-012': 111 } };
  const t = driver(fake, { maps });
  const args = { file: 'qa/runs/new-customer-registration-2026-11-26.md', cases: 'qa/cases/new-customer-registration.md' };
  const pv = await t.testrail_preview_results(args);
  assert.match(pv, /a new test run "ReconQA run 2026-11-27 .*" in project 3 with 2 result\(s\)/);
  assert.match(pv, /TC-REG-012 → C111: failed/);
  assert.match(await t.testrail_upload({ batch: batchOf(pv) }), /Created test run R55/);
  const res = fake.calls.find((c) => c.url.includes('add_results_for_cases/55')).body.results;
  assert.deepEqual(res.map((r) => [r.case_id, r.status_id]), [[100, 1], [111, 5]]);
  await assert.rejects(t.testrail_preview_results(args), /already uploaded/);
  await assert.rejects(t.testrail_preview_cases({ file: '../secrets.md' }), /cases \.md path/);
  await assert.rejects(driver(fake, { env: {} }).testrail_info(), /TR_USER is empty/);
});

test('gate: previews pass; upload is asked with the saved summary; without a saved preview it is denied; other tools denied', () => {
  const map = loadAppMaps(TM_ADAPTERS).testrail;
  const listed = new Set([...map.allow, ...map.ask, ...map.deny]);
  assert.deepEqual(TOOL_LIST.map((t) => t.name).filter((n) => !listed.has(n)), []);
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-tr-'));
  mkdirSync(join(dir, '.reconqa', 'pending'), { recursive: true });
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\ncapabilities:\n  test_management:\n    tool: testrail\n    base_url: https://testrail.example.test\n    project_id: 3\n    section_id: 7\n    user_env: TR_USER\n    key_env: TR_KEY\n');
  assert.deepEqual(load(dir).errors, []);
  compile(dir);
  const d = (op, a = {}) => decide({ tool_name: `mcp__reconqa-testrail__${op}`, tool_input: a }, { projectDir: dir });
  assert.equal(d('testrail_preview_cases', { file: 'x.md' }).decision, 'none');
  assert.equal(d('testrail_upload', { batch: 'cases-0a1b2c3d' }).decision, 'deny');
  writeFileSync(join(dir, '.reconqa', 'pending', 'testrail-cases-0a1b2c3d.json'), JSON.stringify({ what: 'add 2 case(s) to TestRail section 7', file: 'qa/cases/x.md', titles: ['TC-1 A', 'TC-2 B'], hash: 'h' }));
  const up = d('testrail_upload', { batch: 'cases-0a1b2c3d' });
  assert.equal(up.decision, 'ask');
  assert.match(up.reason, /add 2 case\(s\) to TestRail section 7 from qa\/cases\/x\.md: TC-1 A; TC-2 B/);
  assert.equal(d('testrail_upload', { batch: '../../x' }).decision, 'deny');
  assert.equal(d('testrail_delete_case').decision, 'deny');
  const w = decide({ tool_name: 'Write', tool_input: { file_path: join(dir, '.reconqa', 'pending', 'testrail-cases-0a1b2c3d.json'), content: '{}' } }, { projectDir: dir });
  assert.equal(w.decision, 'deny', 'the model cannot rewrite a saved preview');
});
