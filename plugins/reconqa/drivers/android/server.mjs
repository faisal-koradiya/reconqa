#!/usr/bin/env node
// ReconQA Android driver as an MCP server (stdio, newline-delimited JSON-RPC). No dependencies:
// Node and adb only. Register it in the project, not globally:
//   claude mcp add reconqa-android --scope project -- node <plugin>/drivers/android/server.mjs
// The device and the app come from .reconqa/kit.yml (app.android); they are re-read on every call,
// so a kit change takes effect without a restart. See adapters/app/android-adb.md.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, realpathSync, existsSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { readCompiled } from '../../scripts/lib/kit.mjs';
import { serve, findProject } from '../lib/mcp-stdio.mjs';
import { createDriver, TOOL_LIST, DriverError } from './core.mjs';

const ADB = process.env.RECONQA_ADB || 'adb';
const project = findProject([process.env.RECONQA_PROJECT, process.env.CLAUDE_PROJECT_DIR, process.cwd()]);

function config() {
  if (!project) throw new DriverError('No ReconQA project found (.reconqa/kit.yml). Start Claude Code in your project folder.');
  const r = readCompiled(project);
  if (!r.ok) throw new DriverError(r.reason);
  return r.config;
}

function run(args, { binary = false } = {}) {
  return new Promise((resolve) => {
    const p = spawn(ADB, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const out = [], err = [];
    const timer = setTimeout(() => p.kill('SIGKILL'), 60_000);
    p.stdout.on('data', (b) => out.push(b));
    p.stderr.on('data', (b) => err.push(b));
    p.on('error', (e) => { clearTimeout(timer); resolve({ code: 127, stdout: binary ? Buffer.alloc(0) : '', stderr: `adb not found (${e.code}). Install Android platform-tools and put adb on PATH.` }); });
    p.on('close', (code) => {
      clearTimeout(timer);
      const buf = Buffer.concat(out);
      resolve({ code, stdout: binary ? buf : buf.toString('utf8'), stderr: Buffer.concat(err).toString('utf8') });
    });
  });
}

// Screenshots are saved only inside the project folder.
function saveFile(rel, buf) {
  if (!project) throw new DriverError('No ReconQA project found.');
  const root = realpathSync(resolve(project));
  const out = resolve(root, rel);
  if (!out.startsWith(root + sep) || rel.split(/[\\/]/).some((p) => p.startsWith('.'))) throw new DriverError('filename must stay inside the project, outside dot-folders such as .reconqa or .git.');
  mkdirSync(dirname(out), { recursive: true });
  // No symlink may lead outside the project.
  if (!realpathSync(dirname(out)).startsWith(root + sep) && realpathSync(dirname(out)) !== root) throw new DriverError('filename must stay inside the project.');
  if (existsSync(out) && realpathSync(out) !== out) throw new DriverError('filename must not be a link.');
  writeFileSync(out, buf);
}

const tools = createDriver({ config, run, saveFile });
serve({ name: 'reconqa-android', version: '0.1.0', tools, toolList: TOOL_LIST, isExpected: (e) => e instanceof DriverError });
