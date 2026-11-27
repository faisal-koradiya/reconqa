#!/usr/bin/env node
// Reconcile pre-UI cases (‹expected: …›) with the atlas once the screen exists.
//   node reconcile.mjs plan <cases.md> --atlas <page>[,<page>] [--project <dir>]
//        writes .reconqa/work/reconcile-<name>.json (the model may add "review" to different / not_found items)
//   node reconcile.mjs check-plan <plan.json> [--project <dir>]
//   node reconcile.mjs apply <plan.json> [--skip 3,5] [--dry-run] [--project <dir>]
//        converts confirmed items to «atlas text», updates the header, writes <output.reports>/reconcile-<name>.md
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, basename, resolve } from 'node:path';
import { load } from './lib/kit.mjs';
import { plan, checkPlan, apply, count } from './lib/reconcile.mjs';
import { inside } from './lib/kb.mjs';

export function run(argv, { out = console.log, err = console.error } = {}) {
  const args = [...argv];
  const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const project = resolve(opt('--project') ?? '.');
  const atlas = opt('--atlas');
  const skip = (opt('--skip') ?? '').split(',').map((x) => Number(x.trim())).filter(Boolean);
  const dry = args.includes('--dry-run');
  const [cmd, file] = args.filter((a) => a !== '--dry-run');
  const { config, errors } = load(project);
  if (errors.length) { err('Config has errors; run kit.mjs validate first.'); return 2; }
  const atlasDir = join(project, config.output?.atlas ?? 'qa/atlas');
  const reportsDir = join(project, config.output?.reports ?? 'qa/reports');
  const rel = (p) => relative(project, p).split('\\').join('/');
  if (!file || !existsSync(resolve(project, file)) && !existsSync(file)) { err('usage: reconcile.mjs <plan|check-plan|apply> <file> ... (see the top of reconcile.mjs)'); return 2; }
  const path = existsSync(file) ? resolve(file) : resolve(project, file);

  if (cmd === 'plan') {
    if (!atlas) { err('Give the atlas page(s): --atlas <page>[,<page>]'); return 2; }
    const pages = atlas.split(',').map((x) => basename(x.trim()).replace(/\.md$/, ''));
    let p;
    try { p = plan(readFileSync(path, 'utf8').replace(/\r\n?/g, '\n'), atlasDir, pages); } catch (e) { err(e.message); return 1; }
    if (!p.items.length) { out('No ‹expected: …› texts in this file: nothing to reconcile.'); return 0; }
    const name = basename(path).replace(/\.[^.]+$/, '');
    const work = join(project, '.reconqa', 'work');
    mkdirSync(work, { recursive: true });
    const planFile = join(work, `reconcile-${name}.json`);
    writeFileSync(planFile, JSON.stringify({ cases: rel(path), ...p }, null, 2) + '\n');
    const c = p.counts;
    out(`${c.total} expected text(s): ${c.confirmed} confirmed on the screen, ${c.different} different, ${c.not_found} not found.`);
    out(`Plan: ${rel(planFile)}`);
    return 0;
  }
  const p = JSON.parse(readFileSync(path, 'utf8'));
  // The plan is a file the model edits: never trust its paths.
  const casesRoot = join(project, config.output?.cases ?? 'qa/cases');
  const casesFile = resolve(project, String(p.cases ?? ''));
  if (!inside(casesRoot, casesFile) || !/\.md$/.test(casesFile) || !existsSync(casesFile)) { err(`The plan's cases file must be an existing .md file inside ${rel(casesRoot)}.`); return 1; }
  if (!Array.isArray(p.pages) || !p.pages.every((x) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(String(x)) && !String(x).includes('..'))) { err('The plan lists atlas pages that are not plain page names.'); return 1; }
  if (cmd === 'check-plan') {
    const problems = checkPlan(p, atlasDir);
    for (const x of problems) out(`ERROR ${x}`);
    const c = count(p.items);
    out(`Plan: ${c.confirmed} confirmed, ${c.different} different, ${c.not_found} not found; ${problems.length} problem(s).`);
    return problems.length ? 1 : 0;
  }
  if (cmd === 'apply') {
    const problems = checkPlan(p, atlasDir);
    if (problems.length) { for (const x of problems) err(`ERROR ${x}`); return 1; }
    const date = new Date().toISOString().slice(0, 10);
    const r = apply(readFileSync(casesFile, 'utf8').replace(/\r\n?/g, '\n'), p, { skip, atlasPaths: p.pages.map((x) => `${config.output?.atlas ?? 'qa/atlas'}/${x}.md`), date, casesPath: p.cases, atlasDir });
    const reportFile = join(reportsDir, `reconcile-${basename(p.cases).replace(/\.[^.]+$/, '')}.md`);
    if (dry) { out(r.report); out(`(dry run: ${r.applied} would be converted; nothing written)`); return 0; }
    writeFileSync(casesFile, r.text);
    mkdirSync(reportsDir, { recursive: true });
    writeFileSync(reportFile, r.report);
    out(`Converted ${r.applied} expected text(s) to «…» in ${p.cases}; ${r.kept} still open. Report: ${rel(reportFile)}`);
    return 0;
  }
  err('usage: reconcile.mjs <plan|check-plan|apply> <file> ...');
  return 2;
}

if (/[\\/]reconcile\.mjs$/.test(process.argv[1] ?? '')) process.exit(run(process.argv.slice(2)));
