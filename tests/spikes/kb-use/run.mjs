#!/usr/bin/env node
// Live check that skills use the knowledge base (F3), on a copy of the Juice Shop example.
//   node tests/spikes/kb-use/run.mjs write-cases   -> follow-up ticket: decisions reused, not re-asked
//   node tests/spikes/kb-use/run.mjs draft-bug     -> a known issue is recognised, no new draft
// Costs real tokens. Manual only. Output stays in the printed work folder.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const WHICH = process.argv[2] || 'write-cases';
const MODEL = process.argv[3] || 'sonnet';
const PROMPTS = {
  'write-cases': '/reconqa:write-cases tickets/registration-follow-up.md',
  'draft-bug': '/reconqa:draft-bug On the registration page the counter under the Password field shows 0/20, but passwords may be up to 40 characters.',
};
const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), `kb-use-${WHICH}-`));
cpSync(join(ROOT, 'examples/juice-shop'), work, { recursive: true, filter: (s) => !/[\\/](auth|shots|\.mcp\.json)([\\/]|$)/.test(s) });
const t0 = Date.now();
const r = spawnSync('claude', ['-p', PROMPTS[WHICH], '--model', MODEL,
  '--plugin-dir', join(ROOT, 'plugins/reconqa'), '--setting-sources', 'project', '--permission-mode', 'dontAsk',
  '--allowedTools', 'Write', 'Edit', 'Read', 'Glob', 'Grep', 'Bash(node:*)',
  '--max-budget-usd', process.env.SPIKE_BUDGET || '2', '--output-format', 'json'],
  { cwd: work, encoding: 'utf8', timeout: 30 * 60_000, maxBuffer: 64 << 20 });
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: r.stdout + r.stderr }; }
const u = out.usage || {};
const s = { which: WHICH, model: MODEL, secs: Math.round((Date.now() - t0) / 1000), turns: out.num_turns, cost_usd: out.total_cost_usd,
  output: u.output_tokens, result: String(out.result ?? out.raw ?? '').slice(0, 2000), work };
writeFileSync(join(work, 'summary.json'), JSON.stringify(s, null, 2));
console.log(JSON.stringify(s, null, 2));
