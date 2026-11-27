// App driver tool maps (plugins/reconqa/adapters/app/*.json), shared by the write gate, the kit
// validator and the structure check.
//
// A map lists every tool of one driver server and sorts it into:
//   allow - normal Claude Code permissions apply (reading and driving the app)
//   ask   - the gate asks the user first (runs code in the page, changes stored state, uploads files)
//   deny  - never allowed
// Any tool on the driver's prefix that is in none of the lists is denied (deny by default), so a
// new server version cannot add an unchecked tool.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const APP_ADAPTERS = resolve(HERE, '..', '..', 'adapters', 'app');

// Targets ReconQA knows about. Only the ones in ACTIVE_TARGETS work today; the rest are planned.
export const TARGETS = ['web', 'android', 'api', 'mqtt', 'serial', 'desktop', 'ios'];
// Maps in adapters/test-management use this target: they are checked by the gate like drivers but
// are never an app driver.
export const HELPER_TARGET = 'test-management';
export const TM_ADAPTERS = resolve(HERE, '..', '..', 'adapters', 'test-management');
export const ACTIVE_TARGETS = ['web', 'android', 'api'];

const PREFIX = /^mcp__[A-Za-z0-9_-]+__$/;
const LISTS = ['allow', 'ask', 'deny'];

// Returns a list of problems (strings); empty when the map is well formed.
export function checkAppMap(name, map) {
  const p = [];
  if (!map || typeof map !== 'object' || Array.isArray(map)) return [`${name}: must be a JSON object`];
  if (!PREFIX.test(map.default_prefix ?? '')) p.push(`${name}: default_prefix must look like mcp__<server>__`);
  if (!TARGETS.includes(map.target) && map.target !== HELPER_TARGET) p.push(`${name}: target must be one of ${TARGETS.join(', ')}`);
  const seen = new Map();
  for (const l of LISTS) {
    if (!Array.isArray(map[l])) { p.push(`${name}: "${l}" must be a list of tool names`); continue; }
    for (const t of map[l]) {
      if (typeof t !== 'string' || !/^[A-Za-z0-9_-]+$/.test(t)) p.push(`${name}: "${l}" has a bad tool name ${JSON.stringify(t)}`);
      else if (seen.has(t)) p.push(`${name}: ${t} is in both "${seen.get(t)}" and "${l}"`);
      else seen.set(t, l);
    }
  }
  for (const k of ['ask_reasons', 'deny_reasons']) {
    if (map[k] !== undefined && (typeof map[k] !== 'object' || map[k] === null || Array.isArray(map[k]))) p.push(`${name}: ${k} must be an object`);
  }
  return p;
}

// Loads every map in dir. Throws on a malformed map: the gate fails closed on throw.
export function loadAppMaps(dir = APP_ADAPTERS) {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const name = f.slice(0, -5);
    const map = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const problems = checkAppMap(name, map);
    if (problems.length) throw new Error(`bad app tool map ${f}: ${problems[0]}`);
    out[name] = map;
  }
  return out;
}

// The prefix each map is active on: the configured server_prefix for the selected driver, the
// map's default_prefix for every other map (so an unconfigured driver server is still checked).
export function driverPrefixes(maps, appDriver = {}) {
  const out = [];
  for (const [name, map] of Object.entries(maps)) {
    out.push({ name, map, prefix: map.default_prefix });
    if (appDriver.tool === name && appDriver.server_prefix && appDriver.server_prefix !== map.default_prefix) {
      out.push({ name, map, prefix: appDriver.server_prefix });
    }
  }
  // Longest prefix first, so mcp__playwright_two__ is not taken for mcp__playwright__.
  return out.sort((a, b) => b.prefix.length - a.prefix.length);
}
