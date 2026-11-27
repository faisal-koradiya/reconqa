# Reconcile eval

Do cases written **before the screen existed** get checked correctly once it exists?

**Setup.** A fictional spec ticket (`examples/juice-shop/tickets/registration-spec.md`) quotes 20
screen texts. While the cases were written, the atlas was hidden (pre-UI mode). Then
`/reconqa:reconcile` compared them with the real Juice Shop registration screen. The answer key
(`planted.json`) says where each text belongs:

| Group | Texts | Example |
|---|---|---|
| confirmed (exact) | 10 | "Passwords do not match" |
| confirmed after normalising case or end punctuation | 3 | "Security question" → «Security Question» |
| different (planted changes) | 5 | "Create account" → the screen says «Register» |
| not found | 2 | "I accept the terms and conditions" (no such checkbox) |

Some texts appear more than once in the cases, so a run sorts 26 items.

**Results** (Claude Sonnet, 3 runs, 2026-11-26):

| | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Pre-UI cases: ticket texts marked ‹expected› | 20/20 | (same cases) | (same cases) |
| Pre-UI cases: «» used before the screen existed | 0 | | |
| Items sorted into a group | 26/26 | 26/26 | 26/26 |
| Items in the right group (and right screen text for "different") | 26/26 | 26/26 | 26/26 |
| Planted changes found as "different" | 9/9 | 9/9 | 9/9 |
| Texts wrongly confirmed | 0 | 0 | 0 |
| Cost | $0.22 | $0.28 | $0.23 |

No spread across runs. The script alone (no model review) gets 21 of 26 right and never confirms a
wrong text; the model's review fixes the rest (e.g. that "Create account" is the «Register» button).
"Sign up with Google" counts as right in either "different" (the login page has «Log in with
Google») or "not found".

**Limits.** One ticket, one screen, one app (our plan's own rule asks for at least five tickets, so
this is short of it); the planted changes are ones we chose. Check the
"different" list with the team as you would any finding.

Files: `runs/plan-run*.json` (plans after review), `runs/report-run1.md` (dry-run report),
`runs/*.json` (cost and score per run). Score again with
`node scripts/score-reconcile.mjs evals/reconcile/runs/plan-run1.json`.
