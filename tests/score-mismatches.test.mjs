import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreMismatches } from '../scripts/score-mismatches.mjs';

const labels = `| AC | Ticket | App | Label |
|---|---|---|---|
| 1 | a | a | match |
| 2 | b | c | **mismatch** |
| 3 | d | e | **mismatch** (missing in app) |
| — | x | y | **atlas-only finding** |
`;
test('true, false and missed flags; unconfirmed and other kinds ignored', () => {
  const cases = `### TC-1 x
## Mismatches / questions
| # | Ticket says | App | Kind | Q |
|---|---|---|---|---|
| 1 | AC2: b | c | mismatch | ? |
| 2 | AC1: a | a | mismatch | ? |
| 3 | AC3: d | e | missing in app (unconfirmed) | ? |
| 4 | AC3: d | e | missing in ticket | ? |
`;
  const r = scoreMismatches(labels, cases);
  assert.deepEqual([r.tp, r.fp, r.fn], [[2], [1], [3]]);
  assert.equal(r.precision, 0.5);
  assert.equal(r.recall, 0.5);
});
test('AC mentions before the Mismatches heading do not count', () => {
  assert.deepEqual(scoreMismatches(labels, '| 1 | AC2 | mismatch |\n').tp, []);
});

test('"criterion N" wording and likely-defect rows that cite a criterion count', () => {
  const cases = '## Mismatches\n| 1 | criterion 2: b | c | likely defect (severity: low) | ? |\n| 2 | Nothing | x | likely defect | ? |\n';
  assert.deepEqual(scoreMismatches(labels, cases).tp, [2]);
});
