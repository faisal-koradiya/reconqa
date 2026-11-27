#!/usr/bin/env node
// Scores write-cases output for the knowledge-base eval.
//   node scripts/score-kb.mjs <cases.md> <ticket file name> [--key evals/kb/kb-eval-key.json]
import { readFileSync } from 'node:fs';

// Rows of the ticket-vs-app table (found by its "Ticket says" column, whatever the heading says).
export function mismatchRows(text) {
  const lines = text.split('\n');
  const rows = [];
  let inTable = false;
  for (const l of lines) {
    if (/^\s*\|.*ticket says/i.test(l)) { inTable = true; continue; }
    if (inTable && /^\s*\|\s*\d+\s*\|/.test(l)) rows.push(l);
    else if (inTable && !/^\s*\|/.test(l)) inTable = false;
  }
  return rows;
}

// asked:    the point is a row of that table that is not a match and does not cite its answer
// answered: the right decision or known issue is cited ("decision registration/D3", "K1")
export function scoreKb(text, points, feature = 'registration') {
  const rows = mismatchRows(text);
  return points.map((p) => {
    const ac = new RegExp(`\\bAC\\s*${p.ac}\\b`);
    const cites = new RegExp(`\\b${p.id}\\b`);
    const asked = rows.some((r) => ac.test(r.split('|')[2] ?? r) && !/\|\s*match\s*\|/i.test(r) && !cites.test(r));
    const cite = new RegExp(`\\b${p.kind === 'decision' ? 'decision' : 'known issue'}\\s+${feature}/${p.id}\\b`, 'i');
    return { ...p, asked, answered: cite.test(text) };
  });
}

if (process.argv[1]?.endsWith('score-kb.mjs')) {
  const args = process.argv.slice(2);
  const ki = args.indexOf('--key');
  const key = JSON.parse(readFileSync(ki >= 0 ? args.splice(ki, 2)[1] : 'evals/kb/kb-eval-key.json', 'utf8'));
  const [file, ticket] = args;
  if (!file || !key.tickets[ticket]) { console.error('usage: score-kb.mjs <cases.md> <ticket file name> [--key file]'); process.exit(2); }
  console.log(JSON.stringify(scoreKb(readFileSync(file, 'utf8'), key.tickets[ticket], key.feature), null, 2));
}
