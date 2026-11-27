#!/usr/bin/env node
// Builds docs/media/story.gif: a short animated walk-through of ReconQA on the Juice Shop example
// (existing-product path first: explore, import old cases, keep an answer, a new ticket, run).
// Every text and the screenshot come from committed example outputs in examples/juice-shop/qa/.
// Needs Google Chrome (or Chromium) and ffmpeg on PATH. Linux/macOS.
//   node docs/media/make-story.mjs
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const W = 1000, H = 560;
const CHROME = process.env.CHROME || 'google-chrome';
const SHOT = 'data:image/png;base64,' + readFileSync(join(ROOT, 'examples/juice-shop/qa/runs/shots/new-customer-registration-2026-11-26/TC-REG-012-step3.png')).toString('base64');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const ui = (s) => esc(s).replace(/«([^»]+)»/g, '<span class="ui">«$1»</span>');

// ---- content (quoted from examples/juice-shop/qa/) ----
const atlasRows = [
  ['M4', 'Please provide an email address.', 'Email left empty'],
  ['M6', 'Please repeat your password.', 'Repeat Password left empty'],
  ['M10', 'Password must be 5-40 characters long.', 'Password of 4 characters'],
  ['M12', 'Email must be unique', 'Email already registered'],
];
const mismatches = [
  ['Password at least 8 characters', 'Accepts 5 to 40', 'different'],
  ['Logged in, goes to products', 'Goes to the login page', 'different'],
  ['Must accept terms', 'No terms checkbox', 'missing in app'],
  ['(not mentioned)', 'Counter reads «40/20»', 'probably a bug'],
];
// Quoted from examples/juice-shop/qa/reports/import-old-cases.md
const conflicts = [
  ['C1044', 'Expects "Invalid login"', '«Invalid email or password.»', 'outdated case'],
  ['C1029', '12 security questions', '14 in the list', 'outdated case'],
  ['C1055', 'Logged in right after signing up', 'Goes to the login page', 'outdated case'],
  ['C1081', '7-character passwords refused', 'Accepts 5 to 40 characters', 'needs a decision'],
];
// From examples/juice-shop/qa/kb/registration/decisions.md (demo decision)
const decision = { title: 'No automatic login after registration', text: 'The current behaviour is intended. Cases expect the login page after registering; the ticket will be corrected.', who: 'Product owner (demo)', date: '2026-11-26' };
// From examples/juice-shop/qa/cases/registration-follow-up.md
const answered = [
  ['AC1: user is logged in automatically', 'decision D1: login page is intended'],
  ['AC2: accept the terms and conditions', 'decision D2: out of scope'],
  ['Counter reads «40/20»', 'known bug K1: not reported again'],
];
const newQ = ['AC3: "This email is already registered."', '«Email must be unique» in a banner'];
const runRows = Array.from({ length: 14 }, (_, i) => `TC-REG-${String(i + 1).padStart(3, '0')}`);
const FAILED = 'TC-REG-012';
const bugTitle = 'Registration: «Password» character counter shows «/20» although the limit is 40';

const css = `*{box-sizing:border-box;margin:0}
body{width:${W}px;height:${H}px;overflow:hidden;background:#0d1017;color:#e8eaf0;font:16px/1.45 "Inter","Segoe UI","DejaVu Sans",sans-serif}
.mono{font-family:"JetBrains Mono","DejaVu Sans Mono",monospace}
.ui{color:#8fc7ff}
.center{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:40px}
.big{font-size:38px;font-weight:700;line-height:1.25}.mid{font-size:24px;color:#aab2c3}
.red{color:#ff8a8a}.green{color:#7ee2a8}.amber{color:#f3b25f}.dim{color:#7d8699}
.top{display:flex;align-items:center;gap:14px;padding:18px 26px 6px}
.step{background:#7c5cff;color:#fff;border-radius:999px;padding:4px 14px;font-weight:700;font-size:15px}
.title{font-size:22px;font-weight:700}
.term{margin:10px 26px;background:#151a24;border:1px solid #2a3142;border-radius:10px;padding:12px 16px;font-size:17px;min-height:48px}
.term .p{color:#7ee2a8}.cursor{display:inline-block;width:9px;height:19px;background:#e8eaf0;vertical-align:-3px;margin-left:2px}
.panel{margin:6px 26px;background:#121722;border:1px solid #262d3d;border-radius:10px;padding:14px 18px}
table{width:100%;border-collapse:collapse;font-size:15px}td,th{padding:7px 9px;border-bottom:1px solid #232a39;text-align:left;vertical-align:top}
th{color:#8d96a8;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:.04em}
.tag{border-radius:6px;padding:2px 8px;font-size:13px;font-weight:700;white-space:nowrap}
.t-diff{background:#3a2a12;color:#f3b25f}.t-miss{background:#2d1f3d;color:#c9a4ff}.t-bug{background:#3a1d22;color:#ff9aa6}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 26px;font-size:16px}
.row{display:flex;justify-content:space-between;border-bottom:1px solid #20263a;padding:4px 2px}
.note{margin:8px 26px;font-size:17px}
.shotwrap{position:relative;margin:6px auto;width:640px}.shotwrap img{width:640px;border-radius:8px;border:1px solid #2a3142;display:block}
.hl{position:absolute;border:3px solid #ff5f6d;border-radius:8px;box-shadow:0 0 0 4px rgba(255,95,109,.25)}
.dialog{margin:14px 60px;background:#171c27;border:1px solid #3a4258;border-radius:12px;padding:16px 20px}
.dialog h3{font-size:15px;color:#f3b25f;margin-bottom:8px}.opt{margin-top:10px;font-size:16px}.sel{color:#7ee2a8;font-weight:700}
.bar{position:absolute;left:0;bottom:0;height:4px;background:#7c5cff}`;

const header = (n, title) => `<div class="top"><span class="step">${n} of 5</span><span class="title">${title}</span></div>`;
const term = (cmd, typed, cursor = true) => `<div class="term mono"><span class="p">&gt;</span> ${esc(cmd.slice(0, typed))}${cursor ? '<span class="cursor"></span>' : ''}</div>`;

// Each scene: build(t) -> html; frames: [[t, seconds], ...]
const typing = (cmd, hold = 0.06) => Array.from({ length: Math.ceil(cmd.length / 3) + 1 }, (_, i) => [Math.min(cmd.length, i * 3), hold]);
const scenes = [];

// 0. Hook
scenes.push({
  build: (t) => `<div class="center">
    <div class="big">Your old test case expects <span class="amber">"Invalid login"</span>.</div>
    <div class="big" style="visibility:${t >= 1 ? 'visible' : 'hidden'}">The app now says <span class="red">"Invalid email or password."</span></div>
    <div class="mid" style="visibility:${t >= 2 ? 'visible' : 'hidden'}">ReconQA looks at the app first, then tells you what no longer matches.</div></div>`,
  frames: [[0, 1.5], [1, 1.5], [2, 2.6]],
});

// 1. Explore
const c1 = '/reconqa:explore login and sign-up';
scenes.push({
  build: ([typed, rows]) => `${header(1, 'Look at the app')}${term(c1, typed, rows < 0)}
    <div class="panel" style="visibility:${rows >= 0 ? 'visible' : 'hidden'}"><div class="dim" style="margin-bottom:6px">Clicks through the screens in Chrome, tries empty and wrong input, copies every message exactly:</div>
    <table><tr><th>#</th><th>Message in the app</th><th>When</th></tr>
    ${atlasRows.slice(0, Math.max(rows, 0)).map(([id, m, w]) => `<tr><td class="dim">${id}</td><td class="ui">«${esc(m)}»</td><td>${esc(w)}</td></tr>`).join('')}</table></div>
    <div class="note green" style="visibility:${rows >= atlasRows.length ? 'visible' : 'hidden'}">✓ App notes saved: qa/atlas/login-and-registration.md</div>`,
  frames: [...typing(c1).map(([t, s]) => [[t, -1], s]), [[c1.length, -1], 0.4], ...atlasRows.map((_, i) => [[c1.length, i + 1], i === atlasRows.length - 1 ? 1.8 : 0.35])],
});

// 2. Import old cases -> conflict list
const c2 = '/reconqa:kb import old-cases.csv';
scenes.push({
  build: ([typed, rows]) => `${header(2, 'Bring in your old test cases')}${term(c2, typed, rows < 0)}
    <div class="note green" style="visibility:${rows >= 0 ? 'visible' : 'hidden'}">✓ 100 old cases read · 35 still match · 53 not checked yet (screens not explored) · 1 hidden instruction flagged</div>
    <div class="panel" style="visibility:${rows >= 0 ? 'visible' : 'hidden'}"><div class="dim" style="margin-bottom:6px">Conflicts: old cases that no longer match the app (12 were hidden, all 12 found):</div>
    <table><tr><th>Old case</th><th>Expects</th><th>App really shows</th><th></th></tr>
    ${conflicts.slice(0, Math.max(rows, 0)).map(([id, a, b, k]) => `<tr><td class="dim">${id}</td><td>${ui(a)}</td><td>${ui(b)}</td><td><span class="tag ${k === 'needs a decision' ? 't-miss' : 't-diff'}">${k}</span></td></tr>`).join('')}</table></div>`,
  frames: [...typing(c2).map(([t, s]) => [[t, -1], s]), [[c2.length, 0], 0.9], ...conflicts.map((_, i) => [[c2.length, i + 1], i === conflicts.length - 1 ? 3 : 0.6])],
});

// 3. Team answer -> knowledge base
const c3 = '/reconqa:kb answer automatic login after sign-up';
scenes.push({
  build: ([typed, phase]) => `${header(3, "Keep your team's answer")}${term(c3, typed, phase < 0)}
    <div class="panel" style="visibility:${phase >= 0 ? 'visible' : 'hidden'}">
      <div style="font-weight:700;margin-bottom:6px">D1 ${esc(decision.title)}</div>
      <div><span class="dim">Decision:</span> ${esc(decision.text)}</div>
      <div><span class="dim">Who:</span> ${esc(decision.who)} · <span class="dim">Date:</span> ${decision.date}</div></div>
    <div class="dialog" style="visibility:${phase >= 1 ? 'visible' : 'hidden'}"><h3>ReconQA: this changes the knowledge base</h3>
      <div style="font-size:15px">What is written there steers future test cases, so check the change before approving.</div>
      <div class="opt"><span class="${phase >= 2 ? 'sel' : ''}">${phase >= 2 ? '❯ ' : '  '}Yes</span> &nbsp;&nbsp; No</div></div>
    <div class="note dim" style="visibility:${phase >= 2 ? 'visible' : 'hidden'};text-align:center">Saved in qa/kb/registration/decisions.md. It won't ask this again.</div>`,
  frames: [...typing(c3).map(([t, s]) => [[t, -1], s]), [[c3.length, 0], 1.4], [[c3.length, 1], 1.4], [[c3.length, 2], 2]],
});

// 4. New ticket: answered questions are not asked again
const c4 = '/reconqa:write-cases tickets/registration-follow-up.md';
scenes.push({
  build: ([typed, rows]) => `${header(4, 'Write test cases for a new ticket')}${term(c4, typed, rows < 0)}
    <div class="note green" style="visibility:${rows >= 0 ? 'visible' : 'hidden'}">✓ 5 test cases written, every quoted message found in the app</div>
    <div class="panel" style="visibility:${rows >= 0 ? 'visible' : 'hidden'}"><div class="dim" style="margin-bottom:6px">Already answered, so not asked again:</div>
    <table>${answered.slice(0, Math.max(rows, 0)).map(([a, b]) => `<tr><td>${ui(a)}</td><td class="green">${esc(b)}</td></tr>`).join('')}</table>
    <div class="dim" style="margin:10px 0 6px;visibility:${rows > answered.length ? 'visible' : 'hidden'}">New question for the team:</div>
    <table style="visibility:${rows > answered.length ? 'visible' : 'hidden'}"><tr><td>${ui(newQ[0])}</td><td>${ui(newQ[1])}</td><td><span class="tag t-diff">different</span></td></tr></table></div>`,
  frames: [...typing(c4).map(([t, s]) => [[t, -1], s]), [[c4.length, 0], 0.8], ...answered.map((_, i) => [[c4.length, i + 1], 0.7]), [[c4.length, answered.length + 1], 2.8]],
});

// 5. Run and report a bug
const c5 = '/reconqa:run-cases qa/cases/new-customer-registration.md';
scenes.push({
  build: ([typed, done, phase]) => phase ? `${header(5, 'Run them, report what fails')}
    <div class="note"><span class="red">✗ ${FAILED} step 3:</span> the strength bar should disappear when the switch is turned off. It stays.</div>
    <div class="shotwrap"><img src="${SHOT}"><div class="hl" style="left:${443 * 0.5 - 6}px;top:${557 * 0.5 - 6}px;width:${394 * 0.5 + 12}px;height:16px"></div></div>
    <div class="note dim" style="text-align:center">Real screenshot from the run. /reconqa:draft-bug writes the report; it goes to your tracker only if you say yes.</div>`
    : `${header(5, 'Run them, report what fails')}${term(c5, typed, done < 0)}
    <div class="panel" style="visibility:${done >= 0 ? 'visible' : 'hidden'}"><div class="grid mono">
    ${runRows.map((id, i) => `<div class="row" style="visibility:${i < done ? 'visible' : 'hidden'}"><span>${i + 1}/14 ${id}</span>${id === FAILED ? '<span class="red">✗ failed</span>' : '<span class="green">✓ passed</span>'}</div>`).join('')}
    </div></div>
    <div class="note" style="visibility:${done >= 14 ? 'visible' : 'hidden'}"><b class="green">13 passed</b> · <b class="red">1 failed</b> · report saved in qa/runs/</div>`,
  frames: [...typing(c5).map(([t, s]) => [[t, -1, 0], s]), [[c5.length, 0, 0], 0.3], ...runRows.map((_, i) => [[c5.length, i + 1, 0], i === 13 ? 1.8 : 0.16]), [[c5.length, 14, 1], 4]],
});

// 5. End card
scenes.push({
  build: () => `<div class="center"><div class="big">ReconQA</div>
    <div class="mid">Test cases from what your app really does, not just what the ticket says.</div>
    <div style="font-size:19px">For manual testers new to AI · No coding needed · Free and open source</div>
    <div class="mono dim" style="font-size:17px">github.com/faisal-koradiya/reconqa</div></div>`,
  frames: [[0, 3.5]],
});

// ---- render ----
const frames = [];
const total = scenes.reduce((n, s) => n + s.frames.reduce((a, [, d]) => a + d, 0), 0);
let elapsed = 0;
for (const s of scenes) for (const [t, d] of s.frames) {
  const progress = `<div class="bar" style="width:${((elapsed + d) / total) * 100}%"></div>`;
  frames.push([`<!doctype html><meta charset="utf-8"><style>${css}</style><body>${s.build(t)}${progress}</body>`, d]);
  elapsed += d;
}
const work = join(tmpdir(), `reconqa-story-${process.pid}`);
mkdirSync(work, { recursive: true });
const shoot = (i) => new Promise((res, rej) => {
  writeFileSync(join(work, `f${i}.html`), frames[i][0]);
  const p = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${W},${H}`,
    `--screenshot=${join(work, `f${i}.png`)}`, 'file://' + join(work, `f${i}.html`)], { stdio: 'ignore' });
  p.on('close', (c) => (c === 0 ? res() : rej(new Error(`chrome exit ${c} on frame ${i}`))));
});
let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => { while (next < frames.length) await shoot(next++); }));
let list = frames.map(([, d], i) => `file '${join(work, `f${i}.png`)}'\nduration ${d}\n`).join('');
list += `file '${join(work, `f${frames.length - 1}.png`)}'\n`;
writeFileSync(join(work, 'list.txt'), list);
const out = join(HERE, 'story.gif');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(work, 'list.txt'),
  '-vf', 'fps=12,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', '-loop', '0', out]);
rmSync(work, { recursive: true, force: true });
console.log(`wrote ${out}: ${frames.length} frames, ${total.toFixed(1)} s`);
