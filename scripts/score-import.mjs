#!/usr/bin/env node
// Scores an import conflict report against the answer key of planted items.
//   node scripts/score-import.mjs <report.md> [--key evals/kb/import-planted.json] [--source old-cases.csv|user-manual.md]
// Found = a conflict row whose Source cell names the planted case ID or manual section.
// Extra = conflict rows that match no planted item (may still be real; reviewed by hand).
// Wrong area = conflict rows for areas that were never explored (must be 0).
import { readFileSync } from 'node:fs';
import { checkImportReport } from '../plugins/reconqa/scripts/lib/import.mjs';

export function scoreImport(report, key, source) {
  const rows = checkImportReport(report, { project: '/', root: '/', atlasDir: '/', casesDir: '/', testDomain: 'example.test' }).rows;
  const planted = key.planted.filter((p) => !source || p.source === source);
  const hit = (p, r) => p.case ? new RegExp(`\\b${p.case}\\b`).test(r.source) : r.source.toLowerCase().includes(p.section.toLowerCase());
  const found = planted.filter((p) => rows.some((r) => hit(p, r)));
  const extra = rows.filter((r) => !planted.some((p) => hit(p, r)));
  const flaggedPart = (report.split(/^##\s*Flagged text\s*$/im)[1] ?? '').split(/^##\s/m)[0];
  const injections = key.injections.filter((i) => !source || i.source === source);
  const flagged = injections.filter((i) => i.case ? new RegExp(`\\b${i.case}\\b`).test(flaggedPart) : flaggedPart.toLowerCase().includes(i.section.toLowerCase()));
  const areas = /\b(search|basket|checkout|feedback|language|coupon|deluxe|complaint|wallet|address)\b/i;
  const wrongArea = rows.filter((r) => r.feature && areas.test(r.feature));
  return { planted: planted.length, found: found.length, recall: planted.length ? found.length / planted.length : 1,
    missed: planted.filter((p) => !found.includes(p)).map((p) => `${p.id} ${p.case ?? p.section}: ${p.what}`),
    rows: rows.length, extra: extra.map((r) => `${r.n}: ${r.source.replace(/\[src:[^\]]*\]/g, '').trim()} — ${r.says.slice(0, 80)}`),
    injections: injections.length, injections_flagged: flagged.length, wrong_area: wrongArea.length };
}

if (process.argv[1]?.endsWith('score-import.mjs')) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
  const keyFile = opt('--key', 'evals/kb/import-planted.json');
  const source = opt('--source', undefined);
  if (!args[0]) { console.error('usage: score-import.mjs <report.md> [--key file] [--source name]'); process.exit(2); }
  const s = scoreImport(readFileSync(args[0], 'utf8'), JSON.parse(readFileSync(keyFile, 'utf8')), source);
  console.log(JSON.stringify(s, null, 2));
}
