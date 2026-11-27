// ReconQA TestRail driver core (TestRail REST API v2): everything except the MCP wire protocol, so
// tests can run it with a fake fetch. Settings: capabilities.test_management in .reconqa/kit.yml.
//
// Safety rules:
//   - requests go only to base_url (https, or localhost), under index.php?/api/v2/
//   - reads are free; ReconQA only ever ADDS (cases, a run, results); it never edits or deletes
//   - every upload is two steps: a preview builds the exact payload and returns a batch id; the
//     upload tool takes only that batch id and is asked by the write gate
//   - user and API key come from environment variables named in the kit; never returned
import { parseCases } from '../../scripts/check-cases.mjs';
import { parseRun } from '../../scripts/check-run.mjs';
import { sensitive } from '../../hooks/lib/gate-core.mjs';
import { createHash, randomBytes } from 'node:crypto';

export const BATCH_ID = /^(cases|results)-[0-9a-f]{8}$/;
const hashOf = (x) => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);

export class DriverError extends Error {}
const ENV_NAME = /^[A-Z_][A-Z0-9_]*$/;
const isLoopback = (h) => ['localhost', '127.0.0.1', '[::1]'].includes(h);
export const STATUS = { passed: 1, blocked: 2, failed: 5 };

export function settings(config) {
  const t = config?.capabilities?.test_management ?? {};
  if (t.tool !== 'testrail') throw new DriverError('capabilities.test_management.tool is not "testrail" in .reconqa/kit.yml.');
  let base;
  try { base = new URL(t.base_url); } catch { throw new DriverError('Set capabilities.test_management.base_url, e.g. https://yourteam.testrail.io'); }
  if (base.username || base.password) throw new DriverError('base_url must not contain a user or password.');
  if (base.protocol !== 'https:' && !isLoopback(base.hostname)) throw new DriverError('base_url must use https (the API key is sent with every request).');
  for (const k of ['project_id', 'section_id']) if (!Number.isInteger(t[k]) || t[k] < 1) throw new DriverError(`Set capabilities.test_management.${k} (a number from TestRail).`);
  for (const k of ['user_env', 'key_env']) if (!ENV_NAME.test(t[k] ?? '')) throw new DriverError(`Set capabilities.test_management.${k} to the NAME of an environment variable, e.g. TESTRAIL_${k === 'user_env' ? 'USER' : 'API_KEY'}.`);
  return { base, project: t.project_id, suite: Number.isInteger(t.suite_id) ? t.suite_id : null, section: t.section_id, userEnv: t.user_env, keyEnv: t.key_env };
}

// Steps with «screen text» and ‹expected› markup made plain for TestRail.
const plain = (s) => String(s ?? '').replace(/‹expected:\s*([^‹›]*?)\s*(\[src:[^\]]*\])?\s*›/g, '"$1"').replace(/[«»]/g, '"').replace(/\s+/g, ' ').trim();

// Priority P1 (first in the team's scale) → TestRail's highest priority, and so on down.
export function priorityMap(priorities, scale = ['P1', 'P2', 'P3', 'P4']) {
  const sorted = [...priorities].sort((a, b) => b.priority - a.priority);
  const out = {};
  scale.forEach((p, i) => { const hit = sorted[Math.min(i, sorted.length - 1)]; if (hit) out[p] = hit.id; });
  return out;
}

// cases.md → add_case payloads (one per case).
export function casePayloads(text, { priorities = {}, refs = null } = {}) {
  return parseCases(text).map((c) => ({
    reconqa_id: c.id,
    payload: {
      title: `${c.id} ${plain(c.title)}`.slice(0, 250),
      template_id: 2,
      ...(priorities[c.priority] ? { priority_id: priorities[c.priority] } : {}),
      ...(refs ? { refs } : {}),
      custom_preconds: plain(c.preconditions),
      custom_steps_separated: c.rows.map((r) => ({ content: plain(r.step), expected: plain(r.expected) })),
    },
  }));
}

// run report → results per ReconQA case id.
export function runResults(text) {
  const run = parseRun(text.replace(/\r\n?/g, '\n'));
  return run.summary.filter((r) => STATUS[r.result]).map((r) => ({
    reconqa_id: r.id, status_id: STATUS[r.result],
    comment: [`ReconQA run: ${r.result}`, r.step ? `step ${r.step}` : '', r.note].filter(Boolean).join(' · ').slice(0, 1000),
  }));
}

// writePending(id, summary) / readPending(id) / dropPending(id): the batch summary the write gate
// shows when the user is asked about the upload (kept in .reconqa/pending/, which the model cannot write).
export function createDriver({ config, fetchImpl = fetch, env = process.env, readText, readMap, writeMap, writePending, readPending, dropPending, today = () => new Date().toISOString().slice(0, 10), timeoutMs = 20000 }) {
  const batches = new Map();
  const newId = (kind) => `${kind}-${randomBytes(4).toString('hex')}`;
  const leakCheck = (x) => { const leak = sensitive(x, config()?.app?.test_data?.email_domain); if (leak) throw new DriverError(`Not sending this to TestRail: ${leak}. Remove it from the file first.`); };
  async function keep(id, batch, summary) {
    const h = hashOf(batch);
    batches.set(id, { ...batch, hash: h });
    await writePending(id, { ...summary, batch: id, hash: h });
  }
  const s = () => settings(config());

  async function api(st, method, path, body) {
    const user = env[st.userEnv], key = env[st.keyEnv];
    if (!user || !key) throw new DriverError(`${!user ? st.userEnv : st.keyEnv} is empty. Give it to the TestRail helper when you register it (see adapters/test-management/testrail.md).`);
    const url = new URL(`${st.base.origin}${st.base.pathname.replace(/\/$/, '')}/index.php?/api/v2/${path}`);
    if (url.origin !== st.base.origin) throw new DriverError('That request leaves the TestRail server.');
    let res;
    try {
      res = await fetchImpl(url, { method, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs),
        headers: { authorization: `Basic ${Buffer.from(`${user}:${key}`).toString('base64')}`, 'content-type': 'application/json', accept: 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}) });
    } catch (e) { throw new DriverError(`No answer from ${st.base.origin} (${e.cause?.code ?? e.name}).`); }
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
    if (!res.ok) throw new DriverError(`TestRail answered ${res.status}: ${String(json?.error ?? text).replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[hidden]').slice(0, 300)}`);
    return json;
  }
  const list = (j, k) => (Array.isArray(j) ? j : j?.[k] ?? []);
  const suiteQ = (st) => (st.suite ? `&suite_id=${st.suite}` : '');

  return {
    async testrail_info() {
      const st = s();
      const p = await api(st, 'GET', `get_project/${st.project}`);
      const sections = list(await api(st, 'GET', `get_sections/${st.project}${suiteQ(st)}`), 'sections');
      const sec = sections.find((x) => x.id === st.section);
      if (!sec) throw new DriverError(`Section ${st.section} is not in project ${st.project}${st.suite ? ` suite ${st.suite}` : ''}. Sections: ${sections.slice(0, 15).map((x) => `${x.id} ${x.name}`).join('; ')}`);
      const pr = await api(st, 'GET', 'get_priorities');
      return `Project ${p.id} "${p.name}"; new cases go to section ${sec.id} "${sec.name}". Priorities (high to low): ${[...pr].sort((a, b) => b.priority - a.priority).map((x) => x.name).join(', ')}.`;
    },
    async testrail_preview_cases(args = {}) {
      const st = s();
      const file = String(args.file ?? '');
      if (!/^[\w./-]+\.md$/.test(file) || file.includes('..')) throw new DriverError('file must be a cases .md path in the project, e.g. qa/cases/sign-up.md');
      const text = await readText(file);
      const pr = priorityMap(await api(st, 'GET', 'get_priorities'), config()?.cases?.priority_scale);
      const ticket = (text.match(/Ticket:\s*([^\s·]+)/) ?? [])[1];
      const refs = args.refs ? String(args.refs).slice(0, 250) : null;
      const all = casePayloads(text, { priorities: pr, refs });
      if (!all.length) throw new DriverError(`No cases found in ${file}.`);
      const existing = list(await api(st, 'GET', `get_cases/${st.project}${suiteQ(st)}&section_id=${st.section}`), 'cases').map((c) => c.title);
      const skip = all.filter((c) => existing.some((t) => t.startsWith(`${c.reconqa_id} `)));
      const items = all.filter((c) => !skip.includes(c));
      leakCheck(items.map((c) => c.payload));
      const id = newId('cases');
      await keep(id, { kind: 'cases', file, items, section: st.section },
        { what: `add ${items.length} case(s) to TestRail section ${st.section}`, file, titles: items.slice(0, 12).map((c) => c.payload.title) });
      return [
        `Preview ${id}: ${items.length} case(s) to add to section ${st.section}${skip.length ? `; ${skip.length} already in TestRail, skipped (${skip.map((c) => c.reconqa_id).join(', ')})` : ''}. Source: ${file}${ticket ? ` (ticket ${ticket})` : ''}.`,
        ...items.map((c) => `- ${c.payload.title} · ${c.payload.custom_steps_separated.length} step(s)${c.payload.priority_id ? ` · priority_id ${c.payload.priority_id}` : ''}`),
        '', 'First case, exactly as it will be sent:', JSON.stringify(items[0]?.payload ?? {}, null, 2),
        '', `Show this to the user. If they agree, call testrail_upload with batch "${id}" (the gate asks them again).`,
      ].join('\n');
    },
    async testrail_preview_results(args = {}) {
      const st = s();
      const file = String(args.file ?? '');
      if (!/^[\w./-]+\.md$/.test(file) || file.includes('..')) throw new DriverError('file must be a run report .md path in the project, e.g. qa/runs/sign-up-2026-11-27.md');
      const results = runResults(await readText(file));
      const casesFile = String(args.cases ?? '');
      const map = await readMap(casesFile);
      if ((map._runs ?? []).includes(file)) throw new DriverError(`${file} was already uploaded as a test run. Uploading it again would create a second run.`);
      const mapped = results.filter((r) => map[r.reconqa_id]).map((r) => ({ ...r, case_id: map[r.reconqa_id] }));
      const missing = results.filter((r) => !map[r.reconqa_id]).map((r) => r.reconqa_id);
      if (!mapped.length) throw new DriverError(`None of these cases is in TestRail yet${casesFile ? ` (no mapping for ${casesFile})` : ''}. Upload the cases first with testrail_preview_cases.`);
      const name = `ReconQA run ${today()} (${file.replace(/^.*\//, '').replace(/\.md$/, '')})`.slice(0, 250);
      leakCheck(mapped);
      const id = newId('results');
      await keep(id, { kind: 'results', name, items: mapped, file, casesFile },
        { what: `create test run "${name}" with ${mapped.length} result(s)`, file, results: mapped.slice(0, 12).map((r) => `${r.reconqa_id}=${Object.keys(STATUS).find((k) => STATUS[k] === r.status_id)}`) });
      return [
        `Preview ${id}: a new test run "${name}" in project ${st.project} with ${mapped.length} result(s)${missing.length ? `; ${missing.length} case(s) not in TestRail, left out (${missing.join(', ')})` : ''}.`,
        ...mapped.map((r) => `- ${r.reconqa_id} → C${r.case_id}: ${Object.keys(STATUS).find((k) => STATUS[k] === r.status_id)}${r.comment.includes('·') ? ` (${r.comment.split(' · ').slice(1).join(' · ')})` : ''}`),
        '', `Show this to the user. If they agree, call testrail_upload with batch "${id}" (the gate asks them again).`,
      ].join('\n');
    },
    async testrail_upload(args = {}) {
      const st = s();
      if (config()?.tracker_policy?.filing !== 'file-after-approval') throw new DriverError('Uploads are off: tracker_policy.filing is draft-only. Set it to file-after-approval to send to TestRail.');
      const id = String(args.batch ?? '');
      const b = BATCH_ID.test(id) ? batches.get(id) : null;
      if (!b) throw new DriverError('Unknown batch. Run a preview first; batches are kept only while this helper runs.');
      const pending = await readPending(id);
      if (!pending || pending.hash !== b.hash) throw new DriverError('The saved preview for this batch is missing or changed. Run the preview again.');
      batches.delete(id);
      await dropPending(id);
      if (b.kind === 'cases') {
        const map = { ...(await readMap(b.file)) };
        const done = [];
        for (const c of b.items) {
          const r = await api(st, 'POST', `add_case/${b.section}`, c.payload);
          map[c.reconqa_id] = r.id; done.push(`${c.reconqa_id} → C${r.id}`);
          await writeMap(b.file, map); // after each case, so a failure halfway loses nothing
        }
        return `Added ${done.length} case(s): ${done.join(', ')}. Mapping saved next to ${b.file}.`;
      }
      const run = await api(st, 'POST', `add_run/${st.project}`, { name: b.name, include_all: false, case_ids: b.items.map((r) => r.case_id), ...(st.suite ? { suite_id: st.suite } : {}) });
      await api(st, 'POST', `add_results_for_cases/${run.id}`, { results: b.items.map(({ case_id, status_id, comment }) => ({ case_id, status_id, comment })) });
      const map = await readMap(b.casesFile);
      await writeMap(b.casesFile, { ...map, _runs: [...(map._runs ?? []), b.file] });
      return `Created test run R${run.id} "${b.name}" with ${b.items.length} result(s).${run.url ? ` ${run.url}` : ''}`;
    },
  };
}

export const TOOL_LIST = [
  ['testrail_info', 'Check the TestRail connection: project, the section new cases go to, and priorities.', {}],
  ['testrail_preview_cases', 'Build (do not send) the TestRail cases for a ReconQA cases file; returns a batch id and the exact payload.', { file: { type: 'string' }, refs: { type: 'string', description: 'Optional ticket reference(s) for the refs field, e.g. SHOP-88' } }, ['file']],
  ['testrail_preview_results', 'Build (do not send) a TestRail run with results from a ReconQA run report; returns a batch id.', { file: { type: 'string' }, cases: { type: 'string', description: 'The cases .md file the run used (its TestRail mapping)' } }, ['file', 'cases']],
  ['testrail_upload', 'Send a previewed batch to TestRail (adds only; never edits or deletes).', { batch: { type: 'string' } }, ['batch']],
].map(([name, description, properties, required = []]) => ({ name, description, inputSchema: { type: 'object', properties, required, additionalProperties: false } }));
