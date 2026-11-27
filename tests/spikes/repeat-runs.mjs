#!/usr/bin/env node
// Repeats the import and reconcile live runs and scores each one (F6 spread).
//   node tests/spikes/repeat-runs.mjs <fromRun> <toRun>     e.g. 2 3
// Costs real tokens. Manual only.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, cpSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [from = 2, to = 3] = process.argv.slice(2).map(Number);
const node = (args) => execFileSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, timeout: 40 * 60_000 });
for (let n = from; n <= to; n++) {
  for (const [file, source] of [['samples/old-cases.csv', 'old-cases.csv'], ['samples/user-manual.md', 'user-manual.md']]) {
    const s = JSON.parse(node(['tests/spikes/kb-import/run.mjs', file]));
    const name = source.replace(/\.[^.]+$/, '');
    let score = null;
    try { score = JSON.parse(node(['scripts/score-import.mjs', join(s.work, 'qa/reports', `import-${name}.md`), '--source', source])); } catch (e) { score = { error: String(e.message).slice(0, 200) }; }
    const { work, result, ...keep } = s;
    writeFileSync(join(ROOT, `evals/kb/runs/import-${name}-run${n}.json`), JSON.stringify({ date: new Date().toISOString().slice(0, 10), ...keep, score }, null, 2) + '\n');
    console.log(name, n, JSON.stringify({ cost: s.cost_usd, recall: score?.recall, extra: score?.extra?.length, flagged: score?.injections_flagged }));
  }
  if (process.env.SKIP_RECONCILE) continue;
  const s = JSON.parse(node(["tests/spikes/reconcile/run.mjs"]));
  const plan = join(s.work, '.reconqa/work/reconcile-registration-spec.json');
  let score = null;
  try { score = JSON.parse(node(['scripts/score-reconcile.mjs', plan])); cpSync(plan, join(ROOT, `evals/reconcile/runs/plan-run${n}.json`)); } catch (e) { score = { error: String(e.message).slice(0, 200) }; }
  const { work, result, ...keep } = s;
  writeFileSync(join(ROOT, `evals/reconcile/runs/reconcile-run${n}.json`), JSON.stringify({ date: new Date().toISOString().slice(0, 10), ...keep, score }, null, 2) + '\n');
  console.log('reconcile', n, JSON.stringify({ cost: s.cost_usd, correct: score?.correct, checked: score?.checked, wrongly_confirmed: score?.wrongly_confirmed?.length }));
}
