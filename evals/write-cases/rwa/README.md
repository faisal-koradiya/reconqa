# Side by side: ticket-only vs ReconQA (Cypress Real World App, 2026-11-26)

Ticket: `bank-account-onboarding.ticket.md` (fictional, 4 planted mismatches; labels in
`bank-account-onboarding.mismatches.md`). Atlas: `../../explore/rwa-signin-signup.run3-atlas.md`.
Both runs: Sonnet, headless. Outputs unedited in `runs/`.

| | Ticket only (`runs/baseline-ticket-only.cases.md`) | ReconQA write-cases (`runs/grounded.cases.md`) |
|---|---|---|
| Cost | 3 turns, ~$0.14 | 13 turns, ~$0.30 (85 s) |
| UI strings that exist in the app | 74/85 | **97/97** (a gate: the skill loops until the check passes, so this is guaranteed, not a quality score) |
| Planted mismatches flagged | 0/4 (none; ticket taken as truth) | **4/4** |
| Wrong expected results a tester would hit | Bank Name 3–4 chars "no error" (app needs 5); 9-digit account "error" (app accepts 9); "Skip for now" link; "Your bank account has been added." | none found: cases test the app and point to the mismatch rows |
| Defect found | — | missing space in "transactions.Click" |
| Precision of "mismatch" label | — | 4/5 = 80%, n=5: **on track**, not proven (AC10 "home feed" vs "transactions feed" flagged; the home feed *is* the transaction feed → counts as false) |

Limits (from the M1+M2a gate): one ticket, one run each, Sonnet only. The grounded column also needs
the explore run that built the atlas (~$0.47). The baseline was told to use the ticket only; a fairer
baseline (plain AI with browser access to the app) is still to do.
