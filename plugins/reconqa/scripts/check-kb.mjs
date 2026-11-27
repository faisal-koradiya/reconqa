#!/usr/bin/env node
// Knowledge base check: every source exists, quoted facts appear word for word in their source,
// index.md and the feature folders agree, no secrets or real emails, decisions settle intent only
// and are flagged stale when the atlas fact they cite changes, token cap, coverage.md up to date.
//   node check-kb.mjs [--project <dir>]
// Exit 0 = clean (warnings allowed), 1 = errors, 2 = usage or config error.
import { load } from './lib/kit.mjs';
import { kbContext, checkKb } from './lib/kb.mjs';

if (process.argv[1]?.endsWith('check-kb.mjs')) {
  const args = process.argv.slice(2);
  const pi = args.indexOf('--project');
  const project = pi >= 0 ? args[pi + 1] : '.';
  const { config, errors } = load(project);
  if (errors.length) { console.error('Config has errors; run kit.mjs validate first.'); process.exit(2); }
  const ctx = kbContext(project, config);
  const r = checkKb(ctx);
  if (r.missing) { console.log('No knowledge base yet (nothing to check). Start one with: kb.mjs init'); process.exit(0); }
  for (const p of r.problems) console.log(`${p.level === 'error' ? 'ERROR' : 'WARN '} ${p.file ?? ''}${p.line ? `:${p.line}` : ''}  ${p.message}`);
  const n = r.problems.filter((p) => p.level === 'error').length;
  const w = r.problems.length - n;
  console.log(`Knowledge base: ${r.features.length} feature(s), ${n} error(s), ${w} warning(s).`);
  process.exit(n ? 1 : 0);
}
