#!/usr/bin/env node
// Docs match the code: every /reconqa:<command>, every script file name and every config key
// (`app.*`, `output.*`, `capabilities.*`, …) named in the user-facing docs exists.
//   node scripts/check-docs.mjs [files...]   (default: README.md docs/USER-GUIDE.md docs/TECHNICAL.md)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = process.argv.slice(2).length ? process.argv.slice(2) : ['README.md', 'docs/USER-GUIDE.md', 'docs/TECHNICAL.md', 'docs/BUILT-WITH-CLAUDE-CODE.md'];
const skills = new Set(readdirSync('plugins/reconqa/skills'));
const schema = JSON.parse(readFileSync('plugins/reconqa/schema/kit.schema.json', 'utf8'));
const scripts = new Set();
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (f === 'node_modules' || f.startsWith('.git')) continue; if (statSync(p).isDirectory()) walk(p); else if (/\.(mjs|cjs|js|sh)$/.test(f)) scripts.add(f); } };
walk('plugins'); walk('scripts'); walk('tests'); if (existsSync('docs/media')) walk('docs/media');

function keyExists(path) {
  let node = schema;
  for (const part of path.split('.')) {
    if (part === '*') return true;
    const next = node?.properties?.[part] ?? node?.items?.properties?.[part];
    if (!next) return false;
    node = next;
  }
  return true;
}
const TOP = Object.keys(schema.properties);
const problems = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  text.split('\n').forEach((line, i) => {
    const at = `${f}:${i + 1}`;
    for (const m of line.matchAll(/\/reconqa:([a-z-]+)/g)) if (!skills.has(m[1])) problems.push(`${at}: /reconqa:${m[1]} has no skill`);
    for (const m of line.matchAll(/`([A-Za-z0-9_-]+\.(?:mjs|cjs|sh))\b/g)) if (!scripts.has(m[1])) problems.push(`${at}: script ${m[1]} not found`);
    for (const m of line.matchAll(/`((?:app|output|capabilities|kb|cases|bugs|tracker_policy|explore|run|words|rules)\.[a-z_]+(?:\.[a-z_*]+)*)`/g)) {
      if (/\.(mjs|cjs|md|json|ya?ml|csv)$/.test(m[1])) continue;
      if (TOP.includes(m[1].split('.')[0]) && !keyExists(m[1])) problems.push(`${at}: config key ${m[1]} not in the schema`);
    }
  });
}
for (const p of problems) console.log(p);
console.log(`Docs: ${files.length} file(s), ${problems.length} problem(s).`);
process.exit(problems.length ? 1 : 0);
