#!/usr/bin/env node
// Live run of the real explore skill with the built-in Android driver, on a copy of the Loop lab project.
//   node tests/spikes/android/run-skill.mjs [area] [model]
// Needs the lab emulator running with Loop installed (see evals/android/README.md). Costs real tokens.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const AREA = process.argv[2] || 'creating a habit (both habit types)';
const MODEL = process.argv[3] || 'sonnet';
const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), 'android-'));
mkdirSync(join(work, '.reconqa'));
cpSync(join(ROOT, 'evals/android/loop/.reconqa/kit.yml'), join(work, '.reconqa/kit.yml'));
const mcp = { mcpServers: { 'reconqa-android': { command: 'node', args: [join(ROOT, 'plugins/reconqa/drivers/android/server.mjs')],
  env: { RECONQA_PROJECT: work, PATH: process.env.PATH } } } };
const t0 = Date.now();
const r = spawnSync('claude', ['-p', `/reconqa:explore ${AREA}`, '--model', MODEL,
  '--plugin-dir', join(ROOT, 'plugins/reconqa'), '--setting-sources', 'project',
  '--mcp-config', JSON.stringify(mcp), '--strict-mcp-config', '--permission-mode', 'dontAsk',
  '--allowedTools', 'mcp__reconqa-android__*', 'Write', 'Edit', 'Read', 'Glob', 'Bash(node:*)', 'Bash(mkdir:*)',
  '--max-budget-usd', process.env.SPIKE_BUDGET || '2', '--output-format', 'json'],
  { cwd: work, encoding: 'utf8', timeout: 40 * 60_000, maxBuffer: 64 << 20 });
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: r.stdout + r.stderr }; }
const u = out.usage || {};
const s = { secs: Math.round((Date.now() - t0) / 1000), turns: out.num_turns, cost_usd: out.total_cost_usd,
  cache_read: u.cache_read_input_tokens, cache_write: u.cache_creation_input_tokens, output: u.output_tokens,
  result: String(out.result ?? out.raw ?? '').slice(0, 900), work };
writeFileSync(join(work, 'summary.json'), JSON.stringify(s, null, 2));
console.log(JSON.stringify(s, null, 2));
