import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkRun, caseResult, toCsv } from '../plugins/reconqa/scripts/check-run.mjs';

const CASES = `# Test cases: Demo
### TC-A-001 First
**Priority:** P1 · **Area:** A
| # | Step | Expected |
|---|---|---|
| 1 | Open it. | It opens. |
| 2 | Click «Go». | «Done» should be shown. |

### TC-A-002 Second
**Priority:** P2 · **Area:** A
| # | Step | Expected |
|---|---|---|
| 1 | Enter abc. | «Too short» should be shown. |
| 2 | Enter abcdef. | No error. |

## Mismatches / questions
| # | Ticket says | App shows |
`;

const project = mkdtempSync(join(tmpdir(), 'rq-run-'));
mkdirSync(join(project, 'qa', 'runs', 'shots', 'r'), { recursive: true });
writeFileSync(join(project, 'qa', 'runs', 'shots', 'r', 'TC-A-002-step1.png'), 'x');

const good = `# Test run: Demo

**Cases:** qa/cases/demo.md · **Atlas:** qa/atlas/a.md · **Environment:** local (http://localhost:3000) · **Version:** 1.2.3 · **Date:** 2026-11-26
**Result:** 1 passed · 1 failed · 0 blocked · 0 not run

| Case | Result | Failed or blocked step | Note |
|---|---|---|---|
| TC-A-001 | passed | | |
| TC-A-002 | failed | 1 | No message, see mismatch 1 |

## Test data used
- None

## TC-A-001 First
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | The page opened. |
| 2 | pass | «Done» was shown. |

## TC-A-002 Second
**Result:** failed

| # | Result | Actual |
|---|---|---|
| 1 | fail | No message was shown; expected «Too short». |
| 2 | not run | |

**Evidence:** qa/runs/shots/r/TC-A-002-step1.png
**Next:** /reconqa:draft-bug TC-A-002 step 1
`;

const check = (text) => checkRun(text, { casesText: CASES, projectDir: project }).problems.map((p) => p.msg);

test('a complete, consistent report passes', () => {
  assert.deepEqual(check(good), []);
});

test('case result follows from steps', () => {
  assert.equal(caseResult([{ result: 'pass' }, { result: 'observed' }]), 'passed');
  assert.equal(caseResult([{ result: 'pass' }, { result: 'blocked' }, { result: 'not run' }]), 'blocked');
  assert.equal(caseResult([{ result: 'not run' }]), 'not run');
  assert.equal(caseResult([{ result: 'blocked' }, { result: 'fail' }]), 'failed');
});

test('pass claimed over a failed step is caught', () => {
  const t = good.replace('**Result:** failed', '**Result:** passed');
  assert.ok(check(t).some((m) => /result "passed" but its steps make it "failed"/.test(m)));
});

test('steps after a fail must be not run; ran steps need an Actual', () => {
  assert.ok(check(good.replace('| 2 | not run | |', '| 2 | pass | ok |')).some((m) => /must be "not run"/.test(m)));
  assert.ok(check(good.replace('| 1 | pass | The page opened. |', '| 1 | pass | |')).some((m) => /Actual is empty/.test(m)));
});

test('missing evidence file, missing draft-bug pointer, wrong counts', () => {
  assert.ok(check(good.replace('TC-A-002-step1.png', 'nope.png')).some((m) => /evidence file not found/.test(m)));
  assert.ok(check(good.replace('**Next:** /reconqa:draft-bug TC-A-002 step 1', '')).some((m) => /draft-bug TC-A-002 step 1/.test(m)));
  assert.ok(check(good.replace('1 passed · 1 failed', '2 passed · 0 failed')).some((m) => /Result line says 2 passed/.test(m)));
});

test('step count and unknown cases are checked against the cases file', () => {
  assert.ok(check(good.replace('| 2 | pass | «Done» was shown. |\n', '')).some((m) => /1 step result\(s\), the case has 2/.test(m)));
  assert.ok(check(good.replace(/TC-A-001/g, 'TC-A-009')).some((m) => /not in the cases file/.test(m)));
});

test('summary must agree and explain non-passes', () => {
  assert.ok(check(good.replace('| TC-A-002 | failed | 1 | No message, see mismatch 1 |', '| TC-A-002 | failed | 1 | |')).some((m) => /add a short note/.test(m)));
  assert.ok(check(good.replace('| TC-A-001 | passed | | |\n', '')).some((m) => /missing from the summary/.test(m)));
});

test('CSV has one row per case with the failing step', () => {
  const { results } = checkRun(good, { casesText: CASES, projectDir: project });
  const csv = toCsv(results).trim().split('\n');
  assert.equal(csv.length, 3);
  assert.match(csv[2], /^TC-A-002,Second,failed,1,/);
});

test('observed steps need a note; passwords in test data are flagged', () => {
  const obs = good.replace('| 2 | pass | «Done» was shown. |', '| 2 | observed | Could not tell; the text is always shown. |');
  assert.ok(check(obs).some((m) => /observed step; add a short note/.test(m)));
  const pw = good.replace('- None', '- Account reconqa-x@example.test created, password: Reconqa#2026');
  assert.ok(check(pw).some((m) => /password seems to be written/.test(m)));
});

test('test data: prefixed, unique, from real randomness', async () => {
  const { freshData } = await import('../plugins/reconqa/scripts/test-data.mjs');
  const d = freshData('reconqa', 'example.test', 20);
  assert.equal(new Set(d.emails).size, 20);
  assert.ok(d.emails.every((e) => /^reconqa-[0-9a-f]{8}@example\.test$/.test(e)));
  assert.deepEqual(freshData('qa', 'x.test', 1, () => 'abc').emails, ['qa-abc@x.test']);
});
