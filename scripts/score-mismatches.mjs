#!/usr/bin/env node
// Mismatch scorer (dev/eval tool): compares the "Mismatches" table of a write-cases output with
// a hand-labelled list.
//   node scripts/score-mismatches.mjs <labels.md> <cases.md>
// Labels: table rows "| <AC number> | … | <label> |" where the last cell contains "mismatch"
// (incl. "mismatch (missing in app)") or "match". Rows with "—" in the AC cell are ignored.
// Output rows: rows of the table under "## Mismatches"; a row flags AC<n> when it mentions
// "AC<n>" or "criterion <n>" and its kind is mismatch, missing in app or likely defect. Other kinds
// (missing in ticket, open question) and rows marked unconfirmed are not counted either way.
import { readFileSync } from 'node:fs';

export function readLabels(text) {
  const labels = new Map();
  for (const line of text.split('\n')) {
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 3 || !/^\d+$/.test(cells[0])) continue;
    const last = cells[cells.length - 1].toLowerCase().replace(/\*/g, '');
    labels.set(Number(cells[0]), /mismatch/.test(last) ? 'mismatch' : 'match');
  }
  return labels;
}

export function readFlags(text) {
  const section = text.split(/^#{1,6}\s*Mismatches\b.*$/im)[1] ?? '';
  const flagged = new Set();
  for (const line of section.split('\n')) {
    if (!line.startsWith('|') || /^\|[\s-|]+\|$/.test(line)) continue;
    const l = line.toLowerCase();
    // the kind column: a cell that is exactly a kind word (optionally with a note in brackets)
    const kinds = line.split('|').map((c) => c.trim().toLowerCase().replace(/\*/g, ''));
    // likely defect counts when the row cites a ticket criterion: it is a ticket-vs-app disagreement too
    const isFlag = kinds.some((k) => /^(mismatch|missing in app|likely defect)\b/.test(k));
    if (!isFlag || /unconfirmed/.test(l)) continue;
    for (const m of line.matchAll(/\b(?:AC|criteri(?:on|a))\s*#?:?\s*(\d+)/gi)) flagged.add(Number(m[1]));
  }
  return flagged;
}

export function scoreMismatches(labelsText, casesText) {
  const labels = readLabels(labelsText);
  const flagged = readFlags(casesText);
  const truth = [...labels].filter(([, v]) => v === 'mismatch').map(([k]) => k);
  const tp = truth.filter((ac) => flagged.has(ac));
  const fp = [...flagged].filter((ac) => labels.get(ac) === 'match');
  const fn = truth.filter((ac) => !flagged.has(ac));
  const unknown = [...flagged].filter((ac) => !labels.has(ac));
  return { tp, fp, fn, unknown,
    precision: tp.length + fp.length ? tp.length / (tp.length + fp.length) : null,
    recall: truth.length ? tp.length / truth.length : null };
}

if (process.argv[1]?.endsWith('score-mismatches.mjs')) {
  const [l, c] = process.argv.slice(2);
  if (!l || !c) { console.error('usage: score-mismatches.mjs <labels.md> <cases.md>'); process.exit(2); }
  const r = scoreMismatches(readFileSync(l, 'utf8'), readFileSync(c, 'utf8'));
  const pct = (x) => (x === null ? '-' : `${Math.round(x * 100)}%`);
  console.log(`flagged correctly: ${r.tp.map((n) => 'AC' + n).join(', ') || '-'}`);
  console.log(`false flags: ${r.fp.map((n) => 'AC' + n).join(', ') || '-'}`);
  console.log(`missed: ${r.fn.map((n) => 'AC' + n).join(', ') || '-'}`);
  console.log(`precision ${pct(r.precision)} (${r.tp.length}/${r.tp.length + r.fp.length}) · recall ${pct(r.recall)} (${r.tp.length}/${r.tp.length + r.fn.length})`);
}
