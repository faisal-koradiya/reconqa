// Deterministic part of the hook spike: the gate script, the fail-closed
// wrapper and the fake MCP server, without calling a model.
// The live part (headless claude -p) is tests/spikes/hooks/run.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'spikes/hooks');
const PLUGIN = join(DIR, 'plugin');
const GATE = join(PLUGIN, 'hooks/gate.mjs');
const MCP = 'mcp__plugin_hookspike_tracker__';

function gate(tool_name, tool_input, env = {}) {
  const r = spawnSync(process.execPath, [GATE], {
    input: JSON.stringify({ tool_name, tool_input, permission_mode: 'bypassPermissions' }),
    encoding: 'utf8', env: { ...process.env, SPIKE_LOG: '', ...env },
  });
  const out = r.stdout ? JSON.parse(r.stdout).hookSpecificOutput : null;
  return { code: r.status, decision: out?.permissionDecision ?? 'none', out };
}

test('create_item follows SPIKE_GATE', () => {
  assert.equal(gate(`${MCP}create_item`, { title: 'a' }).decision, 'none');
  assert.equal(gate(`${MCP}create_item`, { title: 'a' }, { SPIKE_GATE: 'deny' }).decision, 'deny');
  assert.equal(gate(`${MCP}create_item`, { title: 'a' }, { SPIKE_GATE: 'ask' }).decision, 'ask');
  const rw = gate(`${MCP}create_item`, { title: 'a' }, { SPIKE_GATE: 'rewrite' });
  assert.equal(rw.decision, 'allow');
  assert.deepEqual(rw.out.updatedInput, { title: '[gated] a' });
});

test('delete is always denied', () => {
  assert.equal(gate(`${MCP}delete_item`, { id: '1' }).decision, 'deny');
});

test('pending/ is closed to file tools and Bash', () => {
  assert.equal(gate('Write', { file_path: '/p/.reconqa/pending/x.json' }).decision, 'deny');
  assert.equal(gate('Edit', { file_path: 'C:\\p\\.reconqa\\pending\\x.json' }).decision, 'deny');
  assert.equal(gate('Write', { file_path: '/p/.reconqa/atlas/x.md' }).decision, 'none');
  assert.equal(gate('Bash', { command: 'echo {} > .reconqa/pending/x.json' }).decision, 'deny');
});

test('Bash write CLIs are denied, reads are not', () => {
  for (const command of ['gh issue create --title x', 'gh api repos/o/r/issues -f title=x',
    'curl -X POST http://h/x', 'curl -d a=1 http://h/x', 'curl --data @f http://h']) {
    assert.equal(gate('Bash', { command }).decision, 'deny', command);
  }
  for (const command of ['ls', 'curl -s http://127.0.0.1:3000/', 'git status']) {
    assert.equal(gate('Bash', { command }).decision, 'none', command);
  }
});

test('crash: wrapper turns it into a block (exit 2), without it the error is non-blocking', () => {
  const hooks = JSON.parse(readFileSync(join(PLUGIN, 'hooks/hooks.json'), 'utf8'));
  const cmd = hooks.hooks.PreToolUse[0].hooks[0].command;
  const sh = (env) => spawnSync('bash', ['-c', cmd], {
    input: JSON.stringify({ tool_name: `${MCP}create_item`, tool_input: {} }),
    encoding: 'utf8', env: { ...process.env, CLAUDE_PLUGIN_ROOT: PLUGIN, SPIKE_LOG: '', SPIKE_GATE: 'crash', ...env },
  });
  assert.equal(sh({}).status, 2);
  assert.equal(sh({ SPIKE_NOWRAP: '1' }).status, 1);
  // Bad JSON on stdin is a crash too, so it must also block.
  const bad = spawnSync('bash', ['-c', cmd], { input: 'not json', encoding: 'utf8',
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: PLUGIN, SPIKE_LOG: '' } });
  assert.equal(bad.status, 2);
});

test('fake MCP server speaks enough JSON-RPC', () => {
  const lines = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'create_item', arguments: { title: 't' } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'nope', arguments: {} } },
  ].map((l) => JSON.stringify(l)).join('\n') + '\n';
  const r = spawnSync(process.execPath, [join(DIR, 'fake-mcp.mjs')], { input: lines, encoding: 'utf8', env: { ...process.env, SPIKE_LOG: '' } });
  const res = r.stdout.trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(res.length, 4);
  assert.equal(res[1].result.tools.length, 4);
  assert.match(res[2].result.content[0].text, /created item/);
  assert.equal(res[3].error.code, -32602);
});
