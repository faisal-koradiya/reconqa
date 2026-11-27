#!/usr/bin/env node
// Token usage of Claude Code sessions, from their transcripts (no network, no model calls).
//   node scripts/token-usage.mjs <session.jsonl | folder of .jsonl> [...]
// Claude Code keeps transcripts in ~/.claude/projects/<project folder>/. Prices: Claude Sonnet 5.5
// list prices in USD per million tokens (cache writes are Claude Code's 1-hour writes); change
// PRICE for another model.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const PRICE = { input: 2, cacheWrite: 4, cacheRead: 0.1, output: 10 };
const files = process.argv.slice(2).flatMap((p) => (statSync(p).isDirectory()
  ? readdirSync(p).filter((f) => f.endsWith('.jsonl')).map((f) => join(p, f)) : [p]));
if (!files.length) { console.error('usage: token-usage.mjs <session.jsonl | folder> [...]'); process.exit(2); }
const fmt = (n) => n.toLocaleString('en-US');
for (const f of files) {
  const byId = new Map();
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    if (!line) continue;
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    if (m.message?.role === 'assistant' && m.message.usage) byId.set(m.message.id, m.message.usage);
  }
  const t = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  for (const u of byId.values()) {
    t.input += u.input_tokens ?? 0;
    t.cacheWrite += u.cache_creation_input_tokens ?? 0;
    t.cacheRead += u.cache_read_input_tokens ?? 0;
    t.output += u.output_tokens ?? 0;
  }
  const cost = Object.keys(PRICE).reduce((s, k) => s + (t[k] * PRICE[k]) / 1e6, 0);
  console.log(`${basename(f)}: ${byId.size} requests · input ${fmt(t.input)} · cache write ${fmt(t.cacheWrite)} · cache read ${fmt(t.cacheRead)} · output ${fmt(t.output)} · $${cost.toFixed(3)} ($${(cost / Math.max(byId.size, 1)).toFixed(4)} per request)`);
}
