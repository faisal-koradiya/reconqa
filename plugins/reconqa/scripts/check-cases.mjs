#!/usr/bin/env node
// Case checker: checks generated cases (steps-table Markdown) against the kit's case rules.
//   node check-cases.mjs --project <dir> <cases.md>
// Checks: id pattern, required fields, priority scale, max_steps (rows per case),
// max_expected (sentences per Expected cell), step numbers in expected, banned words,
// and every `rules` entry with a `check` scoped to write-cases.
// Only the cases are checked: everything after a "## Mismatches" heading is ignored.
// Exit 0 = clean, 1 = problems (listed with line numbers), 2 = usage/config error.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkGrounding } from './check-grounding.mjs';
import { load } from './lib/kit.mjs';
import { kbContext, checkKbCitations, checkPreUi } from './lib/kb.mjs';

export function parseCases(text) {
  const lines = text.split('\n');
  const cases = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,6}\s*Mismatches\b/i.test(line)) break;
    const h = line.match(/^###\s+(\S+)\s+(.*)$/);
    if (h) { cur = { id: h[1], title: h[2].trim(), line: i + 1, priority: null, preconditions: null, rows: [] }; cases.push(cur); continue; }
    if (!cur) continue;
    const p = line.match(/\*\*Priority:\*\*\s*([^·|*]+?)\s*(·|$)/);
    if (p) cur.priority = p[1].trim();
    const pre = line.match(/\*\*Preconditions:\*\*\s*(.*)$/);
    if (pre) cur.preconditions = pre[1].trim();
    const r = line.match(/^\|\s*(\d+)\s*\|(.*)\|(.*)\|\s*$/);
    if (r) cur.rows.push({ n: Number(r[1]), step: r[2].trim(), expected: r[3].trim(), line: i + 1 });
  }
  return cases;
}

const sentences = (s) => s.split(/(?<=[.!?])\s+(?=[A-Z«"])/).filter((x) => x.trim()).length;
const idRegex = (pattern) => new RegExp('^' + pattern
  .replace(/[.*+?^$()|[\]\\]/g, '\\$&')
  .replace(/\{area\}/g, '[A-Z0-9]+')
  .replace(/\{n:0?(\d+)\}/g, (_, d) => `\\d{${d},}`)
  .replace(/\{n\}/g, '\\d+') + '$');

export function checkCases(text, config) {
  const c = config.cases ?? {};
  const problems = [];
  const add = (line, rule, msg) => problems.push({ line, rule, msg });
  const cases = parseCases(text);
  if (!cases.length) add(1, 'format', 'No cases found (expected "### <id> <title>" headings).');
  const idRe = c.id_pattern ? idRegex(c.id_pattern) : null;
  const seen = new Set();
  const banned = config.words?.banned ?? [];
  const rules = (config.rules ?? []).filter((r) => r.check && (!r.scope || r.scope.includes('write-cases')));
  for (const k of cases) {
    if (idRe && !idRe.test(k.id)) add(k.line, 'id_pattern', `${k.id} does not match ${c.id_pattern}`);
    if (seen.has(k.id)) add(k.line, 'id_pattern', `duplicate id ${k.id}`);
    seen.add(k.id);
    const fields = { title: k.title, preconditions: k.preconditions, priority: k.priority,
      steps: k.rows.map((r) => r.step).join('\n'), expected: k.rows.map((r) => r.expected).join('\n') };
    for (const f of c.required_fields ?? []) if (!fields[f] || !String(fields[f]).trim()) add(k.line, 'required_fields', `${k.id}: missing ${f}`);
    if (k.priority && c.priority_scale && !c.priority_scale.includes(k.priority)) add(k.line, 'priority_scale', `${k.id}: priority "${k.priority}" not in ${c.priority_scale.join('/')}`);
    if (c.max_steps && k.rows.length > c.max_steps) add(k.line, 'max_steps', `${k.id}: ${k.rows.length} steps (max ${c.max_steps})`);
    for (const r of k.rows) {
      if (c.max_expected && sentences(r.expected) > c.max_expected) add(r.line, 'max_expected', `${k.id} step ${r.n}: ${sentences(r.expected)} expected sentences (max ${c.max_expected})`);
      if (c.step_numbers_in_expected === false && /\b(in |from |of )?step\s*#?\d+/i.test(r.expected)) add(r.line, 'step_numbers_in_expected', `${k.id} step ${r.n}: expected refers to a step number`);
    }
    const all = [['title', k.title, k.line], ['preconditions', k.preconditions ?? '', k.line],
      ...k.rows.flatMap((r) => [['steps', r.step, r.line], ['expected', r.expected, r.line]])];
    for (const b of banned) {
      const re = new RegExp((b.whole_word === false ? '' : '\\b') + b.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (b.whole_word === false ? '' : '\\b'), 'i');
      for (const [, v, line] of all) if (re.test(v)) add(line, 'words.banned', `${k.id}: "${b.word}"${b.use ? ` (use "${b.use}")` : ''}`);
    }
    for (const rule of rules) {
      const flags = rule.check.ignore_case ? 'i' : '';
      for (const [field, v, line] of all) {
        if (rule.check.field !== 'any' && rule.check.field !== field) continue;
        if (!v) continue;
        if (rule.check.must_not_match && new RegExp(rule.check.must_not_match, flags).test(v)) add(line, rule.id, `${k.id}: ${rule.text}`);
        if (rule.check.must_match && !new RegExp(rule.check.must_match, flags).test(v)) add(line, rule.id, `${k.id}: ${rule.text}`);
      }
    }
  }
  return { cases: cases.length, problems };
}

if (process.argv[1]?.endsWith('check-cases.mjs')) {
  const args = process.argv.slice(2);
  const pi = args.indexOf('--project');
  const project = pi >= 0 ? args.splice(pi, 2)[1] : '.';
  const file = args[0];
  if (!file) { console.error('usage: check-cases.mjs --project <dir> <cases.md>'); process.exit(2); }
  const { config, errors } = load(project);
  if (errors.length) { console.error('Config has errors; run the validator first.'); process.exit(2); }
  const text = readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
  const r = checkCases(text, config);
  // Decisions and known issues the cases rely on must exist and still be active.
  const ctx = kbContext(project, config);
  for (const p of checkKbCitations(text, ctx)) r.problems.push({ line: p.line, rule: 'knowledge-base', msg: p.message });
  // Pre-UI expectations: each cites a ticket, manual or imported source that contains the text.
  const pre = checkPreUi(text, ctx);
  for (const p of pre.problems) r.problems.push({ line: p.line, rule: 'pre-ui', msg: p.message });
  // A cases file that names its atlas is grounded here too, not only when a skill remembers to run it.
  const atlasRef = (text.split('\n').slice(0, 6).join('\n').match(/\bAtlas:\s*([^\s·(]+\.md)/) ?? [])[1];
  if (atlasRef) {
    const af = resolve(project, atlasRef);
    if (!existsSync(af)) r.problems.push({ line: 1, rule: 'grounding', msg: `the atlas named in the header (${atlasRef}) was not found` });
    else {
      const markup = config.cases?.ui_string_markup ?? 'guillemets';
      for (const m of checkGrounding(text, [readFileSync(af, 'utf8')], markup).missing) r.problems.push({ line: m.line, rule: 'grounding', msg: `«${m.text}» is not in the atlas (${atlasRef})` });
    }
  }
  r.problems.sort((a, b) => a.line - b.line);
  for (const p of r.problems) console.log(`line ${p.line} [${p.rule}] ${p.msg}`);
  if (pre.expectations) console.log(`${pre.expectations} expected text(s) written before the screen existed (‹expected›): not yet checked against the app. Run /reconqa:reconcile once the screen is built.`);
  console.log(`${r.cases} cases, ${r.problems.length} problem(s)`);
  process.exit(r.problems.length ? 1 : 0);
}
