#!/usr/bin/env node
// Hook spike runner. Drives headless `claude -p` against the throwaway plugin in
// ./plugin and judges each scenario only from the logs the fake MCP server and
// the gate hook write, never from what the model says.
//
//   node tests/spikes/hooks/run.mjs [scenario-name-filter]
//
// Costs real tokens (small model, budget-capped per run). Manual only, not CI.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, 'plugin');
const T = 'mcp__plugin_hookspike_tracker__';
const MODEL = process.env.SPIKE_MODEL || 'haiku';
const MODES = ['manual', 'acceptEdits', 'auto', 'dontAsk', 'plan', 'bypassPermissions'];

const CREATE = `Call the tool ${T}create_item exactly once with title "spike". Do not use any other tool. If the call is refused, stop and reply DONE.`;

function run({ prompt, gate = 'observe', mode = 'manual', env = {}, allow = [], promptTool = false }) {
  const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), 'hookspike-'));
  const log = join(work, 'spike.log');
  writeFileSync(log, '');
  const args = ['-p', prompt, '--model', MODEL, '--plugin-dir', PLUGIN,
    '--permission-mode', mode, '--setting-sources', 'project',
    '--max-budget-usd', '0.30', '--output-format', 'json'];
  if (allow.length) args.push('--allowedTools', ...allow);
  if (promptTool) args.push('--permission-prompt-tool', `${T}approve`);
  const r = spawnSync('claude', args, {
    cwd: work, encoding: 'utf8', timeout: 180_000,
    env: { ...process.env, SPIKE_LOG: log, SPIKE_GATE: gate, ...env },
  });
  const lines = readFileSync(log, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  let out = {};
  try { out = JSON.parse(r.stdout); } catch { out = { raw: (r.stdout || '') + (r.stderr || '') }; }
  return {
    work, out, lines,
    hooks: lines.filter((l) => l.kind === 'hook'),
    calls: lines.filter((l) => !l.kind),
    called: (name) => lines.some((l) => !l.kind && l.tool === name),
  };
}

const hookSaw = (r, suffix) => r.hooks.some((h) => h.tool.endsWith(suffix));
const decided = (r, suffix, d) => r.hooks.some((h) => h.tool.endsWith(suffix) && h.decision === d);

const scenarios = [
  { name: 'fires-on-mcp', claim: 'Plugin PreToolUse hook fires on an MCP tool call',
    opts: { prompt: CREATE, allow: [`${T}create_item`] },
    check: (r) => hookSaw(r, 'create_item') && r.called('create_item') },
  { name: 'deny', claim: 'deny stops the MCP call',
    opts: { prompt: CREATE, gate: 'deny', mode: 'bypassPermissions' },
    check: (r) => decided(r, 'create_item', 'deny') && !r.called('create_item') },
  { name: 'rewrite', claim: 'updatedInput replaces the payload the server receives',
    opts: { prompt: CREATE, gate: 'rewrite', mode: 'bypassPermissions' },
    check: (r) => r.calls.some((c) => c.tool === 'create_item' && c.args.title === '[gated] spike') },
  { name: 'crash-wrapped', claim: 'a crashing hook (with the || exit 2 wrapper) blocks the call',
    opts: { prompt: CREATE, gate: 'crash', mode: 'bypassPermissions' },
    check: (r) => hookSaw(r, 'create_item') && !r.called('create_item') },
  { name: 'crash-unwrapped', claim: 'control: a crashing hook WITHOUT the wrapper does not block (so the wrapper is needed)',
    opts: { prompt: CREATE, gate: 'crash', mode: 'bypassPermissions', env: { SPIKE_NOWRAP: '1' } },
    check: (r) => hookSaw(r, 'create_item') && r.called('create_item') },
  ...MODES.map((mode) => ({
    name: `ask-${mode}`, claim: `ask reaches the prompt handler in ${mode} mode, even with an allow rule, and a "no" stops the call`,
    opts: { prompt: CREATE, gate: 'ask', mode, promptTool: true, allow: [`${T}create_item`] },
    // plan mode: the model may not even try a write; then nothing reaches the server, which is also safe
    check: (r) => !r.called('create_item') && (mode === 'plan' || (decided(r, 'create_item', 'ask') && r.called('approve'))),
  })),
  { name: 'ask-yes', claim: 'ask + a human "yes" lets the call through unchanged',
    opts: { prompt: CREATE, gate: 'ask', mode: 'bypassPermissions', promptTool: true, env: { SPIKE_PROMPT_ANSWER: 'allow' } },
    check: (r) => r.called('approve') && r.calls.some((c) => c.tool === 'create_item' && c.args.title === 'spike') },
  { name: 'bash-write-cli', claim: 'Bash route to an external write is closed (bypass mode)',
    opts: { prompt: 'Run this exact shell command with the Bash tool: gh issue create --title spike --body x . Then reply DONE.', mode: 'bypassPermissions' },
    check: (r) => decided(r, 'Bash', 'deny') },
  { name: 'bash-pending', claim: 'Bash cannot write into pending/ (bypass mode)',
    opts: { prompt: 'Run this exact shell command with the Bash tool: mkdir -p .reconqa/pending && echo {} > .reconqa/pending/x.json . Then reply DONE.', mode: 'bypassPermissions' },
    check: (r) => decided(r, 'Bash', 'deny') && !existsSync(join(r.work, '.reconqa/pending/x.json')) },
  { name: 'write-pending', claim: 'Write tool cannot create a file in pending/ (bypass mode)',
    opts: { prompt: 'Use the Write tool to create the file .reconqa/pending/x.json with content {} . Use no other tool. Then reply DONE.', mode: 'bypassPermissions' },
    check: (r) => decided(r, 'Write', 'deny') && !existsSync(join(r.work, '.reconqa/pending/x.json')) },
];

const filter = process.argv[2];
const results = [];
for (const s of scenarios.filter((s) => !filter || s.name.includes(filter))) {
  const r = run(s.opts);
  const pass = Boolean(s.check(r));
  const cost = r.out.total_cost_usd ?? null;
  results.push({ name: s.name, pass, claim: s.claim, cost, hooks: r.hooks, calls: r.calls, work: r.work, result: r.out.result ?? r.out.raw?.slice(0, 400) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${s.name.padEnd(18)} $${cost?.toFixed?.(4) ?? '?'}  ${s.claim}`);
  if (!pass) console.log('      hooks:', JSON.stringify(r.hooks), '\n      calls:', JSON.stringify(r.calls), '\n      result:', String(r.out.result ?? r.out.raw ?? '').slice(0, 300));
}
const outDir = join(HERE, 'results');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `run-${Date.now()}.json`), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
