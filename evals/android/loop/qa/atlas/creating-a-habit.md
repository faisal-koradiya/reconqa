# Creating a habit (atlas)
App version: 2.3.2 (20302) · Explored: 2026-11-27 · Environment: emulator-5554 (Android 15) · Source: live app

## Screens
### Intro — IntroActivity
How to reach: first launch. Shows title "Welcome", text "Loop Habit Tracker helps you create and maintain good habits.", buttons SKIP and NEXT (icon buttons, desc "SKIP"/"NEXT"). SKIP goes to Habits list.

### Habits list — MainActivity
How to reach: after SKIP. Empty state text: "You have no active habits".
Buttons: "Add habit" (opens type chooser), "Filter", "More options". Each habit row has 5 unlabeled clickable Views (bare `View clickable`, no label for screen readers).

### Habit type chooser (dialog)
How to reach: Habits → Add habit.
Options: "Yes or No" — "e.g. Did you wake up early today? Did you exercise? Did you play chess?"; "Measurable" — "e.g. How many miles did you run today? How many pages did you read?"

### Create habit (Yes or No) — EditHabitActivity
How to reach: Habits → Add habit → Yes or No.
| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Name | text | yes | blank rejected | "e.g. Exercise" |
| Color | button (no label) | no | not explored | |
| Question | text | no (saved with it empty) | | "e.g. Did you exercise today?" |
| Frequency | picker, default "Every day" | no | see Frequency dialog | |
| Reminder | picker, default "Off" | no | not explored | |
| Notes | text | no | | "(Optional)" |
Buttons: "Navigate up", "SAVE". SAVE with valid name returns to Habits list with the new habit.

### Create habit (Measurable) — EditHabitActivity
How to reach: Habits → Add habit → Measurable.
| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Name | text | yes (not tested empty on its own) | | "e.g. Run" |
| Color | button (no label) | no | not explored | |
| Question | text | no (saved with it empty) | | "e.g. How many miles did you run today?" |
| Unit | text | not tested empty | | "e.g. miles" |
| Target | number | yes | blank rejected | "e.g. 15" |
| Frequency | picker, default "Every day" | no | | |
| Target Type | picker, default "At least" | no | options "At least", "At most" | |
| Reminder | picker, default "Off" | no | not explored | |
| Notes | text | no | | "(Optional)" |
SAVE with name "reconqa Run", unit "miles", target 5 returns to the list; habit appears.

### Frequency dialog (Yes or No form)
Options: "Every day"; "Every" [3] "days"; [3] "times per week"; [10] "times per month"; "times in" [3] ... [14] "days". Button "SAVE".

## Messages
| # | Exact text | Screen | Where shown | Trigger |
|---|---|---|---|---|
| 1 | Cannot be blank | Create habit (Yes or No) | popup under Name field, after tapping the field | SAVE with empty Name |
| 2 | Cannot be blank | Create habit (Measurable) | popup on Target field, after tapping the field | SAVE with empty form |

## Rules
- R1 Name is required on Yes or No (observed).
- R2 Target is required on Measurable (observed).
- R3 Question is optional on Yes or No and Measurable (observed: saved with it empty).
- R4 Errors show as an icon; message only appears in a popup after tapping the field (observed).
- R5 Target Type offers only "At least" and "At most" (observed).
- R6 Entered 0 in the "times per week" box then SAVE in the Frequency dialog: Frequency still showed "Every day" afterwards (observed; unclear whether the 0 was rejected or the radio was never selected).

## Open questions
- Name and Unit limits (max length), empty Unit on Measurable, empty Name on Measurable not tested.
- Frequency dialog validation for each option (0, blank, large values) not confirmed; no message seen.
- Color picker, Reminder, and Notes not explored. Duplicate names not tested.
- Success message/toast after save not captured (none seen in the snapshot).
- Several habit-row icons and the Color button have no label.
- Test data created: "reconqa Exercise", "reconqa Run" (prefix reconqa).

## Notes
