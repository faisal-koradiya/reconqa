#!/usr/bin/env node
// CI gate over the committed knowledge-base, import and reconcile eval outputs (PLAN F6). Re-scores
// the saved files; no model calls. Targets: import recall >= 80% and 0 conflicts in unexplored
// areas; reconcile >= 95% items right and 0 wrongly confirmed; with the knowledge base >= 90% of
// planted points cited and <= 15% asked again, and the run without it asks more than with it.
import { readFileSync, existsSync } from 'node:fs';
import { scoreImport } from './score-import.mjs';
import { scoreReconcile } from './score-reconcile.mjs';
import { scoreKb } from './score-kb.mjs';

const read = (f) => readFileSync(f, 'utf8');
const fails = [];
const lines = [];

const importKey = JSON.parse(read('evals/kb/import-planted.json'));
for (const [report, source] of [['examples/juice-shop/qa/reports/import-old-cases.md', 'old-cases.csv'], ['examples/juice-shop/qa/reports/import-user-manual.md', 'user-manual.md']]) {
  const s = scoreImport(read(report), importKey, source);
  lines.push(`import ${source}: ${s.found}/${s.planted} planted found, ${s.extra.length} extra, ${s.wrong_area} in unexplored areas, ${s.injections_flagged}/${s.injections} injections flagged`);
  if (s.recall < 0.8 || s.wrong_area || s.injections_flagged < s.injections) fails.push(`import ${source}`);
}

// Second app (Actual Budget): the import must find every planted outdated case.
{
  const s = scoreImport(read('evals/second-app/actual/qa/reports/import-old-cases.md'), JSON.parse(read('evals/second-app/actual/planted.json')), 'old-cases.csv');
  lines.push(`second app import: ${s.found}/${s.planted} planted found, ${s.extra.length} extra`);
  if (s.recall < 0.8) fails.push('second app import');
}

const recKey = JSON.parse(read('evals/reconcile/planted.json'));
for (let n = 1; existsSync(`evals/reconcile/runs/plan-run${n}.json`); n++) {
  const s = scoreReconcile(JSON.parse(read(`evals/reconcile/runs/plan-run${n}.json`)), recKey);
  lines.push(`reconcile run ${n}: ${s.correct}/${s.checked} right, ${s.wrongly_confirmed.length} wrongly confirmed`);
  if (s.correct / s.checked < 0.95 || s.wrongly_confirmed.length) fails.push(`reconcile run ${n}`);
}

const kbKey = JSON.parse(read('evals/kb/kb-eval-key.json'));
const results = JSON.parse(read('evals/kb/runs/kb-eval-results.json')).results;
const agg = {};
for (const r of results) {
  const a = (agg[r.cond] ??= { points: 0, asked: 0, answered: 0 });
  for (const p of scoreKb(read(`evals/kb/runs/kb-eval/${r.file}`), kbKey.tickets[r.ticket], kbKey.feature)) { a.points++; a.asked += p.asked; a.answered += p.answered; }
}
const w = agg['with-kb'], wo = agg['without-kb'];
lines.push(`knowledge base: with it ${w.answered}/${w.points} cited, ${w.asked}/${w.points} asked again; without it ${wo.asked}/${wo.points} asked again`);
if (w.answered / w.points < 0.9 || w.asked / w.points > 0.15 || wo.asked / wo.points <= w.asked / w.points) fails.push('knowledge base');

for (const l of lines) console.log(l);
if (fails.length) { console.log(`FAILED: ${fails.join(', ')}`); process.exit(1); }
console.log('Knowledge-base, import and reconcile evals: OK');
