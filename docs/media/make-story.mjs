#!/usr/bin/env node
// Builds docs/media/story.gif: an animated tour of ReconQA for people new to QA or AI.
// Every app text, number and finding is quoted from committed outputs (examples/ and evals/);
// the approval question in scene 7 is an example of the gate's wording, labelled as such.
// Needs Google Chrome (or Chromium) and ffmpeg on PATH. Linux/macOS.
//   node docs/media/make-story.mjs
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1000, H = 560;
const CHROME = process.env.CHROME || 'google-chrome';
const SHOT = 'data:image/png;base64,' + readFileSync(join(HERE, '..', '..', 'examples/juice-shop/qa/runs/shots/new-customer-registration-2026-11-26/TC-REG-012-step3.png')).toString('base64');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const ui = (s) => esc(s).replace(/«([^»]+)»/g, '<span class="ui">«$1»</span>');

const css = `*{box-sizing:border-box;margin:0}
body{width:${W}px;height:${H}px;overflow:hidden;color:#eef0f6;font:17px/1.45 "Ubuntu Sans","Noto Sans","DejaVu Sans",sans-serif,"Noto Color Emoji";
 background:radial-gradient(1200px 600px at 15% -10%,#2b1f5c 0%,transparent 60%),radial-gradient(900px 500px at 110% 120%,#0f3b4a 0%,transparent 55%),#0b0e16}
.mono{font-family:"Ubuntu Sans Mono","DejaVu Sans Mono",monospace}
.ui{color:#9fd0ff}.red{color:#ff8f9a}.green{color:#7ee8ad}.amber{color:#ffc46b}.dim{color:#8b93a7}.violet{color:#b9a4ff}
.center{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:16px;padding:40px 60px 70px}
.big{font-size:40px;font-weight:800;line-height:1.2;letter-spacing:-.01em}.mid{font-size:22px;color:#b4bccd}
.top{display:flex;align-items:center;gap:14px;padding:22px 30px 8px}
.step{background:linear-gradient(90deg,#7c5cff,#5b8cff);color:#fff;border-radius:999px;padding:5px 14px;font-weight:800;font-size:14px;letter-spacing:.03em}
.title{font-size:25px;font-weight:800}
.term{margin:8px 30px;background:#121725;border:1px solid #2c3550;border-radius:12px;padding:11px 16px;font-size:17px}
.term .p{color:#7ee8ad}.cursor{display:inline-block;width:9px;height:19px;background:#eef0f6;vertical-align:-3px;margin-left:2px}
.card{background:rgba(22,27,42,.92);border:1px solid #2c3550;border-radius:14px;padding:14px 16px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:10px 30px}
.cards h4{font-size:16px;color:#b4bccd;margin-bottom:8px;font-weight:700}
.quote{font-size:22px;font-weight:700;line-height:1.3}.cards .card{min-height:170px;padding:18px}
table{width:100%;border-collapse:collapse;font-size:15.5px}td,th{padding:6px 9px;border-bottom:1px solid #252d42;text-align:left;vertical-align:top}
th{color:#8b93a7;font-weight:700;font-size:12.5px;text-transform:uppercase;letter-spacing:.05em}
.tag{border-radius:7px;padding:2px 9px;font-size:13px;font-weight:800;white-space:nowrap}
.t-amber{background:#3c2b10;color:#ffc46b}.t-violet{background:#2c2145;color:#c9b2ff}.t-red{background:#3d1b22;color:#ff9aa6}.t-green{background:#123224;color:#7ee8ad}.t-blue{background:#132a45;color:#9fd0ff}
.wrap{margin:8px 30px}
.counter{font-size:56px;font-weight:900;line-height:1}.counter small{font-size:20px;font-weight:700;color:#b4bccd;margin-left:8px}
.row2{display:flex;gap:18px;align-items:stretch;margin:8px 30px}
.arrow{align-self:center;font-size:30px;color:#7c5cff}
.grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:12px 30px}
.cell{border-radius:8px;padding:8px 0;text-align:center;font-weight:800;font-size:14px}
.pass{background:#123224;color:#7ee8ad}.fail{background:#3d1b22;color:#ff9aa6}.wait{background:#161c2b;color:#4a5370}
.finding{display:flex;gap:14px;align-items:flex-start;margin:9px 30px}
.finding .ico{font-size:30px;line-height:1}
.dialog{margin:12px 70px;background:#141a28;border:1px solid #47507a;border-radius:14px;padding:16px 20px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.dialog h3{font-size:15px;color:#ffc46b;margin-bottom:8px}.opt{margin-top:12px;font-size:17px}.sel{color:#7ee8ad;font-weight:800}
.chips{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.chip{border:1px solid #39436a;background:#151b2c;border-radius:999px;padding:8px 16px;font-size:19px;font-weight:700}
.caption{position:absolute;left:0;right:0;bottom:12px;text-align:center;font-size:18px;color:#e6e8f0}
.caption span{background:rgba(124,92,255,.18);border:1px solid rgba(124,92,255,.45);border-radius:10px;padding:6px 14px}
.bar{position:absolute;left:0;bottom:0;height:4px;background:linear-gradient(90deg,#7c5cff,#2ec5ff)}
.list{display:grid;grid-template-columns:1fr 1fr;gap:8px 28px;text-align:left;font-size:19px;margin-top:6px}`;

// Fade-in: element k is hidden before beat k, fades in during beat k, then stays.
const op = (t, k) => Math.max(0, Math.min(1, t - k + 1));
const show = (t, k) => `opacity:${op(t, k)};transform:translateY(${(1 - op(t, k)) * 10}px)`;
const header = (n, title) => `<div class="top"><span class="step">${n} / 6</span><span class="title">${title}</span></div>`;
const term = (cmd, typed, cursor) => `<div class="term mono"><span class="p">&gt;</span> ${esc(cmd.slice(0, typed))}${cursor ? '<span class="cursor"></span>' : ''}</div>`;
const caption = (text) => `<div class="caption"><span>${text}</span></div>`;

// A scene with a typed command, then beats 1..n each fading in and holding.
function scene({ cmd, build, beats, holdLast = 2.8, hold = 1.1 }) {
  const frames = [];
  if (cmd) for (let i = 0; i <= cmd.length; i += 4) frames.push([{ typed: Math.min(i, cmd.length), t: 0, cursor: true }, 0.05]);
  const typed = cmd ? cmd.length : 0;
  frames.push([{ typed, t: 0, cursor: !!cmd }, cmd ? 0.35 : 0.2]);
  for (let k = 1; k <= beats; k++) {
    for (const f of [0.35, 0.7]) frames.push([{ typed, t: k - 1 + f }, 0.06]);
    const h = typeof hold === 'function' ? hold(k) : hold;
    frames.push([{ typed, t: k }, k === beats ? holdLast : h]);
  }
  return { build, frames };
}
const scenes = [];

// 0. Hook
scenes.push(scene({ beats: 3, hold: 1.2, holdLast: 2.4, build: ({ t }) => `<div class="center">
  <div class="big" style="${show(t, 1)}">The ticket says one thing.</div>
  <div class="big" style="${show(t, 2)}">The app does <span class="amber">another</span>.</div>
  <div style="${show(t, 3)}"><div class="mid" style="margin-bottom:14px">ReconQA looks at your app <b>first</b>, then writes and runs your test cases.</div>
  <div class="chips"><span class="chip">🌐 Websites</span><span class="chip">📱 Android apps</span><span class="chip">🔌 REST APIs</span></div></div></div>` }));

// 1. Look at the app: one real message per platform
const c1 = '/reconqa:explore sign-up';
scenes.push(scene({ cmd: c1, beats: 3, hold: 0.9, holdLast: 3, build: ({ typed, t, cursor }) => `${header(1, '👀 Look at the app')}${term(c1, typed, cursor)}
  <div class="cards">
   <div class="card" style="${show(t, 1)}"><h4>🌐 Shop website</h4><div class="quote ui">«Password must be 5-40 characters long.»</div><div class="dim" style="margin-top:6px">under Password, at 4 characters</div></div>
   <div class="card" style="${show(t, 2)}"><h4>📱 Android habit app</h4><div class="quote ui">«Cannot be blank»</div><div class="dim" style="margin-top:6px">a popup that only shows after tapping the red icon</div></div>
   <div class="card" style="${show(t, 3)}"><h4>🔌 Bank account API</h4><div class="quote"><span class="tag t-amber">422</span> <span class="ui">«Invalid value»</span></div><div class="dim" style="margin-top:6px">for each missing field</div></div>
  </div><div class="wrap green" style="font-size:19px;${show(t, 3)}">✓ Saved as app notes: every field, button, rule and exact message</div>${caption('It clicks, taps or calls each screen and copies <b>every</b> message exactly: the "app notes".')}` }));

// 2. Old cases -> conflict list
const c2 = '/reconqa:kb import old-cases.csv';
const conflicts = [['C1044', 'Expects "Invalid login"', '«Invalid email or password.»', 'outdated', 't-amber'],
  ['C1029', '12 security questions', '14 in the list', 'outdated', 't-amber'],
  ['C1081', '7-character passwords refused', 'Accepts 5 to 40 characters', 'ask the team', 't-violet']];
scenes.push(scene({ cmd: c2, beats: 4, hold: 0.7, holdLast: 3, build: ({ typed, t, cursor }) => `${header(2, '📚 Check your old test cases')}${term(c2, typed, cursor)}
  <div class="row2"><div class="card" style="${show(t, 1)};flex:0 0 210px;display:flex;flex-direction:column;justify-content:center"><div class="counter green">12<small>of 12</small></div><div class="dim" style="margin-top:6px">outdated cases found among 100 old ones, no false alarms</div></div>
  <div class="card" style="flex:1;${show(t, 1)}"><table><tr><th>Old case</th><th>Expects</th><th>App really shows</th><th></th></tr>
  ${conflicts.map(([id, a, b, k, c], i) => `<tr style="${show(t, i + 2)}"><td class="dim">${id}</td><td>${ui(a)}</td><td>${ui(b)}</td><td><span class="tag ${c}">${k}</span></td></tr>`).join('')}</table></div></div>
  <div class="row2" style="${show(t, 4)}"><div class="card" style="flex:1">🔎 <b>53 cases</b> about screens not explored yet: marked <span class="tag t-blue">not checked</span>, never guessed</div>
  <div class="card" style="flex:1">🛡️ One old case said <span class="mono amber">"ignore previous instructions…"</span>: flagged and ignored</div></div>
  ${caption('Your old cases and manual are checked against the real app. You get a <b>conflict list</b>, not guesses.')}` }));

// 3. Screen not built yet -> borrow from a similar feature
const c3 = '/reconqa:write-cases tickets/change-password.md --pre-ui';
const borrowed = [['Please repeat your password.', true], ['Password must be 5-40 characters long.', true], ['Passwords do not match', true], ['Please provide a password.', false]];
scenes.push(scene({ cmd: c3, beats: 6, hold: (k) => (k === 2 ? 1.3 : 0.6), holdLast: 3.4, build: ({ typed, t, cursor }) => `${header(3, '🪞 Screen not built yet? Borrow from a similar one')}${term(c3, typed, cursor)}
  <div class="row2">
   <div class="card" style="flex:1;${show(t, 1)}"><h4 class="dim" style="font-size:14px;margin-bottom:6px">THE TICKET</h4><div style="font-weight:700">Change password</div><div class="dim">"Messages to follow the existing account screens." · <b style="color:#eef0f6">0 exact texts</b></div></div>
   <div class="arrow" style="${show(t, 2)}">⟵</div>
   <div class="card" style="flex:1.1;${show(t, 2)}"><h4 class="dim" style="font-size:14px;margin-bottom:6px">MOST SIMILAR SCREEN ALREADY EXPLORED</h4><div style="font-weight:700">Sign up</div><div class="dim">shares Password and Repeat Password</div></div>
  </div>
  <div class="card wrap" style="${show(t, 3)}"><table><tr><th>Borrowed message</th><th>Later, on the real screen</th></tr>
  ${borrowed.map(([m, ok], i) => `<tr style="${show(t, i + 3)}"><td><span class="tag t-blue">borrowed</span> <span class="ui">«${esc(m)}»</span></td><td>${t >= 6 ? (ok ? '<span class="green">✓ exactly right</span>' : '<span class="amber">≠ «Please provide your new password.» → question for the team</span>') : '<span class="dim">…</span>'}</td></tr>`).join('')}</table></div>
  ${caption('Cases are often written <b>before</b> the screen exists. Borrowed texts: <b>3 of 4</b> exactly right.')}` }));

// 4. Run
const c4 = '/reconqa:run-cases qa/cases/new-customer-registration.md';
scenes.push({ build: ({ typed, done, cursor }) => `${header(4, '▶️ Run the cases')}${term(c4, typed, cursor)}
  <div class="grid">${Array.from({ length: 14 }, (_, i) => `<div class="cell ${i < done ? (i === 11 ? 'fail' : 'pass') : 'wait'}">${i < done ? (i === 11 ? '✗' : '✓') : '·'} ${String(i + 1).padStart(2, '0')}</div>`).join('')}</div>
  <div class="wrap" style="opacity:${done >= 14 ? 1 : 0};font-size:19px"><b class="green">13 passed</b> · <b class="red">1 failed</b>: TC-REG-012, the strength bar stays visible after the switch is turned off.</div>
  <div style="opacity:${done >= 14 ? 1 : 0};position:relative;width:380px;margin:4px auto"><img src="${SHOT}" style="width:380px;border-radius:10px;border:1px solid #2c3550;display:block"><div style="position:absolute;left:${443 * 380 / 1280 - 5}px;top:${557 * 380 / 1280 - 5}px;width:${394 * 380 / 1280 + 10}px;height:12px;border:3px solid #ff5f6d;border-radius:7px"></div></div>
  ${caption('Step by step, pass or fail, with a screenshot of every failure (real one above).')}`,
  frames: [...Array.from({ length: Math.ceil(c4.length / 4) + 1 }, (_, i) => [{ typed: Math.min(c4.length, i * 4), done: 0, cursor: true }, 0.05]),
    ...Array.from({ length: 15 }, (_, i) => [{ typed: c4.length, done: i, cursor: false }, i === 14 ? 2.8 : 0.14])] });

// 5. Extreme mode
const c5 = '/reconqa:break sign-up form';
const findings = [['🌐', 'major', 'The same email in another letter case (<span class="mono">RECONQA@…</span>) creates a <b>second account</b>.'],
  ['🔌', 'major', 'A broken request shows an error page with the server\'s <b>stack trace and file paths</b>.'],
  ['📱', 'major', 'A habit name of only spaces is saved: a <b>blank-looking habit</b>.']];
scenes.push(scene({ cmd: c5, beats: 4, hold: 1.1, holdLast: 3.2, build: ({ typed, t, cursor }) => `${header(5, '💥 Extreme mode: try to break it')}${term(c5, typed, cursor)}
  <div class="wrap dim" style="${show(t, 1)}">On websites, Android apps and APIs: very long and strange text, emoji, double clicks, Back while saving, broken requests, and a random "monkey" on Android…</div>
  ${findings.map(([ico, sev, text], i) => `<div class="finding card" style="${show(t, i + 2)}"><span class="ico">${ico}</span><div><span class="tag t-red">${sev}</span> ${text}</div></div>`).join('')}
  ${caption('<b>15 real problems</b> on three practice apps, each with steps to repeat it.')}` }));

// 6. Asks first, then sends to your tools
scenes.push(scene({ beats: 3, hold: 1.4, holdLast: 3, build: ({ t }) => `${header(6, '✋ Nothing leaves without your OK')}
  <div class="dialog" style="${show(t, 1)}"><h3>ReconQA write, check before approving</h3>
   <div class="mono" style="font-size:14.5px">createJiraIssue on QA · summary: Habit name of only spaces is saved · description: Steps 1. Add habit 2. Type 3 spaces in Name 3. Save …</div>
   <div class="opt"><span class="${t >= 2 ? 'sel' : ''}">${t >= 2 ? '❯ ' : '&nbsp;&nbsp;'}Yes</span> &nbsp;&nbsp;&nbsp; No</div></div>
  <div class="dim" style="text-align:center;font-size:14px;${show(t, 1)}">(example of the question you see)</div>
  <div class="chips" style="margin-top:16px;${show(t, 3)}"><span class="chip">🐙 GitHub Issues</span><span class="chip">🟦 Jira</span><span class="chip">🧪 TestRail</span></div>
  ${caption('Bugs and cases go to your tools only after you see them and say yes. Deletes are never allowed.')}` }));

// 7. End card
const feats = ['👀 Looks at the app first', '📚 Checks old cases and manuals', '🪞 Learns from similar screens', '▶️ Runs cases, drafts bugs', '💥 Extreme mode', '✋ Asks before anything is sent'];
scenes.push(scene({ beats: 2, hold: 0.8, holdLast: 4, build: ({ t }) => `<div class="center">
  <div class="big" style="${show(t, 1)}">🔍 ReconQA</div>
  <div class="mid" style="${show(t, 1)}">An AI helper for testers. No coding needed. Free and open source.</div>
  <div class="list" style="${show(t, 2)}">${feats.map((f) => `<div>${f}</div>`).join('')}</div>
  <div class="mono dim" style="font-size:17px;margin-top:8px;${show(t, 2)}">github.com/faisal-koradiya/reconqa</div></div>` }));

// ---- render ----
const frames = [];
const total = scenes.reduce((n, s) => n + s.frames.reduce((a, [, d]) => a + d, 0), 0);
let elapsed = 0;
for (const s of scenes) for (const [state, d] of s.frames) {
  const progress = `<div class="bar" style="width:${((elapsed + d) / total) * 100}%"></div>`;
  frames.push([`<!doctype html><meta charset="utf-8"><style>${css}</style><body>${s.build(state)}${progress}</body>`, d]);
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
await Promise.all(Array.from({ length: 8 }, async () => { while (next < frames.length) await shoot(next++); }));
if (process.env.KEEP_FRAMES) { console.log(`frames kept in ${work}`); }
let list = frames.map(([, d], i) => `file '${join(work, `f${i}.png`)}'\nduration ${d}\n`).join('');
list += `file '${join(work, `f${frames.length - 1}.png`)}'\n`;
writeFileSync(join(work, 'list.txt'), list);
const out = join(HERE, 'story.gif');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(work, 'list.txt'),
  '-vf', 'fps=15,split[a][b];[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', '-loop', '0', out]);
if (!process.env.KEEP_FRAMES) rmSync(work, { recursive: true, force: true });
console.log(`wrote ${out}: ${frames.length} frames, ${total.toFixed(1)} s`);
