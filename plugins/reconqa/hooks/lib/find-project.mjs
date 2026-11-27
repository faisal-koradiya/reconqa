// Find the ReconQA project for a hook call: the nearest folder, walking up, that has
// .reconqa/kit.yml. Node built-ins only, so it can run before anything that might fail to load.
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export function findProject(starts) {
  for (const start of starts) {
    if (!start) continue;
    let dir = resolve(start);
    for (;;) {
      if (existsSync(join(dir, '.reconqa', 'kit.yml'))) return dir;
      const up = dirname(dir);
      if (up === dir) break;
      dir = up;
    }
  }
  return null;
}
