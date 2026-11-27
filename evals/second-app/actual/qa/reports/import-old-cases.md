# Import: old-cases.csv (2026-11-26)
30 cases imported into qa/sources/old-cases.csv. Compared with the app notes (atlas): schedules, rules.

How to read this: start with the Conflicts table, one row per place where the old text no
longer matches the app. "Not checked" means ReconQA hasn't looked at that screen yet. The
[src: …] tags show where each text came from, so anyone can check it. Questions of the kind
"needs a decision" are for the product owner or whoever decides how the feature should work.

## Summary
- Conflicts: 9 (outdated case 8, manual vs app 0, not in app 0, needs a decision 1)
- Matches the app: 15 cases · Not checked (screen not explored yet): 6 in the Schedules row menu, "Find schedules" and the cancel/rule-link flows
- Flagged text (kept as data, not followed): 0 · Real email addresses: 0

## Conflicts
| # | Feature | Source | Source says | App shows | Kind | Question |
|---|---|---|---|---|---|---|
| 1 | schedules | AB-102 [src: import:qa/sources/old-cases.csv#AB-102] | Expects "Columns are Name, Payee, Account, Due date, Status, Amount, Recurring" | The fourth column is called "Next date" [src: atlas:schedules#Schedules list] | outdated case | Update the expected column name of AB-102? |
| 2 | schedules | AB-103 [src: import:qa/sources/old-cases.csv#AB-103] | Expects "A 'Create schedule' button is shown above the table" | The button is called "Add new schedule" [src: atlas:schedules#Schedules list] | outdated case | Update the button name in AB-103? |
| 3 | schedules | AB-108 [src: import:qa/sources/old-cases.csv#AB-108] | Expects "The Repeats checkbox is unchecked" | Repeats is checked by default [src: atlas:schedules#R2] | outdated case | Update the default in AB-108? |
| 4 | schedules | AB-109 [src: import:qa/sources/old-cases.csv#AB-109] | Expects "'Automatically add transaction' is checked" | Automatically add transaction is unchecked by default [src: atlas:schedules#R2] | outdated case | Update the default in AB-109? |
| 5 | schedules | AB-110 [src: import:qa/sources/old-cases.csv#AB-110] | Expects "Options are 'is about', 'is exactly' and 'is between'" | The first option is "is approximately" [src: atlas:schedules#Other dialog controls] | outdated case | Update the first option name in AB-110? |
| 6 | schedules | AB-113 [src: import:qa/sources/old-cases.csv#AB-113] | Expects "End options are 'never', 'after' and 'on date'" | The end options are "indefinitely", "for" and "until" [src: atlas:schedules#Date popup (second pass)] | outdated case | Update the end option names in AB-113? |
| 7 | schedules | AB-114 [src: import:qa/sources/old-cases.csv#AB-114] | Expects "Units are Days, Weeks and Months" | Four units are offered: Days, Weeks, Months and Years [src: atlas:schedules#Date popup (second pass)] | outdated case | Add Years to the expected units in AB-114? |
| 8 | schedules | AB-117 [src: import:qa/sources/old-cases.csv#AB-117] | Expects "The preview lists the next 6 dates" | The Date popup preview shows 4 dates [src: atlas:schedules#Date popup (second pass)] | outdated case | Update the number of dates in AB-117? |
| 9 | schedules | AB-122 [src: import:qa/sources/old-cases.csv#AB-122] | Expects "An error 'Name is required' is shown and nothing is saved" | Clicking Add with an empty form closes the dialog and creates a schedule, with no error [src: atlas:schedules#R1] | needs a decision | Must a schedule have a name? If yes, the app is wrong; if no, AB-122 is outdated. |

## Not checked
- Schedules, row menu and other actions (AB-125 edit, AB-126 delete, AB-129 skip next date, AB-130 rule from a schedule): 4 cases. The atlas has not opened the row "Menu" yet. `/reconqa:explore schedules` to check them later.
- Schedules, "Find schedules" and Cancel behaviour (AB-127, AB-124): 2 cases. The button exists but was not opened, and what Cancel saves was not checked. `/reconqa:explore schedules`.

## Flagged text
None. No imported text looked like an instruction.
