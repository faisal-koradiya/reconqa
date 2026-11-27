#!/usr/bin/env node
// ReconQA config tool.
//   node kit.mjs validate [--project <dir>]   check config, print errors with file:line
//   node kit.mjs compile  [--project <dir>]   validate, then write .reconqa/.compiled.json
//   node kit.mjs show     [--project <dir>]   print the effective (merged) config as JSON
//   node kit.mjs status   [--project <dir>]   is the compiled file present and current?
// Exit code 0 = ok, 1 = problems found, 2 = usage error.

import { load, compile, readCompiled, formatError } from './lib/kit.mjs';

const args = process.argv.slice(2);
const cmd = args[0];
const pi = args.indexOf('--project');
const project = pi !== -1 ? args[pi + 1] : process.cwd();

function report(errors) {
  for (const e of errors) console.error(formatError(e));
  console.error(`\n${errors.length} problem(s) found.`);
}

switch (cmd) {
  case 'validate': {
    const r = load(project);
    if (r.errors.length) { report(r.errors); process.exit(1); }
    console.log('Config OK.');
    break;
  }
  case 'compile': {
    const r = compile(project);
    if (r.errors.length) { report(r.errors); process.exit(1); }
    console.log(`Config OK. Compiled to ${r.written}`);
    break;
  }
  case 'show': {
    const r = load(project);
    if (r.errors.length) { report(r.errors); process.exit(1); }
    console.log(JSON.stringify(r.config, null, 2));
    break;
  }
  case 'status': {
    const r = readCompiled(project);
    if (!r.ok) { console.error(r.reason); process.exit(1); }
    console.log('Compiled config is current.');
    break;
  }
  default:
    console.error('usage: kit.mjs <validate|compile|show|status> [--project <dir>]');
    process.exit(2);
}
