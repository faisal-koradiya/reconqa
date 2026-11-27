import { test } from 'node:test';
import assert from 'node:assert/strict';
import { score } from '../scripts/score-recall.mjs';

const golden = '| G1 | x | "Please log in." |\n| G2 | x | "Passwords do not match" |\n| G3 | behaviour only |\n| G4 | n/a item |\nnot a row\n';
test('quoted strings auto-score, normalised; manual marks win; n/a excluded', () => {
  const r = score(golden, 'Shows: please   log in.\n', { G3: 'found', G4: 'n/a' });
  assert.deepEqual(r.items.map((i) => i.status), ['found', 'missed', 'found', 'n/a']);
  assert.equal(r.recall, 2 / 3);
  assert.equal(r.manual, 0);
});
test('rows without quotes and no mark stay unmarked', () => {
  assert.equal(score('| G9 | something |', '').manual, 1);
});

test('absence checks pass only when the text is absent', () => {
  const g = '| G1 | Absence check: no "Forgot password" link |';
  assert.equal(score(g, 'Sign in page').items[0].status, 'found');
  assert.equal(score(g, 'link: Forgot password').items[0].status, 'missed');
});
