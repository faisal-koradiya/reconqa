#!/usr/bin/env node
// ReconQA API driver as an MCP server (stdio). No dependencies: Node only. Register it in the project:
//   claude mcp add reconqa-api --scope project -- node <plugin>/drivers/api/server.mjs
// Settings come from .reconqa/kit.yml (app.api), re-read on every call. See adapters/app/http-api.md.
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { readCompiled } from '../../scripts/lib/kit.mjs';
import { parse as parseYaml } from '../../scripts/lib/yaml-lite.mjs';
import { serve, findProject } from '../lib/mcp-stdio.mjs';
import { createDriver, TOOL_LIST, DriverError } from './core.mjs';

const project = findProject([process.env.RECONQA_PROJECT, process.env.CLAUDE_PROJECT_DIR, process.cwd()]);

function config() {
  if (!project) throw new DriverError('No ReconQA project found (.reconqa/kit.yml). Start Claude Code in your project folder.');
  const r = readCompiled(project);
  if (!r.ok) throw new DriverError(r.reason);
  return r.config;
}

// The spec is a file in the project, or a path on the API server itself (e.g. /openapi.json).
async function readSpec(ref, st) {
  let text;
  if (ref.startsWith('/')) {
    const res = await fetch(new URL(st.basePath + ref, st.base.origin), { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new DriverError(`The spec at ${ref} answered ${res.status}.`);
    text = await res.text();
  } else {
    const root = resolve(project);
    const file = resolve(root, ref);
    if (!file.startsWith(root + sep)) throw new DriverError('app.api.spec must be a file inside the project, or a path on the API server.');
    try { text = readFileSync(file, 'utf8'); } catch { throw new DriverError(`Cannot read the spec file ${ref}.`); }
  }
  try { return JSON.parse(text); } catch { /* YAML */ }
  try { return parseYaml(text); } catch (e) { throw new DriverError(`The spec is not valid JSON or simple YAML (${e.message}). Convert it to JSON.`); }
}

const tools = createDriver({ config, readSpec });
serve({ name: 'reconqa-api', version: '0.1.0', tools, toolList: TOOL_LIST, isExpected: (e) => e instanceof DriverError });
