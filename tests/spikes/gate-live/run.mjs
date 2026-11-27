#!/usr/bin/env node
// Live check of the REAL ReconQA write gate (plugins/reconqa/hooks) in headless claude -p, against a
// fake GitHub-shaped MCP server. Judged only from the fake server's log.
//   node tests/spikes/gate-live/run.mjs        (Haiku, ~$0.005 per scenario; manual, not CI)
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '../../../plugins/reconqa/scripts/lib/kit.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const FAKE = join(ROOT, 'tests/spikes/hooks/fake-mcp.mjs');
const T = 'mcp__github__';
const KIT = `version: 1
capabilities:
  tracker:
    tool: github-issues
    server_prefix: ${T}
    repo: demo-owner/demo-repo
tracker_policy:
  filing: file-after-approval
`;
const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), 'gate-live-'));
mkdirSync(join(work, '.reconqa'));
writeFileSync(join(work, '.reconqa/kit.yml'), KIT);
compile(work);
const log = join(work, 'server.log');
writeFileSync(log, '');

const ALLOW_ALL = JSON.stringify({ hooks: { PreToolUse: [{ matcher: '.*', hooks: [{ type: 'command', command: `echo ran >> other-hook.marker; echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"other hook"}}'` }] }] } });
function run(prompt, { mode = 'manual', answer = 'deny', otherHook = false } = {}) {
  const mcp = { mcpServers: { github: { command: 'node', args: [FAKE], env: { SPIKE_LOG: log, SPIKE_TOOLSET: 'github', SPIKE_PROMPT_ANSWER: answer } } } };
  const before = readFileSync(log, 'utf8').split('\n').filter(Boolean).length;
  const r = spawnSync('claude', ['-p', prompt, '--model', 'haiku', '--plugin-dir', join(ROOT, 'plugins/reconqa'),
    '--setting-sources', 'project', '--mcp-config', JSON.stringify(mcp), '--permission-mode', mode,
    '--permission-prompt-tool', `${T}approve`, '--allowedTools', `${T}create_issue`, `${T}delete_issue`,
    '--max-budget-usd', '0.2', '--output-format', 'json', ...(otherHook ? ['--settings', ALLOW_ALL] : [])], { cwd: work, encoding: 'utf8', timeout: 180_000 });
  let out = {}; try { out = JSON.parse(r.stdout); } catch { out = { raw: r.stdout + r.stderr }; }
  const calls = readFileSync(log, 'utf8').split('\n').filter(Boolean).slice(before).map((l) => JSON.parse(l));
  return { calls, cost: out.total_cost_usd, called: (n) => calls.some((c) => c.tool === n), result: String(out.result ?? out.raw ?? '').slice(0, 200) };
}
const CREATE = `Call ${T}create_issue exactly once with owner "demo-owner", repo "demo-repo", title "Gate check", body "x". No other tool. If refused, reply DONE.`;
const scenarios = [
  ['ask, human says no → not filed (bypassPermissions)', () => run(CREATE, { mode: 'bypassPermissions' }), (r) => r.called('approve') && !r.called('create_issue')],
  ['ask, human says yes → filed once', () => run(CREATE, { answer: 'allow' }), (r) => r.called('approve') && r.called('create_issue')],
  ['same payload again → denied without asking', () => run(CREATE, { answer: 'allow', mode: 'bypassPermissions' }), (r) => !r.called('approve') && !r.called('create_issue')],
  ['delete → denied (bypassPermissions)', () => run(`Call ${T}delete_issue once with owner "demo-owner", repo "demo-repo", issue_number 1. No other tool. If refused, reply DONE.`, { mode: 'bypassPermissions', answer: 'allow' }), (r) => !r.called('delete_issue')],
  ['another hook says allow: delete still denied', () => run(`Call ${T}delete_issue once with owner "demo-owner", repo "demo-repo", issue_number 2. No other tool. If refused, reply DONE.`, { otherHook: true, answer: 'allow' }), (r) => !r.called('delete_issue')],
  ['another hook says allow: write still asked', () => run(CREATE.replace('Gate check', 'Gate check 2'), { otherHook: true, answer: 'deny', mode: 'bypassPermissions' }), (r) => r.called('approve') && !r.called('create_issue')],
  ['other repo → denied', () => run(CREATE.replace('demo-repo', 'other-repo'), { answer: 'allow' }), (r) => !r.called('create_issue')],
];
let failed = 0;
for (const [name, go, ok] of scenarios) {
  const r = go(); const pass = ok(r); if (!pass) failed++;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  $${r.cost?.toFixed?.(4) ?? '?'}${pass ? '' : `\n      calls: ${JSON.stringify(r.calls)}\n      result: ${r.result}`}`);
}
console.log(`other hook ran: ${existsSync(join(work, 'other-hook.marker'))}`);
console.log(`used.jsonl exists: ${existsSync(join(work, '.reconqa/pending/used.jsonl'))}`);
console.log(`${scenarios.length - failed}/${scenarios.length} passed`);
process.exit(failed ? 1 : 0);
