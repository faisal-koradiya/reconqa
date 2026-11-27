# Test cases: Recurring bills as schedules

Ticket: tickets/recurring-bills.md · Atlas: none yet (pre-UI, written 2026-11-26)

These cases were written before the screens exist. Expected-text markers come from the ticket and must be
reconciled with the real screen once it is built: `/reconqa:reconcile qa/cases/recurring-bills.md`.

## Questions (gaps inside the ticket)
| # | Ticket item | Gap or contradiction | Suggested question |
|---|---|---|---|
| Q1 | AC2 | Only a name is stated as required. Other fields (account, payee, amount, date) are not mentioned. | Can a schedule be saved with only a name? Which other fields are required? |
| Q2 | AC2 | No rule for a name made only of spaces, a very long name, or a name that already exists. | Is a whitespace-only name accepted? Is there a length limit? Must names be unique? |
| Q3 | AC3 | "Repeats is checked" does not say which controls appear or hide when Repeats is unchecked. | What does the dialog show when Repeats is unchecked? What kind of schedule is saved? |
| Q4 | AC4 | "After a number of times" gives no limits for the number (0, negative, decimal, maximum). | What values are valid for the number of times? What is the default? |
| Q5 | AC4 | "On a date" does not say whether a date in the past, or before the schedule's start date, is accepted. | Is an end date in the past or before the start date rejected, and with what message? |
| Q6 | AC5 | Does not say whether the repeat can be set to every N units (for example every 2 weeks) or only every one. | Can the interval be more than 1? What is the maximum? |
| Q7 | AC6 | Only the default is given, not what happens when it is turned on. | What happens on the due date when the automatic transaction option is on? |
| Q8 | AC7 | Only the label of the approximate option is given. Labels of the exact and range options are not. For a range, the rule when the first amount is higher than the second is not given. | What are the labels of the other two options? Is a range with the first amount higher than the second rejected? |
| Q9 | AC8 | Does not say the order of the list, the date format, or what the column shows for a schedule that has no next date. | How is the list sorted and how is the due date formatted? |
| Q10 | General | Nothing says what happens after Add (dialog closes, new row appears) or how to cancel. | Does the dialog close after Add and does the schedule appear in the list at once? |

---

### TC-SCHED-001 Open the new schedule dialog from the Schedules page
**Priority:** High · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC1
**Preconditions:** Logged in as a test user with an open budget file.

| # | Step | Expected |
|---|---|---|
| 1 | Open the Schedules page. | The Schedules page is shown with a ‹expected: Add new schedule [src: ticket:tickets/recurring-bills.md#AC1]› control. |
| 2 | Select ‹expected: Add new schedule [src: ticket:tickets/recurring-bills.md#AC1]›. | A dialog to create a schedule opens. |

---

### TC-SCHED-002 Add stays disabled while the name is empty
**Priority:** High · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC2
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open on its first display.

| # | Step | Expected |
|---|---|---|
| 1 | Leave the name field empty and look at the ‹expected: Add [src: ticket:tickets/recurring-bills.md#AC2]› button. | The button is disabled. |
| 2 | Select the disabled button. | Nothing happens and the dialog stays open. |

---

### TC-SCHED-003 Add becomes enabled once a name is entered
**Priority:** High · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC2
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type `reconqa-rent` in the name field. | The ‹expected: Add [src: ticket:tickets/recurring-bills.md#AC2]› button is enabled. |
| 2 | Delete all characters from the name field. | The button is disabled again. |

---

### TC-SCHED-004 Create a schedule with only a name
**Priority:** High · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC2 (Q1, Q10)
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type `reconqa-internet` in the name field. | The name is shown in the field. |
| 2 | Select ‹expected: Add [src: ticket:tickets/recurring-bills.md#AC2]›. | The dialog closes. |
| 3 | Look at the schedule list. | A schedule named `reconqa-internet` is in the list. |

---

### TC-SCHED-005 Repeats is checked by default
**Priority:** Medium · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC3
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open on its first display.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the ‹expected: Repeats [src: ticket:tickets/recurring-bills.md#AC3]› option. | The option is checked. |

---

### TC-SCHED-006 Repeat end options
**Priority:** Medium · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC4
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open and Repeats is checked.

| # | Step | Expected |
|---|---|---|
| 1 | Open the control that sets when the repeat ends. | Three choices are offered: never, after a number of times, and on a date. |
| 2 | Choose the option to end after a number of times. | A field for the number of times is shown. |
| 3 | Choose the option to end on a date. | A field for the end date is shown. |
| 4 | Choose the option to never end. | No number field and no end date field are shown. |

---

### TC-SCHED-007 Repeat frequency options
**Priority:** Medium · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC5
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open and Repeats is checked.

| # | Step | Expected |
|---|---|---|
| 1 | Open the control that sets the repeat unit. | Four choices are offered: day, week, month and year. |

---

### TC-SCHED-008 Create a schedule that repeats weekly and ends after a number of times
**Priority:** Medium · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC4, ticket:tickets/recurring-bills.md#AC5 (Q4, Q6)
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open and Repeats is checked.

| # | Step | Expected |
|---|---|---|
| 1 | Type `reconqa-gym` in the name field. | The name is shown in the field. |
| 2 | Choose week as the repeat unit. | Week is selected. |
| 3 | Choose to end after a number of times and enter `3`. | The value 3 is shown. |
| 4 | Select ‹expected: Add [src: ticket:tickets/recurring-bills.md#AC2]›. | The dialog closes and `reconqa-gym` is in the schedule list. |

---

### TC-SCHED-009 Create a schedule that repeats monthly and ends on a date
**Priority:** Medium · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC4, ticket:tickets/recurring-bills.md#AC5 (Q5)
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open and Repeats is checked.

| # | Step | Expected |
|---|---|---|
| 1 | Type `reconqa-phone` in the name field. | The name is shown in the field. |
| 2 | Choose month as the repeat unit. | Month is selected. |
| 3 | Choose to end on a date and enter a date one year in the future. | The date is shown. |
| 4 | Select ‹expected: Add [src: ticket:tickets/recurring-bills.md#AC2]›. | The dialog closes and `reconqa-phone` is in the schedule list. |

---

### TC-SCHED-010 Automatically add transaction is off by default
**Priority:** Medium · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC6
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open on its first display.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the ‹expected: Automatically add transaction [src: ticket:tickets/recurring-bills.md#AC6]› option. | The option is not checked. |

---

### TC-SCHED-011 Amount options include the approximate option
**Priority:** Medium · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC7 (Q8)
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open.

| # | Step | Expected |
|---|---|---|
| 1 | Open the control that sets how the amount is given. | Three choices are offered: approximate, exact and range. |
| 2 | Look at the approximate choice. | It is labelled ‹expected: is about [src: ticket:tickets/recurring-bills.md#AC7]›. |

---

### TC-SCHED-012 Amount fields for each amount option
**Priority:** Low · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC7 (Q8)
**Preconditions:** Logged in as a test user with an open budget file. The new schedule dialog is open.

| # | Step | Expected |
|---|---|---|
| 1 | Choose the approximate option. | One amount field is shown. |
| 2 | Choose the exact option. | One amount field is shown. |
| 3 | Choose the range option. | Two amount fields are shown, one for each end of the range. |

---

### TC-SCHED-013 Due date column in the schedule list
**Priority:** Medium · **Area:** SCHED · **Source:** ticket:tickets/recurring-bills.md#AC8 (Q9)
**Preconditions:** Logged in as a test user with an open budget file. A schedule named `reconqa-water` exists (create it with the new schedule dialog if needed).

| # | Step | Expected |
|---|---|---|
| 1 | Open the Schedules page. | The schedule list shows a column headed ‹expected: Due date [src: ticket:tickets/recurring-bills.md#AC8]›. |
| 2 | Find the row for `reconqa-water`. | The row shows a value in that column. |

---

## Notes on coverage
Boundaries for the number of times, name length and range amounts are not written: the ticket gives no limits (Q2, Q4, Q8). Add them once the team answers.
