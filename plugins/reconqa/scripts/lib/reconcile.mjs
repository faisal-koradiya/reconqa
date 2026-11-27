// Reconcile pre-UI cases with the real screen (the atlas).
//
// plan():  sorts every ‹expected: text [src]› into
//            confirmed  - the text is on the screen exactly, or after normalising case, spacing,
//                         quote style and end punctuation (the atlas's exact text is used)
//            different  - not on the screen, but a close atlas text exists (a finding)
//            not_found  - nothing close on the screen
// review:  the model may move items between different and not_found (e.g. "Create account" is the
//          "Register" button) and add a note; it can never make an item confirmed.
// apply(): turns only confirmed items into «atlas text», points the header at the atlas, and
//          writes a report. Nothing else in the cases file changes.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expectations, norm, observedAtlas } from './kb.mjs';

const loose = (s) => norm(s).toLowerCase().replace(/[“”"'‘’]/g, '').replace(/[.!?:;,]+$/, '').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const words = (s) => new Set(loose(s).replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 1));
function similarity(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return (2 * n) / (A.size + B.size);
}

// Screen texts the atlas states: message texts, quoted strings, field names, screen names.
export function screenTexts(atlasDir, pages) {
  const out = [];
  for (const page of pages) {
    const file = join(atlasDir, `${page.replace(/\.md$/, '')}.md`);
    if (!existsSync(file)) throw new Error(`atlas page not found: ${page}`);
    const text = observedAtlas(readFileSync(file, 'utf8').replace(/\r\n?/g, '\n'));
    let screen = null;
    const add = (t, ref) => { t = t.trim(); if (t && !out.some((x) => x.text === t && x.page === page)) out.push({ text: t, page, ref }); };
    for (const line of text.split('\n')) {
      const h = line.match(/^###\s+(.+?)(?:\s+—\s+\S+)?\s*$/);
      if (h) { screen = h[1].trim(); add(screen, `atlas:${page}#${screen}`); continue; }
      const m = line.match(/^\|\s*(M\d+)\s*\|\s*([^|]+?)\s*\|/);
      if (m) { add(m[2], `atlas:${page}#${m[1]}`); continue; }
      const field = line.match(/^\|\s*([^|]+?)\s*\|/);
      if (field && screen && !/^(Field|#|-+|:?-+:?)$/.test(field[1])) add(field[1], `atlas:${page}#${screen}`);
      for (const q of line.matchAll(/"([^"\n]+)"|«([^»\n]+)»/g)) add(q[1] ?? q[2], screen ? `atlas:${page}#${screen}` : `atlas:${page}`);
    }
    out.push({ page, full: text });
  }
  return out;
}

export function plan(casesText, atlasDir, pages) {
  const all = screenTexts(atlasDir, pages);
  const texts = all.filter((x) => x.text);
  const fulls = all.filter((x) => x.full);
  const items = expectations(casesText).map((e, i) => {
    const base = { n: i + 1, line: e.line, raw: e.raw, text: e.text, src: e.src };
    const exact = texts.find((x) => norm(x.text) === norm(e.text));
    if (exact) return { ...base, group: 'confirmed', how: 'exact', atlas_text: exact.text, atlas_ref: exact.ref };
    const normal = texts.find((x) => loose(x.text) === loose(e.text));
    if (normal) return { ...base, group: 'confirmed', how: 'normalised', atlas_text: normal.text, atlas_ref: normal.ref };
    // A sentence is rarely the same thing as a two-word label: halve the score of much shorter texts.
    const size = words(e.text).size;
    const near = texts.map((x) => ({ text: x.text, ref: x.ref, score: Math.round(similarity(e.text, x.text) * (words(x.text).size * 2 < size ? 0.5 : 1) * 100) / 100 }))
      .filter((x) => x.score >= 0.25).sort((a, b) => b.score - a.score).slice(0, 3);
    return near.length && near[0].score >= 0.4
      ? { ...base, group: 'different', how: 'similar', atlas_text: near[0].text, atlas_ref: near[0].ref, near }
      : { ...base, group: 'not_found', near };
  });
  return { pages, items, counts: count(items) };
}

export function count(items) {
  const c = { total: items.length, confirmed: 0, different: 0, not_found: 0 };
  for (const i of items) c[i.review?.group ?? i.group]++;
  return c;
}

// After the model's review: only different <-> not_found moves, atlas texts must exist.
export function checkPlan(p, atlasDir) {
  const problems = [];
  const texts = screenTexts(atlasDir, p.pages).filter((x) => x.text);
  const fulls = screenTexts(atlasDir, p.pages).filter((x) => x.full).map((f) => norm(f.full)).join('\n');
  for (const i of p.items) {
    const r = i.review;
    if (!r) continue;
    const where = `item ${i.n} (${i.text})`;
    if (!['different', 'not_found'].includes(r.group)) { problems.push(`${where}: a review can only set group to different or not_found`); continue; }
    if (i.group === 'confirmed') { problems.push(`${where}: confirmed items come from the script and cannot be changed by a review`); continue; }
    if (r.group === 'different') {
      if (!r.atlas_text) problems.push(`${where}: a different item needs atlas_text, the text the screen shows instead`);
      else if (!texts.some((x) => x.text === r.atlas_text) && !fulls.includes(norm(r.atlas_text))) problems.push(`${where}: atlas_text "${r.atlas_text}" is not in the atlas`);
    }
  }
  return problems;
}

const final = (i) => ({ ...i, group: i.review?.group ?? i.group, atlas_text: i.review?.group === 'not_found' ? null : (i.review?.atlas_text ?? i.atlas_text),
  atlas_ref: i.review?.atlas_ref ?? (i.review?.group === 'not_found' ? null : i.atlas_ref), note: i.review?.note ?? null });

// Returns { text, report, applied, kept }. skip = item numbers the user did not approve.
// The plan file can be edited by anyone, so the script plans again and converts an item only when
// the fresh plan also confirms it with the same screen text (atlasDir given).
export function apply(casesText, p, { skip = [], atlasPaths, date, casesPath, atlasDir }) {
  const fresh = atlasDir ? plan(casesText, atlasDir, p.pages).items : null;
  const items = p.items.map(final).map((i) => {
    if (!fresh || i.group !== 'confirmed') return i;
    const f = fresh.find((x) => x.line === i.line && x.raw === i.raw);
    return f && f.group === 'confirmed' && f.atlas_text === i.atlas_text ? i : { ...i, group: f?.group ?? 'not_found', atlas_text: f?.atlas_text ?? null, note: 'not confirmed when checked again' };
  });
  const lines = casesText.split('\n');
  const applied = [], kept = [];
  for (const i of items) {
    if (i.group !== 'confirmed' || skip.includes(i.n)) { kept.push(i); continue; }
    const at = i.line - 1;
    if (!lines[at]?.includes(i.raw)) { kept.push({ ...i, stale: true }); continue; }
    lines[at] = lines[at].replace(i.raw, `«${i.atlas_text}»`);
    applied.push(i);
  }
  const open = kept.length;
  let text = lines.join('\n');
  text = text.replace(/Atlas:\s*none yet[^\n·]*/i, `Atlas: ${atlasPaths.join(', ')} (reconciled ${date}; ${open} expected text${open === 1 ? '' : 's'} still open)`);
  const row = (s) => String(s ?? '').replace(/\|/g, '\\|');
  const differ = items.filter((i) => i.group === 'different');
  const missing = items.filter((i) => i.group === 'not_found');
  const report = [
    `# Reconcile: ${casesPath} (${date})`,
    `Atlas: ${atlasPaths.join(', ')}. ${items.length} expected text(s): ${applied.length} confirmed and converted, ${differ.length} different, ${missing.length} not found${skip.length ? `, ${skip.length} skipped by the user` : ''}.`,
    ...(() => {
      const b = items.filter((i) => /^\s*similar:/.test(i.src ?? ''));
      if (!b.length) return [];
      const ok = b.filter((i) => applied.includes(i)).length;
      return ['', `Borrowed from similar features: ${b.length}, of which ${ok} confirmed, ${b.filter((i) => i.group === 'different').length} different, ${b.filter((i) => i.group === 'not_found').length} not found.`];
    })(),
    '',
    '## Different on the screen',
    'The ticket (or manual) expected one text; the screen shows another. Each is a question for the team: change the screen, or accept the screen and update the source.',
    '',
    '| # | Expected (source) | Screen shows | Question |',
    '|---|---|---|---|',
    ...differ.map((i) => `| ${i.n} | "${row(i.text)}" [src: ${row(i.src)}] | "${row(i.atlas_text)}" [src: ${row(i.atlas_ref)}] | ${row(i.note || 'Which text is wanted?')} |`),
    '',
    '## Not found on the screen',
    ...(missing.length ? missing.map((i) => `- ${i.n}. "${i.text}" [src: ${i.src}]${i.note ? `: ${i.note}` : ''}`) : ['None.']),
    '',
    '## Confirmed and converted',
    ...(applied.length ? applied.map((i) => `- ${i.n}. "${i.text}" → «${i.atlas_text}»${i.how === 'normalised' ? ' (same text apart from case or punctuation)' : ''}`) : ['None.']),
    ...(skip.length ? ['', '## Skipped by the user', ...skip.map((n) => `- ${n}`)] : []),
    ...(kept.some((i) => i.stale) ? ['', '## Not converted: the line changed since the plan', ...kept.filter((i) => i.stale).map((i) => `- ${i.n}. ${i.raw}`)] : []),
    '',
  ].join('\n');
  return { text, report, applied: applied.length, kept: open };
}
