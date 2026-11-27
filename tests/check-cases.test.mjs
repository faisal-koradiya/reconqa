import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCases, parseCases } from '../plugins/reconqa/scripts/check-cases.mjs';

const config = {
  cases: { required_fields: ['title', 'preconditions', 'steps', 'expected', 'priority'], id_pattern: 'TC-{area}-{n:03}',
    priority_scale: ['P1', 'P2'], max_steps: 2, max_expected: 2, step_numbers_in_expected: false },
  words: { banned: [{ word: 'target user', use: 'test user' }] },
  rules: [{ id: 'no-click-here', scope: ['write-cases'], text: 'No "click here".', check: { field: 'steps', must_not_match: 'click here', ignore_case: true } },
    { id: 'other-skill', scope: ['draft-bug'], text: 'ignored', check: { field: 'any', must_match: 'zzz' } }],
};
const good = `### TC-REG-001 Valid sign-up
**Priority:** P1 · **Area:** REG
**Preconditions:** Page open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Register». | The page should open. |

## Mismatches / questions
### not a case
`;
test('clean case passes; mismatch section ignored', () => {
  assert.equal(parseCases(good).length, 1);
  assert.deepEqual(checkCases(good, config).problems, []);
});
test('each rule is reported with its name', () => {
  const bad = `### TC-1 Bad
**Priority:** High
| 1 | Click here as the target user. | Shows. Then more. And more. |
| 2 | x | As in step 1, it should work. |
| 3 | y | z |
### TC-1 Dup
`;
  const rules = checkCases(bad, config).problems.map((p) => p.rule).sort();
  assert.deepEqual([...new Set(rules)], ['id_pattern', 'max_expected', 'max_steps', 'no-click-here', 'priority_scale', 'required_fields', 'step_numbers_in_expected', 'words.banned']);
});
