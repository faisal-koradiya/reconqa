// ReconQA write gate (plugins/reconqa/hooks): decisions, fail-closed behaviour, duplicate guard.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { compile } from '../plugins/reconqa/scripts/lib/kit.mjs';
import { decide } from '../plugins/reconqa/hooks/lib/gate-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOOKS = join(ROOT, 'plugins/reconqa/hooks');
const KIT = (filing = 'file-after-approval', assignee = 'never') => `version: 1
capabilities:
  tracker:
    tool: github-issues
    server_prefix: mcp__github__
    repo: demo-owner/demo-repo
tracker_policy:
  filing: ${filing}
  assignee: ${assignee}
`;
function project(kit = KIT(), { compiled = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-gate-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), kit);
  if (compiled) compile(dir);
  return dir;
}
const call = (tool_name, tool_input = {}) => ({ tool_name, tool_input });
const create = (extra = {}) => call('mcp__github__create_issue', { owner: 'demo-owner', repo: 'demo-repo', title: 'Login error text wrong', body: 'Steps…', ...extra });
const d = (dir, input) => decide(input, { projectDir: dir }).decision;

test('no opinion outside a ReconQA project', () => {
  const dir = mkdtempSync(join(tmpdir(), 'plain-'));
  assert.equal(d(dir, create()), 'none');
  assert.equal(d(dir, call('Bash', { command: 'gh issue create -t x' })), 'none');
});

test('pending/ is hook-only: file tools and shell are denied', () => {
  const dir = project();
  assert.equal(d(dir, call('Write', { file_path: join(dir, '.reconqa/pending/x.json') })), 'deny');
  assert.equal(d(dir, call('Edit', { file_path: 'C:\\p\\.reconqa\\pending\\used.jsonl' })), 'deny');
  assert.equal(d(dir, call('Bash', { command: 'echo {} >> .reconqa/pending/used.jsonl' })), 'deny');
  assert.equal(d(dir, call('Write', { file_path: join(dir, 'qa/bugs/draft.md') })), 'none');
});

test('shell routes to a tracker are denied; harmless commands pass', () => {
  const dir = project();
  for (const command of ['gh issue create --title x', 'gh issue close 3', 'gh api repos/o/r/issues -f title=x',
    'gh api -X PATCH repos/o/r/issues/1', 'curl -X POST https://api.example.com/x', 'curl --json {} https://h/x',
    'wget --post-data=a=1 https://h', 'Invoke-RestMethod -Uri https://h -Method Post']) {
    assert.equal(d(dir, call('Bash', { command })), 'deny', command);
  }
  for (const command of ['ls -la', 'curl -s http://127.0.0.1:3000/', 'gh issue view 3', 'gh api repos/o/r/issues', 'git status']) {
    assert.equal(d(dir, call('Bash', { command })), 'none', command);
  }
});

test('tracker server: reads pass, deletes and unknown tools are denied, other servers untouched', () => {
  const dir = project();
  assert.equal(d(dir, call('mcp__github__get_issue', { owner: 'demo-owner', repo: 'demo-repo', issue_number: 1 })), 'allow');
  assert.equal(d(dir, call('mcp__github__delete_issue', {})), 'deny');
  assert.equal(d(dir, call('mcp__github__merge_pull_request', {})), 'deny');
  assert.equal(d(dir, call('mcp__playwright__browser_click', {})), 'none');
});

test('writes: asked with the payload shown, only to the configured repo, no assignee, no closing', () => {
  const dir = project();
  const r = decide(create(), { projectDir: dir });
  assert.equal(r.decision, 'ask');
  assert.match(r.reason, /create_issue on demo-owner\/demo-repo.*Login error text wrong/);
  assert.equal(d(dir, create({ repo: 'other-repo' })), 'deny');
  assert.equal(d(dir, create({ assignees: ['someone'] })), 'deny');
  assert.equal(d(dir, create({ assignees: [] })), 'ask');
  assert.equal(d(dir, call('mcp__github__update_issue', { owner: 'demo-owner', repo: 'demo-repo', issue_number: 2, state: 'closed' })), 'deny');
  assert.equal(d(dir, call('mcp__github__issue_write', { method: 'delete', owner: 'demo-owner', repo: 'demo-repo' })), 'deny');
  assert.equal(d(project(KIT('file-after-approval', 'allowed')), create({ assignees: ['someone'] })), 'ask');
});

test('draft-only policy denies every write', () => {
  assert.equal(d(project(KIT('draft-only')), create()), 'deny');
});

test('missing or stale compiled config blocks MCP tools but not other tools', () => {
  const notCompiled = project(KIT(), { compiled: false });
  assert.equal(d(notCompiled, create()), 'deny');
  assert.equal(d(notCompiled, call('mcp__playwright__browser_click')), 'deny');
  assert.equal(d(notCompiled, call('Read', { file_path: 'x' })), 'none');
  const stale = project();
  writeFileSync(join(stale, '.reconqa', 'kit.yml'), KIT() + 'cases:\n  max_steps: 6\n');
  assert.match(decide(create(), { projectDir: stale }).reason, /changed since it was compiled/);
});

function hook(script, dir, input, cmd) {
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, CLAUDE_PLUGIN_ROOT: join(ROOT, 'plugins/reconqa') };
  const stdin = typeof input === 'string' ? input : JSON.stringify(input);
  return cmd
    ? spawnSync('bash', ['-c', cmd], { input: stdin, encoding: 'utf8', env })
    : spawnSync(process.execPath, [join(HOOKS, script)], { input: stdin, encoding: 'utf8', env });
}

test('hook scripts: ask output, then record, then the same payload is denied as a duplicate', () => {
  const dir = project();
  const first = hook('gate.mjs', dir, create());
  assert.equal(first.status, 0);
  assert.equal(JSON.parse(first.stdout).hookSpecificOutput.permissionDecision, 'ask');
  assert.equal(hook('record.mjs', dir, create()).status, 0);
  assert.ok(existsSync(join(dir, '.reconqa/pending/used.jsonl')));
  const again = JSON.parse(hook('gate.mjs', dir, create()).stdout).hookSpecificOutput;
  assert.equal(again.permissionDecision, 'deny');
  assert.match(again.permissionDecisionReason, /already sent/);
  assert.equal(JSON.parse(hook('gate.mjs', dir, create({ body: 'changed' })).stdout).hookSpecificOutput.permissionDecision, 'ask');
  assert.equal(hook('gate.mjs', dir, call('Read', { file_path: 'x' })).stdout, '');
});

test('fails closed: bad input, a broken script, and the timer is shorter than the hook timeout', () => {
  const dir = project();
  assert.equal(hook('gate.mjs', dir, 'not json').status, 2);
  const hooks = JSON.parse(readFileSync(join(HOOKS, 'hooks.json'), 'utf8'));
  const pre = hooks.hooks.PreToolUse[0].hooks[0];
  assert.match(pre.command, /\|\| exit 2$/);
  assert.equal(hook(null, dir, create(), pre.command).status, 0);
  const broken = pre.command.replace('gate.mjs', 'missing-gate.mjs');
  assert.equal(hook(null, dir, create(), broken).status, 2);
  const timer = Number(readFileSync(join(HOOKS, 'gate.mjs'), 'utf8').match(/TIMEOUT_MS = (\d+)/)[1]);
  assert.ok(timer < pre.timeout * 1000, 'in-hook timer must fire before Claude Code gives up on the hook');
});

// --- M3 gate fixes ---
test('tracker-like tools on another server prefix: writes and deletes denied (target cannot be checked) (also with tracker none)', () => {
  const dir = project();
  assert.equal(d(dir, call('mcp__plugin_x_github__create_issue', { owner: 'a', repo: 'b', title: 't' })), 'deny');
  assert.equal(d(dir, call('mcp__claude_ai_GitHub__delete_issue', {})), 'deny');
  const noTracker = project('version: 1\n');
  assert.equal(d(noTracker, call('mcp__github__issue_write', { method: 'create', title: 't' })), 'deny');
  assert.equal(d(noTracker, call('mcp__playwright__browser_click', {})), 'none');
});

test('project found by walking up from a subfolder', () => {
  const dir = project();
  const sub = join(dir, 'qa', 'deep');
  mkdirSync(sub, { recursive: true });
  assert.equal(decide(create(), { projectDir: sub }).decision, 'ask');
  assert.equal(decide({ ...create(), cwd: sub }, {}).decision, 'ask');
});

test('secrets and non-test email addresses are never sent', () => {
  const dir = project();
  assert.equal(d(dir, create({ body: 'token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijkl' })), 'deny');
  assert.equal(d(dir, create({ body: 'seen for jane.doe@realcompany.com' })), 'deny');
  assert.equal(d(dir, create({ body: 'seen for reconqa-ab12@example.test' })), 'ask');
});

test('config edits are asked; reading the config is not', () => {
  const dir = project();
  assert.equal(d(dir, call('Edit', { file_path: join(dir, '.reconqa/kit.yml') })), 'ask');
  assert.equal(d(dir, call('Write', { file_path: join(dir, '.reconqa/kit.local.yml') })), 'ask');
  assert.equal(d(dir, call('Bash', { command: "sed -i 's/draft-only/file-after-approval/' .reconqa/kit.yml" })), 'ask');
  assert.equal(d(dir, call('Bash', { command: 'cat .reconqa/kit.yml' })), 'none');
});

test('reads on another repo are left to normal permissions; more shell write routes denied', () => {
  const dir = project();
  assert.equal(d(dir, call('mcp__github__get_file_contents', { owner: 'someone', repo: 'private', path: 'x' })), 'none');
  for (const command of ['gh repo delete o/r --yes', 'gh label create bug', 'gh release delete v1', 'gh secret set X', 'gh workflow run ci.yml', 'http POST https://h/x a=1']) {
    assert.equal(d(dir, call('Bash', { command })), 'deny', command);
  }
});

test('duplicate guard works across create_issue and issue_write', () => {
  const dir = project();
  const a = decide(create(), { projectDir: dir });
  const b = decide(call('mcp__github__issue_write', { method: 'create', owner: 'demo-owner', repo: 'demo-repo', title: 'Login error text wrong', body: 'Steps…' }), { projectDir: dir });
  assert.equal(a.fingerprint, b.fingerprint);
});

test('in-hook timer fires when stdin stalls', () => {
  const dir = project();
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['-e', `const c=require('child_process').spawn(process.execPath,[${JSON.stringify(join(HOOKS, 'gate.mjs'))}],{stdio:['pipe','inherit','inherit'],env:{...process.env,CLAUDE_PROJECT_DIR:${JSON.stringify(dir)}}});c.on('exit',(code)=>process.exit(code));`], { encoding: 'utf8', timeout: 9000 });
  assert.equal(r.status, 2);
  assert.ok(Date.now() - t0 < 8000);
});

test('hook cost per call stays small (p50 < 400 ms)', () => {
  const dir = project();
  const times = [];
  for (let i = 0; i < 7; i++) { const t = Date.now(); hook('gate.mjs', dir, call('mcp__playwright__browser_click', {})); times.push(Date.now() - t); }
  times.sort((a, b) => a - b);
  assert.ok(times[3] < 400, `p50 ${times[3]} ms`);
});

test('real github-mcp-server v2.1.0 shapes: issue_write create asked, close denied, sub_issue remove denied', () => {
  const dir = project();
  const iw = (x) => call('mcp__github__issue_write', { owner: 'demo-owner', repo: 'demo-repo', ...x });
  assert.equal(d(dir, iw({ method: 'create', title: 'x', body: 'y' })), 'ask');
  assert.equal(d(dir, iw({ method: 'update', issue_number: 3, state: 'closed', state_reason: 'completed' })), 'deny');
  assert.equal(d(dir, call('mcp__github__sub_issue_write', { owner: 'demo-owner', repo: 'demo-repo', method: 'remove', issue_number: 1, sub_issue_id: 2 })), 'deny');
  assert.equal(d(dir, call('mcp__github__issue_read', { owner: 'demo-owner', repo: 'demo-repo', issue_number: 1 })), 'allow');
  assert.equal(d(dir, call('mcp__github__create_repository', { name: 'x' })), 'deny');
});
