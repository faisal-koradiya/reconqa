#!/usr/bin/env node
// Builds docs/media/side-by-side.gif from the committed RWA eval outputs
// (evals/write-cases/rwa/runs/baseline-ticket-only.cases.md vs grounded.cases.md).
// Needs Google Chrome (or Chromium) and ffmpeg on PATH. Linux/macOS.
//   node docs/media/make-side-by-side.mjs
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1200, H = 570;
const CHROME = process.env.CHROME || 'google-chrome';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const q = s => esc(s).replace(/«([^»]+)»/g, '<span class="ui">«$1»</span>');

// Text is quoted from the committed run outputs; only shortened.
const scenes = [
  { ac: 'AC4 · Bank Name at least 3 characters',
    left: ['TC-06 Bank Name length boundaries', 'Bank Name = abcd (4 characters)', 'No error. Save is enabled'],
    leftBad: 'The app shows «Must contain at least 5 characters». The tester logs a false bug.',
    right: ['TC-ONB-005 Bank Name with 4 characters is rejected', 'Enter Abcd in «Bank Name».', '«Must contain at least 5 characters» is shown under «Bank Name».'],
    rightGood: 'MM1 mismatch: Is the minimum 3 or 5?' },
  { ac: 'AC6 · Account Number 10 to 12 digits',
    left: ['TC-08 Account Number: 10 to 12 digits', 'Account Number = 123456789 (9 digits)', 'An inline error is shown. Save is disabled'],
    leftBad: 'The app accepts 9 digits. Another false bug.',
    right: ['TC-ONB-011 Account Number with 9 digits is accepted', 'Enter 123456789 in «Account Number» and leave the field.', 'No error is shown under «Account Number».'],
    rightGood: 'MM2 mismatch: Is the minimum 9 or 10 digits?' },
  { ac: 'AC8 · "Skip for now" link',
    left: ['TC-10 Skip for now', 'On Step 2, click Skip for now', 'The onboarding dialog closes.'],
    leftBad: 'There is no such link in the app. The case cannot be run.',
    right: ['Mismatch list', 'Step 1 has «Logout» and «Next»; step 2 has «Save» and «Logout».', 'No skip link.'],
    rightGood: 'MM4 missing in app: Is the skip option still planned?' },
  { ac: 'AC9 · Confirmation text',
    left: ['TC-05 Happy path: save a bank account', 'Click Save', 'Text: Your bank account has been added.'],
    leftBad: 'The app says something else. One more false bug.',
    right: ['Mismatch list', 'Step 3 shows «Finished» and «You\'re all set!».', ''],
    rightGood: 'MM6 mismatch: Which confirmation text is correct?' },
];

const css = `
*{box-sizing:border-box;margin:0}body{width:${W}px;height:${H}px;background:#0f1117;color:#e6e8ee;
font:17px/1.45 "Inter","Segoe UI","DejaVu Sans",sans-serif;padding:28px 32px;overflow:hidden}
h1{font-size:26px;font-weight:700;margin-bottom:4px}.sub{color:#9aa3b5;font-size:16px;margin-bottom:18px}
.ac{display:inline-block;background:#262b38;border:1px solid #3a4152;border-radius:8px;padding:6px 14px;font-size:17px;margin-bottom:16px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.col{border-radius:12px;padding:18px 20px;min-height:330px;border:1px solid #2c3242;background:#161a23}
.col h2{font-size:15px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:14px}
.l h2{color:#f0a35e}.r h2{color:#6fd3a0}
.case{font-weight:700;margin-bottom:10px}.k{color:#8d96a8;font-size:13px;text-transform:uppercase;letter-spacing:.05em;margin-top:8px}
.v{font-family:"JetBrains Mono","DejaVu Sans Mono",monospace;font-size:15.5px;background:#0f1117;border-radius:6px;padding:7px 10px;margin-top:3px}
.ui{color:#8fc7ff}
.bad,.good{margin-top:18px;border-radius:8px;padding:10px 14px;font-weight:600}
.bad{background:#3a1d22;border:1px solid #7a2e38;color:#ffb3bd}.good{background:#14301f;border:1px solid #2d6b45;color:#a9f0c5}
.hide{visibility:hidden}
table{width:100%;border-collapse:collapse;margin-top:10px;font-size:20px}td,th{padding:14px 16px;border-bottom:1px solid #2c3242;text-align:left}
th{color:#9aa3b5;font-weight:600;font-size:16px}td.n{font-weight:700}.o{color:#f0a35e}.g{color:#6fd3a0}
.foot{position:absolute;bottom:20px;left:32px;color:#7c8598;font-size:14px}`;

const head = `<h1>Same ticket, same model</h1><div class="sub">Bank account onboarding in a demo app (Cypress Real World App). The ticket has 4 planted mistakes.</div>`;
const foot = `<div class="foot">Shortened from the unedited outputs in evals/write-cases/rwa/runs · Sonnet, one run each</div>`;

function scenePage(s, showRight) {
  const col = (cls, title, lines, note, noteCls, hidden) => `<div class="col ${cls} ${hidden ? 'hide' : ''}"><h2>${title}</h2>
    <div class="case">${q(lines[0])}</div><div class="k">Step</div><div class="v">${q(lines[1])}</div>
    ${lines[2] ? `<div class="k">Expected</div><div class="v">${q(lines[2])}</div>` : ''}
    <div class="${noteCls}">${noteCls === 'bad' ? '✗ ' : '✓ '}${q(note)}</div></div>`;
  return `${head}<div class="ac">Ticket says ${esc(s.ac)}</div><div class="cols">
    ${col('l', 'AI with the ticket only', s.left, s.leftBad, 'bad', false)}
    ${col('r', 'ReconQA, after exploring the app', s.right, s.rightGood, 'good', !showRight)}</div>${foot}`;
}
const summary = `${head}<table><tr><th></th><th class="o">Ticket only</th><th class="g">ReconQA</th></tr>
<tr><td>UI texts in the cases that exist in the app</td><td class="n o">74 of 85</td><td class="n g">97 of 97</td></tr>
<tr><td>Planted mismatches flagged</td><td class="n o">0 of 4</td><td class="n g">4 of 4 (+1 false flag)</td></tr>
<tr><td>Expected results that lead to a false bug</td><td class="n o">4</td><td class="n g">0 found</td></tr></table>${foot}`;

const frames = []; // [html, seconds]
for (const s of scenes) { frames.push([scenePage(s, false), 1.6]); frames.push([scenePage(s, true), 3.6]); }
frames.push([summary, 5]);

const work = join(tmpdir(), `reconqa-gif-${process.pid}`);
mkdirSync(work, { recursive: true });
let list = '';
frames.forEach(([body, secs], i) => {
  const html = join(work, `f${i}.html`), png = join(work, `f${i}.png`);
  writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>${css}</style><body>${body}</body>`);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${W},${H}`,
    `--screenshot=${png}`, 'file://' + html], { stdio: 'ignore' });
  list += `file '${png}'\nduration ${secs}\n`;
});
list += `file '${join(work, `f${frames.length - 1}.png`)}'\n`; // concat demuxer needs the last file twice
writeFileSync(join(work, 'list.txt'), list);
const out = join(HERE, 'side-by-side.gif');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(work, 'list.txt'),
  '-vf', 'fps=10,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=none', '-loop', '0', out]);
rmSync(work, { recursive: true, force: true });
console.log('wrote', out);
