#!/usr/bin/env node
// Live run of write-cases in pre-UI mode: the atlas (and everything built on it) is hidden, as if
// the screen did not exist yet.
//   node tests/spikes/pre-ui/run.mjs [ticket] [model]     (PROJECT=<dir> to use another project than the Juice Shop example)
// Costs real tokens. Manual only. Output stays in the printed work folder.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const TICKET = process.argv[2] || 'tickets/registration-spec.md';
const MODEL = process.argv[3] || 'sonnet';
const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), 'pre-ui-'));
cpSync(process.env.PROJECT ? resolve(process.env.PROJECT) : join(ROOT, 'examples/juice-shop'), work, { recursive: true,
  filter: (s) => !/[\\/](auth|shots|\.mcp\.json|atlas|kb|cases|reports|sources|runs|bugs|samples)([\\/]|$)/.test(s) });
const t0 = Date.now();
const r = spawnSync('claude', ['-p', `/reconqa:write-cases ${TICKET} --pre-ui`, '--model', MODEL,
  '--plugin-dir', join(ROOT, 'plugins/reconqa'), '--setting-sources', 'project', '--permission-mode', 'dontAsk',
  '--allowedTools', 'Write', 'Edit', 'Read', 'Glob', 'Grep', 'Bash(node:*)',
  '--max-budget-usd', process.env.SPIKE_BUDGET || '2', '--output-format', 'json'],
  { cwd: work, encoding: 'utf8', timeout: 30 * 60_000, maxBuffer: 64 << 20 });
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: r.stdout + r.stderr }; }
const s = { ticket: TICKET, model: MODEL, secs: Math.round((Date.now() - t0) / 1000), turns: out.num_turns, cost_usd: out.total_cost_usd,
  output: out.usage?.output_tokens, result: String(out.result ?? out.raw ?? '').slice(0, 2000), work };
writeFileSync(join(work, 'summary.json'), JSON.stringify(s, null, 2));
console.log(JSON.stringify(s, null, 2));
