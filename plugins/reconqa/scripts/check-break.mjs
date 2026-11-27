#!/usr/bin/env node
// Checks an extreme-mode break report (qa/breaks/<area>-<date>.md).
//   node check-break.mjs <report.md>
// Every finding needs a severity, steps someone else can follow, what happened, evidence and
// whether it was repeated; the report needs the action count and the test data left behind.
import { readFileSync } from 'node:fs';

const SEV = ['critical', 'major', 'minor'];
export function checkBreak(text) {
  const problems = [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const add = (line, message) => problems.push({ line, message });
  if (!/^#\s+Break report:/m.test(text)) add(1, 'title must be "# Break report: <Area> (<date>)"');
  if (!/Actions used:\s*\d+/i.test(text)) add(2, 'header must say "Actions used: <n> of <max>"');
  for (const h of ['Findings', 'Held up well', 'Test data left behind']) if (!new RegExp(`^##\\s+${h}\\b`, 'mi').test(text)) add(0, `missing section "## ${h}"`);
  const start = lines.findIndex((l) => /^##\s+Findings\b/i.test(l));
  let rows = 0;
  for (let i = start + 1; start >= 0 && i < lines.length && !/^##\s/.test(lines[i]); i++) {
    const l = lines[i];
    if (!/^\|/.test(l) || /^\|\s*#\s*\|/.test(l) || /^\|[\s:-]+\|/.test(l)) continue;
    const c = l.split('|').slice(1, -1).map((x) => x.trim());
    rows++;
    if (c.length < 6) { add(i + 1, 'a finding needs 6 columns: # | Severity | What I did | What happened | Evidence | Repeated'); continue; }
    const [, sev, did, happened, evidence, repeated] = c;
    if (!SEV.includes(sev.toLowerCase())) add(i + 1, `severity must be ${SEV.join(', ')}`);
    if (!/(^|\s|<br>)1[.)]/.test(did)) add(i + 1, '"What I did" must be numbered steps (1. … 2. …)');
    if (!happened) add(i + 1, '"What happened" is empty');
    if (!evidence || /^(-|none|n\/a)$/i.test(evidence)) add(i + 1, 'evidence is missing (screenshot path, status and body, or log lines)');
    if (!/^(yes|no|seen once)/i.test(repeated)) add(i + 1, '"Repeated" must start with yes, no or seen once');
    if (/password\s*[:=]\s*\S+|bearer\s+\S{8,}|eyJ[\w-]+\.[\w-]+/i.test(l)) add(i + 1, 'a finding contains a password or token');
    for (const m of l.matchAll(/\b[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}\b/g)) {
      if (!/@(.+\.)?example\.(test|com|org)$/i.test(m[0])) add(i + 1, `a finding contains a real-looking email address (${m[0].replace(/^(.).*@/, '$1…@')}); use test data or [email]`);
    }
  }
  return { findings: rows, problems };
}

if (process.argv[1]?.endsWith('check-break.mjs')) {
  const f = process.argv[2];
  if (!f) { console.error('usage: check-break.mjs <report.md>'); process.exit(2); }
  const r = checkBreak(readFileSync(f, 'utf8'));
  for (const p of r.problems) console.log(`ERROR ${f}${p.line ? `:${p.line}` : ''}  ${p.message}`);
  console.log(`Break report: ${r.findings} finding(s), ${r.problems.length} problem(s).`);
  process.exit(r.problems.length ? 1 : 0);
}
