// F1: knowledge base format and checks (check-kb, kb.mjs, gate rule for qa/kb).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, appendFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, compile } from '../plugins/reconqa/scripts/lib/kit.mjs';
import { kbContext, checkKb, parseRefs, quotes, resolveRef, stamp, search, loadFeature, coverage, parseIndex, factHash } from '../plugins/reconqa/scripts/lib/kb.mjs';
import { parseCsv, csvRecords } from '../plugins/reconqa/scripts/lib/csv.mjs';
import { run } from '../plugins/reconqa/scripts/kb.mjs';
import { decide } from '../plugins/reconqa/hooks/lib/gate-core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE = join(ROOT, 'examples/juice-shop');
function copy() {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-kb-'));
  cpSync(EXAMPLE, dir, { recursive: true, filter: (s) => !/[\\/](auth|shots)([\\/]|$)/.test(s) });
  return dir;
}
const ctxOf = (dir) => kbContext(dir, load(dir).config);
const errs = (dir) => checkKb(ctxOf(dir)).problems.filter((p) => p.level === 'error').map((p) => p.message).join('\n');
const KB = 'qa/kb/registration';
const edit = (dir, f, fn) => writeFileSync(join(dir, f), fn(readFileSync(join(dir, f), 'utf8')));

test('the Juice Shop example KB passes every check', () => {
  const r = checkKb(ctxOf(EXAMPLE));
  assert.deepEqual(r.problems, []);
  assert.equal(r.features.length, 1);
});

test('source references and quotes are parsed', () => {
  const refs = parseRefs('- x [src: atlas:login-and-registration#R6 @0123abcd; ticket:t.md#AC4] y [src: bug:b.md]');
  assert.deepEqual(refs.map((r) => [r.kind, r.path, r.anchor, r.hash]), [['atlas', 'login-and-registration', 'R6', '0123abcd'], ['ticket', 't.md', 'AC4', null], ['bug', 'b.md', null, null]]);
  assert.ok(parseRefs('[src: nonsense]')[0].bad);
  assert.deepEqual(quotes('Shows “Email must be unique” and «Register» [src: a:"ignored"]').map((q) => q.text), ['Email must be unique', 'Register']);
});

test('anchors resolve: atlas IDs, acceptance criteria, headings, line ranges, CSV rows and IDs', () => {
  const ctx = ctxOf(EXAMPLE);
  const r = (raw) => resolveRef(parseRefs(`[src: ${raw}]`)[0], ctx);
  assert.match(r('atlas:login-and-registration#M12').text, /Email must be unique/);
  assert.match(r('atlas:login-and-registration#R6').text, /^- R6 Password length/);
  assert.match(r('ticket:tickets/new-customer-registration.md#AC8').text, /This email is already registered/);
  assert.match(r('atlas:login-and-registration#User Registration').text, /Security Question/);
  assert.equal(r('ticket:tickets/new-customer-registration.md#L1').text, '# Story: New customers can create an account');
  assert.match(r('case:new-customer-registration.csv#row 1').text, /TC-REG-001/);
  assert.match(r('case:new-customer-registration.csv#TC-REG-001').text, /Not yet a customer\?/);
  assert.match(r('case:new-customer-registration.md#TC-REG-010').text, /TC-REG-010/);
  assert.match(r('atlas:login-and-registration#M99').problem, /not found/);
  assert.match(r('ticket:tickets/new-customer-registration.md#AC42').problem, /criterion 42 not found/);
  assert.match(r('ticket:nope.md').problem, /file not found/);
  assert.match(r('bug:../../etc/passwd').problem, /inside the project/);
  assert.match(r('wiki:x').problem, /unknown source kind/);
  // Open questions in the atlas ground nothing.
  assert.match(r('atlas:login-and-registration#mixed-case').problem ?? '', /not found/);
});

test('quoted facts must appear word for word in the cited source; quotes need a source', () => {
  const dir = copy();
  appendFileSync(join(dir, KB, 'overview.md'), '\n## Rules\n- Duplicates show "This email is taken." [src: atlas:login-and-registration#M12]\n- The button says "Sign up".\n- Unsourced rule.\n');
  const e = errs(dir);
  assert.match(e, /"This email is taken\." is not found word for word/);
  assert.match(e, /quoted text needs a source/);
  assert.match(e, /every item under "rules" needs a source/);
});

test('index and folders must agree; listed files must exist', () => {
  const dir = copy();
  mkdirSync(join(dir, 'qa/kb/orphan'));
  edit(dir, 'qa/kb/index.md', (t) => t + '| Checkout | checkout | basket | — | tickets/none.md | 26-11-2026 |\n');
  const e = errs(dir);
  assert.match(e, /orphan.*|folder is not in index\.md/);
  assert.match(e, /folder checkout\/ does not exist/);
  assert.match(e, /atlas page "basket" not found/);
  assert.match(e, /ticket "tickets\/none\.md" not found/);
  assert.match(e, /must be a date/);
});

test('no secrets or real email addresses in the KB; test addresses are fine', () => {
  const dir = copy();
  appendFileSync(join(dir, KB, 'overview.md'), '\nAsk jane.doe@company.com about it.\nUse token ghp_abcdefghijklmnopqrstuvwxyz0123.\nreconqa-1@example.test is fine.\n');
  const e = errs(dir);
  assert.match(e, /not test data \(j…@company\.com\)/);
  assert.match(e, /looks like a secret/);
  assert.doesNotMatch(e, /example\.test/);
});

test('decisions: required fields, intent only (no «UI text»), atlas facts by ID with a fingerprint', () => {
  const dir = copy();
  appendFileSync(join(dir, KB, 'decisions.md'), '\n## D3 Button wording\n- Question: What should the button say? [src: atlas:login-and-registration]\n- Decision: The button says «Create account».\n- Date: yesterday\n\n## D4 Counter\n- Question: Counter limit? [src: atlas:login-and-registration#R6]\n- Decision: Fix it.\n- Who: QA lead\n- Date: 2026-11-26\n');
  const e = errs(dir);
  assert.match(e, /D3 needs a "- Who:" line/);
  assert.match(e, /D3: date must look like/);
  assert.match(e, /decisions settle intent, not UI text/);
  assert.match(e, /cite the atlas fact by its ID/);
  assert.match(e, /D4: .*no fingerprint \(run: kb\.mjs stamp registration\)/);
  // stamp adds the fingerprint, and only where missing
  const ctx = ctxOf(dir);
  const s = stamp(readFileSync(join(dir, KB, 'decisions.md'), 'utf8'), ctx);
  assert.equal(s.added, 1);
  assert.equal(stamp(s.text, ctx).added, 0);
});

test('a decision goes stale when the atlas fact it cites changes', () => {
  const dir = copy();
  assert.equal(checkKb(ctxOf(dir)).problems.length, 0);
  edit(dir, 'qa/atlas/login-and-registration.md', (t) => t.replace('Successful registration redirects to #/login and shows M13', 'Successful registration logs the user in and opens the product list'));
  const p = checkKb(ctxOf(dir)).problems;
  const stale = p.find((x) => /D1 is STALE/.test(x.message));
  assert.ok(stale, JSON.stringify(p));
  assert.equal(stale.level, 'warn');
  // Marked stale by the team: no more warning.
  edit(dir, `${KB}/decisions.md`, (t) => t.replace('- Status: active', '- Status: stale'));
  assert.ok(!checkKb(ctxOf(dir)).problems.some((x) => /D1 is STALE/.test(x.message)));
});

test('known issues need a status and a bug file or link', () => {
  const dir = copy();
  appendFileSync(join(dir, KB, 'known-issues.md'), '\n## K2 Something\n- Seen: 2026-11-26\n');
  const e = errs(dir);
  assert.match(e, /K2 needs "- Status: open"/);
  assert.match(e, /K2 needs a bug file/);
});

test('token cap: decisions + known issues over kb.token_cap fail', () => {
  const dir = copy();
  edit(dir, '.reconqa/kit.yml', (t) => t + '\nkb:\n  token_cap: 500\n');
  compile(dir);
  appendFileSync(join(dir, KB, 'known-issues.md'), '\n<!-- ' + 'padding '.repeat(300) + '-->\n');
  assert.match(errs(dir), /over the cap of 500/);
  const l = loadFeature('registration', ctxOf(dir));
  assert.ok(l.over);
  assert.match(l.text, /D1 No automatic login/);
  assert.doesNotMatch(l.text, /# Customer registration: overview/);
  assert.match(loadFeature('registration', ctxOf(dir), { all: true }).text, /overview/);
});

test('coverage.md is generated, and hand edits or stale coverage are caught', () => {
  const dir = copy();
  const ctx = ctxOf(dir);
  const row = parseIndex(readFileSync(join(dir, 'qa/kb/index.md'), 'utf8')).rows[0];
  const text = coverage(row, ctx);
  assert.match(text, /\| M12 \| Email must be unique \| TC-REG-013, TC-REG-102, C\d+ \|/);
  // Same text on two screens counts for the screen the case is about: the ReconQA registration
  // case covers M4 (Registration) but not M1 (Login); the old login case covers M1.
  assert.match(text, /\| M1 \| Please provide an email address\. \| C\d+ \|/);
  assert.match(text, /\| M4 \| Please provide an email address\. \| TC-REG-004(, C\d+)* \|/);
  edit(dir, `${KB}/coverage.md`, (t) => t.replace('**not covered**', 'TC-REG-999'));
  assert.match(errs(dir), /out of date or edited by hand/);
  assert.equal(run(['coverage', 'registration', '--project', dir], { out: () => {}, err: () => {} }), 0);
  assert.equal(errs(dir), '');
});

test('kb.mjs: init, new-feature, search, load', () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-kb-new-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa/kit.yml'), 'version: 1\n');
  const lines = [];
  const io = { out: (s) => lines.push(s), err: (s) => lines.push(s) };
  assert.equal(run(['new-feature', 'checkout', 'Checkout', '--project', dir], io), 0);
  assert.equal(run(['new-feature', 'Bad Name', 'X', '--project', dir], io), 2);
  assert.equal(run(['new-feature', 'checkout', 'Again', '--project', dir], io), 1);
  const ctx = ctxOf(dir);
  assert.deepEqual(checkKb(ctx).problems, []);
  assert.match(readFileSync(join(dir, 'qa/kb/checkout/decisions.md'), 'utf8'), /^# Checkout: decisions/);
  const hits = search(['automatic', 'login'], ctxOf(EXAMPLE));
  assert.equal(hits[0].feature, 'registration');
  assert.match(hits.map((h) => h.text).join('\n'), /D1 No automatic login/);
  assert.equal(search(['zzzz-nothing'], ctxOf(EXAMPLE)).length, 0);
  rmSync(dir, { recursive: true });
});

test('no KB folder yet: nothing to check', () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-kb-none-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa/kit.yml'), 'version: 1\n');
  assert.equal(checkKb(ctxOf(dir)).missing, true);
});

test('gate asks before any model write to the KB, including through the shell', () => {
  const dir = copy();
  compile(dir);
  const d = (tool_name, tool_input) => decide({ tool_name, tool_input }, { projectDir: dir });
  assert.equal(d('Write', { file_path: join(dir, 'qa/kb/registration/decisions.md') }).decision, 'ask');
  assert.match(d('Edit', { file_path: 'C:\\p\\qa\\kb\\index.md' }).reason, /knowledge base/);
  assert.equal(d('Bash', { command: "sed -i 's/a/b/' qa/kb/registration/overview.md" }).decision, 'ask');
  assert.equal(d('Bash', { command: 'echo x >> qa/kb/index.md' }).decision, 'ask');
  assert.equal(d('Bash', { command: 'cat qa/kb/index.md' }).decision, 'none');
  assert.equal(d('Write', { file_path: join(dir, 'qa/kbx/notes.md') }).decision, 'none');
  assert.equal(d('Write', { file_path: join(dir, 'qa/cases/x.md') }).decision, 'none');
  // A custom output.kb is honoured.
  edit(dir, '.reconqa/kit.yml', (t) => t + '\noutput:\n  kb: docs/knowledge\n');
  compile(dir);
  assert.equal(d('Write', { file_path: join(dir, 'docs/knowledge/a.md') }).decision, 'ask');
});

test('CSV reader: quotes, doubled quotes, newlines in fields, CRLF, BOM', () => {
  const rows = parseCsv('\uFEFFid,text\r\n"A1","say ""hi""\nthere"\r\nA2,plain\n');
  assert.deepEqual(rows.map((r) => [...r]), [['id', 'text'], ['A1', 'say "hi"\nthere'], ['A2', 'plain']]);
  assert.equal(rows[2].line, 4);
  assert.deepEqual(csvRecords('ID, Title\n1,x\n').records[0].values, { id: '1', title: 'x' });
  assert.throws(() => parseCsv('a,"b\n'), /unclosed quote/);
});

test('fact fingerprints ignore spacing and quote style only', () => {
  assert.equal(factHash('a  “b”'), factHash('a "b"'));
  assert.notEqual(factHash('a b'), factHash('a c'));
});
