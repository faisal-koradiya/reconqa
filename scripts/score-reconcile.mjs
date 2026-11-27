#!/usr/bin/env node
// Scores a reconcile plan (after the model's review) against the answer key.
//   node scripts/score-reconcile.mjs <plan.json> [--key evals/reconcile/planted.json]
// Per unique expected text: the group it ended in (review wins over the script) vs the key.
import { readFileSync } from 'node:fs';

export function scoreReconcile(plan, key) {
  const want = new Map();
  for (const x of [...key.confirmed, ...key.confirmed_normalised]) want.set(x.text, { group: 'confirmed', ...x });
  for (const x of key.different) want.set(x.text, { group: 'different', ...x });
  for (const x of key.not_found) want.set(x.text, { group: 'not_found', ...x });
  const items = plan.items.map((i) => ({ text: i.text, group: i.review?.group ?? i.group, atlas_text: i.review?.atlas_text ?? i.atlas_text }));
  const results = [];
  for (const [text, w] of want) {
    const got = items.filter((i) => i.text === text);
    if (!got.length) { results.push({ text, want: w.group, got: 'missing', ok: false }); continue; }
    for (const g of got) {
      const groupOk = g.group === w.group || (w.also_ok && g.group === w.also_ok);
      const textOk = w.group !== 'different' || g.group !== 'different' || !w.atlas_text || g.atlas_text === w.atlas_text;
      results.push({ text, want: w.group, got: g.group, atlas_text: g.atlas_text ?? null, ok: groupOk && textOk });
    }
  }
  const unknown = items.filter((i) => !want.has(i.text)).map((i) => i.text);
  const sorted = items.filter((i) => ['confirmed', 'different', 'not_found'].includes(i.group)).length;
  const planted = key.different.map((d) => d.text);
  return {
    items: items.length, sorted, sorted_pct: items.length ? Math.round((sorted / items.length) * 100) : 100,
    correct: results.filter((r) => r.ok).length, checked: results.length,
    planted_changes_in_different: results.filter((r) => planted.includes(r.text) && r.got === 'different' && r.ok).length,
    planted_changes: results.filter((r) => planted.includes(r.text)).length,
    wrongly_confirmed: results.filter((r) => r.got === 'confirmed' && r.want !== 'confirmed').map((r) => r.text),
    wrong: results.filter((r) => !r.ok), unknown,
  };
}

if (process.argv[1]?.endsWith('score-reconcile.mjs')) {
  const args = process.argv.slice(2);
  const ki = args.indexOf('--key');
  const key = JSON.parse(readFileSync(ki >= 0 ? args.splice(ki, 2)[1] : 'evals/reconcile/planted.json', 'utf8'));
  if (!args[0]) { console.error('usage: score-reconcile.mjs <plan.json> [--key file]'); process.exit(2); }
  console.log(JSON.stringify(scoreReconcile(JSON.parse(readFileSync(args[0], 'utf8')), key), null, 2));
}
