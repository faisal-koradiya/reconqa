#!/usr/bin/env node
// ReconQA TestRail helper as an MCP server (stdio). Node only. Register it in the project, giving
// it the login so only this helper has it:
//   claude mcp add reconqa-testrail --scope local -e TESTRAIL_USER=<email> -e TESTRAIL_API_KEY=<key> -- node <plugin>/drivers/testrail/server.mjs
// Settings: capabilities.test_management in .reconqa/kit.yml. See adapters/test-management/testrail.md.
import { readFileSync, writeFileSync, existsSync, realpathSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { readCompiled } from '../../scripts/lib/kit.mjs';
import { serve, findProject } from '../lib/mcp-stdio.mjs';
import { createDriver, TOOL_LIST, DriverError, BATCH_ID } from './core.mjs';

const project = findProject([process.env.RECONQA_PROJECT, process.env.CLAUDE_PROJECT_DIR, process.cwd()]);
function config() {
  if (!project) throw new DriverError('No ReconQA project found (.reconqa/kit.yml). Start Claude Code in your project folder.');
  const r = readCompiled(project);
  if (!r.ok) throw new DriverError(r.reason);
  return r.config;
}
function inProject(rel) {
  const root = realpathSync(resolve(project));
  const f = resolve(root, rel);
  if (!f.startsWith(root + sep) || rel.split(/[\\/]/).some((p) => p.startsWith('.'))) throw new DriverError('The file must be inside the project, outside dot-folders.');
  // No symlink may lead outside the project.
  if (existsSync(f) && !realpathSync(f).startsWith(root + sep)) throw new DriverError('The file must be inside the project (not a link to elsewhere).');
  return f;
}
const pendingFile = (id) => { if (!BATCH_ID.test(id)) throw new DriverError('bad batch id'); return resolve(project, '.reconqa', 'pending', `testrail-${id}.json`); };
const mapFile = (cases) => inProject(String(cases).replace(/\.md$/, '.testrail.json'));
const tools = createDriver({
  config,
  readText: (rel) => { const f = inProject(rel); if (!existsSync(f)) throw new DriverError(`Not found: ${rel}`); return readFileSync(f, 'utf8'); },
  readMap: (cases) => { if (!cases) return {}; const f = mapFile(cases); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}; },
  writeMap: (cases, map) => writeFileSync(mapFile(cases), JSON.stringify(map, null, 2) + '\n'),
  writePending: (id, summary) => { const f = pendingFile(id); mkdirSync(resolve(f, '..'), { recursive: true }); writeFileSync(f, JSON.stringify(summary, null, 2)); },
  readPending: (id) => { const f = pendingFile(id); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; },
  dropPending: (id) => rmSync(pendingFile(id), { force: true }),
});
serve({ name: 'reconqa-testrail', version: '0.1.0', tools, toolList: TOOL_LIST, isExpected: (e) => e instanceof DriverError });
