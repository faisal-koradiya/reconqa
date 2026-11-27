# Second app: Actual Budget

Does ReconQA work on an app the model doesn't know well? Juice Shop is a famous training app;
[Actual Budget](https://actualbudget.org) (open-source budgeting, MIT licence) is less known and its
screens are full of options. We ran it locally (version 26.11.0, `127.0.0.1` only, demo budget)
and used the same skills, unchanged.

**Explore** (`actual/qa/atlas/`). Schedules took two passes ($0.31 + $1.82): the list, the
"Schedule" dialog, the repeat popup and its option lists, with two findings the app doesn't warn
about: an empty form saves a schedule named "None", and "Repeat every 0" is accepted. Rules took one
pass ($0.63): the list and the rule editor, also saving an empty rule without a message. Both pages
are marked partial with their open questions. The explorer left its test schedules and rule in the
demo budget and said so, because deleting is on its deny list.

**Import** (`actual/samples/old-cases.csv`): 30 old cases in a different export layout (Xray-style
columns, several rows per case), with 9 outdated cases planted (`actual/planted.json`) and 6 cases
about screens not explored yet.

| | Result |
|---|---|
| Planted outdated cases found | 9/9 |
| Conflicts that weren't planted | 0 |
| Cases about unexplored screens reported as "not checked" | 6/6 |
| Cost | $0.24 |

**Write cases** for a fictional ticket (`actual/tickets/recurring-bills.md`): 12 cases, 85 of 85
marked screen texts found in the atlas. Ticket vs app: 3 of 3 real mismatches found (Add enabled
with no name, "is about" vs «is approximately», "Due date" vs «Next date»), plus two fair extra
findings ("Repeat every 0" accepted; Status and Upcoming length not in the ticket). We had also
marked AC4 (how a repeat ends) as a mismatch; the model called it a match in meaning, and it was
right: the ticket describes the options in plain words that mean the same as the app's labels. We
corrected our key (`actual/ticket-key.json`). Cost $0.32.

**Cases before the screen, then reconcile.** With the atlas hidden, write-cases produced 13
pre-UI cases with 11 ‹expected› texts and no «» ($0.34). Reconcile then sorted all 11 correctly: 9
confirmed, 2 different ("is about" → «is approximately», "Due date" → «Next date»). The script
alone had paired "Due date" with «Date»; the model's review fixed it ($0.14).

**Limits.** One run each (not three), one feature explored in depth, old cases and tickets written
by us after exploring. It shows the same skills work on an unfamiliar app; it doesn't measure how
often.

Files: `actual/qa/` (atlas, cases, import report, knowledge base), `actual/runs/` (cost and result
of each run, reconcile plan).
