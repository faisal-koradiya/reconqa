#!/usr/bin/env node
// Live run of the real kb skill (import) on a copy of the Juice Shop example project.
//   node tests/spikes/kb-import/run.mjs [samples/old-cases.csv|samples/user-manual.md] [model]
// Costs real tokens. Manual only. Output stays in the printed work folder.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const FILE = process.argv[2] || 'samples/old-cases.csv';
const MODEL = process.argv[3] || 'sonnet';
const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), 'kb-import-'));
// A fresh project: nothing imported yet (no qa/sources, no reports, index without the imported file).
cpSync(join(ROOT, 'examples/juice-shop'), work, { recursive: true, filter: (s) => !/[\\/](auth|shots|\.mcp\.json|sources|reports)([\\/]|$)/.test(s) });
const idx = join(work, 'qa/kb/index.md');
writeFileSync(idx, readFileSync(idx, 'utf8').replace(', qa/sources/old-cases.csv', ''));
const ov = join(work, 'qa/kb/registration/overview.md');
writeFileSync(ov, readFileSync(ov, 'utf8').replace(/## From the manual[\s\S]*?(?=## Notes)/, ''));
const t0 = Date.now();
const r = spawnSync('claude', ['-p', `/reconqa:kb import ${FILE}`, '--model', MODEL,
  '--plugin-dir', join(ROOT, 'plugins/reconqa'), '--setting-sources', 'project',
  '--permission-mode', 'dontAsk',
  '--allowedTools', 'Write', 'Edit', 'Read', 'Glob', 'Grep', 'Bash(node:*)',
  '--max-budget-usd', process.env.SPIKE_BUDGET || '2', '--output-format', 'json'],
  { cwd: work, encoding: 'utf8', timeout: 30 * 60_000, maxBuffer: 64 << 20 });
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: r.stdout + r.stderr }; }
const u = out.usage || {};
const s = { file: FILE, model: MODEL, secs: Math.round((Date.now() - t0) / 1000), turns: out.num_turns, cost_usd: out.total_cost_usd,
  cache_read: u.cache_read_input_tokens, cache_write: u.cache_creation_input_tokens, output: u.output_tokens,
  result: String(out.result ?? out.raw ?? '').slice(0, 1500), work };
writeFileSync(join(work, 'summary.json'), JSON.stringify(s, null, 2));
console.log(JSON.stringify(s, null, 2));
