#!/usr/bin/env node
// Tiny stdio MCP server for the hook spike. No dependencies.
// Every tool call is appended to $SPIKE_LOG (JSON lines) so a test can see
// what really reached the "external tool" after the hooks ran.
//
// Tools:
//   create_item  - stands in for an external write (e.g. "file an issue")
//   delete_item  - stands in for a destructive write
//   read_item    - harmless read
//   approve      - used as --permission-prompt-tool; records that a prompt
//                  happened and answers with $SPIKE_PROMPT_ANSWER (deny|allow)
import { appendFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const LOG = process.env.SPIKE_LOG;
const record = (entry) => { if (LOG) appendFileSync(LOG, JSON.stringify({ t: Date.now(), ...entry }) + '\n'); };

const obj = (props, required = []) => ({ type: 'object', properties: props, required });
const GITHUB = process.env.SPIKE_TOOLSET === 'github';
const repoProps = { owner: { type: 'string' }, repo: { type: 'string' } };
const TOOLS = GITHUB ? [
  { name: 'create_issue', description: 'Create a GitHub issue.', inputSchema: obj({ ...repoProps, title: { type: 'string' }, body: { type: 'string' }, assignees: { type: 'array', items: { type: 'string' } } }, ['owner', 'repo', 'title']) },
  { name: 'get_issue', description: 'Get a GitHub issue.', inputSchema: obj({ ...repoProps, issue_number: { type: 'number' } }, ['owner', 'repo', 'issue_number']) },
  { name: 'delete_issue', description: 'Delete a GitHub issue.', inputSchema: obj({ ...repoProps, issue_number: { type: 'number' } }, ['owner', 'repo', 'issue_number']) },
  { name: 'approve', description: 'Permission prompt handler (spike only).', inputSchema: obj({ tool_name: { type: 'string' }, input: { type: 'object' } }) },
] : [
  { name: 'create_item', description: 'Create an item in the external tracker.', inputSchema: obj({ title: { type: 'string' }, body: { type: 'string' } }, ['title']) },
  { name: 'delete_item', description: 'Delete an item from the external tracker.', inputSchema: obj({ id: { type: 'string' } }, ['id']) },
  { name: 'read_item', description: 'Read an item from the external tracker.', inputSchema: obj({ id: { type: 'string' } }, ['id']) },
  { name: 'approve', description: 'Permission prompt handler (spike only).', inputSchema: obj({ tool_name: { type: 'string' }, input: { type: 'object' } }) },
];

const send = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...msg }) + '\n');
const text = (s) => ({ content: [{ type: 'text', text: s }] });

function callTool(name, args) {
  record({ tool: name, args });
  switch (name) {
    case 'create_item': return text(`created item ITEM-1 titled "${args.title}"`);
    case 'delete_item': return text(`deleted ${args.id}`);
    case 'read_item': return text(`item ${args.id}: sample item`);
    case 'create_issue': return text(`created issue #1 "${args.title}" in ${args.owner}/${args.repo}`);
    case 'get_issue': return text(`issue #${args.issue_number}: sample`);
    case 'delete_issue': return text(`deleted #${args.issue_number}`);
    case 'approve': {
      const allow = process.env.SPIKE_PROMPT_ANSWER === 'allow';
      const answer = allow
        ? { behavior: 'allow', updatedInput: args.input ?? {} }
        : { behavior: 'deny', message: 'denied by spike prompt handler' };
      return text(JSON.stringify(answer));
    }
    default: return null;
  }
}

createInterface({ input: process.stdin }).on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  if (id === undefined) return; // notification
  if (method === 'initialize') {
    send({ id, result: { protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'spike-tracker', version: '0.0.0' } } });
  } else if (method === 'tools/list') {
    send({ id, result: { tools: TOOLS } });
  } else if (method === 'tools/call') {
    const result = callTool(params?.name, params?.arguments ?? {});
    if (result) send({ id, result });
    else send({ id, error: { code: -32602, message: `unknown tool ${params?.name}` } });
  } else if (method === 'ping') {
    send({ id, result: {} });
  } else {
    send({ id, error: { code: -32601, message: `method not found: ${method}` } });
  }
});
