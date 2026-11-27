import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBug } from '../plugins/reconqa/scripts/check-bug.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = { bugs: { fields: ['title', 'environment', 'version', 'preconditions', 'steps', 'expected', 'actual', 'evidence', 'severity'],
  severity_scale: ['Critical', 'Major', 'Minor', 'Trivial'], required_evidence: ['steps', 'expected', 'actual', 'screenshot', 'version', 'environment'] },
  tracker_policy: { assignee: 'never' } };
const good = `# Password counter shows /20 while the limit is 40

**Severity:** Minor · **Environment:** local http://localhost:3000 · **Version:** 20.4.0
**Found by:** TC-REG-010 step 2 · **Atlas:** qa/atlas/login-and-registration.md

## Preconditions
Logged out, registration page open.

## Steps
1. Type 12 characters in «Password».

## Expected
Counter shows 12/40 (atlas: hint «Password must be 5-40 characters long.»).

## Actual
Counter shows «12/20».

## Evidence
- Screenshot: qa/bugs/shots/counter.png
- Reproduced: 2 of 2 attempts on 2026-11-26

---
*Drafted with ReconQA; reviewed by a person before filing.*
`;
test('complete draft passes', () => assert.deepEqual(checkBug(good, config), []));
test('missing parts, bad severity, assignee and placeholders are reported', () => {
  const bad = good.replace('Minor', 'Blocker').replace(/## Actual[\s\S]*?## Evidence/, '## Evidence').replace('qa/bugs/shots/counter.png', 'see above')
    .replace('## Steps\n1. Type', '## Steps\nType') + '\nAssignee: someone\n';
  const p = checkBug(bad, config).join('\n');
  for (const s of ['missing or unfilled: actual', 'severity "Blocker"', 'no screenshot', 'numbered list', 'assignee set']) assert.match(p, new RegExp(s));
});
test('the empty template itself fails', () => {
  assert.ok(checkBug(readFileSync(join(ROOT, 'plugins/reconqa/templates/bug.md'), 'utf8'), config).length > 3);
});

test('secrets and real email addresses in a draft are reported', () => {
  assert.match(checkBug(good.replace('Logged out', 'Logged in as jane@realcompany.com'), config).join(), /privacy/);
  assert.match(checkBug(good + '\nBearer abcdefghijklmnopqrstuvwxyz123456\n', config).join(), /privacy/);
});
