# Rules (atlas)
App version: not shown in this area (v26.11.0 seen on the loading screen, see schedules atlas) · Explored: 2026-11-26 · Environment: local · Source: live app

PARTIAL: the rules list, the "Rule" editor, and the option lists of the first condition/action rows are mapped. See Open questions.

## Screens
### Rules list — /settings/rules
How to reach: open the app (lands on /budget), click "Settings" in the left sidebar (goes to /settings/general), click "Rules" in the Settings menu (tabs: General, Payees, Tags, Rules, Bank Sync, Advanced, Experimental).

Intro text: "Rules are always run in the order that you see them." with link "Learn more" (goes to an outside docs site; not followed).

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Filter rules... | text box | no | observed: "Dominion" shows only the rule containing "payee is Dominion Power"; "notes matches" shows only the rule with that text. Filter works on the rule's displayed text. A clear button (no label) appears once text is typed | "Filter rules..." |

Table columns: "Stage", "Rule". The Stage cell showed no text for any row in this run (see Open questions).
Rows at start (demo data, all are schedule-linked rules): 6 rows, e.g. "payee is Dominion Power and account is Bank of America and date is Every month on the 26th and amount is approx -120.00" with the note "link schedule Dominion Power (2026-11-26)"; "payee is Fast Internet and account is Bank of America and date is 11/25/2026 and amount is approx -140.00" with "link schedule Fast Internet (2026-11-25)"; "account is Bank of America and date is Every month on the 27th and amount is -1,900.00" with "link schedule Next: 2026-11-27"; "date is Every month on the 23rd and amount is -27,000.00" with "link schedule Next: 2026-12-23"; two rules "payee is (nothing) and date is approx Every month on the 26th and amount is approx 0.00" with "link schedule Next: 2026-11-26".
Each row has an "Edit" button.

Buttons and links:
- "Edit" (per row) → opens the "Rule" dialog with that rule.
- "Create new rule" → opens the "Rule" dialog, empty.
- "Learn more" (not followed).
- Row selection / delete: hovering a row showed nothing new in the page text; no delete control found (see Open questions).

### Rule dialog (create and edit) — modal over /settings/rules
How to reach: "Create new rule", or "Edit" on a row. Header "Rule" with button "Close". Bottom buttons "Cancel" and "Save".

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Stage of rule: | three buttons "Pre", "Default", "Post" | no | none of the three looked selected; not probed further | none |
| Condition match mode ("If [all] of these conditions match:") | button, default "all" | no | options: "all", "any" | none |
| Condition field | button, default "payee" | no | options: "imported payee", "account", "category", "category group", "date", "payee", "notes", "amount", "amount (inflow)", "amount (outflow)", "cleared" | none |
| Condition operator | button, default "is" | no | for "notes": "is", "contains", "matches", "is not", "does not contain", "has all tags", "has any tag". Other fields' lists not opened | none |
| Condition value | for "payee": combobox with text box "Payee"; for "notes": text box | not enforced (R1) | no length limit probed | "nothing" |
| Action type | button, default "set" | no | options: "set", "prepend to notes", "append to notes", "delete transaction" (not chosen) | none |
| Action field | button, default "category" | no | options (for "set"): "category", "payee", "notes", "cleared", "account", "date", "amount" | none |
| Action value | combobox with text box | not enforced (R1) | not probed | "nothing" |

Buttons and links in the dialog:
- Condition row: "Delete entry", "Add entry" (not clicked).
- Action row: "Delete entry", "Add entry" (not clicked).
- "Split into multiple transactions" → adds, under the action row, a line "Apply to all" with the value "0", plus a block "Split 1" with "Delete split", the text "allocate", a button defaulting to "an equal portion of the remainder" (options: "a fixed amount", "a fixed percent of the remainder", "an equal portion of the remainder") and "Add entry"; and a new button "Add another split".
- Preview area: text "This rule applies to these transactions:", table headers "Date", "Payee", "Category", "Amount", and button "Apply actions (0)" (disabled while 0 transactions match; never clicked).
- "Cancel" closes the dialog without saving.
- "Save" closes the dialog and adds/updates the row in the list.

## Messages
| # | Exact text | Screen | Where shown | Trigger |
|---|---|---|---|---|
| 1 | Rules are always run in the order that you see them. | Rules list | intro line above the filter | always |
| 2 | This rule applies to these transactions: | Rule dialog | label above the preview table | always |
| 3 | Then apply these actions: | Rule dialog | label above the action row | always |
| 4 | of these conditions match: | Rule dialog | after the "all/any" button | always |
| 5 | There was a problem syncing your changes. Please confirm that your server is accessible. | Rules list (also on /budget) | banner with "Close" at the top right | seen on opening the app and again after saves; the "Server online" button was also shown |

No validation or error message was seen in the rule dialog (see R1, R2).

## Rules
- R1 (observed) "Save" accepts a rule with nothing filled in. The new row read "payee is (nothing)" and "set category to (nothing)". No error, no required marker.
- R2 (observed) With "notes" "matches" and the value "(" (not a valid pattern), "Save" accepted it and the row read "notes matches (". No error was shown.
- R3 (observed) Changing the condition field changes the operator button and the value input (payee: combobox; notes: text box).
- R4 (observed) "Apply actions (0)" is disabled in the dialog for a rule with no matching transactions.
- R5 (observed) Rules created in this run go to the top of the list.
- R6 (observed) "Cancel" closed the dialog; whether unsaved changes are discarded was not checked afterwards.
- R7 (inferred from the intro text) Order in the list decides run order; not tested with two rules.

## Open questions
- What do "Pre", "Default", "Post" do, which is selected by default, and why does the Stage column show nothing?
- How to delete a rule: no selection box or delete button was found. One test rule ("notes matches (" → set category to (nothing)) created by this run was left in the local app and needs removing by a person.
- Operators and value inputs for date, amount, account, category, cleared, and imported payee.
- What happens with "any", "prepend to notes", "append to notes" and "delete transaction", and with Add entry / Delete entry / Add another split.
- Does the preview table list matching transactions (needs a rule with a real match)?
- Is the rule order changeable (drag)? Not seen.
- Limits for text length.
- Is the sync banner (message 5) related to this local setup only?

## Notes
(people may write here)
