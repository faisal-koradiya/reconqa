// Loads, merges, validates and compiles ReconQA config.
//
// Layers (later wins): plugin defaults -> <project>/.reconqa/kit.yml -> <project>/.reconqa/kit.local.yml
// Maps merge key by key; lists and scalars replace. Exception: app.deny_actions is a union, so no layer
// can remove a default deny action.
//
// Each source file is read exactly once per load; the hash and the parsed config come from the same bytes.
// compile() writes <project>/.reconqa/.compiled.json. readCompiled() (for hooks) re-derives the config from
// the sources and refuses the compiled file if anything differs: stale sources, hand edits to the
// compiled file, wrong format, or a config that no longer validates.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { parse, YamlError } from './yaml-lite.mjs';
import { validate, pretty } from './schema-lite.mjs';
import { loadAppMaps, ACTIVE_TARGETS } from './app-maps.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PLUGIN_ROOT = resolve(HERE, '..', '..');
export const DEFAULTS_FILE = join(PLUGIN_ROOT, 'templates', 'kit.default.yml');
export const SCHEMA_FILE = join(PLUGIN_ROOT, 'schema', 'kit.schema.json');
export const COMPILED_NAME = '.compiled.json';
export const COMPILED_FORMAT = 1;

// Paths whose lists are unioned across layers instead of replaced.
const UNION_LISTS = new Set(['/app/deny_actions']);

export function layerFiles(projectDir) {
  const dir = join(resolve(projectDir), '.reconqa');
  return [
    { name: 'defaults', file: DEFAULTS_FILE, optional: false },
    { name: 'team', file: join(dir, 'kit.yml'), optional: true },
    { name: 'personal', file: join(dir, 'kit.local.yml'), optional: true },
  ];
}

// Read every layer once. A missing optional layer still counts in the hash ("absent"),
// so creating it later changes the hash.
function readSources(projectDir) {
  const h = createHash('sha256');
  const sources = layerFiles(projectDir).map((l) => {
    const bytes = existsSync(l.file) ? readFileSync(l.file) : null;
    h.update(`${l.name}\0`);
    h.update(bytes ?? 'absent');
    h.update('\0');
    return { ...l, bytes };
  });
  return { sources, hash: h.digest('hex') };
}

export function sourceHash(projectDir) {
  return readSources(projectDir).hash;
}

// ---- secrets -----------------------------------------------------------------

const SECRET_PATTERNS = [
  /\bghp_[A-Za-z0-9]{20,}/, /\bgh[ousr]_[A-Za-z0-9]{20,}/, /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bglpat-[A-Za-z0-9_-]{16,}/, /\bsk-[A-Za-z0-9_-]{20,}/, /\bAKIA[0-9A-Z]{16}\b/, /\bAIza[0-9A-Za-z_-]{30,}/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/, // JWT
  /\bBearer\s+[A-Za-z0-9._~+/-]{16,}=*/i,
  /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/i, // credentials inside a URL
];

export function looksSecret(s) {
  return typeof s === 'string' && SECRET_PATTERNS.some((re) => re.test(s));
}

// Scan one layer's raw value, keys included.
function findSecrets(value, path, out) {
  if (typeof value === 'string') {
    if (looksSecret(value)) out.push({ path, message: `${pretty(path)} looks like a secret; keep secrets in env vars or MCP config, never in kit files` });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => findSecrets(v, `${path}/${i}`, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const p = `${path}/${k}`;
      if (looksSecret(k)) out.push({ path: p, message: `a key in ${pretty(path)} looks like a secret; keep secrets in env vars or MCP config, never in kit files` });
      findSecrets(v, p, out);
    }
  }
}

// ---- rule regexes ---------------------------------------------------------

// Nested repeats like (a+)+ or (a*)* can make a regex run for minutes (catastrophic backtracking).
const NESTED_REPEAT = /\((?:[^()\\]|\\.)*[+*}](?:[^()\\]|\\.)*\)\s*[+*{]/;

function checkRuleRegexes(config, out) {
  (config.rules ?? []).forEach((r, i) => {
    for (const k of ['must_not_match', 'must_match']) {
      const src = r?.check?.[k];
      if (typeof src !== 'string') continue;
      const path = `/rules/${i}/check/${k}`;
      try { new RegExp(src, r.check.ignore_case ? 'i' : ''); }
      catch (e) { out.push({ path, message: `${pretty(path)} is not a valid regular expression: ${e.message}` }); continue; }
      if (NESTED_REPEAT.test(src)) out.push({ path, message: `${pretty(path)} has a nested repeat like (a+)+, which can hang the checker; simplify it` });
    }
  });
}

// app.target must be active today, and the chosen app driver must have a tool map for that target.
export function checkTarget(config, out, appAdapterDir) {
  const target = config.app?.target ?? 'web';
  if (!ACTIVE_TARGETS.includes(target)) {
    out.push({ path: '/app/target', message: `app.target "${target}" is planned but not available yet; only ${ACTIVE_TARGETS.join(', ')} works today` });
    return;
  }
  const tool = config.capabilities?.app_driver?.tool;
  if (!tool || tool === 'none') return;
  const map = loadAppMaps(appAdapterDir)[tool];
  if (!map) out.push({ path: '/capabilities/app_driver/tool', message: `no tool map for app driver "${tool}" (adapters/app/${tool}.json). Known drivers: ${Object.keys(loadAppMaps(appAdapterDir)).join(', ') || 'none'}` });
  else if (map.target !== target) out.push({ path: '/capabilities/app_driver/tool', message: `app driver "${tool}" drives ${map.target}, but app.target is ${target}` });
}

// ---- merge ------------------------------------------------------------------

function isMap(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function merge(base, over, path = '') {
  if (UNION_LISTS.has(path) && Array.isArray(base) && Array.isArray(over)) {
    return [...base, ...over.filter((x) => !base.includes(x))];
  }
  if (!isMap(base) || !isMap(over)) return over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = Object.hasOwn(base, k) ? merge(base[k], v, `${path}/${k}`) : v;
  }
  return out;
}

// ---- load ---------------------------------------------------------------------

// Returns { config, layers, errors, hash }. Each error has file + line when known.
export function load(projectDir) {
  const schema = JSON.parse(readFileSync(SCHEMA_FILE, 'utf8'));
  const { sources, hash } = readSources(projectDir);
  const layers = [];
  const errors = [];

  for (const l of sources) {
    if (l.bytes === null) {
      if (!l.optional) errors.push({ file: l.file, line: null, message: 'missing' });
      else if (l.name === 'team') errors.push({ file: l.file, line: null, message: 'no .reconqa/kit.yml found (run setup, or copy an example kit)' });
      continue;
    }
    try {
      const { value, lines } = parse(l.bytes.toString('utf8'));
      if (value !== null && !isMap(value)) {
        errors.push({ file: l.file, line: 1, message: 'the file must be a map of keys (e.g. "version: 1")' });
        continue;
      }
      const layer = { name: l.name, file: l.file, value: value ?? {}, lines };
      const secrets = [];
      findSecrets(layer.value, '', secrets);
      for (const s of secrets) errors.push({ ...locate(s.path, [layer]), message: s.message });
      layers.push(layer);
    } catch (e) {
      if (e instanceof YamlError) errors.push({ file: l.file, line: e.line ?? null, message: e.message.replace(/^line \d+: /, '') });
      else throw e;
    }
  }
  if (errors.length) return { config: null, layers, errors, hash };

  let config = {};
  for (const l of layers) config = merge(config, l.value);

  const problems = validate(schema, config);
  checkRuleRegexes(config, problems);
  if (!problems.length) checkTarget(config, problems);
  for (const p of problems) errors.push({ ...locate(p.path, layers), message: p.message });
  return { config: errors.length ? null : config, layers, errors, hash };
}

// Which layer file + line a path came from: the last layer that defines the path or its nearest parent.
function locate(path, layers) {
  let p = path;
  for (;;) {
    for (let i = layers.length - 1; i >= 0; i--) {
      if (Object.hasOwn(layers[i].lines, p)) return { file: layers[i].file, line: layers[i].lines[p] };
    }
    if (p === '') break;
    p = p.slice(0, p.lastIndexOf('/'));
  }
  const top = layers[layers.length - 1];
  return { file: top ? top.file : null, line: null };
}

// ---- compile / read compiled ------------------------------------------------------

export function compile(projectDir) {
  const result = load(projectDir);
  if (result.errors.length) return { ...result, written: null };
  const out = join(resolve(projectDir), '.reconqa', COMPILED_NAME);
  const compiled = {
    note: 'Generated by ReconQA. Do not edit; edit .reconqa/kit.yml and re-run the validator.',
    format: COMPILED_FORMAT,
    source_hash: result.hash,
    sources: result.layers.map((l) => ({ layer: l.name, file: l.name === 'defaults' ? 'plugin:templates/kit.default.yml' : relative(resolve(projectDir), l.file) })),
    config: result.config,
  };
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(compiled, null, 2) + '\n');
  return { ...result, written: out };
}

// For hooks. Never trusts the compiled file on its own: re-derives the config from the sources
// and requires an exact match. Returns { ok: true, config } or { ok: false, reason }.
export function readCompiled(projectDir) {
  const file = join(resolve(projectDir), '.reconqa', COMPILED_NAME);
  const fix = 'Run: node <plugin>/scripts/kit.mjs compile';
  let data;
  try { data = JSON.parse(readFileSync(file, 'utf8')); }
  catch { return { ok: false, reason: `ReconQA config is not compiled (${file} missing or unreadable). ${fix}` }; }
  if (!isMap(data) || data.format !== COMPILED_FORMAT) return { ok: false, reason: `ReconQA compiled config has an unknown format. ${fix}` };

  let current;
  try { current = load(projectDir); }
  catch (e) { return { ok: false, reason: `ReconQA config could not be read (${e.message}).` }; }
  if (current.errors.length) return { ok: false, reason: `ReconQA config has ${current.errors.length} problem(s). Run: node <plugin>/scripts/kit.mjs validate` };
  if (data.source_hash !== current.hash) return { ok: false, reason: `ReconQA config changed since it was compiled. ${fix}` };
  if (!isDeepStrictEqual(data.config, JSON.parse(JSON.stringify(current.config)))) {
    return { ok: false, reason: `ReconQA compiled config does not match kit.yml (was it edited by hand?). ${fix}` };
  }
  return { ok: true, config: current.config };
}

export function formatError(e, cwd = process.cwd()) {
  const f = e.file ? relative(cwd, e.file) || e.file : '(config)';
  return `${f}${e.line ? `:${e.line}` : ''}: ${e.message}`;
}
