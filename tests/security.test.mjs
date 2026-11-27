// Regression tests for the first security review (milestone M0).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { load, compile, readCompiled } from '../plugins/reconqa/scripts/lib/kit.mjs';
import { parse, YamlError } from '../plugins/reconqa/scripts/lib/yaml-lite.mjs';

function project(files) {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-sec-'));
  mkdirSync(join(dir, '.reconqa'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, '.reconqa', name), body);
  return dir;
}
const msgs = (r) => r.errors.map((e) => e.message).join('\n');

test('1. a hand-edited compiled file is refused', () => {
  const dir = project({ 'kit.yml': 'version: 1\n' });
  const { written } = compile(dir);
  assert.equal(readCompiled(dir).ok, true);
  const data = JSON.parse(readFileSync(written, 'utf8'));
  data.config.guardrails.require_approval = false;
  writeFileSync(written, JSON.stringify(data));
  const r = readCompiled(dir);
  assert.equal(r.ok, false);
  assert.match(r.reason, /edited by hand/);
  data.format = 2;
  writeFileSync(written, JSON.stringify(data));
  assert.match(readCompiled(dir).reason, /unknown format/);
});

test('2. __proto__ / constructor / prototype keys are rejected (block and flow)', () => {
  for (const src of ['__proto__:\n  a: 1', 'a:\n  constructor: x', 'a: {prototype: 1}', 'l:\n  - {__proto__: {x: 1}}', '"__proto__": 1']) {
    assert.throws(() => parse(src), (e) => e instanceof YamlError && /is not allowed/.test(e.message), src);
  }
  const r = load(project({ 'kit.yml': 'version: 1\napp:\n  environments:\n    - __proto__:\n        name: prod\n        writes_allowed: true\n' }));
  assert.equal(r.config, null);
  assert.match(msgs(r), /"__proto__" is not allowed/);
});

test('3. the personal layer cannot weaken guardrails', () => {
  const r = load(project({ 'kit.yml': 'version: 1\n', 'kit.local.yml': 'app:\n  deny_actions: [my extra rule]\n' }));
  assert.deepEqual(r.errors, []);
  assert.ok(r.config.app.deny_actions.length > 1, 'defaults kept');
  assert.ok(r.config.app.deny_actions.includes('my extra rule'));
  const wiped = load(project({ 'kit.yml': 'version: 1\n', 'kit.local.yml': 'app:\n  deny_actions: []\n' }));
  assert.ok(wiped.config.app.deny_actions.length >= 5);
  for (const flag of ['deny_deletes', 'deny_shell_tracker_writes', 'require_approval']) {
    const off = load(project({ 'kit.yml': 'version: 1\n', 'kit.local.yml': `guardrails:\n  ${flag}: false\n` }));
    assert.match(msgs(off), new RegExp(`${flag} must be one of: true`));
  }
});

test('4. secrets are found in every layer, in keys, and inside URLs', () => {
  const overridden = load(project({
    'kit.yml': 'version: 1\nwords:\n  glossary:\n    t: ghp_abcdefghijklmnopqrstuvwxyz0123456789\n',
    'kit.local.yml': 'words:\n  glossary:\n    t: fine\n',
  }));
  assert.match(msgs(overridden), /looks like a secret/);
  assert.match(msgs(load(project({ 'kit.yml': 'version: 1\nwords:\n  glossary:\n    ghp_abcdefghijklmnopqrstuvwxyz0123456789: x\n' }))), /key .* looks like a secret/);
  assert.match(msgs(load(project({ 'kit.yml': 'version: 1\napp:\n  url: https://admin:pw@example.com\n' }))), /secret|invalid format/);
  assert.match(msgs(load(project({ 'kit.yml': 'version: 1\nwords:\n  glossary:\n    a: "Bearer abcdefghijklmnop1234"\n' }))), /looks like a secret/);
});

test('5. paths must stay inside the project', () => {
  for (const bad of ['/etc/x', '../../x', 'qa/../../x', 'C:\\\\x', '..']) {
    const r = load(project({ 'kit.yml': `version: 1\noutput:\n  atlas: "${bad}"\n` }));
    assert.match(msgs(r), /output\.atlas has an invalid format/, bad);
  }
  assert.deepEqual(load(project({ 'kit.yml': 'version: 1\noutput:\n  atlas: docs/qa-atlas\n' })).errors, []);
  assert.match(msgs(load(project({ 'kit.yml': 'version: 1\napp:\n  auth:\n    browser_state: ../state.json\n' }))), /browser_state has an invalid format/);
});

test('7. deep nesting and bad escapes give a clear error, not a crash', () => {
  assert.throws(() => parse('a: ' + '['.repeat(20000)), (e) => e instanceof YamlError && /nesting/.test(e.message));
  const deep = Array.from({ length: 200 }, (_, i) => ' '.repeat(i * 2) + 'k:').join('\n') + ' 1';
  assert.throws(() => parse(deep), (e) => e instanceof YamlError && /nesting/.test(e.message));
  assert.throws(() => parse('a: "\\uZZZZ"'), (e) => e instanceof YamlError && /\\u escape/.test(e.message));
});

test('8. rule regexes must compile and must not have nested repeats', () => {
  const rule = (re) => `version: 1\nrules:\n  - id: r\n    text: t\n    check:\n      field: any\n      must_not_match: "${re}"\n`;
  assert.match(msgs(load(project({ 'kit.yml': rule('([') }))), /not a valid regular expression/);
  assert.match(msgs(load(project({ 'kit.yml': rule('(a+)+$') }))), /nested repeat/);
  assert.match(msgs(load(project({ 'kit.yml': rule('(x*)*') }))), /nested repeat/);
  assert.deepEqual(load(project({ 'kit.yml': rule('\\\\bstep \\\\d+') })).errors, []);
});

test('9. hash and config come from the same read', () => {
  const dir = project({ 'kit.yml': 'version: 1\n' });
  const r = compile(dir);
  const data = JSON.parse(readFileSync(r.written, 'utf8'));
  assert.equal(data.source_hash, r.hash);
});
