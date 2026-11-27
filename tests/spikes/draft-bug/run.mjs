#!/usr/bin/env node
// Live run of draft-bug on a copy of examples/juice-shop (tracker none = draft only).
//   node tests/spikes/draft-bug/run.mjs "<case id + step or description>"   (manual; costs tokens)
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const WHAT = process.argv[2] || 'TC-REG-010 step 2 (password counter)';
const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), 'bug-'));
for (const d of ['.reconqa/kit.yml', 'qa']) cpSync(join(ROOT, 'examples/juice-shop', d), join(work, d), { recursive: true });
const mcp = { mcpServers: { playwright: { command: 'npx', args: ['-y', '@playwright/mcp@0.0.85', '--headless', '--isolated',
  '--allowed-origins', 'http://localhost:3000', '--image-responses', 'omit', '--output-dir', join(work, '.playwright-output')] } } };
const t0 = Date.now();
const r = spawnSync('claude', ['-p', `/reconqa:draft-bug ${WHAT}`, '--model', 'sonnet', '--plugin-dir', join(ROOT, 'plugins/reconqa'),
  '--setting-sources', 'project', '--mcp-config', JSON.stringify(mcp), '--permission-mode', 'dontAsk',
  '--allowedTools', 'mcp__playwright__*', 'Write', 'Edit', 'Read', 'Glob', 'Grep', 'Bash(node:*)',
  '--max-budget-usd', '2', '--output-format', 'json'], { cwd: work, encoding: 'utf8', timeout: 30 * 60_000, maxBuffer: 64 << 20 });
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: r.stdout + r.stderr }; }
const s = { secs: Math.round((Date.now() - t0) / 1000), turns: out.num_turns, cost_usd: out.total_cost_usd,
  output: out.usage?.output_tokens, result: String(out.result ?? out.raw ?? '').slice(0, 700), work };
writeFileSync(join(work, 'summary.json'), JSON.stringify(s, null, 2));
console.log(JSON.stringify(s, null, 2));
