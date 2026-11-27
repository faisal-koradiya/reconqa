# Break report: Creating a habit (2026-11-27)
App version: 2.3.2 (20302) · Environment: emulator-5554 (Android 15) · Actions used: 36 of 80 · Monkey seed: none (monkey run was not approved)

## Findings
| # | Severity | What I did | What happened | Evidence | Repeated |
|---|---|---|---|---|---|
| 1 | major | 1. Habits → Add habit → Yes or No. 2. Type 3 spaces in Name. 3. Tap SAVE. | The form saved and returned to the list. A habit with a blank-looking name was added, although the atlas says a blank Name is rejected (R1, "Cannot be blank"). | qa/breaks/shots/spaces-name.png | Yes, saved again; the list grew from 2 to 3 habits |
| 2 | minor | 1. Habits → Add habit → Yes or No. 2. Type the 256-character value from the catalogue in Name (the field took 255). 3. Tap SAVE. | Saved with no message. The list row shows the whole name in one text element. I did not check whether the layout breaks. | qa/breaks/shots/long-name.png | Seen once |

## Held up well
- Pressing SAVE twice quickly on the Yes or No form created one habit, not two. The second tap landed on the Habits list.
- The long Name (255 characters) did not crash the app.

## Not tested
- Monkey run: Claude Code asked for approval and it was not given.
- Measurable form, Unit and Target odd inputs, Notes and Question fields, Frequency dialog values, Back during save, and fields filled in an unusual order.
- Run stopped early to keep the budget small. Robustness of the other fields is unknown.

## Test data left behind
- Habit with a 255-character name made of "x" (no `reconqa` prefix, because the catalogue value has none).
- Two habits with a spaces-only name (no prefix).
- Earlier atlas data: "reconqa Exercise", "reconqa Run".
