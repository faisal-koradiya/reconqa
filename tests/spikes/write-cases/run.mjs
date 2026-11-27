#!/usr/bin/env node
// Live run of the write-cases skill on a copy of examples/juice-shop (frozen atlas + sample ticket).
//   node tests/spikes/write-cases/run.mjs [ticket path inside the example] [model]
// Costs real tokens. Manual only.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const TICKET = process.argv[2] || 'tickets/new-customer-registration.md';
const MODEL = process.argv[3] || 'sonnet';
const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), 'cases-'));
for (const d of ['.reconqa/kit.yml', 'qa/atlas', 'tickets']) cpSync(join(process.env.SRC_DIR || join(ROOT, 'examples/juice-shop'), d), join(work, d), { recursive: true });
const t0 = Date.now();
const r = spawnSync('claude', ['-p', `/reconqa:write-cases ${TICKET}`, '--model', MODEL,
  '--plugin-dir', join(ROOT, 'plugins/reconqa'), '--setting-sources', 'project',
  '--permission-mode', 'dontAsk', '--allowedTools', 'Write', 'Edit', 'Read', 'Glob', 'Grep', 'Bash(node:*)',
  '--max-budget-usd', process.env.SPIKE_BUDGET || '2', '--output-format', 'json'],
  { cwd: work, encoding: 'utf8', timeout: 30 * 60_000, maxBuffer: 64 << 20 });
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: r.stdout + r.stderr }; }
const u = out.usage || {};
const s = { secs: Math.round((Date.now() - t0) / 1000), turns: out.num_turns, cost_usd: out.total_cost_usd,
  output: u.output_tokens, result: String(out.result ?? out.raw ?? '').slice(0, 900), work };
writeFileSync(join(work, 'summary.json'), JSON.stringify(s, null, 2));
console.log(JSON.stringify(s, null, 2));
