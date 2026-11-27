import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, compile, readCompiled } from '../plugins/reconqa/scripts/lib/kit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function project(files) {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-'));
  mkdirSync(join(dir, '.reconqa'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, '.reconqa', name), body);
  return dir;
}

test('example Juice Shop kit is valid and merges with defaults', () => {
  const r = load(join(ROOT, 'examples', 'juice-shop'));
  assert.deepEqual(r.errors, []);
  assert.equal(r.config.app.url, 'http://localhost:3000');
  assert.deepEqual(r.config.cases.priority_scale, ['P1', 'P2', 'P3']); // list replaced
  assert.equal(r.config.cases.format, 'steps-table'); // default kept
  assert.equal(r.config.tracker_policy.assignee, 'never');
});

test('layers: personal overrides team overrides defaults', () => {
  const dir = project({ 'kit.yml': 'version: 1\ncases:\n  format: gherkin\n  max_steps: 6\n', 'kit.local.yml': 'cases:\n  max_steps: 10\n' });
  const r = load(dir);
  assert.deepEqual(r.errors, []);
  assert.equal(r.config.cases.format, 'gherkin');
  assert.equal(r.config.cases.max_steps, 10);
  assert.equal(r.config.cases.max_expected, 4);
});

test('errors point to the right file and line', () => {
  const dir = project({
    'kit.yml': 'version: 1\ncases:\n  fromat: gherkin\n',
    'kit.local.yml': 'tracker_policy:\n  assignee: sometimes\n',
  });
  const r = load(dir);
  assert.equal(r.config, null);
  const byMsg = Object.fromEntries(r.errors.map((e) => [e.message.split(' ')[0] + e.message.split(' ')[1], e]));
  const typo = r.errors.find((e) => /unknown key "fromat"/.test(e.message));
  assert.match(typo.message, /did you mean "format"/);
  assert.ok(typo.file.endsWith('kit.yml') && typo.line === 3);
  const enumErr = r.errors.find((e) => /assignee must be one of/.test(e.message));
  assert.ok(enumErr.file.endsWith('kit.local.yml') && enumErr.line === 2);
  assert.ok(byMsg);
});

test('secret-looking values are refused', () => {
  const dir = project({ 'kit.yml': 'version: 1\nwords:\n  glossary:\n    token: ghp_abcdefghijklmnopqrstuvwxyz0123456789\n' });
  const r = load(dir);
  assert.ok(r.errors.some((e) => /looks like a secret/.test(e.message) && e.line === 4));
});

test('approval cannot be switched off', () => {
  const r = load(project({ 'kit.yml': 'version: 1\nguardrails:\n  require_approval: false\n' }));
  assert.ok(r.errors.some((e) => /require_approval must be one of: true/.test(e.message)));
});

test('missing team kit is reported', () => {
  const r = load(project({}));
  assert.ok(r.errors.some((e) => /no \.reconqa\/kit\.yml/.test(e.message)));
});

test('YAML errors are reported with file and line', () => {
  const r = load(project({ 'kit.yml': 'version: 1\ncases:\n\tformat: x\n' }));
  assert.equal(r.errors.length, 1);
  assert.equal(r.errors[0].line, 3);
  assert.match(r.errors[0].message, /tabs/);
});

test('compiled config goes stale after a hand edit, and after adding a personal layer', () => {
  const dir = project({ 'kit.yml': 'version: 1\n' });
  const c = compile(dir);
  assert.deepEqual(c.errors, []);
  assert.ok(existsSync(c.written));
  const data = JSON.parse(readFileSync(c.written, 'utf8'));
  assert.equal(data.config.tracker_policy.assignee, 'never');
  assert.equal(readCompiled(dir).ok, true);

  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\ncases:\n  format: gherkin\n');
  const stale = readCompiled(dir);
  assert.equal(stale.ok, false);
  assert.match(stale.reason, /changed since it was compiled/);

  compile(dir);
  assert.equal(readCompiled(dir).ok, true);
  writeFileSync(join(dir, '.reconqa', 'kit.local.yml'), 'cases:\n  max_steps: 5\n');
  assert.equal(readCompiled(dir).ok, false);
});

test('missing compiled file is refused, not ignored', () => {
  const r = readCompiled(project({ 'kit.yml': 'version: 1\n' }));
  assert.equal(r.ok, false);
  assert.match(r.reason, /not compiled/);
});

test('test_data: safe defaults, example opts in, bad values rejected', () => {
  const def = load(project({ 'kit.yml': 'version: 1\n' }));
  assert.deepEqual(def.errors, []);
  assert.equal(def.config.app.test_data.allow_create, false);
  assert.equal(def.config.app.test_data.prefix, 'reconqa');
  assert.equal(load(join(ROOT, 'examples', 'juice-shop')).config.app.test_data.allow_create, true);
  const bad = load(project({ 'kit.yml': 'version: 1\napp:\n  test_data:\n    prefix: "Bad Prefix!"\n  environments:\n    - name: x\n      kind: prod\n' }));
  assert.equal(bad.errors.length, 2, JSON.stringify(bad.errors));
});
