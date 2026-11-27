#!/usr/bin/env node
// Knowledge base helper. No model calls; plain file work.
//   node kb.mjs <command> [--project <dir>] ...
//   init                              create <kb>/index.md from the template
//   new-feature <folder> "<Name>"     create a feature folder from the templates and add its index row
//   coverage <folder>|--all           (re)generate coverage.md from the atlas pages and cases in index.md
//   stamp <folder>|--all              fingerprint atlas facts cited by decisions (for stale detection)
//   search <words...>                 keyword search across the KB, with feature and sources
//   load <folder> [--all]             print what a skill should read for this feature (default: decisions + known issues)
//   import <file> [--replace]         copy a CSV of old cases or a Markdown/text manual into output.sources,
//                                     split it, compare quoted text with the atlas; writes .reconqa/work/import-<name>.json
//   check-import <report.md>          check the conflict report the import skill wrote
//   inventory                         JSON: features, atlas pages, cases, tickets, bugs, sources (for kb build)
//   features-for [--pages a,b] [--words x,y]   which features cover these atlas pages or words
//   similar --ticket <path> [--exclude p]   atlas pages of built features most like this ticket (for pre-UI cases)
//   add-decision --feature f --title t --question q --decision d --who w --src "kind:path#anchor; …" [--date d] [--dry-run]
//   add-issue --feature f --title t (--bug path | --link url) [--status open|fixed|wont-fix] [--screens s] [--dry-run]
//   check                             same as check-kb.mjs
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, relative, basename, resolve } from 'node:path';
import { prepare, checkImportReport } from './lib/import.mjs';
import { load, PLUGIN_ROOT } from './lib/kit.mjs';
import { kbContext, parseIndex, coverage, stamp, search, loadFeature, checkKb, FEATURE_FILES, inventory, featuresFor, similar, addDecision, addIssue } from './lib/kb.mjs';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TEMPLATES = join(PLUGIN_ROOT, 'templates', 'kb');
const today = () => new Date().toISOString().slice(0, 10);

export function run(argv, { out = console.log, err = console.error } = {}) {
  const args = [...argv];
  const pi = args.indexOf('--project');
  const project = pi >= 0 ? args.splice(pi, 2)[1] : '.';
  const all = args.includes('--all');
  const replace = args.includes('--replace');
  const allowPersonal = args.includes('--allow-personal');
  const dry = args.includes('--dry-run');
  const named = {};
  for (let i = 0; i < args.length; i++) {
    const m = args[i].match(/^--(feature|title|question|decision|who|date|src|bug|link|status|screens|pages|words|ticket|exclude)$/);
    if (m) { named[m[1]] = args[i + 1]; args.splice(i, 2); i--; }
  }
  const rest = args.filter((a) => !['--all', '--replace', '--dry-run', '--allow-personal'].includes(a));
  const cmd = rest.shift();
  const { config, errors } = load(project);
  if (errors.length) { err('Config has errors; run kit.mjs validate first.'); return 2; }
  const ctx = kbContext(project, config);
  const index = join(ctx.root, 'index.md');
  const rows = () => existsSync(index) ? parseIndex(readFileSync(index, 'utf8')).rows : [];
  const pick = (name) => {
    const rs = rows();
    if (all) return rs;
    const r = rs.find((x) => x.folder === name);
    if (!r) { err(`No feature "${name}" in ${relative(ctx.project, index)}. Features: ${rs.map((x) => x.folder).join(', ') || 'none'}`); return null; }
    return [r];
  };

  switch (cmd) {
    case 'init': {
      if (existsSync(index)) { out(`${relative(ctx.project, index)} already exists.`); return 0; }
      mkdirSync(ctx.root, { recursive: true });
      writeFileSync(index, readFileSync(join(TEMPLATES, 'index.md'), 'utf8'));
      out(`Created ${relative(ctx.project, index)}.`);
      return 0;
    }
    case 'new-feature': {
      const [folder, name] = rest;
      if (!folder || !SLUG.test(folder) || !name) { err('usage: kb.mjs new-feature <folder-name> "<Feature name>" (folder: lowercase words with dashes)'); return 2; }
      if (!existsSync(index)) run(['init', '--project', project], { out, err });
      const dir = join(ctx.root, folder);
      if (rows().some((r) => r.folder === folder) || existsSync(dir)) { err(`Feature folder ${folder} already exists.`); return 1; }
      mkdirSync(dir, { recursive: true });
      for (const f of FEATURE_FILES) writeFileSync(join(dir, f), readFileSync(join(TEMPLATES, f), 'utf8').replaceAll('{{feature}}', name));
      const text = readFileSync(index, 'utf8');
      writeFileSync(index, text.replace(/\n*$/, '\n') + `| ${name.replace(/\|/g, '/')} | ${folder} | — | — | — | ${today()} |\n`);
      out(`Created ${relative(ctx.project, dir)}/ (${FEATURE_FILES.join(', ')}) and its row in index.md. Fill in atlas pages, cases and tickets in the row.`);
      return 0;
    }
    case 'coverage': {
      const rs = pick(rest[0]); if (!rs) return 1;
      for (const r of rs) {
        const dir = join(ctx.root, r.folder);
        if (!existsSync(dir)) { err(`Folder ${r.folder}/ does not exist.`); return 1; }
        const text = coverage(r, ctx);
        writeFileSync(join(dir, 'coverage.md'), text);
        out(`${relative(ctx.project, join(dir, 'coverage.md'))}: ${text.match(/Covered: .*|None found\./g)?.slice(-1)[0] ?? 'written'}`);
      }
      return 0;
    }
    case 'stamp': {
      const rs = pick(rest[0]); if (!rs) return 1;
      for (const r of rs) {
        const f = join(ctx.root, r.folder, 'decisions.md');
        if (!existsSync(f)) continue;
        const s = stamp(readFileSync(f, 'utf8'), ctx);
        if (s.added) writeFileSync(f, s.text);
        out(`${relative(ctx.project, f)}: ${s.added} atlas reference(s) fingerprinted.`);
      }
      return 0;
    }
    case 'search': {
      if (!rest.length) { err('usage: kb.mjs search <words...>'); return 2; }
      const hits = search(rest, ctx);
      for (const h of hits.slice(0, 50)) out(`[${h.feature}] ${h.file}:${h.line}  ${h.text.length > 160 ? h.text.slice(0, 157) + '…' : h.text}`);
      out(hits.length > 50 ? `${hits.length} hits (first 50 shown; add words to narrow).` : `${hits.length} hit(s).`);
      return hits.length ? 0 : 1;
    }
    case 'load': {
      const folder = rest[0];
      if (!folder || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(folder) || !existsSync(join(ctx.root, folder))) { err(`usage: kb.mjs load <feature folder> [--all]; known: ${rows().map((r) => r.folder).join(', ') || 'none'}`); return 2; }
      const l = loadFeature(folder, ctx, { all });
      out(l.text);
      out(`<!-- about ${l.tokens} tokens${l.over ? ` — OVER the cap (${ctx.cap}); run check-kb.mjs` : ''} -->`);
      return l.over ? 1 : 0;
    }
    case 'import': {
      const src = rest[0];
      if (!src) { err('usage: kb.mjs import <file.csv|file.md|file.txt> [--replace] [--project <dir>]'); return 2; }
      const from = resolve(src);
      if (!existsSync(from)) { err(`File not found: ${src}`); return 2; }
      const name = basename(from).replace(/[^A-Za-z0-9._-]+/g, '-');
      const dest = join(ctx.sourcesDir, name);
      const inPlace = resolve(dest) === from;
      if (existsSync(dest) && !inPlace && !replace) { err(`${relative(ctx.project, dest)} already exists. Add --replace to import the new version over it.`); return 1; }
      // Check before copying: a file with secrets is never copied into the project.
      const probe = prepare(from, ctx, { rel: relative(ctx.project, dest).split('\\').join('/') });
      if (probe.error) { err(probe.error); return 1; }
      // Real people's email addresses would be committed with the copy: refuse unless the user said so.
      if (probe.counts.personal && !allowPersonal) {
        const where = probe.units.filter((u) => u.personal.length).slice(0, 5).map((u) => u.id).join(', ');
        err(`${basename(from)} contains real email addresses (in ${where}${probe.counts.personal > 5 ? ', …' : ''}). Remove them, or import anyway with --allow-personal after checking it is allowed. Nothing was copied.`);
        return 1;
      }
      mkdirSync(ctx.sourcesDir, { recursive: true });
      if (!inPlace) copyFileSync(from, dest);
      const result = prepare(dest, ctx);
      const workDir = join(ctx.project, '.reconqa', 'work');
      mkdirSync(workDir, { recursive: true });
      const work = join(workDir, `import-${name.replace(/\.[^.]+$/, '')}.json`);
      writeFileSync(work, JSON.stringify(result, null, 2) + '\n');
      // Large imports: also write pages of 40 units so a skill never has to read everything at once.
      const PAGE = 40;
      const pages = Math.ceil(result.units.length / PAGE);
      if (pages > 1) for (let n = 0; n < pages; n++) {
        writeFileSync(work.replace(/\.json$/, `.part${n + 1}.json`), JSON.stringify({ ...result, part: n + 1, parts: pages, units: result.units.slice(n * PAGE, (n + 1) * PAGE) }, null, 2) + '\n');
      }
      const est = Math.ceil(JSON.stringify(result.units).length / 4);
      const c = result.counts;
      out(`Imported ${relative(ctx.project, dest)} (${result.kind === 'cases' ? 'old test cases' : 'manual'}): ${c.units} ${result.kind === 'cases' ? 'cases' : 'sections'}.`);
      if (result.columns) out(`Columns used: ${Object.entries(result.columns).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(', ')}`);
      out(`Quoted texts: ${c.quotes} (in the atlas: ${c.confirmed}; close to an atlas text but different: ${c.different}; not found: ${c.unknown}).`);
      out(`Feature hint for ${c.units - c.unassigned} of ${c.units} (a guess from shared words; confirm each one).`);
      if (c.flagged) out(`WARNING: ${c.flagged} unit(s) contain command-like text (kept as data only, never followed).`);
      if (c.personal) out(`WARNING: ${c.personal} unit(s) contain real email addresses (kept because --allow-personal was given); never copy them into the knowledge base.`);
      for (const p of result.problems) out(`NOTE: ${p}`);
      out(`Details for the next step: ${relative(ctx.project, work)} (about ${est} tokens)${pages > 1 ? `; also in ${pages} parts of 40: ${relative(ctx.project, work).replace(/\.json$/, '.part1.json')} … .part${pages}.json (read one part at a time)` : ''}`);
      return 0;
    }
    case 'check-import': {
      const f = rest[0];
      if (!f || !existsSync(f)) { err('usage: kb.mjs check-import <conflict report.md> [--project <dir>]'); return 2; }
      const r = checkImportReport(readFileSync(f, 'utf8').replace(/\r\n?/g, '\n'), ctx);
      for (const p of r.problems) out(`ERROR ${f}${p.line ? `:${p.line}` : ''}  ${p.message}`);
      out(`Conflict report: ${r.rows.length} row(s), ${r.problems.length} problem(s).`);
      return r.problems.length ? 1 : 0;
    }
    case 'inventory': {
      out(JSON.stringify(inventory(ctx), null, 2));
      return 0;
    }
    case 'similar': {
      if (!named.ticket) { err('usage: kb.mjs similar --ticket <path> [--exclude <atlas page>,...] --project <dir>'); return 2; }
      const file = join(ctx.project, named.ticket);
      if (!existsSync(file)) { err(`ticket not found: ${named.ticket}`); return 2; }
      const rs = similar(readFileSync(file, 'utf8'), ctx, { exclude: (named.exclude ?? '').split(',').map((x) => x.trim()).filter(Boolean) });
      if (!rs.length) { out('No similar feature in the atlas. Write the pre-UI cases from the ticket alone.'); return 1; }
      for (const r of rs) out(`${r.page}  score ${r.score}; shared fields: ${r.fields.join(', ') || 'none'}; shared words: ${r.words.join(', ')}`);
      out('Borrow only what the ticket does not give word for word: ‹expected: <atlas text> [src: similar:<page>#M<n> or #<screen>]›, and list each borrowed item as a question for the team.');
      return 0;
    }
    case 'features-for': {
      const split = (v) => (v ?? '').split(',').map((x) => x.trim()).filter(Boolean);
      const rs = featuresFor(ctx, { pages: split(named.pages), words: split(named.words) });
      for (const r of rs) out(`${r.folder}  (${r.feature}; atlas: ${r.atlas.join(', ') || 'none'})`);
      if (!rs.length) out('No feature in the knowledge base covers these.');
      return rs.length ? 0 : 1;
    }
    case 'add-decision':
    case 'add-issue': {
      if (!named.feature) { err(`usage: kb.mjs ${cmd} --feature <folder> ... (see the top of kb.mjs)`); return 2; }
      const r = cmd === 'add-decision'
        ? addDecision(ctx, named.feature, { ...named, date: named.date ?? today() })
        : addIssue(ctx, named.feature, named);
      if (r.problem) { err(`Not added: ${r.problem}`); return 1; }
      out(r.entry.trimEnd());
      if (dry) { out(`(dry run: ${r.id} would be added to ${relative(ctx.project, r.file)})`); return 0; }
      writeFileSync(r.file, r.text);
      out(`Added ${r.id} to ${relative(ctx.project, r.file)}.`);
      return 0;
    }
    case 'check': {
      const r = checkKb(ctx);
      for (const p of r.problems) out(`${p.level === 'error' ? 'ERROR' : 'WARN '} ${p.file ?? ''}${p.line ? `:${p.line}` : ''}  ${p.message}`);
      const n = r.problems.filter((p) => p.level === 'error').length;
      out(`Knowledge base: ${r.features.length} feature(s), ${n} error(s), ${r.problems.length - n} warning(s).`);
      return n ? 1 : 0;
    }
    default:
      err('usage: kb.mjs <init|new-feature|coverage|stamp|search|load|import|check-import|inventory|features-for|add-decision|add-issue|check> [--project <dir>] ...');
      return 2;
  }
}

if (/[\/]kb\.mjs$/.test(process.argv[1] ?? '')) process.exit(run(process.argv.slice(2)));
