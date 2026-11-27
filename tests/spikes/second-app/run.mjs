#!/usr/bin/env node
// Live runs on the second test app (Actual Budget, local lab). The browser helper uses the lab's
// persistent Chrome profile (Actual keeps the budget in the browser's own storage), not --isolated.
//   node tests/spikes/second-app/run.mjs "<slash command>" [model]
// Runs in evals/second-app/actual (outputs land there). Costs real tokens. Manual only.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const PROJECT = join(ROOT, 'evals/second-app/actual');
const CMD = process.argv[2];
const MODEL = process.argv[3] || 'sonnet';
if (!CMD) { console.error('usage: run.mjs "<slash command>" [model]'); process.exit(2); }
const mcp = { mcpServers: { playwright: { command: 'npx', args: ['-y', '@playwright/mcp@0.0.85',
  '--headless', '--user-data-dir', join(homedir(), 'Projects/reconqa-lab/actual/profile'),
  '--allowed-origins', 'http://127.0.0.1:5006', '--image-responses', 'omit',
  '--output-dir', join(process.env.SPIKE_TMP || '/tmp', 'second-app-pw-output')] } } };
const t0 = Date.now();
const r = spawnSync('claude', ['-p', CMD, '--model', MODEL,
  '--plugin-dir', join(ROOT, 'plugins/reconqa'), '--setting-sources', 'project',
  '--mcp-config', JSON.stringify(mcp), '--strict-mcp-config', '--permission-mode', 'dontAsk',
  '--allowedTools', 'mcp__playwright__*', 'Write', 'Edit', 'Read', 'Glob', 'Grep', 'Bash(node:*)', 'Bash(mkdir:*)',
  '--max-budget-usd', process.env.SPIKE_BUDGET || '2.5', '--output-format', 'json'],
  { cwd: PROJECT, encoding: 'utf8', timeout: 45 * 60_000, maxBuffer: 64 << 20 });
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: (r.stdout + r.stderr).slice(-3000) }; }
const s = { cmd: CMD, model: MODEL, secs: Math.round((Date.now() - t0) / 1000), turns: out.num_turns, cost_usd: out.total_cost_usd,
  output: out.usage?.output_tokens, result: String(out.result ?? out.raw ?? '').slice(0, 2500) };
writeFileSync(join(PROJECT, 'runs', `run-${Date.now()}.json`), JSON.stringify(s, null, 2));
console.log(JSON.stringify(s, null, 2));
