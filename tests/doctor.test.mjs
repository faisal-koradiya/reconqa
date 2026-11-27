import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { summariseState } from '../plugins/reconqa/scripts/lib/auth-state.mjs';
import { findServers, checkPlaywright, playwrightAddCommand, isGithub } from '../plugins/reconqa/scripts/lib/mcp-config.mjs';
import { doctor, hasAllowRule, render } from '../plugins/reconqa/scripts/doctor.mjs';
import { PLAYWRIGHT_MCP } from '../plugins/reconqa/scripts/lib/versions.mjs';

const APP = 'http://localhost:3000';
const NOW = Date.parse('2026-11-26T00:00:00Z');
const cookie = (domain, expires) => ({ name: 'token', value: 'SECRET-VALUE', domain, path: '/', expires });

test('state: cookies for the app host are counted, values never returned', () => {
  const text = JSON.stringify({ cookies: [cookie('localhost', NOW / 1000 + 3600), cookie('other.test', -1)], origins: [{ origin: APP, localStorage: [{ name: 't', value: 'x' }] }] });
  const s = summariseState('x', APP, { now: NOW, text });
  assert.equal(s.ok, true);
  assert.equal(s.cookies, 1);
  assert.equal(s.storage, 1);
  assert.ok(!JSON.stringify(s).includes('SECRET-VALUE'));
});

test('state: parent-domain cookie matches a subdomain app', () => {
  const s = summariseState('x', 'https://app.example.test', { now: NOW, text: JSON.stringify({ cookies: [cookie('.example.test', -1)], origins: [] }) });
  assert.equal(s.cookies, 1);
});

test('state: expired, empty and broken files are not usable', () => {
  assert.match(summariseState('x', APP, { now: NOW, text: JSON.stringify({ cookies: [cookie('localhost', NOW / 1000 - 10)], origins: [] }) }).problems.join(), /expired/);
  assert.match(summariseState('x', APP, { now: NOW, text: JSON.stringify({ cookies: [], origins: [] }) }).problems.join(), /nothing saved/);
  assert.match(summariseState('x', APP, { now: NOW, text: '{oops' }).problems.join(), /JSON/);
  assert.match(summariseState('/nope/missing.json', APP).problems.join(), /not found/);
});

const config = { app: { url: APP, extra_origins: ['http://localhost:3101'], auth: { browser_state: '.reconqa/auth/state.json' } } };
const server = (args) => ({ name: 'playwright', scope: 'local', args });

test('playwright check: missing origin, missing storage state, other version', () => {
  const r = checkPlaywright(server(['-y', '@playwright/mcp@0.0.70', '--isolated', '--allowed-origins', APP]), config, { stateExists: true });
  assert.match(r.problems.join(), /missing http:\/\/localhost:3101/);
  assert.match(r.problems.join(), /storage-state is missing/);
  assert.match(r.warnings.join(), /tested with/);
});

test('playwright check: the generated command passes its own check', () => {
  const cmd = playwrightAddCommand(config, { stateExists: true });
  assert.ok(cmd.includes(PLAYWRIGHT_MCP));
  assert.ok(cmd.includes('"http://localhost:3000;http://localhost:3101"'));
  const args = cmd.split(' -- npx ')[1].split(' ').map((a) => a.replace(/^"|"$/g, ''));
  const r = checkPlaywright(server(args), config, { stateExists: true });
  assert.deepEqual(r, { problems: [], warnings: [] });
});

function fakeHome(claudeJson, settings) {
  const home = mkdtempSync(join(tmpdir(), 'rq-home-'));
  if (claudeJson) writeFileSync(join(home, '.claude.json'), JSON.stringify(claudeJson));
  if (settings) { mkdirSync(join(home, '.claude')); writeFileSync(join(home, '.claude', 'settings.json'), JSON.stringify(settings)); }
  return home;
}
function fakeProject(kit) {
  const dir = mkdtempSync(join(tmpdir(), 'rq-proj-'));
  mkdirSync(join(dir, '.reconqa'));
  if (kit) writeFileSync(join(dir, '.reconqa', 'kit.yml'), kit);
  return dir;
}

test('servers: project, local and user scopes are found; env values are not read out', () => {
  const dir = fakeProject();
  writeFileSync(join(dir, '.mcp.json'), JSON.stringify({ mcpServers: { pw: { command: 'npx', args: ['@playwright/mcp@0.0.85'] } } }));
  const home = fakeHome({ projects: { [dir]: { mcpServers: { github: { command: 'gh-mcp', env: { TOKEN: 'ghp_secret' } } } } }, mcpServers: { other: { command: 'x' } } });
  const s = findServers(dir, { home });
  assert.deepEqual(s.map((x) => `${x.scope}:${x.name}`), ['project:pw', 'local:github', 'user:other']);
  assert.ok(!JSON.stringify(s).includes('ghp_secret'));
  assert.ok(isGithub(s[1]));
});

test('allow rule is found in user settings', () => {
  const home = fakeHome(null, { permissions: { allow: ['mcp__playwright__*'] } });
  assert.equal(hasAllowRule(fakeProject(), 'playwright', home), true);
  assert.equal(hasAllowRule(fakeProject(), 'pw', home), false);
});

const ok200 = async () => ({ status: 200 });

test('doctor: no kit -> one clear failure pointing to setup', async () => {
  const checks = await doctor(mkdtempSync(join(tmpdir(), 'rq-empty-')), { home: fakeHome(), fetchImpl: ok200 });
  const fail = checks.filter((c) => c.level === 'fail');
  assert.equal(fail.length, 1);
  assert.match(fail[0].fix, /\/reconqa:setup/);
});

test('doctor: missing browser helper gives the exact add command', async () => {
  const dir = fakeProject(`version: 1\napp:\n  url: ${APP}\n`);
  const checks = await doctor(dir, { home: fakeHome(), fetchImpl: ok200 });
  const pw = checks.find((c) => /Browser helper/.test(c.title) && c.level === 'fail');
  assert.ok(pw, render(checks));
  assert.match(pw.fix, /claude mcp add playwright -- npx -y @playwright\/mcp@0\.0\.85/);
  assert.match(render(checks), /problem\(s\) to fix/);
});

test('doctor: tracker filing without repo fails; app down fails without spending anything', async () => {
  const dir = fakeProject(`version: 1\napp:\n  url: ${APP}\ncapabilities:\n  tracker:\n    tool: github-issues\ntracker_policy:\n  filing: file-after-approval\n`);
  const down = async () => { throw Object.assign(new Error('x'), { cause: { code: 'ECONNREFUSED' } }); };
  const checks = await doctor(dir, { home: fakeHome(), fetchImpl: down });
  const titles = checks.filter((c) => c.level === 'fail').map((c) => c.title).join(' | ');
  assert.match(titles, /App check failed/);
  assert.match(titles, /Tracker helper/);
  assert.match(titles, /repo not set/);
});

test('chrome locations per platform', async () => {
  const { chromeCandidates } = await import('../plugins/reconqa/scripts/doctor.mjs');
  assert.deepEqual(chromeCandidates({}, 'linux', '/h'), ['/opt/google/chrome/chrome']);
  assert.ok(chromeCandidates({ PROGRAMFILES: 'C:\\Program Files' }, 'win32', 'C:\\h')[0].endsWith('chrome.exe'));
  assert.equal(chromeCandidates({}, 'darwin', '/h')[0], '/Applications/Google Chrome.app');
});

test('doctor: own Chrome driver skips the Playwright checks and explains the extension setup', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'reconqa-doc-chrome-'));
  mkdirSync(join(dir, '.reconqa'));
  writeFileSync(join(dir, '.reconqa', 'kit.yml'), 'version: 1\napp:\n  url: http://127.0.0.1:9\ncapabilities:\n  app_driver:\n    tool: claude-in-chrome\n');
  const checks = await doctor(dir, { home: dir, fetchImpl: async () => { throw new Error('down'); } });
  assert.ok(!checks.some((c) => /Playwright/.test(c.title)));
  assert.ok(checks.some((c) => /your own Chrome/.test(c.title) && /claude --chrome/.test(c.fix)));
  assert.ok(checks.some((c) => /ask before every browser step/.test(c.title) && /mcp__claude-in-chrome__\*/.test(c.fix)));
});
