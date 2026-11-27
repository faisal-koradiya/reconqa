#!/usr/bin/env node
// Live run of the real explore skill (plugins/reconqa) on a copy of the Juice Shop example project.
//   node tests/spikes/explore/run-skill.mjs [area] [model]
// Costs real tokens. Manual only.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const AREA = process.argv[2] || 'login and registration';
const MODEL = process.argv[3] || 'sonnet';
const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), 'skill-'));
cpSync(process.env.KIT || join(ROOT, 'examples/juice-shop/.reconqa/kit.yml'), join(work, '.reconqa/kit.yml'), { recursive: true });
const mcp = { mcpServers: { playwright: { command: 'npx', args: ['-y', '@playwright/mcp@0.0.85',
  '--headless', '--isolated', '--allowed-origins', process.env.APP_URL || 'http://localhost:3000', '--image-responses', 'omit',
  '--output-dir', join(work, '.playwright-output'),
  ...(process.env.STATE ? ['--storage-state', process.env.STATE] : [])] } } };
const t0 = Date.now();
const r = spawnSync('claude', ['-p', `/reconqa:explore ${AREA}`, '--model', MODEL,
  '--plugin-dir', join(ROOT, 'plugins/reconqa'), '--setting-sources', 'project',
  '--mcp-config', JSON.stringify(mcp), '--permission-mode', 'dontAsk',
  '--allowedTools', 'mcp__playwright__*', 'Write', 'Edit', 'Read', 'Glob', 'Bash(node:*)', 'Bash(mkdir:*)',
  '--max-budget-usd', process.env.SPIKE_BUDGET || '2', '--output-format', 'json'],
  { cwd: work, encoding: 'utf8', timeout: 40 * 60_000, maxBuffer: 64 << 20 });
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: r.stdout + r.stderr }; }
const u = out.usage || {};
const s = { secs: Math.round((Date.now() - t0) / 1000), turns: out.num_turns, cost_usd: out.total_cost_usd,
  cache_read: u.cache_read_input_tokens, cache_write: u.cache_creation_input_tokens, output: u.output_tokens,
  result: String(out.result ?? out.raw ?? '').slice(0, 700), work };
writeFileSync(join(work, 'summary.json'), JSON.stringify(s, null, 2));
console.log(JSON.stringify(s, null, 2));
