#!/usr/bin/env node
// Fresh, really random test data with the kit's prefix. Models repeat "random" strings across
// runs, which collides with data from earlier runs; this script doesn't.
//   node test-data.mjs [--project <dir>] [--count 5]
// Prints JSON: { prefix, emails: [...], names: [...] }. Exit 1 if test data creation isn't allowed.
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { load } from './lib/kit.mjs';
import { preflight } from './preflight.mjs';

export function freshData(prefix = 'reconqa', domain = 'example.test', count = 5, rand = () => randomBytes(4).toString('hex')) {
  const ids = Array.from({ length: count }, rand);
  return { prefix, emails: ids.map((id) => `${prefix}-${id}@${domain}`), names: ids.map((id) => `${prefix}-${id}`) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
  const project = arg('--project') ?? '.';
  const count = Math.min(Math.max(Number(arg('--count') ?? 5), 1), 50);
  const { errors } = load(project);
  if (errors.length) { console.error('Settings have errors; run the doctor.'); process.exit(2); }
  const pre = await preflight(project);
  if (!pre.ok) { console.error(pre.reason); process.exit(1); }
  if (!pre.allow_create) { console.error('Creating test data is not allowed here (app.test_data.allow_create is false, or the environment is not local, test or staging). Values below may be typed but must not be submitted to create records.'); }
  console.log(JSON.stringify(freshData(pre.prefix, pre.email_domain, count)));
}
