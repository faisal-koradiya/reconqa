// F3: inventory, scripted decisions and known issues, citations in cases.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { load } from '../plugins/reconqa/scripts/lib/kit.mjs';
import { kbContext, inventory, featuresFor, addDecision, addIssue, checkKbCitations, checkKb } from '../plugins/reconqa/scripts/lib/kb.mjs';
import { run } from '../plugins/reconqa/scripts/kb.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLE = join(ROOT, 'examples/juice-shop');
function copy() {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-kbb-'));
  cpSync(EXAMPLE, dir, { recursive: true, filter: (s) => !/[\\/](auth|shots)([\\/]|$)/.test(s) });
  return dir;
}
const ctxOf = (dir) => kbContext(dir, load(dir).config);
const io = () => { const lines = []; return { lines, out: (s) => lines.push(s), err: (s) => lines.push(s) }; };

test('inventory lists features, atlas pages, cases, tickets, bugs and sources', () => {
  const inv = inventory(ctxOf(EXAMPLE));
  assert.deepEqual(inv.features.map((f) => f.folder), ['registration']);
  assert.equal(inv.atlas[0].page, 'login-and-registration');
  assert.equal(inv.atlas[0].messages, 13);
  assert.ok(inv.atlas[0].screens.some((s) => s.startsWith('User Registration')));
  assert.ok(inv.cases.some((c) => c.file === 'new-customer-registration.md' && c.ticket === 'tickets/new-customer-registration.md'));
  assert.ok(inv.tickets.includes('tickets/new-customer-registration.md'));
  assert.equal(inv.bugs[0].file, 'qa/bugs/password-counter-shows-20.md');
  assert.ok(inv.sources.includes('old-cases.csv'));
});

test('features-for finds the feature by atlas page or by word', () => {
  const ctx = ctxOf(EXAMPLE);
  assert.equal(featuresFor(ctx, { pages: ['qa/atlas/login-and-registration.md'] })[0].folder, 'registration');
  assert.equal(featuresFor(ctx, { words: ['Registration'] })[0].folder, 'registration');
  assert.equal(featuresFor(ctx, { pages: ['basket'] }).length, 0);
});

test('add-decision: next ID, fingerprinted atlas refs, checks pass; intent only, sources must exist', () => {
  const dir = copy();
  const ctx = ctxOf(dir);
  const ok = addDecision(ctx, 'registration', { title: 'Minimum password length', question: 'Ticket says 8, app accepts 5.',
    decision: 'Keep 5 until the security update.', who: 'Product owner', date: '2026-11-26',
    src: 'ticket:tickets/new-customer-registration.md#AC4; atlas:login-and-registration#R6' });
  assert.equal(ok.id, 'D3');
  assert.match(ok.entry, /#R6 @[0-9a-f]{8}\]/);
  writeFileSync(ok.file, ok.text);
  assert.deepEqual(checkKb(ctx).problems, []);
  assert.match(addDecision(ctx, 'registration', { title: 't', question: 'q', decision: 'Use «Sign up».', who: 'PO', date: '2026-11-26', src: 'atlas:login-and-registration#R6' }).problem, /intent, not UI text/);
  assert.match(addDecision(ctx, 'registration', { title: 't', question: 'q', decision: 'd', who: 'PO', date: '2026-11-26', src: 'atlas:login-and-registration#R99' }).problem, /R99 not found/);
  assert.match(addDecision(ctx, 'registration', { title: 't', question: 'q', decision: 'd', who: 'jane@company.com', date: '2026-11-26', src: 'atlas:login-and-registration#R6' }).problem, /real email/);
  assert.match(addDecision(ctx, 'nope', { title: 't' }).problem, /no feature folder/);
  assert.match(addDecision(ctx, 'registration', { title: 't', question: 'q', decision: 'd', who: 'PO', date: 'today', src: 'atlas:login-and-registration#R6' }).problem, /date/);
});

test('kb.mjs add-decision and add-issue: dry run writes nothing; real run writes and checks pass', () => {
  const dir = copy();
  const file = join(dir, 'qa/kb/registration/decisions.md');
  const before = readFileSync(file, 'utf8');
  const a = io();
  const args = ['add-decision', '--feature', 'registration', '--title', 'Duplicate email message', '--question', 'Ticket wants another text.',
    '--decision', 'Keep the current message; update the ticket.', '--who', 'Product owner', '--src', 'ticket:tickets/new-customer-registration.md#AC8; atlas:login-and-registration#M12', '--project', dir];
  assert.equal(run([...args, '--dry-run'], a), 0);
  assert.match(a.lines.join('\n'), /dry run: D3/);
  assert.equal(readFileSync(file, 'utf8'), before);
  assert.equal(run(args, a), 0);
  assert.match(readFileSync(file, 'utf8'), /## D3 Duplicate email message/);
  writeFileSync(join(dir, 'qa/bugs/other.md'), '# Other bug\n');
  assert.equal(run(['add-issue', '--feature', 'registration', '--title', 'Other', '--bug', 'qa/bugs/other.md', '--project', dir], a), 0);
  assert.equal(run(['add-issue', '--feature', 'registration', '--title', 'Again', '--bug', 'qa/bugs/other.md', '--project', dir], a), 1);
  assert.match(a.lines.join('\n'), /already listed/);
  assert.equal(run(['add-issue', '--feature', 'registration', '--title', 'No source', '--project', dir], a), 1);
  assert.equal(run(['add-issue', '--feature', 'registration', '--title', 'Filed', '--link', 'https://tracker.example.test/1', '--status', 'fixed', '--project', dir], a), 0);
  assert.equal(run(['check', '--project', dir], io()), 0);
});

test('cases may cite decisions and known issues; missing, replaced or stale ones are reported', () => {
  const dir = copy();
  const ctx = ctxOf(dir);
  assert.deepEqual(checkKbCitations('**Source:** AC10 + decision registration/D1 + known issue registration/K1', ctx), []);
  const msgs = (t) => checkKbCitations(t, ctx).map((p) => p.message).join('\n');
  assert.match(msgs('decision registration/D9'), /does not exist/);
  assert.match(msgs('decision checkout/D1'), /no feature "checkout"/);
  assert.match(msgs('decision registration/K1'), /decisions are D<n>/);
  const dec = join(dir, 'qa/kb/registration/decisions.md');
  writeFileSync(dec, readFileSync(dec, 'utf8').replace('- Status: active', '- Status: replaced'));
  assert.match(msgs('decision registration/D1'), /D1 is replaced/);
  // D2 cites R4; change the atlas fact and D2 becomes stale.
  const atlas = join(dir, 'qa/atlas/login-and-registration.md');
  writeFileSync(atlas, readFileSync(atlas, 'utf8').replace('- R4 Registration requires all 5 fields', '- R4 Registration requires all 6 fields'));
  assert.match(msgs('decision registration/D2'), /stale/);
});

test('check-cases reports a decision citation that does not exist', () => {
  const dir = copy();
  const f = join(dir, 'qa/cases/new-customer-registration.md');
  writeFileSync(f, readFileSync(f, 'utf8').replace('**Source:** new-customer-registration.md AC1', '**Source:** new-customer-registration.md AC1 + decision registration/D7'));
  const r = spawnSync(process.execPath, [join(ROOT, 'plugins/reconqa/scripts/check-cases.mjs'), '--project', dir, f], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /\[knowledge-base\] decision registration\/D7 does not exist/);
});
