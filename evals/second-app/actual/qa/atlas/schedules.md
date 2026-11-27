# Schedules (atlas)
App version: v26.11.0 (footer on the loading screen: "App: v26.11.0 | Server: N/A") · Explored: 2026-11-26 · Environment: local · Source: live app

PARTIAL (second pass done): list screen, the "Schedule" dialog, the Date popup (Repeats options) and several dropdown option lists are mapped. See Open questions.

## Screens
### Schedules list — /schedules
How to reach: open the app (lands on /budget), click "Schedules" in the left sidebar.

Page title: "Schedules". Search box and table below.

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Filter schedules… | text box | no | not probed | name only: "Filter schedules…" |

Table columns (in order): Name, Payee, Account, Next date, Status, Amount, Recurring.
Rows seen at start (demo data): "Internet bill" (Fast Internet, Bank of America, 11/25/2026, Missed, ~140.00), "Phone bills" (Dominion Power, Bank of America, 11/26/2026, Due, ~120.00), "Utilities" (no payee, Bank of America, 11/27/2026, Upcoming, 1,900.00), "Wedding" (no payee, no account, 12/23/2026, Scheduled, 27,000.00).
Amount cells with an approximate amount show "~" with tooltip "Approximately <amount>".
Each row has a "Menu" button (not opened).

Buttons and links:
- "Find schedules" (not opened)
- "Change upcoming length" (not opened)
- "Add new schedule" → opens the "Schedule" dialog. A "Welcome to Actual!" toast covered this button; clicking failed until the toast was closed with "Close".

### Schedule dialog (add) — modal over /schedules
How to reach: "Add new schedule".

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Schedule Name | text | not enforced (see R1) | not probed | "nothing" |
| Payee | combobox with text | not enforced (R1) | not probed | "nothing" |
| Account | combobox with text | not enforced (R1) | not probed | "nothing" |
| Amount | text | not enforced | default "0.00" | none |
| Amount operator | button, default "is approximately" | no | other options not opened | none |
| Make positive | button next to Amount | no | not opened | none |
| Date | button, default "Every month on the 26th" | no | not opened | none |
| Repeats | checkbox | no | checked by default | none |
| Upcoming length | button, default "Use global default" | no | not opened | "How far in advance this schedule appears as upcoming" |
| Automatically add transaction | checkbox | no | unchecked by default | "Automatically create transactions in the specified account" |

Also in the dialog: "Upcoming dates" list (default: 11/26/2026 Thursday, 12/26/2026 Saturday, 01/26/2027 Tuesday); table "These transactions match this schedule:" with link text "Select transactions to link on save", columns Date, Payee, Notes, Amount, and the empty text "No matching transactions".
Buttons: "Close" (title bar), "Cancel", "Add". "Add" is enabled with an empty form.

## Messages
| # | Exact text | Screen | Where shown | Trigger |
|---|---|---|---|---|
| M1 | Welcome to Actual! | Budget (/budget) and Schedules list | toast, bottom right | on load |
| M2 | New to Actual? Take a short tour to learn how budgeting works and find your way around. | Budget and Schedules list | toast, with "Take the tour" button | on load |
| M3 | There was a problem syncing your changes. Please confirm that your server is accessible. | Budget (/budget) | toast with "Close" | on load; the "Server online" button was also shown. Not seen on the Schedules list. |
| M4 | No matching transactions | Schedule dialog | table body | dialog opened with empty form |

## Rules
- R1 (observed) Clicking "Add" with every field empty closes the dialog and creates a schedule: Name "None", Payee "None", Account "None", Next date 11/26/2026, Status "Due", Amount "~0.00". No error message is shown.
- R2 (observed) New schedule dialog defaults: repeats monthly on today's day, approximate amount 0.00, Repeats checked, auto-add unchecked.
- R3 (observed) List status values seen: Missed, Due, Upcoming, Scheduled.
- R4 (observed) A schedule created with an empty name shows "None" in the Name column, and in the Payee and Account columns.

### Date popup (second pass) — popover over the Schedule dialog
How to reach: in the Schedule dialog click the Date button ("Every month on the 26th"). A calendar opens on top and covers the lower part of the popup; press Escape once to close the calendar, the popup stays open.

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| From | date text box (calendar opens) | no | default 11/26/2026 (today) | placeholder "Start Date" |
| End mode | button, default "indefinitely" | no | options: "indefinitely", "for", "until" | none |
| (after "for") occurrences | number box | no | default 1; label text "occurrences" | none |
| Repeat every | number box | no | default 1; 0 was accepted without a message | none |
| Unit | button, default "Months" | no | options: "Days", "Weeks", "Months", "Years" | none |
| Move schedule | checkbox | no | unchecked; the "after" / "weekend" button next to it is disabled until checked | none |

Buttons: "Add specific days" (shown for Months only; gone for Weeks), "Cancel", "Apply". The popup also shows an "Upcoming dates" preview (4 dates; 1 date after "for 1 occurrences").
After Apply with Weeks, "for 1" and Repeat every 0, the Date button read "Every week on Thursday, once".

### Other dialog controls (second pass)
- Amount operator options: "is approximately", "is exactly", "is between". With "is between" two amount boxes appear, each with "Make positive", joined by the text "and".
- Repeats unchecked: the Date button is replaced by a single date text box (11/26/2026) and "Upcoming dates" shows one date.
- Upcoming length options: "Use global default", "1 day", "1 week", "2 weeks", "1 month", "End of the current month", "Custom length".
- Schedule Name: a name of about 180 characters starting with "reconqa-" was accepted and shown in full in the list, with no limit message. Payee and Account showed "None".

## Open questions
- Still not explored: row "Menu" actions, edit, "Find schedules", "Change upcoming length", the filter box, "Add specific days", "Move schedule" on, "until" end mode, "Custom length", "Automatically add transaction" on, link-transactions flow, duplicate names, a name longer than ~180 characters, Repeat every with negative or very large values, and a happy path with real Payee and Account.
- Is "Repeat every" 0 meant to be allowed? It is shown as "Every week" (observed); what it really does is unknown.
- Two test schedules now sit in the demo budget (blank one from the first pass, and a long "reconqa-AAAA…" one); delete by hand (deleting is on the deny list).
- Is the blank schedule in R1 intended? Needs a product answer.
- The schedule created by the empty-form probe (Name shows "None") is left in the demo budget; delete it by hand (deleting is on the deny list for this run).

## Notes
