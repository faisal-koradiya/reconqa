#!/usr/bin/env node
// Spike gate hook (PreToolUse). Not the real ReconQA gate: it only proves what
// the hook API can do. Behaviour for the fake "create_item" tool is picked by
// $SPIKE_GATE: observe | deny | ask | rewrite | crash.
// Fixed rules, whatever the mode:
//   - delete_item is always denied
//   - Write/Edit/MultiEdit/NotebookEdit into a pending/ folder is denied
//   - Bash that touches pending/ or calls a write-capable CLI/HTTP verb is denied
import { appendFileSync, readFileSync } from 'node:fs';

const LOG = process.env.SPIKE_LOG;
const record = (entry) => { if (LOG) appendFileSync(LOG, JSON.stringify({ t: Date.now(), kind: 'hook', ...entry }) + '\n'); };

const input = JSON.parse(readFileSync(0, 'utf8'));
const { tool_name: tool = '', tool_input: args = {}, permission_mode: mode } = input;
const gate = process.env.SPIKE_GATE || 'observe';
record({ tool, mode, gate });

const decide = (permissionDecision, reason, extra = {}) => {
  record({ tool, decision: permissionDecision });
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason: reason, ...extra },
  }));
  process.exit(0);
};

const PENDING = /(^|[\\/])pending([\\/]|$)/;
const WRITE_CLI = /\b(gh\s+(issue|pr|api)\b|curl\b[^|]*(-X\s*(POST|PUT|PATCH|DELETE)|--data|-d\s)|wget\b[^|]*--post)/i;

if (/delete_item$/.test(tool)) decide('deny', 'Deletes are never allowed.');

if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
  const target = args.file_path || args.notebook_path || '';
  if (PENDING.test(target)) decide('deny', 'Only the approval flow may write to pending/.');
  process.exit(0);
}

if (tool === 'Bash') {
  const cmd = String(args.command || '');
  if (PENDING.test(cmd)) decide('deny', 'Shell access to pending/ is blocked.');
  if (WRITE_CLI.test(cmd)) decide('deny', 'External writes must go through the gated MCP tool.');
  process.exit(0);
}

if (/create_item$/.test(tool)) {
  switch (gate) {
    case 'deny': decide('deny', 'Spike: unapproved write.');
    case 'ask': decide('ask', 'Spike: needs a human yes.');
    case 'rewrite':
      decide('allow', 'Spike: payload replaced.', { updatedInput: { ...args, title: `[gated] ${args.title ?? ''}` } });
    case 'crash': throw new Error('spike crash');
    default: process.exit(0);
  }
}
process.exit(0);
