#!/usr/bin/env node
// Run report checker: is a /reconqa:run-cases report complete and consistent with its cases file?
//   node check-run.mjs --project <dir> <report.md> [--cases <cases.md>] [--csv <out.csv>]
// Checks: header fields; every case in the report exists in the cases file with the same number of
// steps; step results are valid; steps after the first fail/blocked are "not run"; ran steps have an
// Actual; the case result follows from its steps; summary table and counts agree; failed and
// blocked cases have evidence files that exist; failed cases point to draft-bug.
// --csv writes one row per case for import into a test management tool (only when clean).
// Exit 0 = clean, 1 = problems (with line numbers), 2 = usage/config error.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { load } from './lib/kit.mjs';
import { parseCases } from './check-cases.mjs';

const STEP = ['pass', 'fail', 'blocked', 'observed', 'not run'];
const CASE = ['passed', 'failed', 'blocked', 'not run'];
const cells = (line) => line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());

export function parseRun(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const run = { header: {}, totals: null, summary: [], sections: [], lines };
  let cur = null, inSummary = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const m of line.matchAll(/\*\*(Cases|Atlas|Environment|Version|Date):\*\*\s*([^·]+?)\s*(?=·|$)/g)) run.header[m[1].toLowerCase()] = m[2].trim();
    const t = line.match(/^\*\*Result:\*\*\s*(\d+) passed · (\d+) failed · (\d+) blocked · (\d+) not run\s*$/);
    if (t && !cur) { run.totals = { passed: +t[1], failed: +t[2], blocked: +t[3], 'not run': +t[4], line: i + 1 }; continue; }
    if (/^\|\s*Case\s*\|\s*Result\s*\|/.test(line)) { inSummary = true; continue; }
    if (inSummary) {
      if (!line.startsWith('|')) { inSummary = false; } else if (!/^\|\s*-/.test(line)) {
        const [id, result, step, note] = cells(line);
        run.summary.push({ id, result, step, note, line: i + 1 });
        continue;
      } else continue;
    }
    const h = line.match(/^##\s+(\S+)\s+(.*)$/);
    if (h && !/^Test$/.test(h[1])) { cur = { id: h[1], title: h[2].trim(), line: i + 1, result: null, rows: [], evidence: null, next: null }; run.sections.push(cur); continue; }
    if (/^##\s/.test(line)) { cur = null; continue; }
    if (!cur) continue;
    const r = line.match(/^\*\*Result:\*\*\s*(.+?)\s*$/);
    if (r) cur.result = { value: r[1], line: i + 1 };
    const row = line.match(/^\|\s*(\d+)\s*\|/);
    if (row) { const [n, result, actual = ''] = cells(line); cur.rows.push({ n: +n, result, actual, line: i + 1 }); }
    const ev = line.match(/^\*\*Evidence:\*\*\s*(.*)$/);
    if (ev) cur.evidence = { text: ev[1].trim(), line: i + 1 };
    const nx = line.match(/^\*\*Next:\*\*\s*(.*)$/);
    if (nx) cur.next = { text: nx[1].trim(), line: i + 1 };
  }
  return run;
}

export function caseResult(rows) {
  const r = rows.map((x) => x.result);
  if (r.includes('fail')) return 'failed';
  if (r.includes('blocked')) return 'blocked';
  if (r.length && r.every((x) => x === 'not run')) return 'not run';
  return 'passed';
}

const PATHS = /(?:^|[\s,;(])((?:[\w.-]+\/)*[\w.-]+\.(?:png|jpe?g|webp|gif))(?=$|[\s,;)])/gi;

export function checkRun(text, { casesText, projectDir = '.' } = {}) {
  const run = parseRun(text);
  const problems = [];
  const bad = (line, msg) => problems.push({ line, msg });
  for (const k of ['cases', 'environment', 'version', 'date']) if (!run.header[k]) bad(1, `header: **${k[0].toUpperCase() + k.slice(1)}:** is missing`);
  if (run.header.date && !/^\d{4}-\d{2}-\d{2}$/.test(run.header.date)) bad(1, 'header: Date must be YYYY-MM-DD');
  if (!run.totals) bad(1, 'missing the "**Result:** n passed · n failed · n blocked · n not run" line');
  if (!run.sections.length) bad(1, 'no case sections ("## <case id> <title>")');

  const cases = casesText ? new Map(parseCases(casesText).map((c) => [c.id, c])) : null;
  const counts = { passed: 0, failed: 0, blocked: 0, 'not run': 0 };
  const results = new Map();
  for (const s of run.sections) {
    const src = cases?.get(s.id);
    if (cases && !src) bad(s.line, `${s.id}: not in the cases file`);
    if (src && src.rows.length !== s.rows.length) bad(s.line, `${s.id}: ${s.rows.length} step result(s), the case has ${src.rows.length} step(s)`);
    let stopped = false;
    s.rows.forEach((row, idx) => {
      if (row.n !== idx + 1) bad(row.line, `${s.id}: step numbers must run 1, 2, 3...`);
      if (!STEP.includes(row.result)) { bad(row.line, `${s.id} step ${row.n}: result "${row.result}" must be one of ${STEP.join(', ')}`); return; }
      if (stopped && row.result !== 'not run') bad(row.line, `${s.id} step ${row.n}: steps after a fail or blocked step must be "not run"`);
      if (['fail', 'blocked'].includes(row.result)) stopped = true;
      if (row.result !== 'not run' && !row.actual) bad(row.line, `${s.id} step ${row.n}: Actual is empty; say what the app did`);
    });
    const expected = caseResult(s.rows);
    if (!s.result) bad(s.line, `${s.id}: missing **Result:**`);
    else if (s.result.value !== expected) bad(s.result.line, `${s.id}: result "${s.result.value}" but its steps make it "${expected}"`);
    if (CASE.includes(expected)) counts[expected]++;
    results.set(s.id, { section: s, result: expected });
    if (['failed', 'blocked'].includes(expected)) {
      const files = s.evidence ? [...s.evidence.text.matchAll(PATHS)].map((m) => m[1]) : [];
      if (!files.length) bad(s.evidence?.line ?? s.line, `${s.id}: ${expected} needs **Evidence:** with a screenshot path`);
      for (const f of files) if (!existsSync(join(projectDir, f))) bad(s.evidence.line, `${s.id}: evidence file not found: ${f}`);
    }
    if (expected === 'failed') {
      const step = s.rows.find((r) => r.result === 'fail')?.n;
      if (!s.next || !s.next.text.includes(`draft-bug ${s.id} step ${step}`)) bad(s.next?.line ?? s.line, `${s.id}: add "**Next:** /reconqa:draft-bug ${s.id} step ${step}"`);
    }
  }
  const seen = new Set();
  for (const r of run.summary) {
    seen.add(r.id);
    const got = results.get(r.id);
    if (!got) { bad(r.line, `summary: ${r.id} has no section below`); continue; }
    if (r.result !== got.result) bad(r.line, `summary: ${r.id} says "${r.result}", its section says "${got.result}"`);
    if (got.result !== 'passed' && !r.note) bad(r.line, `summary: ${r.id} is ${got.result}; add a short note why`);
    if (got.result === 'passed' && got.section.rows.some((x) => x.result === 'observed') && !r.note) bad(r.line, `summary: ${r.id} has an observed step; add a short note saying what to look at`);
    const firstBad = got.section.rows.find((x) => ['fail', 'blocked'].includes(x.result))?.n;
    if (firstBad && String(r.step) !== String(firstBad)) bad(r.line, `summary: ${r.id} failed or blocked step should be ${firstBad}`);
  }
  for (const id of results.keys()) if (!seen.has(id)) bad(results.get(id).section.line, `${id}: missing from the summary table`);
  if (run.totals) for (const k of CASE) if (run.totals[k] !== counts[k]) bad(run.totals.line, `Result line says ${run.totals[k]} ${k}, the sections give ${counts[k]}`);
  // Passwords don't belong in a run report, even throwaway ones.
  let inData = false;
  run.lines.forEach((l, i) => {
    if (/^##\s/.test(l)) inData = /^##\s+Test data/i.test(l);
    if (inData && /password\W+(?!(as|not|from|generated|in)\b)\S*[\d#!@$%^&*]\S*/i.test(l)) bad(i + 1, 'a password seems to be written here; remove it');
  });
  return { problems, run, results };
}

const csvCell = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
export function toCsv(results) {
  const rows = [['case_id', 'title', 'result', 'failed_or_blocked_step', 'actual', 'evidence']];
  for (const [id, { section, result }] of results) {
    const badRow = section.rows.find((r) => ['fail', 'blocked'].includes(r.result));
    rows.push([id, section.title, result, badRow ? String(badRow.n) : '', badRow?.actual ?? '', section.evidence?.text ?? '']);
  }
  return rows.map((r) => r.map((c) => csvCell(c.replace(/«|»/g, '"'))).join(',')).join('\n') + '\n';
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const project = opt('--project') ?? '.';
  let casesFile = opt('--cases');
  const csvOut = opt('--csv');
  const file = args[0];
  if (!file) { console.error('usage: check-run.mjs --project <dir> <report.md> [--cases <cases.md>] [--csv <out.csv>]'); process.exit(2); }
  const { errors } = load(project);
  if (errors.length) { console.error('Settings have errors; run the doctor.'); process.exit(2); }
  const text = readFileSync(file, 'utf8');
  casesFile ??= parseRun(text).header.cases;
  const casesPath = casesFile && (existsSync(casesFile) ? casesFile : join(project, casesFile));
  if (!casesPath || !existsSync(casesPath)) { console.error(`Cases file not found: ${casesFile ?? '(none in header)'}`); process.exit(2); }
  const { problems, results } = checkRun(text, { casesText: readFileSync(casesPath, 'utf8'), projectDir: project });
  for (const p of problems) console.error(`${file}:${p.line}: ${p.msg}`);
  if (problems.length) { console.error(`\n${problems.length} problem(s).`); process.exit(1); }
  if (csvOut) writeFileSync(csvOut, toCsv(results));
  const c = { passed: 0, failed: 0, blocked: 0, 'not run': 0 };
  for (const { result } of results.values()) c[result]++;
  console.log(`Run report OK: ${results.size} case(s): ${c.passed} passed, ${c.failed} failed, ${c.blocked} blocked, ${c['not run']} not run.${csvOut ? ` CSV: ${csvOut}` : ''}`);
}
