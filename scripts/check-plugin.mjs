#!/usr/bin/env node
// Structure check that runs in CI without Claude Code installed.
// Checks marketplace + plugin manifests agree, versions are semver, JSON/YAML files parse,
// and skills/agents (when present) have the frontmatter they need.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../plugins/reconqa/scripts/lib/yaml-lite.mjs';
import { checkAppMap } from '../plugins/reconqa/scripts/lib/app-maps.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = (m) => problems.push(m);
const json = (p) => { try { return JSON.parse(readFileSync(join(ROOT, p), 'utf8')); } catch (e) { fail(`${p}: ${e.message}`); return null; } };
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const market = json('.claude-plugin/marketplace.json');
if (market) {
  if (!KEBAB.test(market.name ?? '')) fail('marketplace.json: name must be kebab-case');
  if (!market.owner?.name) fail('marketplace.json: owner.name is required');
  for (const p of market.plugins ?? []) {
    const dir = join(ROOT, p.source ?? '');
    const mf = join(p.source ?? '', '.claude-plugin', 'plugin.json');
    if (!existsSync(join(ROOT, mf))) { fail(`marketplace entry "${p.name}": ${mf} not found`); continue; }
    const plugin = json(mf);
    if (!plugin) continue;
    if (plugin.name !== p.name) fail(`plugin name mismatch: marketplace "${p.name}" vs plugin.json "${plugin.name}"`);
    if (!KEBAB.test(plugin.name)) fail(`${mf}: name must be kebab-case`);
    if (!SEMVER.test(plugin.version ?? '')) fail(`${mf}: version must be semver`);
    if (p.version && p.version !== plugin.version) fail(`version mismatch: marketplace ${p.version} vs plugin.json ${plugin.version}`);
    checkComponents(dir, p.source);
  }
}

function frontmatter(file) {
  const text = readFileSync(file, 'utf8').replace(/\r\n?/g, '\n'); // Windows checkouts may have CRLF
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return null;
  try { return parse(m[1]).value ?? {}; } catch (e) { fail(`${file}: frontmatter: ${e.message}`); return {}; }
}

function checkComponents(dir, rel) {
  const skills = join(dir, 'skills');
  if (existsSync(skills)) for (const s of readdirSync(skills)) {
    const f = join(skills, s, 'SKILL.md');
    if (!statSync(join(skills, s)).isDirectory()) continue;
    if (!existsSync(f)) { fail(`${rel}/skills/${s}: missing SKILL.md`); continue; }
    const fm = frontmatter(f);
    if (!fm?.name || !fm?.description) fail(`${rel}/skills/${s}/SKILL.md: frontmatter needs name and description`);
  }
  const agents = join(dir, 'agents');
  if (existsSync(agents)) for (const a of readdirSync(agents).filter((x) => x.endsWith('.md'))) {
    const fm = frontmatter(join(agents, a));
    if (!fm?.name || !fm?.description) fail(`${rel}/agents/${a}: frontmatter needs name and description`);
  }
  const hooks = join(dir, 'hooks', 'hooks.json');
  if (existsSync(hooks)) json(join(rel, 'hooks', 'hooks.json'));
  for (const f of ['schema/kit.schema.json']) if (existsSync(join(dir, f))) json(join(rel, f));
  const appMaps = join(dir, 'adapters', 'app');
  if (existsSync(appMaps)) for (const f of readdirSync(appMaps).filter((x) => x.endsWith('.json'))) {
    const m = json(join(rel, 'adapters', 'app', f));
    if (m) for (const p of checkAppMap(`${rel}/adapters/app/${f}`, m)) fail(p);
  }
  const defaults = join(dir, 'templates', 'kit.default.yml');
  if (existsSync(defaults)) { try { parse(readFileSync(defaults, 'utf8')); } catch (e) { fail(`${rel}/templates/kit.default.yml: ${e.message}`); } }
}

// Dev-only reviewer agents
const devAgents = join(ROOT, '.claude', 'agents');
if (existsSync(devAgents)) for (const a of readdirSync(devAgents).filter((x) => x.endsWith('.md'))) {
  const fm = frontmatter(join(devAgents, a));
  if (!fm?.name || !fm?.description) fail(`.claude/agents/${a}: frontmatter needs name and description`);
}

if (problems.length) { for (const p of problems) console.error(p); console.error(`\n${problems.length} problem(s).`); process.exit(1); }
console.log('Plugin structure OK.');
