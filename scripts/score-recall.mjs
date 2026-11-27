#!/usr/bin/env node
// Explore recall scorer (dev/eval tool).
//   node scripts/score-recall.mjs <golden.md> <atlas.md> [manual.json]
// Golden items are table rows starting with | G<n> |. Quoted strings in a row ("...") must
// appear verbatim in the atlas (whitespace and quote style normalised) -> auto found/missed.
// Rows without quoted strings need a human mark in manual.json: {"G8": "missed", "G9": "found",
// "G60": "n/a"}. n/a items are left out of the denominator (not visible in the UI / out of area).
// Rows containing "Absence check" pass when their quoted strings do NOT appear (text the app never shows).
import { readFileSync, existsSync } from 'node:fs';

const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();

export function score(golden, atlas, manual = {}) {
  const A = norm(atlas);
  const items = [];
  for (const line of golden.split('\n')) {
    const m = line.match(/^\|\s*(G\d+)\s*\|(.*)$/);
    if (!m) continue;
    const quotes = [...m[2].matchAll(/"([^"]{2,})"/g)].map((q) => q[1]);
    const mark = manual[m[1]]; // human marks win (behaviours, false hits on short/shared strings)
    let status, missing = [];
    if (mark) status = mark;
    else if (!quotes.length) status = 'manual';
    else {
      if (/absence check/i.test(m[2])) {
        const present = quotes.filter((q) => A.includes(norm(q)));
        items.push({ id: m[1], status: present.length ? 'missed' : 'found', missing: present.map((q) => `(should be absent) ${q}`) });
        continue;
      }
      missing = quotes.filter((q) => !A.includes(norm(q)));
      // a row counts as found when its first quoted string (the main text) is present
      status = A.includes(norm(quotes[0])) ? 'found' : 'missed';
    }
    items.push({ id: m[1], status, missing });
  }
  const count = (s) => items.filter((i) => i.status === s).length;
  const found = count('found'), missed = count('missed'), na = count('n/a'), manualLeft = count('manual');
  return { items, found, missed, na, manual: manualLeft, total: items.length,
    recall: found + missed ? found / (found + missed) : null };
}

if (process.argv[1]?.endsWith('score-recall.mjs')) {
  const [g, a, m] = process.argv.slice(2);
  if (!g || !a) { console.error('usage: score-recall.mjs <golden.md> <atlas.md> [manual.json]'); process.exit(2); }
  const r = score(readFileSync(g, 'utf8'), readFileSync(a, 'utf8'), m && existsSync(m) ? JSON.parse(readFileSync(m, 'utf8')) : {});
  for (const i of r.items.filter((i) => i.status !== 'found')) console.log(`${i.status.padEnd(7)} ${i.id}${i.missing.length ? '  missing: ' + i.missing.map((x) => JSON.stringify(x)).join(', ') : ''}`);
  console.log(`\nfound ${r.found} · missed ${r.missed} · n/a ${r.na} · unmarked ${r.manual} · recall ${r.recall === null ? '-' : (r.recall * 100).toFixed(0) + '%'} (of ${r.found + r.missed} scored)`);
  process.exit(r.manual ? 3 : 0);
}
