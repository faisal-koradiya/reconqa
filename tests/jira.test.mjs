// Jira tracker adapter: the gate matches writes to capabilities.tracker.project (project key or issue key).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compile, load } from '../plugins/reconqa/scripts/lib/kit.mjs';
import { decide } from '../plugins/reconqa/hooks/lib/gate-core.mjs';

function project(extra = '') {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-jira-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), `version: 1\ncapabilities:\n  tracker:\n    tool: jira\n    project: QA\n    site: abc\ntracker_policy:\n  filing: file-after-approval\n${extra}`);
  assert.deepEqual(load(dir).errors, []);
  compile(dir);
  return dir;
}
const d = (dir, op, args = {}) => decide({ tool_name: `mcp__atlassian__${op}`, tool_input: { cloudId: 'abc', ...args } }, { projectDir: dir });

test('jira: create and comment in the configured project are asked with the payload', () => {
  const dir = project();
  const c = d(dir, 'createJiraIssue', { projectKey: 'QA', issueTypeName: 'Bug', summary: 'Repeat password error missing', description: 'Steps…' });
  assert.equal(c.decision, 'ask');
  assert.match(c.reason, /createJiraIssue on QA · .*summary: Repeat password error missing/);
  assert.doesNotMatch(c.reason, /cloudId/);
  assert.equal(d(dir, 'addCommentToJiraIssue', { issueIdOrKey: 'QA-12', commentBody: 'Seen again on 2.3' }).decision, 'ask');
});

test('jira: other projects, odd keys and missing targets are denied', () => {
  const dir = project();
  assert.match(d(dir, 'createJiraIssue', { projectKey: 'PROD', summary: 'x' }).reason, /only allowed to QA; this call targets PROD/);
  assert.equal(d(dir, 'editJiraIssue', { issueIdOrKey: 'PROD-1', fields: {} }).decision, 'deny');
  assert.equal(d(dir, 'editJiraIssue', { issueIdOrKey: '10023', fields: {} }).decision, 'deny', 'numeric ids cannot be checked against the project');
  assert.equal(d(dir, 'createJiraIssue', { projectKey: 'QA', issueIdOrKey: 'PROD-2', summary: 'x' }).decision, 'deny', 'mixed targets');
  assert.equal(d(dir, 'createJiraIssue', { summary: 'x' }).decision, 'deny');
});

test('jira: transitions, worklogs, links, generic execute tools and unknown tools are denied; reads pass', () => {
  const dir = project();
  for (const op of ['transitionJiraIssue', 'addWorklogToJiraIssue', 'createIssueLink', 'executeWrite', 'executeDestructive', 'createConfluencePage']) {
    assert.equal(d(dir, op, { issueIdOrKey: 'QA-1' }).decision, 'deny', op);
  }
  assert.notEqual(d(dir, 'getJiraIssue', { issueIdOrKey: 'QA-1' }).decision, 'deny');
  assert.notEqual(d(dir, 'searchJiraIssuesUsingJql', { jql: 'project = QA' }).decision, 'deny');
});

test('jira: assigning people stays off by default; draft-only blocks filing; secrets are refused', () => {
  const dir = project();
  assert.match(d(dir, 'createJiraIssue', { projectKey: 'QA', summary: 'x', assignee_account_id: '5b10' }).reason, /assigning people is off/);
  assert.match(d(dir, 'createJiraIssue', { projectKey: 'QA', summary: 'token ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }).reason ?? '', /not sending|token/i);
  const dir2 = mkdtempSync(join(tmpdir(), 'reconqa-jira-'));
  mkdirSync(join(dir2, '.reconqa'));
  writeFileSync(join(dir2, '.reconqa', 'kit.yml'), 'version: 1\ncapabilities:\n  tracker:\n    tool: jira\n    project: QA\n    site: abc\n');
  compile(dir2);
  assert.match(d(dir2, 'createJiraIssue', { projectKey: 'QA', summary: 'x' }).reason, /draft-only/);
});

test('jira: project key format is validated', () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-jira-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\ncapabilities:\n  tracker:\n    tool: jira\n    project: "qa project"\n');
  assert.ok(load(dir).errors.length > 0);
});

test('jira: the site is pinned too; the same project key on another site is denied; other Atlassian installs are denied', () => {
  const dir = project();
  assert.equal(d(dir, 'createJiraIssue', { projectKey: 'QA', summary: 'x' }).decision, 'ask');
  const other = decide({ tool_name: 'mcp__atlassian__createJiraIssue', tool_input: { cloudId: 'other-site', projectKey: 'QA', summary: 'x' } }, { projectDir: dir });
  assert.match(other.reason, /only allowed to QA; this call targets QA on site other-site/);
  const otherInstall = decide({ tool_name: 'mcp__claude_ai_Atlassian__createJiraIssue', tool_input: { cloudId: 'abc', projectKey: 'OTHER', summary: 'x' } }, { projectDir: dir });
  assert.equal(otherInstall.decision, 'deny');
  const noSite = mkdtempSync(join(tmpdir(), 'reconqa-jira-'));
  mkdirSync(join(noSite, '.reconqa'));
  writeFileSync(join(noSite, '.reconqa', 'kit.yml'), 'version: 1\ncapabilities:\n  tracker:\n    tool: jira\n    project: QA\ntracker_policy:\n  filing: file-after-approval\n');
  compile(noSite);
  assert.match(d(noSite, 'createJiraIssue', { projectKey: 'QA', summary: 'x' }).reason, /tracker.project and capabilities.tracker.site is not set|not set/);
});
