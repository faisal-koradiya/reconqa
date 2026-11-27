#!/usr/bin/env node
// PostToolUse hook: after a gated tracker write ran, record its fingerprint so the same payload
// can't be sent twice. Only this hook writes .reconqa/pending/used.jsonl (the gate denies the model).
// On failure it exits 2 so Claude sees the message: the duplicate guard is then NOT active for this write.
const fail = (why) => { process.stderr.write(`ReconQA: could not record this write (${why}); the duplicate guard does not know about it.\n`); process.exit(2); };
setTimeout(() => fail('timed out'), 4000);
process.on('uncaughtException', (e) => fail(e.message));
let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;
let input;
try { input = JSON.parse(raw); } catch { fail('bad input'); }
const { findProject } = await import('./lib/find-project.mjs');
if (!findProject([process.env.CLAUDE_PROJECT_DIR, input?.cwd])) process.exit(0);
const { appendFileSync, mkdirSync } = await import('node:fs');
const { join, dirname } = await import('node:path');
const { decide, USED_FILE } = await import('./lib/gate-core.mjs');
const r = decide(input, { projectDir: process.env.CLAUDE_PROJECT_DIR });
if (r.decision === 'ask' && r.fingerprint) {
  const f = join(r.project, USED_FILE);
  mkdirSync(dirname(f), { recursive: true });
  appendFileSync(f, JSON.stringify({ at: new Date().toISOString(), op: r.op, fingerprint: r.fingerprint }) + '\n');
}
process.exit(0);
