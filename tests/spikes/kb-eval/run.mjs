#!/usr/bin/env node
// Knowledge-base eval (F6): each eval ticket through write-cases WITH the knowledge base (fixture
// decisions) and WITHOUT it, several runs each. Saves every cases file and a results JSON.
//   node tests/spikes/kb-eval/run.mjs [runsWithKb=3] [runsWithout=1] [model]
// Costs real tokens (about $0.25-0.35 per run). Manual only.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync, readdirSync, readFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreKb } from '../../../scripts/score-kb.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const [WITH = 3, WITHOUT = 1] = process.argv.slice(2, 4).map(Number);
const MODEL = process.argv[4] || 'sonnet';
const KEY = JSON.parse(readFileSync(join(ROOT, 'evals/kb/kb-eval-key.json'), 'utf8'));
const OUT = join(ROOT, 'evals/kb/runs/kb-eval');
mkdirSync(OUT, { recursive: true });
const results = [];
for (const ticket of Object.keys(KEY.tickets)) {
  for (const [cond, n] of [['with-kb', WITH], ['without-kb', WITHOUT]]) {
    for (let run = 1; run <= n; run++) {
      const work = mkdtempSync(join(process.env.SPIKE_TMP || tmpdir(), 'kb-eval-'));
      cpSync(join(ROOT, 'examples/juice-shop'), work, { recursive: true, filter: (s) => !/[\\/](auth|shots|\.mcp\.json|samples)([\\/]|$)/.test(s) });
      cpSync(join(ROOT, 'evals/kb/tickets', ticket), join(work, 'tickets', ticket));
      if (cond === 'with-kb') cpSync(join(ROOT, 'evals/kb/fixture/decisions.md'), join(work, 'qa/kb/registration/decisions.md'));
      else rmSync(join(work, 'qa/kb'), { recursive: true, force: true });
      const before = new Set(readdirSync(join(work, 'qa/cases')));
      const t0 = Date.now();
      const r = spawnSync('claude', ['-p', `/reconqa:write-cases tickets/${ticket}`, '--model', MODEL,
        '--plugin-dir', join(ROOT, 'plugins/reconqa'), '--setting-sources', 'project', '--permission-mode', 'dontAsk',
        '--allowedTools', 'Write', 'Edit', 'Read', 'Glob', 'Grep', 'Bash(node:*)',
        '--max-budget-usd', process.env.SPIKE_BUDGET || '1.5', '--output-format', 'json'],
        { cwd: work, encoding: 'utf8', timeout: 20 * 60_000, maxBuffer: 64 << 20 });
      let out; try { out = JSON.parse(r.stdout); } catch { out = {}; }
      const made = readdirSync(join(work, 'qa/cases')).filter((f) => f.endsWith('.md') && !before.has(f))
        .sort((a, b) => statSync(join(work, 'qa/cases', b)).mtimeMs - statSync(join(work, 'qa/cases', a)).mtimeMs);
      const name = `${ticket.replace(/\.md$/, '')}-${cond}-r${run}.md`;
      let score = null;
      if (made[0]) {
        const text = readFileSync(join(work, 'qa/cases', made[0]), 'utf8');
        writeFileSync(join(OUT, name), text);
        score = scoreKb(text, KEY.tickets[ticket], KEY.feature);
      }
      const row = { ticket, cond, run, file: made[0] ? name : null, secs: Math.round((Date.now() - t0) / 1000), cost_usd: out.total_cost_usd ?? null, score };
      results.push(row);
      console.log(JSON.stringify(row));
      writeFileSync(join(ROOT, 'evals/kb/runs/kb-eval-results.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), model: MODEL, results }, null, 2) + '\n');
    }
  }
}
