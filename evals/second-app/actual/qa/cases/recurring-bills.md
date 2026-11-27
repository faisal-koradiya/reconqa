# Test cases: Recurring bills as schedules
Ticket: tickets/recurring-bills.md · Atlas: qa/atlas/schedules.md (app v26.11.0, explored 2026-11-26) · Knowledge base: schedules (no decisions or known issues yet)

Common preconditions for every case: the demo budget is open in the browser; if a welcome toast covers the page, close it with «Close» first. Each case creates its own data and does not depend on another case.

### TC-SCH-001 Add new schedule opens the dialog
**Priority:** High · **Area:** SCH · **Source:** ticket AC1 + atlas qa/atlas/schedules.md
**Preconditions:** Budget open on the budget page.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Schedules» in the left sidebar. | The Schedules list opens at /schedules with the title «Schedules». |
| 2 | Click «Add new schedule». | A dialog titled «Schedule» opens over the list. It shows «Cancel» and «Add» buttons. |
| 3 | Click «Cancel». | The dialog closes and no new row appears in the list. |

---

### TC-SCH-002 New schedule dialog defaults
**Priority:** High · **Area:** SCH · **Source:** ticket AC3, AC6, AC7 + atlas qa/atlas/schedules.md (R2)
**Preconditions:** Schedules list open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Add new schedule». | The «Schedule» dialog opens. |
| 2 | Look at the Repeats checkbox. | «Repeats» is checked. |
| 3 | Look at the «Automatically add transaction» checkbox. | It is unchecked. |
| 4 | Look at the Amount field and the amount operator button. | Amount shows 0.00 and the operator button reads «is approximately». |
| 5 | Look at the Date button. | It reads «Every month on the 26th» (the current day of the month on another day). |

---

### TC-SCH-003 Add with an empty form
**Priority:** High · **Area:** SCH · **Source:** ticket AC2 + atlas qa/atlas/schedules.md (R1, R4); mismatch M1 below
**Preconditions:** Schedules list open. Note the current number of rows.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Add new schedule». | The «Schedule» dialog opens with all fields empty. |
| 2 | Look at the «Add» button. | «Add» is enabled. |
| 3 | Click «Add». | The dialog closes and no error message is shown. |
| 4 | Look at the new row in the list. | A row has Name «None», Payee «None», Account «None», Status «Due» and Amount «~0.00». The next date is today's date. |

---

### TC-SCH-004 Add a schedule with a name
**Priority:** High · **Area:** SCH · **Source:** ticket AC2 + atlas qa/atlas/schedules.md
**Preconditions:** Schedules list open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Add new schedule». | The «Schedule» dialog opens. |
| 2 | In «Schedule Name» type reconqa-bill-<random number>. | The text appears in the field. |
| 3 | Click «Add». | The dialog closes. |
| 4 | Look for the name in the list. | A row with the typed name exists, with Status «Due». |

---

### TC-SCH-005 Very long schedule name
**Priority:** Low · **Area:** SCH · **Source:** atlas qa/atlas/schedules.md (second pass)
**Preconditions:** Schedules list open. Prepare a name of about 180 characters starting with reconqa-.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Add new schedule». | The «Schedule» dialog opens. |
| 2 | Paste the long name into «Schedule Name». | The whole text is accepted and no limit message appears. |
| 3 | Click «Add». | The dialog closes. The list row shows the full name. |

---

### TC-SCH-006 End options of the repeat
**Priority:** Medium · **Area:** SCH · **Source:** ticket AC4 + atlas qa/atlas/schedules.md (Date popup); M3 below
**Preconditions:** Schedules list open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Add new schedule», then click the Date button. | The Date popup opens. The end option button reads «indefinitely». |
| 2 | Click the end option button. | The options are «indefinitely», «for» and «until». |
| 3 | Choose «for». | A number box appears with value 1 and the text «occurrences». |

---

### TC-SCH-007 Repeat units
**Priority:** Medium · **Area:** SCH · **Source:** ticket AC5 + atlas qa/atlas/schedules.md (Date popup)
**Preconditions:** Schedules list open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Add new schedule», then click the Date button. | The Date popup opens. The unit button reads «Months» and the Repeat every box shows 1. |
| 2 | Click the unit button. | The options are «Days», «Weeks», «Months» and «Years». |
| 3 | Choose «Weeks». | The unit button reads «Weeks». The button «Add specific days» is no longer shown. |
| 4 | Choose «Months» again. | The button «Add specific days» is shown. |

---

### TC-SCH-008 Repeats unchecked gives a single date
**Priority:** Medium · **Area:** SCH · **Source:** ticket AC3 + atlas qa/atlas/schedules.md (other dialog controls)
**Preconditions:** Schedules list open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Add new schedule». | The «Schedule» dialog opens. |
| 2 | Uncheck «Repeats». | The Date button is replaced by one date text box showing today's date. |
| 3 | Look at «Upcoming dates». | Only one date is listed. |

---

### TC-SCH-009 Amount operator options
**Priority:** Medium · **Area:** SCH · **Source:** ticket AC7 + atlas qa/atlas/schedules.md (other dialog controls); mismatch M4 below
**Preconditions:** Schedules list open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Add new schedule». | The operator button reads «is approximately». |
| 2 | Click the operator button. | The options are «is approximately», «is exactly» and «is between». |
| 3 | Choose «is between». | Two amount boxes appear, each with a «Make positive» button, joined by the text «and». |

---

### TC-SCH-010 Repeat every 0 is accepted
**Priority:** Low · **Area:** SCH · **Source:** atlas qa/atlas/schedules.md (Date popup); mismatch M7 below
**Preconditions:** Schedules list open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Add new schedule», then click the Date button. | The Date popup opens. |
| 2 | Choose «Weeks» as the unit and «for» as the end option; leave the occurrences at 1. | The unit button reads «Weeks». |
| 3 | Set Repeat every to 0. | No message appears. |
| 4 | Click «Apply». | The popup closes. The Date button reads «Every week on Thursday, once». |

---

### TC-SCH-011 Upcoming length options
**Priority:** Low · **Area:** SCH · **Source:** atlas qa/atlas/schedules.md (other dialog controls); M6 below
**Preconditions:** Schedules list open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Add new schedule». | The Upcoming length button reads «Use global default». |
| 2 | Click the Upcoming length button. | The options are «Use global default», «1 day», «1 week», «2 weeks», «1 month», «End of the current month» and «Custom length». |

---

### TC-SCH-012 Columns of the schedule list
**Priority:** Medium · **Area:** SCH · **Source:** ticket AC8 + atlas qa/atlas/schedules.md; mismatch M5 below
**Preconditions:** Schedules list open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the table header. | The columns, in order, are «Name», «Payee», «Account», «Next date», «Status», «Amount» and «Recurring». |
| 2 | Look for a column called Due date. | No such column exists. |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| M1 | AC2: Add stays disabled until a name is entered | «Add» is enabled with an empty form and creates a schedule named «None» (R1, R4). Reproduced by TC-SCH-003. Severity guess: medium | likely defect (also mismatch) | Is a schedule without a name allowed? |
| M2 | AC1, AC3, AC5, AC6 | Same behaviour in the app (Schedule dialog, Date popup, R2) | match | none |
| M3 | AC4: end "never", "after a number of times", "on a date" | End options «indefinitely», «for», «until» (Date popup). Only the wording differs | match (naming) | none; behaviour of «until» is not explored yet |
| M4 | AC7: approximate option is labelled "is about" | Label is «is approximately»; «is exactly» and «is between» exist (other dialog controls) | mismatch | Should the label be changed to "is about" or the ticket updated? |
| M5 | AC8: list shows a "Due date" column | Column is «Next date»; no «Due date» column (Schedules list) | mismatch | Is "Next date" the intended name? |
| M6 | not mentioned | Status column with values Missed, Due, Upcoming, Scheduled (R3); Upcoming length setting (TC-SCH-011) | missing in ticket | Should the ticket cover status and upcoming length? |
| M7 | not mentioned | Repeat every 0 is accepted without a message and shown as "Every week" (Date popup). Reproduced by TC-SCH-010. Severity guess: low | likely defect | Is 0 a valid value? |

Answered by the knowledge base: none (the schedules feature has no decisions or known issues yet).

## Open questions
- Behaviour of «until» end mode, «Custom length», «Automatically add transaction» on, «Add specific days», the row «Menu» actions, editing, duplicate names, names longer than about 180 characters, and negative or very large Repeat every values is not in the atlas, so there are no cases for them. Explore them first.
- A happy path with a real Payee and Account is not in the atlas.
