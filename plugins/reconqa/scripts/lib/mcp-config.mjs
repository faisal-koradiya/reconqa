// Find MCP servers configured for a project, from the files Claude Code reads.
// Only names, args and env variable NAMES are returned; env values (which can hold tokens) are never read out.
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { PLAYWRIGHT_MCP } from './versions.mjs';

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const strip = (servers, scope, file) => Object.entries(servers ?? {}).map(([name, s]) =>
  ({ name, scope, file, command: s?.command ?? null, args: Array.isArray(s?.args) ? s.args.map(String) : [], url: s?.url ?? null, envKeys: Object.keys(s?.env ?? {}) }));

// Returns [{ name, scope: 'project'|'local'|'user', file, command, args, url }]
export function findServers(projectDir, { home = homedir() } = {}) {
  const abs = resolve(projectDir);
  const out = [];
  const projectFile = join(abs, '.mcp.json');
  if (existsSync(projectFile)) out.push(...strip(readJson(projectFile)?.mcpServers, 'project', projectFile));
  const userFile = join(home, '.claude.json');
  const user = readJson(userFile);
  if (user) {
    const proj = user.projects?.[abs] ?? user.projects?.[abs.replace(/\\/g, '/')];
    out.push(...strip(proj?.mcpServers, 'local', userFile));
    out.push(...strip(user.mcpServers, 'user', userFile));
  }
  return out;
}

const argValue = (args, flag) => {
  const i = args.findIndex((a) => a === flag || a.startsWith(flag + '='));
  if (i < 0) return undefined;
  return args[i].includes('=') ? args[i].slice(flag.length + 1) : args[i + 1];
};
export const isPlaywright = (s) => s.args.some((a) => a.startsWith('@playwright/mcp'));
export const isAtlassian = (s) => /atlassian|jira/i.test(s.name) || /mcp\.atlassian\.com|atlassian/i.test([s.command, s.url, ...s.args].join(' '));
export const isGithub = (s) => /github/i.test(s.name) || /github-mcp-server|api\.githubcopilot\.com\/mcp/i.test([s.command, s.url, ...s.args].join(' '));

export const origins = (config) => [config.app?.url, ...(config.app?.extra_origins ?? [])]
  .filter(Boolean).map((u) => { try { return new URL(u).origin; } catch { return u; } });

// Check one Playwright server entry against the kit. Returns { problems[], warnings[] }.
export function checkPlaywright(server, config, { stateExists = false } = {}) {
  const problems = [], warnings = [];
  const pkg = server.args.find((a) => a.startsWith('@playwright/mcp'));
  if (pkg !== PLAYWRIGHT_MCP) warnings.push(`uses ${pkg}; ReconQA is tested with ${PLAYWRIGHT_MCP}`);
  const allowed = (argValue(server.args, '--allowed-origins') ?? '').split(/[;,]/).map((s) => s.trim()).filter(Boolean)
    .map((u) => { try { return new URL(u).origin; } catch { return u; } });
  if (!allowed.length) problems.push('no --allowed-origins: the browser could go to any site');
  else for (const o of origins(config)) if (!allowed.includes(o)) problems.push(`--allowed-origins is missing ${o}`);
  if (!server.args.includes('--isolated')) warnings.push('no --isolated: the browser profile is kept between runs');
  const statePath = config.app?.auth?.browser_state;
  const given = argValue(server.args, '--storage-state');
  if (stateExists && !given) problems.push('the saved login is not used: --storage-state is missing');
  if (given && statePath && given.replace(/^\.\//, '') !== statePath.replace(/^\.\//, '')) warnings.push(`--storage-state is ${given}, the kit says ${statePath}`);
  return { problems, warnings };
}

const quote = (s) => (/^[\w@./:=-]+$/.test(s) ? s : `"${s}"`);
// The exact command to (re)register the Playwright server for this kit.
export function playwrightArgs(config, { stateExists = false } = {}) {
  const args = ['-y', PLAYWRIGHT_MCP, '--isolated', '--headless',
    '--allowed-origins', origins(config).join(';'), '--image-responses', 'omit', '--output-dir', '.playwright-output'];
  if (stateExists && config.app?.auth?.browser_state) args.push('--storage-state', config.app.auth.browser_state);
  return args;
}
export function playwrightAddCommand(config, { name = 'playwright', stateExists = false } = {}) {
  return `claude mcp add ${name} -- npx ${playwrightArgs(config, { stateExists }).map(quote).join(' ')}`;
}
