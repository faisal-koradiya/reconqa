// F5: reconcile pre-UI cases with the atlas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plan, checkPlan, apply, screenTexts } from '../plugins/reconqa/scripts/lib/reconcile.mjs';
import { run } from '../plugins/reconqa/scripts/reconcile.mjs';
import { checkGrounding } from '../plugins/reconqa/scripts/check-grounding.mjs';
import { scoreReconcile } from '../scripts/score-reconcile.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE = join(ROOT, 'examples/juice-shop');
const ATLAS = join(EXAMPLE, 'qa/atlas');
const KEY = JSON.parse(readFileSync(join(ROOT, 'evals/reconcile/planted.json'), 'utf8'));
const PRE = readFileSync(join(EXAMPLE, 'qa/cases/registration-spec.md'), 'utf8');
const quiet = { out: () => {}, err: () => {} };
function copy() {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-rec-'));
  cpSync(EXAMPLE, dir, { recursive: true, filter: (s) => !/[\\/](auth|shots)([\\/]|$)/.test(s) });
  return dir;
}

test('screen texts: messages, field names, screens and quoted labels from observed atlas parts only', () => {
  const t = screenTexts(ATLAS, ['login-and-registration']).filter((x) => x.text).map((x) => x.text);
  for (const s of ['Email must be unique', 'Repeat Password', 'Show password advice', 'Register', 'User Registration']) assert.ok(t.includes(s), s);
  assert.throws(() => screenTexts(ATLAS, ['nope']), /atlas page not found/);
});

test('plan: exact and normalised matches are confirmed with the atlas text; nothing planted is confirmed', () => {
  const p = plan(PRE, ATLAS, ['login-and-registration']);
  assert.equal(p.items.length, 26);
  const by = (t) => p.items.find((i) => i.text === t);
  assert.equal(by('Passwords do not match').how, 'exact');
  assert.deepEqual([by('Security question').how, by('Security question').atlas_text], ['normalised', 'Security Question']);
  assert.equal(by('Please provide a password').atlas_text, 'Please provide a password.');
  assert.equal(by('Registration successful. Please log in.').atlas_text, 'Registration completed successfully. You can now log in.');
  const s = scoreReconcile(p, KEY);
  assert.deepEqual(s.wrongly_confirmed, []);
  assert.equal(s.sorted_pct, 100);
});

test('review: may move different <-> not_found with an exact atlas text; may never confirm', () => {
  const p = plan(PRE, ATLAS, ['login-and-registration']);
  const ca = p.items.filter((i) => i.text === 'Create account');
  for (const i of ca) i.review = { group: 'different', atlas_text: 'Register', note: 'Which label is wanted?' };
  assert.deepEqual(checkPlan(p, ATLAS), []);
  ca[0].review.atlas_text = 'Sign up';
  assert.match(checkPlan(p, ATLAS).join('\n'), /"Sign up" is not in the atlas/);
  ca[0].review = { group: 'confirmed' };
  assert.match(checkPlan(p, ATLAS).join('\n'), /can only set group to different or not_found/);
  const conf = p.items.find((i) => i.group === 'confirmed');
  conf.review = { group: 'not_found' };
  assert.match(checkPlan(p, ATLAS).join('\n'), /confirmed items come from the script/);
});

test('apply: converts only confirmed items, respects skips, updates the header, cases stay grounded', () => {
  const p = plan(PRE, ATLAS, ['login-and-registration']);
  const skip = [p.items.find((i) => i.group === 'confirmed').n];
  const r = apply(PRE, p, { skip, atlasPaths: ['qa/atlas/login-and-registration.md'], date: '2026-11-27', casesPath: 'qa/cases/registration-spec.md' });
  assert.equal(r.applied, p.counts.confirmed - 1);
  assert.match(r.text, /Atlas: qa\/atlas\/login-and-registration\.md \(reconciled 2026-11-27; \d+ expected texts still open\)/);
  assert.doesNotMatch(r.text, /Atlas: none yet/);
  assert.match(r.text, /«Security Question»/);
  assert.match(r.text, /‹expected: Create account/);
  const g = checkGrounding(r.text, [readFileSync(join(ATLAS, 'login-and-registration.md'), 'utf8')]);
  assert.deepEqual(g.missing, []);
  assert.match(r.report, /## Different on the screen/);
  assert.match(r.report, /## Skipped by the user/);
});

test('reconcile.mjs: plan -> check-plan -> apply writes the cases and the report; dry run writes nothing', () => {
  const dir = copy();
  assert.equal(run(['plan', 'qa/cases/registration-spec.md', '--atlas', 'login-and-registration', '--project', dir], quiet), 0);
  const planFile = join(dir, '.reconqa/work/reconcile-registration-spec.json');
  assert.equal(run(['check-plan', planFile, '--project', dir], quiet), 0);
  const before = readFileSync(join(dir, 'qa/cases/registration-spec.md'), 'utf8');
  assert.equal(run(['apply', planFile, '--dry-run', '--project', dir], quiet), 0);
  assert.equal(readFileSync(join(dir, 'qa/cases/registration-spec.md'), 'utf8'), before);
  assert.equal(run(['apply', planFile, '--project', dir], quiet), 0);
  assert.ok(existsSync(join(dir, 'qa/reports/reconcile-registration-spec.md')));
  assert.match(readFileSync(join(dir, 'qa/cases/registration-spec.md'), 'utf8'), /reconciled/);
  // A bad review blocks apply.
  const p = JSON.parse(readFileSync(planFile, 'utf8'));
  p.items[0].review = { group: 'confirmed' };
  writeFileSync(planFile, JSON.stringify(p));
  assert.equal(run(['apply', planFile, '--project', dir], quiet), 1);
  assert.equal(run(['plan', 'qa/cases/new-customer-registration.md', '--atlas', 'login-and-registration', '--project', dir], quiet), 0);
});

test('scorer: a perfect review scores every item correct', () => {
  const p = plan(PRE, ATLAS, ['login-and-registration']);
  for (const i of p.items) {
    const d = KEY.different.find((x) => x.text === i.text);
    if (d) i.review = { group: 'different', atlas_text: d.atlas_text };
    if (KEY.not_found.some((x) => x.text === i.text)) i.review = { group: 'not_found' };
  }
  const s = scoreReconcile(p, KEY);
  assert.equal(s.correct, s.checked, JSON.stringify(s.wrong));
  assert.equal(s.planted_changes_in_different, s.planted_changes);
});

test('the committed live-run plan scores every item correct and passes check-plan', () => {
  const p = JSON.parse(readFileSync(join(ROOT, 'evals/reconcile/runs/plan-run1.json'), 'utf8'));
  assert.deepEqual(checkPlan(p, ATLAS), []);
  const s = scoreReconcile(p, KEY);
  assert.equal(s.correct, s.checked);
  assert.deepEqual(s.wrongly_confirmed, []);
});

test('screen texts in «angle quotes» in the atlas are found too (button labels), and borrowed items are counted', () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-rec-'));
  writeFileSync(join(dir, 'pw.md'), '# Change password (atlas)\n## Screens\n### Change Password — #/x\nButtons and links:\n- «Change» (disabled until valid)\n## Messages\n| # | Exact text | Screen | Where shown | Trigger |\n|---|---|---|---|---|\n| M1 | Please repeat your password. | Change Password | under Repeat | empty |\n');
  const cases = 'Ticket: t.md · Atlas: none yet\n| 1 | Click ‹expected: Change [src: ticket:t.md#AC1]› | ‹expected: Please repeat your password. [src: similar:login#M6]› |\n';
  const p = plan(cases, dir, ['pw']);
  assert.deepEqual(p.items.map((i) => i.group), ['confirmed', 'confirmed']);
  assert.equal(p.items[0].atlas_text, 'Change');
  const r = apply(cases, p, { atlasPaths: ['qa/atlas/pw.md'], casesPath: 'qa/cases/x.md', date: '2026-11-27' });
  assert.match(r.report, /Borrowed from similar features: 1, of which 1 confirmed/);
});
