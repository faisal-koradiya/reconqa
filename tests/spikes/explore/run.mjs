#!/usr/bin/env node
// Explore spike: one headless explorer run against the local demo app.
//   node tests/spikes/explore/run.mjs [area] [model]
// Prints duration, turns, tokens and cost; leaves the atlas in the work dir.
// Costs real tokens. Manual only, not CI.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_URL = process.env.APP_URL || 'http://127.0.0.1:3000';
const AREA = process.argv[2] || 'Login and user registration (sign-up), including validation and error messages';
const MODEL = process.argv[3] || 'sonnet';
const PLAYWRIGHT_MCP = '@playwright/mcp@0.0.85'; // pinned; bump deliberately
const slug = 'login-registration';
const runId = Date.now().toString(36);

const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), 'explore-'));
mkdirSync(join(work, 'atlas'));
const prompt = readFileSync(join(HERE, 'explorer-prompt.md'), 'utf8')
  .replaceAll('{{APP_URL}}', APP_URL).replaceAll('{{AREA}}', AREA)
  .replaceAll('{{AREA_SLUG}}', slug).replaceAll('{{RUN_ID}}', runId);
const mcp = { mcpServers: { playwright: { command: 'npx', args: ['-y', PLAYWRIGHT_MCP,
  '--headless', '--isolated', '--allowed-origins', APP_URL, '--image-responses', 'omit',
  '--output-dir', join(work, 'playwright-output')] } } };

const t0 = Date.now();
const r = spawnSync('claude', ['-p', prompt, '--model', MODEL, '--setting-sources', 'project',
  '--strict-mcp-config', '--mcp-config', JSON.stringify(mcp),
  '--permission-mode', 'dontAsk', '--allowedTools', 'mcp__playwright__*', 'Write', 'Edit', 'Read',
  '--max-budget-usd', process.env.SPIKE_BUDGET || '4', '--output-format', 'json'],
  { cwd: work, encoding: 'utf8', timeout: 40 * 60_000, maxBuffer: 64 << 20 });
const secs = Math.round((Date.now() - t0) / 1000);
let out; try { out = JSON.parse(r.stdout); } catch { out = { raw: r.stdout + r.stderr }; }
const u = out.usage || {};
const summary = { area: AREA, model: MODEL, playwright: PLAYWRIGHT_MCP, secs, turns: out.num_turns,
  cost_usd: out.total_cost_usd, input: u.input_tokens, cache_read: u.cache_read_input_tokens,
  cache_write: u.cache_creation_input_tokens, output: u.output_tokens, result: String(out.result ?? out.raw ?? '').slice(0, 500), work };
writeFileSync(join(work, 'summary.json'), JSON.stringify({ ...summary, modelUsage: out.modelUsage }, null, 2));
console.log(JSON.stringify(summary, null, 2));
