# write-cases fixtures

Fictional tickets, each with hand labels against an atlas made by a real explore run.
Labels: **mismatch** (the run should flag it), match, or open question (atlas doesn't cover it:
flagging it as a mismatch counts as a false flag). Score with
`node scripts/score-mismatches.mjs <labels.md> <cases.md>`.

| Ticket | App / atlas | Planted mismatches |
|---|---|---|
| `examples/juice-shop/tickets/new-customer-registration.md` | Juice Shop, frozen atlas | 4 |
| `juice-shop/customer-login.ticket.md` | Juice Shop, frozen atlas | 3 |
| `juice-shop/password-advice.ticket.md` | Juice Shop, frozen atlas | 1 (+2 open questions) |
| `rwa/bank-account-onboarding.ticket.md` | RWA, `evals/explore/rwa-signin-signup.run3-atlas.md` | 4 |
| `rwa/user-sign-up.ticket.md` | RWA, same atlas | 3 |
| `rwa/user-sign-in.ticket.md` | RWA, same atlas | 2 (+1 open question) |

More fixtures come with more explored areas. Juice Shop is likely in model training
data, so RWA results weigh more.

## Results (2026-11-26, Sonnet, one run per ticket)
| Ticket | Grounding | Kit rules | Mismatch precision | Recall | Cost |
|---|---|---|---|---|---|
| new-customer-registration (sample) | 67/67 | 14 cases, 0 problems | 4/4 | 4/4 | ~$0.28 |
| customer-login | 41/41 | 11 cases, 0 problems | 3/3 | 3/3 | ~$0.26 |
| password-advice | 24/24 | 9 cases, 0 problems | 1/1 | 1/1 | ~$0.28 |
| bank-account-onboarding | 97/97 | — | 4/5 | 4/4 | ~$0.30 |
| user-sign-up | 50/50 | 10 cases, 0 problems | 3/3 | 3/3 | ~$0.24 |
| user-sign-in | 51/51 | 9 cases, 0 problems | 2/2 | 2/2 | ~$0.24 |
| **Total** | all grounded | 0 problems | **17/18 = 94%** | **17/17** | ~$0.27/ticket |

The 3 open-question criteria (atlas doesn't cover them) were all left as open questions, never
flagged. Caveats: n=1 run per ticket; grounding and kit rules are gates the skill loops on, not
quality scores; the first two rows ran on the skill before the M1+M2a gate changes; Juice Shop is
likely in training data. Outputs: `*/runs/`.
