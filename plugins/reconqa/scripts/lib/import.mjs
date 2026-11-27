// Import of existing material into the knowledge base: old test cases (CSV) and manuals (Markdown
// or plain text). Everything here is plain file work; the model only reads the result.
//
// prepare() splits the source into units (one per case, one per manual section), each with a
// source reference that check-kb can resolve, flags command-like phrases (imported text is data,
// never instructions), suggests a feature, and compares every quoted string with the atlas:
//   confirmed  - the exact text is in the atlas
//   different  - not in the atlas, but close to an atlas message (likely outdated)
//   unknown    - not in the atlas and nothing close (not UI text, or an area not explored yet)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { csvRecords, mapColumns } from './csv.mjs';
import { looksSecret } from './kit.mjs';
import { norm, observedAtlas, parseIndex, parseRefs, quotes, resolveRef, looseQuotes } from './kb.mjs';

export const IMPORT_KINDS = { '.csv': 'cases', '.md': 'manual', '.markdown': 'manual', '.txt': 'manual' };
export const CONFLICT_KINDS = ['outdated case', 'manual vs app', 'not in app', 'needs a decision'];
const EMAIL = /\b[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}\b/g;

// Phrases that read like instructions to an AI or a shell. Flagged, shown to the user, never followed.
const COMMAND_LIKE = [
  [/\b(ignore|disregard|forget|override|skip)\s+(all\s+|any\s+|your\s+)?(the\s+)?(previous|prior|above|earlier|other|existing|original)?\s*(instructions|rules|prompts?|guidance|directions|guidelines|system message)/i, 'asks to ignore instructions'],
  [/\b(new instructions|from now on you|instead,? you (must|should)|note (to|for) (any |the )?(ai|assistant|model|llm|claude))/i, 'talks to an AI'],
  [/\b(system prompt|you are (now )?(an? )?(ai|assistant|language model)|as an ai\b)/i, 'talks to an AI'],
  [/\b(run|execute)\s+(this|the following|these)\s+(command|script|code)/i, 'asks to run a command'],
  [/(^|\s)(rm\s+-rf|sudo\s|curl\s+-|wget\s+http|bash\s+-c|powershell\s|Invoke-WebRequest)/i, 'contains a shell command'],
  [/\b(delete|drop|truncate|wipe)\s+(all|every|the\s+(whole|entire))\b|\bdrop\s+table\b/i, 'asks to delete data in bulk'],
  [/\b(do not|don't|never)\s+(tell|show|report|mention)\s+(the\s+)?(user|tester|anyone)/i, 'asks to hide something'],
  [/\b(send|post|upload|email)\s+(it|this|the\s+\w+)\s+to\s+(https?:|[\w.-]+@)/i, 'asks to send data somewhere'],
  [/<\s*script\b/i, 'contains a script tag'],
];

export function commandLike(text) {
  return COMMAND_LIKE.filter(([re]) => re.test(text)).map(([, why]) => why);
}

export function sensitive(text, testDomain = 'example.test') {
  const out = [];
  if (text.split('\n').some(looksSecret)) out.push('secret');
  for (const m of text.matchAll(EMAIL)) {
    const d = m[0].split('@')[1].toLowerCase();
    if (d !== testDomain && !d.endsWith(`.${testDomain}`) && !/(^|\.)example\.(com|org|net)$/.test(d)) out.push(`email ${m[0].replace(/^(.).*@/, '$1…@')}`);
  }
  return out;
}

// ---- units ----------------------------------------------------------------------

function caseUnits(text, rel) {
  const { header, records } = csvRecords(text);
  const col = mapColumns(header);
  const problems = [];
  if (!col.id) problems.push(`no ID column found (looked for: id, case id, test id, key, …); found: ${header.join(', ')}`);
  if (!col.title && !col.step && !col.expected) problems.push('no title, step or expected column found');
  if (problems.length) return { units: [], problems, columns: col };
  const units = [];
  let cur = null;
  for (const r of records) {
    const v = r.values;
    if (v[col.id]) {
      cur = { kind: 'case', id: v[col.id], title: v[col.title] ?? '', area: col.area ? v[col.area] : '', priority: col.priority ? v[col.priority] : '',
        preconditions: col.preconditions ? v[col.preconditions] : '', steps: [], rows: [r.row], ref: `import:${rel}#${v[col.id]}` };
      units.push(cur);
    } else if (!cur) { problems.push(`row ${r.row} has no ID and no case above it`); continue; }
    else cur.rows.push(r.row);
    if ((col.step && v[col.step]) || (col.expected && v[col.expected])) cur.steps.push({ row: r.row, step: col.step ? v[col.step] : '', expected: col.expected ? v[col.expected] : '' });
  }
  const seen = new Map();
  for (const u of units) {
    if (seen.has(u.id)) problems.push(`case ID ${u.id} is used twice (rows ${seen.get(u.id)} and ${u.rows[0]}); the second one is cited by row`);
    seen.set(u.id, u.rows[0]);
  }
  for (const u of units.filter((x, i) => units.findIndex((y) => y.id === x.id) !== i)) u.ref = `import:${rel}#row ${u.rows[0]}`;
  for (const u of units) u.text = [u.title, u.preconditions, ...u.steps.flatMap((s) => [s.step, s.expected])].filter(Boolean).join('\n');
  return { units, problems, columns: col };
}

function manualUnits(text, rel, isMarkdown) {
  const lines = text.split('\n');
  const units = [];
  if (isMarkdown) {
    const heads = [];
    lines.forEach((l, i) => { const m = l.match(/^(#{1,6})\s+(.*)$/); if (m) heads.push({ i, level: m[1].length, title: m[2].trim() }); });
    const path = [];
    const starts = heads.length && heads[0].i > 0 ? [{ i: -1, level: 0, title: '(start)' }, ...heads] : heads.length ? heads : [{ i: -1, level: 0, title: '(whole file)' }];
    starts.forEach((h, k) => {
      while (path.length && path[path.length - 1].level >= h.level) path.pop();
      if (h.level) path.push(h);
      const from = h.i + 1, to = (starts[k + 1]?.i ?? lines.length) - 1; // body lines, 0-based inclusive
      const body = lines.slice(from, to + 1).join('\n').trim();
      if (!body) return;
      const unique = h.level && heads.filter((x) => x.title.toLowerCase().includes(h.title.toLowerCase())).length === 1
        && lines.findIndex((l) => /^#{1,6}\s/.test(l) && l.toLowerCase().includes(h.title.toLowerCase())) === h.i;
      const first = Math.max(h.i, 0) + 1, last = to + 1;
      units.push({ kind: 'section', id: `S${units.length + 1}`, title: path.map((p) => p.title).join(' > ') || h.title,
        lines: [first, last], ref: unique && !/[#@;\]]/.test(h.title) ? `manual:${rel}#${h.title}` : `manual:${rel}#L${first}-${last}`, text: body });
    });
  } else {
    let start = null;
    const flush = (end) => {
      if (start === null) return;
      const body = lines.slice(start, end + 1).join('\n').trim();
      if (body) units.push({ kind: 'section', id: `S${units.length + 1}`, title: body.split('\n')[0].slice(0, 80), lines: [start + 1, end + 1], ref: `manual:${rel}#L${start + 1}-${end + 1}`, text: body });
      start = null;
    };
    lines.forEach((l, i) => { if (l.trim()) { if (start === null) start = i; } else flush(i - 1); });
    flush(lines.length - 1);
  }
  return { units, problems: [] };
}

// ---- atlas comparison and feature suggestion --------------------------------------------

const words = (s) => new Set(norm(s).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2));
function similarity(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size) * (n / Math.max(A.size, B.size)) ** 0.5;
}

export function atlasIndex(atlasDir) {
  const pages = [];
  if (!existsSync(atlasDir)) return pages;
  for (const f of readdirSync(atlasDir).filter((x) => x.endsWith('.md')).sort()) {
    const text = observedAtlas(readFileSync(join(atlasDir, f), 'utf8').replace(/\r\n?/g, '\n'));
    const strings = [];
    for (const line of text.split('\n')) {
      const m = line.match(/^\|\s*(M\d+)\s*\|\s*([^|]+?)\s*\|/);
      if (m) strings.push({ id: m[1], text: m[2] });
      for (const q of line.matchAll(/"([^"\n]{3,})"/g)) if (!strings.some((s) => s.text === q[1])) strings.push({ id: null, text: q[1] });
    }
    pages.push({ page: f.slice(0, -3), text, normText: norm(text), strings });
  }
  return pages;
}

export const unitQuotes = looseQuotes;

export function compareWithAtlas(quote, atlas) {
  const n = norm(quote);
  for (const p of atlas) if (p.normText.includes(n)) return { status: 'confirmed', page: p.page };
  const near = atlas.flatMap((p) => p.strings.map((s) => ({ page: p.page, id: s.id, text: s.text, score: Math.round(similarity(quote, s.text) * 100) / 100 })))
    .filter((x) => x.score >= 0.2).sort((a, b) => b.score - a.score).slice(0, 3);
  // Close atlas texts are hints for the model, not a verdict: it decides which one (if any) is the same thing.
  return near.length && near[0].score >= 0.25 ? { status: 'different', near } : { status: 'unknown', near };
}

// Common words that say nothing about a feature.
const STOP = new Set('the and for you your are with this that from then into when will can not any all has have its was one out use see open click enter type shows shown show page button field press choose look after before each there their them they what which while only also more than must should under next same new'.split(' '));
const keywords = (s) => new Set([...words(s)].filter((w) => !STOP.has(w) && !/^\d+$/.test(w)));

// The feature whose atlas pages use most of the unit's words. A hint for the model and the user.
export function suggestFeature(unit, features, atlas) {
  const text = keywords(`${unit.title}\n${unit.area ?? ''}\n${unit.text}`);
  if (!text.size) return null;
  let best = null;
  for (const f of features) {
    const vocab = keywords([f.feature, f.folder.replace(/-/g, ' '), ...atlas.filter((p) => f.atlas.includes(p.page)).map((p) => p.text)].join('\n'));
    let n = 0;
    for (const w of text) if (vocab.has(w)) n++;
    const score = n / text.size;
    if (!best || score > best.score) best = { folder: f.folder, score };
  }
  return best && best.score >= 0.7 ? best.folder : null;
}

// ---- prepare ----------------------------------------------------------------------

export function prepare(file, ctx, { rel } = {}) {
  const ext = extname(file).toLowerCase();
  const kind = IMPORT_KINDS[ext];
  if (!kind) return { error: `${basename(file)}: only CSV (old test cases) and Markdown or text files (manuals) can be imported today. Save PDFs, Word or HTML pages as Markdown or text first.` };
  const text = readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  rel = rel ?? relative(ctx.project, file).split('\\').join('/');
  const secrets = text.split('\n').map((l, i) => (looksSecret(l) ? i + 1 : 0)).filter(Boolean);
  if (secrets.length) return { error: `${basename(file)} contains something that looks like a password, token or key (line${secrets.length > 1 ? 's' : ''} ${secrets.slice(0, 5).join(', ')}). Remove it from the file, then import again. Nothing was copied.` };

  let parsed;
  try { parsed = kind === 'cases' ? caseUnits(text, rel) : manualUnits(text, rel, ext !== '.txt'); }
  catch (e) { return { error: `${basename(file)}: ${e.message}` }; }
  const indexFile = join(ctx.root, 'index.md');
  const features = existsSync(indexFile) ? parseIndex(readFileSync(indexFile, 'utf8')).rows : [];
  const atlas = atlasIndex(ctx.atlasDir);
  const counts = { units: parsed.units.length, quotes: 0, confirmed: 0, different: 0, unknown: 0, flagged: 0, personal: 0, unassigned: 0 };
  for (const u of parsed.units) {
    u.flags = commandLike(u.text);
    u.personal = sensitive(u.text, ctx.testDomain);
    u.feature_hint = suggestFeature(u, features, atlas);
    u.quotes = unitQuotes(u.text).map((q) => ({ text: q, ...compareWithAtlas(q, atlas) }));
    if (u.flags.length) counts.flagged++;
    if (u.personal.length) counts.personal++;
    if (!u.feature_hint) counts.unassigned++;
    for (const q of u.quotes) { counts.quotes++; counts[q.status]++; }
  }
  return { source: rel, kind, columns: parsed.columns ?? null, problems: parsed.problems, features: features.map((f) => f.folder), atlas_pages: atlas.map((p) => p.page), counts, units: parsed.units };
}

// ---- conflict report check --------------------------------------------------------------
// The report the import skill writes: a table
// | # | Feature | Source | Source says | App shows | Kind | Question |
// Source and App shows cite [src: …]; quoted text in each must be in what it cites.

export function checkImportReport(text, ctx) {
  const problems = [];
  const rows = [];
  let header = null;
  text.split('\n').forEach((line, i) => {
    if (!/^\s*\|/.test(line)) { if (!line.trim()) return; return; }
    const cells = line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim());
    if (!header) { if (cells.map((c) => c.toLowerCase()).includes('source says')) header = cells.map((c) => c.toLowerCase()); return; }
    if (cells.every((c) => /^:?-+:?$/.test(c))) return;
    const get = (n) => cells[header.indexOf(n)] ?? '';
    rows.push({ line: i + 1, n: get('#'), feature: get('feature'), source: get('source'), says: get('source says'), app: get('app shows'), kind: get('kind').toLowerCase(), question: get('question') });
  });
  if (!header) return { rows, problems: [{ line: null, message: 'no conflict table found (needs the columns # | Feature | Source | Source says | App shows | Kind | Question)' }] };
  for (const need of ['#', 'feature', 'source', 'source says', 'app shows', 'kind', 'question']) if (!header.includes(need)) problems.push({ line: null, message: `the conflict table is missing the "${need}" column` });
  for (const r of rows) {
    const add = (m) => problems.push({ line: r.line, message: `row ${r.n}: ${m}` });
    if (!CONFLICT_KINDS.includes(r.kind)) add(`kind must be one of: ${CONFLICT_KINDS.join(', ')}`);
    const src = parseRefs(r.source);
    if (!src.length) add('Source needs a [src: import:…] or [src: manual:…] reference');
    for (const ref of src) if (!['import', 'manual'].includes(ref.kind)) add(`Source cites ${ref.kind}:, expected import: or manual:`);
    const srcTexts = src.map((x) => resolveRef(x, ctx)).filter((x) => { if (x.problem) add(x.problem); return !x.problem; }).map((x) => norm(x.text));
    for (const q of quotes(r.says)) if (srcTexts.length && !srcTexts.some((t) => t.includes(norm(q.text)))) add(`"${q.text}" is not word for word in the cited source`);
    if (!quotes(r.says).length && !r.says.replace(/\[src:[^\]]*\]/g, '').trim()) add('Source says is empty');
    const app = parseRefs(r.app);
    if (r.kind !== 'not in app' && !app.length) add('App shows needs an atlas reference [src: atlas:page#M12]');
    for (const ref of app) if (ref.kind !== 'atlas') add(`App shows cites ${ref.kind}:, expected atlas:`);
    const appTexts = app.map((x) => resolveRef(x, ctx)).filter((x) => { if (x.problem) add(x.problem); return !x.problem; }).map((x) => norm(x.text));
    for (const q of quotes(r.app)) if (appTexts.length && !appTexts.some((t) => t.includes(norm(q.text)))) add(`"${q.text}" is not word for word in the cited atlas fact`);
    if (!r.question) add('Question is empty: say what the team must decide or fix');
  }
  return { rows, problems };
}
