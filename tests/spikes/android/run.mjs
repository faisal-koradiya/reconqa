#!/usr/bin/env node
// Live runs on the Android lab project (Loop Habit Tracker on the emulator), with the built-in
// Android driver. Needs the lab emulator running with Loop installed.
//   node tests/spikes/android/run.mjs "<slash command>" [model]
// Runs in evals/android/loop (outputs land there). Costs real tokens. Manual only.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const PROJECT = join(ROOT, 'evals/android/loop');
const CMD = process.argv[2];
const MODEL = process.argv[3] || 'sonnet';
if (!CMD) { console.error('usage: run.mjs "<slash command>" [model]'); process.exit(2); }
const mcp = { mcpServers: { 'reconqa-android': { command: 'node', args: [join(ROOT, 'plugins/reconqa/drivers/android/server.mjs')],
  env: { RECONQA_PROJECT: PROJECT, PATH: process.env.PATH } } } };
const t0 = Date.now();
const r = spawnSync('claude', ['-p', CMD, '--model', MODEL,
  '--plugin-dir', join(ROOT, 'plugins/reconqa'), '--setting-sources', 'project',
  '--mcp-config', JSON.stringify(mcp), '--strict-mcp-config', '--permission-mode', 'dontAsk',
  '--allowedTools', 'mcp__reconqa-android__*', 'Write', 'Edit', 'Read', 'Glob', 'Grep', 'Bash(node:*)', 'Bash(mkdir:*)',
  '--max-budget-usd', process.env.SPIKE_BUDGET || '2.5', '--output-format', 'json'],
  { cwd: PROJECT, encoding: 'utf8', timeout: 45 * 60_000, maxBuffer: 64 << 20 });
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: (r.stdout + r.stderr).slice(-3000) }; }
const s = { cmd: CMD, model: MODEL, secs: Math.round((Date.now() - t0) / 1000), turns: out.num_turns, cost_usd: out.total_cost_usd,
  output: out.usage?.output_tokens, result: String(out.result ?? out.raw ?? '').slice(0, 2500) };
writeFileSync(join(PROJECT, 'runs', `run-${Date.now()}.json`), JSON.stringify(s, null, 2));
console.log(JSON.stringify(s, null, 2));
