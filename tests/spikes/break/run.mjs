#!/usr/bin/env node
// Live extreme-mode runs on a fresh copy of a lab project. Costs real tokens. Manual only.
//   node tests/spikes/break/run.mjs web|android|api "<area>" [model]
// web: examples/juice-shop (Juice Shop on :3000); android: evals/android/loop (emulator-5554);
// api: evals/api/rwa (RWA API on :3101, RWA_USER / RWA_PASSWORD given to the driver only).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const [TARGET, AREA, MODEL = 'sonnet'] = process.argv.slice(2);
const SRC = { web: 'examples/juice-shop', android: 'evals/android/loop', api: 'evals/api/rwa' }[TARGET];
if (!SRC || !AREA) { console.error('usage: run.mjs web|android|api "<area>" [model]'); process.exit(2); }
const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), `break-${TARGET}-`));
cpSync(join(ROOT, SRC), work, { recursive: true, filter: (s) => !/[\\/](runs|shots|\.mcp\.json)$/.test(s) && !/\.compiled\.json$/.test(s) });
if (TARGET === 'api') { mkdirSync(join(work, 'qa/atlas'), { recursive: true }); cpSync(join(ROOT, 'evals/api/runs/run1-atlas.md'), join(work, 'qa/atlas/bank-accounts.md')); }
const servers = {
  web: { playwright: { command: 'npx', args: ['-y', '@playwright/mcp@0.0.85', '--headless', '--isolated', '--allowed-origins', 'http://localhost:3000',
    '--image-responses', 'omit', '--output-dir', join(work, '.playwright-output'), ...(process.env.STATE ? ['--storage-state', process.env.STATE] : [])] } },
  android: { 'reconqa-android': { command: 'node', args: [join(ROOT, 'plugins/reconqa/drivers/android/server.mjs')], env: { RECONQA_PROJECT: work, PATH: process.env.PATH } } },
  api: { 'reconqa-api': { command: 'node', args: [join(ROOT, 'plugins/reconqa/drivers/api/server.mjs')],
    env: { RECONQA_PROJECT: work, PATH: process.env.PATH, RWA_USER: process.env.RWA_USER ?? '', RWA_PASSWORD: process.env.RWA_PASSWORD ?? '' } } },
}[TARGET];
const prefix = { web: 'mcp__playwright__*', android: 'mcp__reconqa-android__*', api: 'mcp__reconqa-api__*' }[TARGET];
const env = { ...process.env }; delete env.RWA_USER; delete env.RWA_PASSWORD;
const t0 = Date.now();
const r = spawnSync('claude', ['-p', `/reconqa:break ${AREA}`, '--model', MODEL, '--plugin-dir', join(ROOT, 'plugins/reconqa'),
  '--setting-sources', 'project', '--mcp-config', JSON.stringify({ mcpServers: servers }), '--strict-mcp-config', '--permission-mode', 'dontAsk',
  '--allowedTools', prefix, 'Write', 'Edit', 'Read', 'Glob', 'Bash(node:*)', 'Bash(mkdir:*)',
  '--max-budget-usd', process.env.SPIKE_BUDGET || '2', '--output-format', 'json'],
  { cwd: work, env, encoding: 'utf8', timeout: 40 * 60_000, maxBuffer: 64 << 20 });
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: (r.stdout + r.stderr).slice(-3000) }; }
const s = { target: TARGET, area: AREA, model: MODEL, secs: Math.round((Date.now() - t0) / 1000), turns: out.num_turns, cost_usd: out.total_cost_usd,
  result: String(out.result ?? out.raw ?? '').slice(0, 2500), work };
writeFileSync(join(work, 'summary.json'), JSON.stringify(s, null, 2));
console.log(JSON.stringify(s, null, 2));
