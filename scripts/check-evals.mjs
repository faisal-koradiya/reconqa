#!/usr/bin/env node
// CI gate over the committed write-cases outputs: each is grounded in its atlas, and overall
// mismatch precision and recall stay at or above the targets (PLAN: precision >= 80%).
import { readFileSync } from 'node:fs';
import { checkGrounding } from '../plugins/reconqa/scripts/check-grounding.mjs';
import { scoreMismatches } from './score-mismatches.mjs';

const JS = 'examples/juice-shop/qa/atlas/login-and-registration.md';
const RWA = 'evals/explore/rwa-signin-signup.run3-atlas.md';
const W = 'evals/write-cases';
const SETS = [
  ['examples/juice-shop/qa/cases/new-customer-registration.md', JS, `${W}/juice-shop/new-customer-registration.mismatches.md`],
  [`${W}/juice-shop/runs/customer-login.cases.md`, JS, `${W}/juice-shop/customer-login.mismatches.md`],
  [`${W}/juice-shop/runs/password-advice.cases.md`, JS, `${W}/juice-shop/password-advice.mismatches.md`],
  [`${W}/rwa/runs/grounded.cases.md`, RWA, `${W}/rwa/bank-account-onboarding.mismatches.md`],
  [`${W}/rwa/runs/user-sign-up.cases.md`, RWA, `${W}/rwa/user-sign-up.mismatches.md`],
  [`${W}/rwa/runs/user-sign-in.cases.md`, RWA, `${W}/rwa/user-sign-in.mismatches.md`],
];
const read = (f) => readFileSync(f, 'utf8');
let tp = 0, fp = 0, fn = 0, bad = 0;
for (const [cases, atlas, labels] of SETS) {
  const g = checkGrounding(read(cases), [read(atlas)]);
  if (g.missing.length || !g.checked) { bad++; console.log(`NOT GROUNDED ${cases}: ${g.missing.map((m) => m.text).join(' | ') || 'no marked strings'}`); }
  const s = scoreMismatches(read(labels), read(cases));
  tp += s.tp.length; fp += s.fp.length; fn += s.fn.length;
}
const precision = tp / (tp + fp), recall = tp / (tp + fn);
console.log(`evals: ${SETS.length} outputs, ${bad} not grounded · mismatch precision ${(precision * 100).toFixed(0)}% (${tp}/${tp + fp}) · recall ${(recall * 100).toFixed(0)}% (${tp}/${tp + fn})`);
process.exit(bad || precision < 0.8 || recall < 0.8 ? 1 : 0);
