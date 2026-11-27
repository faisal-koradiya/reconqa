import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkGrounding, quotedStrings } from '../plugins/reconqa/scripts/check-grounding.mjs';

const atlas = '| M1 | Please provide an email address. |\nButton "Log in"\n';
test('grounded strings pass, guessed ones are listed with line numbers', () => {
  const cases = '| 1 | Click "Log in" | "Please provide an email address." shows |\n| 2 | x | "Login successful!" shows |';
  const r = checkGrounding(cases, [atlas], 'double-quotes');
  assert.equal(r.checked, 3);
  assert.deepEqual(r.missing.map((m) => [m.text, m.line]), [['Login successful!', 2]]);
});
test('mismatch section and HTML comments are ignored; CSV double quotes handled', () => {
  const cases = '<!-- "template text" -->\nClick ""Log in""\n## Mismatches / questions\n| Ticket says "Welcome aboard" |';
  assert.deepEqual(quotedStrings(cases, 'double-quotes').map((s) => s.text), ['Log in']);
});
test('quote style and spacing are normalised', () => {
  assert.equal(checkGrounding('See “Please  provide an email address.”', [atlas], 'double-quotes').missing.length, 0);
});

test('default markup is guillemets; ticket quotes are not checked', () => {
  const r = checkGrounding('Click «Log in»; ticket said "Sign in now"', [atlas]);
  assert.equal(r.checked, 1); assert.equal(r.missing.length, 0);
});

test('case-sensitive; open questions and notes in the atlas do not ground', () => {
  const at = '## Screens\nButton "Sign In"\n## Open questions\n- Is there a "Forgot password" link?\n## Notes\nmaybe «Reset»';
  assert.equal(checkGrounding('Click «Sign In»', [at]).missing.length, 0);
  assert.equal(checkGrounding('Click «Sign in»', [at]).missing.length, 1);
  assert.equal(checkGrounding('Click «Forgot password»', [at]).missing.length, 1);
  assert.equal(checkGrounding('Click «Reset»', [at]).missing.length, 1);
});
