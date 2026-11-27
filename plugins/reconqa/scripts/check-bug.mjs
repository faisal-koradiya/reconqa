#!/usr/bin/env node
// Bug draft checker: required sections, severity scale, evidence, no assignee.
//   node check-bug.mjs --project <dir> <draft.md>
// Exit 0 = complete, 1 = problems listed, 2 = usage/config error.
import { readFileSync } from 'node:fs';
import { load } from './lib/kit.mjs';
import { sensitive } from '../hooks/lib/gate-core.mjs';

const SECTION = { preconditions: 'Preconditions', steps: 'Steps', expected: 'Expected', actual: 'Actual', evidence: 'Evidence' };
const HEADER = { severity: 'Severity', environment: 'Environment', version: 'Version' };

export function checkBug(text, config) {
  const b = config.bugs ?? {};
  const problems = [];
  const section = (name) => {
    const m = text.match(new RegExp(`^##\\s+${name}\\s*$([\\s\\S]*?)(?=^##\\s|^---\\s*$|(?![\\s\\S]))`, 'mi'));
    return m ? m[1].replace(/<!--[\s\S]*?-->/g, '').trim() : null;
  };
  const header = (name) => { const m = text.match(new RegExp(`\\*\\*${name}:\\*\\*\\s*([^·\\n]+)`, 'i')); return m ? m[1].trim() : null; };
  const title = (text.match(/^#\s+(.+)$/m) ?? [])[1]?.trim();
  for (const f of b.fields ?? []) {
    let v;
    if (f === 'title') v = title;
    else if (SECTION[f]) v = section(SECTION[f]);
    else if (HEADER[f]) v = header(HEADER[f]);
    else v = section(f);
    if (!v || /\{\{.*\}\}/.test(v)) problems.push(`missing or unfilled: ${f}`);
  }
  const sev = header('Severity');
  if (sev && b.severity_scale && !b.severity_scale.includes(sev)) problems.push(`severity "${sev}" not in ${b.severity_scale.join('/')}`);
  const steps = section('Steps') ?? '';
  if (steps && !/^\s*1\.\s+\S/m.test(steps)) problems.push('steps must be a numbered list');
  for (const r of b.required_evidence ?? []) {
    if (r === 'screenshot' && !/\.(png|jpe?g|webp)\b/i.test(section('Evidence') ?? '')) problems.push('evidence: no screenshot path');
    if (r === 'version' && !header('Version')) problems.push('evidence: no version');
    if (r === 'environment' && !header('Environment')) problems.push('evidence: no environment');
  }
  if ((config.tracker_policy?.assignee ?? 'never') === 'never' && /\bassignees?\**\s*[:=]/i.test(text)) problems.push('assignee set, but tracker_policy.assignee is never');
  const leak = sensitive({ text }, config.app?.test_data?.email_domain);
  if (leak) problems.push(`privacy: ${leak}`);
  if (/\{\{[^}]*\}\}/.test(text.replace(/<!--[\s\S]*?-->/g, ''))) problems.push('template placeholders left in the draft');
  return problems;
}

if (process.argv[1]?.endsWith('check-bug.mjs')) {
  const args = process.argv.slice(2);
  const pi = args.indexOf('--project');
  const project = pi >= 0 ? args.splice(pi, 2)[1] : '.';
  if (!args[0]) { console.error('usage: check-bug.mjs --project <dir> <draft.md>'); process.exit(2); }
  const { config, errors } = load(project);
  if (errors.length) { console.error('Config has errors; run the validator first.'); process.exit(2); }
  const p = checkBug(readFileSync(args[0], 'utf8'), config);
  for (const x of p) console.log(`- ${x}`);
  console.log(p.length ? `${p.length} problem(s)` : 'Bug draft complete.');
  process.exit(p.length ? 1 : 0);
}
