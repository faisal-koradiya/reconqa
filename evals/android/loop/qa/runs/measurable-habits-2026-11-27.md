# Test run: LOOP-12 Track habits with a number

**Cases:** qa/cases/measurable-habits.md · **Atlas:** qa/atlas/creating-a-habit.md · **Environment:** emulator-5554 (Android 15, sdk_gphone64_x86_64) · **Version:** 2.3.2 (20302) · **Date:** 2026-11-27
**Result:** 4 passed · 0 failed · 1 blocked · 0 not run

| Case | Result | Failed or blocked step | Note |
|---|---|---|---|
| TC-MEAS-001 | passed | | |
| TC-MEAS-004 | passed | | |
| TC-MEAS-006 | passed | | The «Name» field also shows an error icon (it was empty too); the case only checks «Target». |
| TC-MEAS-007 | passed | | Fresh name used instead of the example `reconqa Run`. |
| TC-MEAS-010 | blocked | 1 | TalkBack is not on and the driver cannot turn it on or hear its speech. The snapshot shows the Color button (`colorButton`) with no label, which fits mismatch row 5, but that is not a spoken-label check. |

## Test data used
- Habit `reconqa-31c5f56f` (Measurable, unit `miles`, target `5`), created in TC-MEAS-007.

## TC-MEAS-001 Add habit offers a choice of habit type
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | A dialog opened with two options: «Yes or No» and «Measurable». |
| 2 | pass | The text under «Yes or No» is «e.g. Did you wake up early today? Did you exercise? Did you play chess?» |
| 3 | pass | The text under «Measurable» is «e.g. How many miles did you run today? How many pages did you read?» |

---

## TC-MEAS-004 Target Type default and options
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | «Target Type» showed «At least». |
| 2 | pass | A picker opened with exactly two options: «At least» and «At most». |
| 3 | pass | After choosing «At most», «Target Type» shows «At most». |

---

## TC-MEAS-006 Empty Target is refused on the measurable form
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | The form stayed open and the Habits list was not shown. A red error icon is on the «Target» field (and also on «Name»). «Target Type» was still «At most» from TC-MEAS-004; all text fields were empty. |
| 2 | pass | After tapping «Target», a popup showed «Cannot be blank». |

---

## TC-MEAS-007 Save a measurable habit
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | The Create habit form opened. |
| 2 | pass | «Name» shows `reconqa-31c5f56f`, «Unit» shows `miles`, «Target» shows `5`. |
| 3 | pass | The app returned to the Habits list. A habit named `reconqa-31c5f56f` is shown. No success message was seen. |

---

## TC-MEAS-010 Color button has an accessible label
**Result:** blocked

| # | Result | Actual |
|---|---|---|
| 1 | blocked | Precondition "TalkBack is on" could not be set up: the driver offers no way to turn TalkBack on or read what it says. In the snapshot the Color button has no text or description (`Button id=colorButton clickable`). |

**Evidence:** qa/runs/shots/measurable-habits-2026-11-27/TC-MEAS-010-step1.png

---
*Run with ReconQA: an AI ran these steps on an Android device. Check each failure before reporting it.*
