#!/usr/bin/env node
// PreToolUse hook: ReconQA write gate. Fails closed: any error or a timeout exits 2 (= block),
// and hooks.json adds "|| exit 2" in case the script can't start. Outside a ReconQA project it
// exits 0 before loading anything that could fail, so other projects are never blocked.
const TIMEOUT_MS = 4000; // below the 10 s timeout in hooks.json
const fail = (why) => { process.stderr.write(`ReconQA gate blocked this call (fail closed): ${why}\n`); process.exit(2); };
setTimeout(() => fail('the gate took too long'), TIMEOUT_MS);
process.on('uncaughtException', (e) => fail(e.message));
process.on('unhandledRejection', (e) => fail(String(e?.message ?? e)));

// Read stdin asynchronously so the timer can fire if input stalls.
let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw); } catch { fail('hook input was not valid JSON'); }

const { findProject } = await import('./lib/find-project.mjs');
if (!findProject([process.env.CLAUDE_PROJECT_DIR, input?.cwd])) process.exit(0);

const { decide } = await import('./lib/gate-core.mjs');
const r = decide(input, { projectDir: process.env.CLAUDE_PROJECT_DIR });
if (r.decision !== 'none') {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: {
    hookEventName: 'PreToolUse', permissionDecision: r.decision, permissionDecisionReason: r.reason } }));
}
process.exit(0);
