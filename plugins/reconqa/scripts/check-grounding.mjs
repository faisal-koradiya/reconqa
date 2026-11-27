#!/usr/bin/env node
// Grounding check: every marked exact UI string in generated cases must exist in the atlas.
//   node check-grounding.mjs [--markup guillemets|double-quotes] <cases.md|cases.csv> <atlas.md> [...]
// Default markup: guillemets «text» (cases.ui_string_markup).
// Quoted text after a "## Mismatches" heading is ignored (it quotes the ticket on purpose).
// Exit 0 = grounded, 1 = guessed strings found (listed), 2 = usage error.
import { readFileSync } from 'node:fs';

// Case-sensitive on purpose: «Sign in» is not grounded by "Sign In". Only quotes and spacing are normalised.
const norm = (s) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

// Atlas text that was not observed (open questions, people's notes) does not ground anything.
export const observedAtlas = (text) => text.split(/^(?=#{1,6}\s)/m)
  .filter((sec) => !/^#{1,6}\s*(Open questions|Notes)\b/i.test(sec)).join('');

const PATTERNS = { guillemets: /«([^»\n]{2,})»/g, 'double-quotes': /"([^"\n]{2,})"/g };

export function quotedStrings(text, markup = 'guillemets') {
  const body = text.split(/^#{1,6}\s*Mismatches\b.*$/im)[0];
  // ‹expected: …› marks text the screen has not shown yet; check-cases checks it against its source.
  const lines = body.split('\n').filter((l) => !/^\s*<!--/.test(l)).map((l) => l.replace(/‹[^‹›]*›/g, ''));
  const out = [];
  for (const [i, line] of lines.entries()) {
    // CSV doubles quotes inside fields: ""text"" -> treat as "text"
    const l = line.replace(/""/g, '"');
    for (const m of l.matchAll(PATTERNS[markup])) {
      if (/^[,\s]*$/.test(m[1])) continue;
      out.push({ text: m[1], line: i + 1 });
    }
  }
  return out;
}

export function checkGrounding(casesText, atlasTexts, markup = 'guillemets') {
  const atlas = norm(atlasTexts.map(observedAtlas).join('\n'));
  const strings = quotedStrings(casesText, markup);
  const missing = strings.filter((s) => !atlas.includes(norm(s.text)));
  return { checked: strings.length, missing };
}

if (process.argv[1]?.endsWith('check-grounding.mjs')) {
  const args = process.argv.slice(2);
  let markup = 'guillemets';
  const mi = args.indexOf('--markup');
  if (mi >= 0) { markup = args[mi + 1]; args.splice(mi, 2); }
  if (!PATTERNS[markup]) { console.error(`unknown markup ${markup}`); process.exit(2); }
  const [cases, ...atlases] = args;
  if (!cases || !atlases.length) { console.error('usage: check-grounding.mjs <cases> <atlas.md> [...]'); process.exit(2); }
  const r = checkGrounding(readFileSync(cases, 'utf8'), atlases.map((a) => readFileSync(a, 'utf8')), markup);
  for (const m of r.missing) console.log(`line ${m.line}: ${m.text} is not in the atlas`);
  console.log(`${r.checked - r.missing.length}/${r.checked} marked UI strings grounded`);
  if (!r.checked) { console.log('No marked UI strings found: check the markup setting.'); process.exit(1); }
  process.exit(r.missing.length ? 1 : 0);
}
