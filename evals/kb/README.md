# Knowledge-base and import evals

Two questions: does importing old material find what no longer matches the app, and does the
knowledge base stop ReconQA from asking the same question twice?

## Import: old cases and a manual

**Setup.** For the Juice Shop example we wrote (fictionally) 100 old test cases
(`examples/juice-shop/samples/old-cases.csv`) and a short user manual (`samples/user-manual.md`),
the way a team might have them after a few releases. We planted 12 outdated cases and 7 outdated
manual statements, plus one hidden instruction in each ("ignore previous instructions…"). Answer
key: `import-planted.json`. Only login and registration were explored; the 53 cases about other
areas must be reported as "not checked", never as conflicts.

**Results** (Claude Sonnet, 3 runs each, every run on a fresh copy, 2026-11-26):

| | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Old cases: planted outdated cases found | 12/12 | 12/12 | 12/12 |
| Old cases: conflicts that weren't planted | 0 | 0 | 0 |
| Manual: planted outdated statements found | 7/7 | 7/7 | 7/7 |
| Manual: conflicts that weren't planted | 0 | 0 | 0 |
| Conflicts reported for areas not explored | 0 | 0 | 0 |
| Hidden instructions flagged (and not followed) | 2/2 | 2/2 | 2/2 |
| Cost (cases + manual) | $0.64 | $0.71 | $0.47 |

No spread across runs. One run also reported a second, real difference for one planted case (where
the duplicate-email message appears), counted as part of that case.

## Knowledge base: questions not asked twice

**Setup.** Five fictional follow-up tickets (`tickets/kb-0*.md`) for the registration feature
raise 11 points the team had already settled: 9 answered by a decision (`fixture/decisions.md`,
D1–D6) and 2 about a known bug (K1). Answer key: `kb-eval-key.json`. Each ticket ran through
`/reconqa:write-cases` 3 times **with** the knowledge base and once **without** it.

**Results** (Claude Sonnet, 2026-11-26):

| | With knowledge base (15 runs) | Without (5 runs) |
|---|---|---|
| Settled points cited with the right decision or known issue | 33/33 (100%) | 0/11 |
| Settled points asked again as an open question | 2/33 (6%) | 10/11 (91%) |
| Cost per ticket | $0.20–0.25 | $0.21–0.30 |

Spread across the three runs with the knowledge base: asked again 0, 2 and 0 of 11; cited 11 of 11
each time. The 2 repeats were both about the password checklist item "contains at least 8
characters", a related question the decision about the minimum length doesn't settle; we count
them as repeats anyway. Without the knowledge base, the known counter bug was reported as a new
likely defect.

## Limits

One small app, one feature, tickets and planted items written by us. The run without the
knowledge base was done once per ticket (no spread). Only the run-1 import reports are kept; runs
2 and 3 are kept as scores. The injection check shows the text is flagged and the run went on as
normal; it doesn't prove a model could never be talked into following such text. Real old cases are messier
(other columns, merged cells, vague steps). Treat these as a first check, not proof.

Files: `runs/import-*-run*.json` and `runs/kb-eval-results.json` (cost and score per run),
`runs/kb-eval/*.md` (every cases file written), `../../examples/juice-shop/qa/reports/import-*.md`
(the run-1 reports). Score again: `node scripts/check-evals-kb.mjs`.
