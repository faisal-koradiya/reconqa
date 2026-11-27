// F4: pre-UI cases (‹expected: text [src: …]›), their checks and the gate rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { load, compile } from '../plugins/reconqa/scripts/lib/kit.mjs';
import { kbContext, expectations, checkPreUi, isPreUi } from '../plugins/reconqa/scripts/lib/kb.mjs';
import { quotedStrings } from '../plugins/reconqa/scripts/check-grounding.mjs';
import { decide } from '../plugins/reconqa/hooks/lib/gate-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE = join(ROOT, 'examples/juice-shop');
function copy() {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-pre-'));
  cpSync(EXAMPLE, dir, { recursive: true, filter: (s) => !/[\\/](auth|shots)([\\/]|$)/.test(s) });
  compile(dir);
  return dir;
}
const ctxOf = (dir) => kbContext(dir, load(dir).config);
const T = 'tickets/registration-spec.md';
const CASES = (body) => `# Test cases: Registration (pre-UI)\n\nTicket: ${T} · Atlas: none yet (pre-UI, written 2026-11-26)\n\n${body}`;
const GOOD = CASES(`### TC-REG-201 Wrong email format
**Priority:** P1 · **Area:** REG · **Source:** ${T} AC3
**Preconditions:** Registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter abc in the email field and leave it. | The message ‹expected: Email address is not valid. [src: ticket:${T}#AC3]› should be shown. |
| 2 | Leave the repeat field empty. | ‹expected: "Please repeat your password." [src: ticket:${T}#AC6]› should be shown. |
`);

test('expectations are parsed with their text and source', () => {
  const e = expectations(GOOD);
  assert.equal(e.length, 2);
  assert.equal(e[0].text, 'Email address is not valid.');
  assert.equal(e[1].text, 'Please repeat your password.');
  assert.equal(e[0].src, `ticket:${T}#AC3`);
  assert.ok(isPreUi(GOOD));
});

test('a correct pre-UI file passes; every text must be word for word in a ticket, manual or import source', () => {
  const dir = copy();
  assert.deepEqual(checkPreUi(GOOD, ctxOf(dir)).problems, []);
  const bad = CASES([
    `| 1 | x | ‹expected: Email address is invalid. [src: ticket:${T}#AC3]› |`,
    '| 2 | x | ‹expected: Something›  |',
    `| 3 | x | ‹expected: Keep 5 [src: atlas:login-and-registration#R6]› |`,
    `| 4 | x | ‹expected: Hello [src: ticket:${T}#AC99]› |`,
    `| 5 | x | «Register» should be enabled. |`,
    `| 6 | x | ‹expected: Open [src: ticket:${T}#AC1] |`,
  ].join('\n'));
  const msgs = checkPreUi(bad, ctxOf(dir)).problems.map((p) => `${p.line}: ${p.message}`).join('\n');
  assert.match(msgs, /"Email address is invalid\." is not word for word in the cited source/);
  assert.match(msgs, /needs a source/);
  assert.match(msgs, /can only come from ticket, manual, import, similar \(not atlas\)/);
  assert.match(msgs, /criterion 99 not found/);
  assert.match(msgs, /may not mark text with «»/);
  assert.match(msgs, /unbalanced/);
});

test('«» in the mismatch section of a pre-UI file and in reconciled files is not refused here', () => {
  const dir = copy();
  assert.deepEqual(checkPreUi(GOOD + '\n## Mismatches / questions\n| 1 | «x» |\n', ctxOf(dir)).problems, []);
  const reconciled = GOOD.replace('Atlas: none yet (pre-UI, written 2026-11-26)', 'Atlas: qa/atlas/login-and-registration.md (reconciled 2026-11-27)') + '| 3 | y | «Register» |\n';
  assert.deepEqual(checkPreUi(reconciled, ctxOf(dir)).problems, []);
});

test('the grounding check ignores ‹expected› text', () => {
  const s = quotedStrings('| 1 | «Email» | ‹expected: «Create account» [src: ticket:t.md#AC1]› |');
  assert.deepEqual(s.map((x) => x.text), ['Email']);
});

test('check-cases runs the pre-UI checks and counts open expectations', () => {
  const dir = copy();
  const f = join(dir, 'qa/cases/spec.md');
  writeFileSync(f, GOOD);
  const r = spawnSync(process.execPath, [join(ROOT, 'plugins/reconqa/scripts/check-cases.mjs'), '--project', dir, f], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /2 expected text\(s\) written before the screen existed/);
  writeFileSync(f, GOOD.replace('Email address is not valid. [src', 'Email address is wrong. [src'));
  const r2 = spawnSync(process.execPath, [join(ROOT, 'plugins/reconqa/scripts/check-cases.mjs'), '--project', dir, f], { encoding: 'utf8' });
  assert.equal(r2.status, 1);
  assert.match(r2.stdout, /\[pre-ui\]/);
});

test('gate asks when «» is added to a pre-UI cases file, not for other edits', () => {
  const dir = copy();
  const f = join(dir, 'qa/cases/spec.md');
  writeFileSync(f, GOOD);
  const d = (tool_name, tool_input) => decide({ tool_name, tool_input }, { projectDir: dir });
  assert.equal(d('Edit', { file_path: f, old_string: '‹expected: Email address is not valid. [src: ticket:tickets/registration-spec.md#AC3]›', new_string: '«Email address is not valid.»' }).decision, 'ask');
  assert.equal(d('Edit', { file_path: f, old_string: 'Enter abc', new_string: 'Type abc' }).decision, 'none');
  assert.equal(d('MultiEdit', { file_path: f, edits: [{ old_string: 'a', new_string: '«b»' }] }).decision, 'ask');
  assert.equal(d('Write', { file_path: f, content: GOOD + '| 9 | «Register» |\n' }).decision, 'ask');
  assert.equal(d('Write', { file_path: join(dir, 'qa/cases/new.md'), content: GOOD.replace('| 1 |', '| 1 | «Register» |') }).decision, 'ask');
  assert.equal(d('Write', { file_path: join(dir, 'qa/cases/new.md'), content: GOOD }).decision, 'none');
  // Normal (atlas-based) cases files are not affected.
  const normal = join(dir, 'qa/cases/new-customer-registration.md');
  assert.equal(d('Edit', { file_path: normal, old_string: 'x', new_string: '«Register»' }).decision, 'none');
  assert.equal(d('Bash', { command: "sed -i 's/‹expected: X›/«X»/' qa/cases/spec.md" }).decision, 'ask');
});

test('learn from similar features: borrowed text must be word for word in the similar atlas row', () => {
  const dir = copy();
  const ok = CASES(`| 1 | Leave the repeat field empty. | ‹expected: Please repeat your password. [src: similar:login-and-registration#M6]› should be shown. |\n`);
  assert.deepEqual(checkPreUi(ok, ctxOf(dir)).problems, []);
  const wrong = CASES(`| 1 | Leave it empty. | ‹expected: Please enter your old password. [src: similar:login-and-registration#M6]› |\n`);
  assert.match(checkPreUi(wrong, ctxOf(dir)).problems.map((p) => p.message).join('\n'), /not word for word/);
  const outside = CASES(`| 1 | x | ‹expected: Please repeat your password. [src: similar:../tickets/registration-spec#M6]› |\n`);
  assert.ok(checkPreUi(outside, ctxOf(dir)).problems.length > 0, 'similar sources must be atlas pages');
});

test('kb similar ranks atlas pages by shared fields; numbers and table ids are not fields', async () => {
  const { similar, atlasFields } = await import('../plugins/reconqa/scripts/lib/kb.mjs');
  const dir = copy();
  const fields = atlasFields(readFileSync(join(dir, 'qa/atlas/login-and-registration.md'), 'utf8'));
  assert.ok(fields.includes('Password') && fields.includes('Repeat Password'), fields.join(','));
  assert.ok(!fields.some((f) => /^(M?\d+)$/.test(f)), fields.join(','));
  const r = similar('As a customer I want to change my password. Fields: Current Password, New Password, Repeat Password.', ctxOf(dir));
  assert.equal(r[0].page, 'login-and-registration');
  assert.ok(r[0].fields.includes('Repeat Password'));
  assert.deepEqual(similar('Export the monthly invoice as PDF', ctxOf(dir)), []);
  assert.deepEqual(similar('change my password, Repeat Password', ctxOf(dir), { exclude: ['login-and-registration'] }), []);
});
