# Creating a habit (atlas)
App version: 2.3.2 (20302) · Explored: 2026-11-27 · Environment: emulator-5554 (Android 15) · Source: live app

## Screens
### Intro — IntroActivity
How to reach: first launch.
- Title "Welcome"; text "Loop Habit Tracker helps you create and maintain good habits."
- Buttons: SKIP (icon, desc "SKIP") goes to Habits list; NEXT (icon, desc "NEXT") not tapped.

### Habits list — MainActivity
How to reach: after SKIP.
- Empty state text: "You have no active habits".
- Buttons: "Add habit" (opens habit type dialog), "Filter", "More options".

### Habit type dialog
How to reach: tap "Add habit".
- "Yes or No" — "e.g. Did you wake up early today? Did you exercise? Did you play chess?"
- "Measurable" — "e.g. How many miles did you run today? How many pages did you read?"

### Create habit (Yes or No) — EditHabitActivity
How to reach: Add habit > Yes or No.
| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Name | text | yes | blank blocks save | "e.g. Exercise" |
| Color | button | no | not opened | – |
| Question | text | no | saved fine when empty | "e.g. Did you exercise today?" |
| Frequency | picker | no | default "Every day" | – |
| Reminder | picker | no | default "Off"; not opened | – |
| Notes | text | no | – | "(Optional)" |

Buttons: SAVE (top right), Navigate up.
Frequency dialog options: "Every day" (default); "Every" [3] "days"; [3] "times per week"; [10] "times per month"; [3] "times in" [14] "days"; button SAVE.

### Create habit (Measurable) — EditHabitActivity
How to reach: Add habit > Measurable.
| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Name | text | yes | blank blocks save | "e.g. Run" |
| Color | button | no | not opened | – |
| Question | text | no | not tested | "e.g. How many miles did you run today?" |
| Unit | text | not tested | – | "e.g. miles" |
| Target | number | yes | blank blocks save | "e.g. 15" |
| Frequency | picker | no | default "Every day" | – |
| Target Type | picker | no | options "At least" (default), "At most" | – |
| Reminder | picker | no | default "Off"; not opened | – |
| Notes | text | no | – | "(Optional)" |

## Messages
| # | Exact text | Screen | Where shown | Trigger |
|---|---|---|---|---|
| 1 | Cannot be blank | Create habit (Yes or No) | popup on the Name field, shown after tapping the field | SAVE with Name empty |
| 2 | Cannot be blank | Create habit (Measurable) | popup on the Target field, shown after tapping the field | SAVE with Target empty |

## Rules
- R1 Save is blocked while Name is empty (observed, Yes or No). Error shows only as an icon until the field is tapped.
- R2 Save is blocked while Target is empty (observed, Measurable). Name was also empty on the first attempt, so Target alone was confirmed on the second attempt with Name filled.
- R3 Question can be left empty for a Yes or No habit (observed).
- R4 Saving returns to the Habits list and the new habit appears by name; no toast seen (observed).
- R5 In the frequency dialog, setting "times per week" to 0 and tapping SAVE closed the dialog and the field still read "Every day" (observed).

## Open questions
- Name length limit, duplicate names, Unit/Question limits, Color picker, Reminder picker, the other frequency options and the Measurable frequency dialog were not probed.
- R5: unclear if 0 was rejected silently or the selection was dropped; not verified.
- Habits created in this run: reconqa-f92a526e (Yes or No), reconqa-f3752efc (Measurable, At most, target 5).

## Notes
