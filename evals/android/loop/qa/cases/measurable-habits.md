# Test cases: LOOP-12 Track habits with a number
Ticket: tickets/measurable-habits.md · Atlas: qa/atlas/creating-a-habit.md (app 2.3.2, explored 2026-11-27)

Test data uses the prefix `reconqa`. Each case starts from the Habits list.

### TC-MEAS-001 Add habit offers a choice of habit type
**Priority:** High · **Area:** MEAS · **Source:** tickets/measurable-habits.md AC1 + atlas qa/atlas/creating-a-habit.md
**Preconditions:** App installed and started; intro skipped so the Habits list is shown.

| # | Step | Expected |
|---|---|---|
| 1 | Tap «Add habit». | A dialog opens with two options: «Yes or No» and «Measurable». |
| 2 | Read the text under «Yes or No». | The text is «e.g. Did you wake up early today? Did you exercise? Did you play chess?» |
| 3 | Read the text under «Measurable». | The text is «e.g. How many miles did you run today? How many pages did you read?» |

---

### TC-MEAS-002 Measurable form shows all its fields
**Priority:** High · **Area:** MEAS · **Source:** tickets/measurable-habits.md AC2 + atlas qa/atlas/creating-a-habit.md (mismatch row 4)
**Preconditions:** Habits list is shown.

| # | Step | Expected |
|---|---|---|
| 1 | Tap «Add habit», then tap «Measurable». | The Create habit form opens. |
| 2 | Look at the form from top to bottom (scroll if needed). | These fields are shown: «Name», «Question», «Unit», «Target», «Frequency», «Target Type», «Reminder», «Notes». A Color button is also shown. |
| 3 | Look at the top of the form. | The buttons «Navigate up» and «SAVE» are shown. |

---

### TC-MEAS-003 Measurable form hints
**Priority:** Medium · **Area:** MEAS · **Source:** tickets/measurable-habits.md AC3 + atlas qa/atlas/creating-a-habit.md (mismatch row 1)
**Preconditions:** Habits list is shown. The Create habit (Measurable) form is open and all fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Read the hint in the empty «Name» field. | «Name» shows «e.g. Run» |
| 2 | Read the hint in the empty «Question» field. | «Question» shows «e.g. How many miles did you run today?» |
| 3 | Read the hint in the empty «Unit» field. | «Unit» shows «e.g. miles» |
| 4 | Read the hint in the «Target» field. | «Target» shows «e.g. 15» |
| 5 | Read the hint in the «Notes» field. | «Notes» shows «(Optional)» |

---

### TC-MEAS-004 Target Type default and options
**Priority:** Medium · **Area:** MEAS · **Source:** tickets/measurable-habits.md AC4 + atlas qa/atlas/creating-a-habit.md (mismatch row 2)
**Preconditions:** Habits list is shown. The Create habit (Measurable) form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Read the value of «Target Type» without changing it. | The value is «At least». |
| 2 | Tap «Target Type». | A picker opens with the options «At least» and «At most». No third option is listed. |
| 3 | Choose «At most». | «Target Type» now shows «At most». |

---

### TC-MEAS-005 Frequency starts at Every day
**Priority:** Medium · **Area:** MEAS · **Source:** tickets/measurable-habits.md AC7 + atlas qa/atlas/creating-a-habit.md
**Preconditions:** Habits list is shown.

| # | Step | Expected |
|---|---|---|
| 1 | Tap «Add habit», then tap «Measurable». | The Create habit form opens. |
| 2 | Read the value of «Frequency». | The value is «Every day». |

---

### TC-MEAS-006 Empty Target is refused on the measurable form
**Priority:** High · **Area:** MEAS · **Source:** tickets/measurable-habits.md AC6 + atlas qa/atlas/creating-a-habit.md (messages 2, R2, R4)
**Preconditions:** Habits list is shown. The Create habit (Measurable) form is open and all fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Tap «SAVE». | The form stays open; the Habits list is not shown. An error icon is shown on the «Target» field. |
| 2 | Tap the «Target» field. | A popup on the field shows «Cannot be blank». |

---

### TC-MEAS-007 Save a measurable habit
**Priority:** High · **Area:** MEAS · **Source:** tickets/measurable-habits.md AC8 + atlas qa/atlas/creating-a-habit.md
**Preconditions:** Habits list is shown. No habit named «reconqa Run» exists yet (or use another unique name with the prefix reconqa).

| # | Step | Expected |
|---|---|---|
| 1 | Tap «Add habit», then tap «Measurable». | The Create habit form opens. |
| 2 | Enter `reconqa Run` in «Name», `miles` in «Unit» and `5` in «Target». | The values are shown in the fields. |
| 3 | Tap «SAVE». | The app returns to the Habits list. A habit named `reconqa Run` is shown in the list. |

---

### TC-MEAS-008 Measurable habit saves with an empty Question
**Priority:** Low · **Area:** MEAS · **Source:** atlas qa/atlas/creating-a-habit.md (R3; mismatch row 6, missing in ticket)
**Preconditions:** Habits list is shown. The Create habit (Measurable) form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `reconqa Pages` in «Name», `pages` in «Unit» and `10` in «Target». Leave «Question» empty. | The values are shown; «Question» shows «e.g. How many miles did you run today?». |
| 2 | Tap «SAVE». | The app returns to the Habits list. A habit named `reconqa Pages` is shown. No error is shown. |

---

### TC-MEAS-009 Empty Name on the Yes or No form
**Priority:** High · **Area:** MEAS · **Source:** tickets/measurable-habits.md AC5 + atlas qa/atlas/creating-a-habit.md (messages 1, R1; mismatch row 3)
**Preconditions:** Habits list is shown.

| # | Step | Expected |
|---|---|---|
| 1 | Tap «Add habit», then tap «Yes or No». | The Create habit form opens. |
| 2 | Leave «Name» empty and tap «SAVE». | The form stays open. An error icon is shown on the «Name» field. |
| 3 | Tap the «Name» field. | A popup under the field shows «Cannot be blank». |

---

### TC-MEAS-010 Color button has an accessible label
**Priority:** Low · **Area:** MEAS · **Source:** atlas qa/atlas/creating-a-habit.md (Create habit forms: Color button has no label; mismatch row 5)
**Preconditions:** TalkBack is on. The Create habit (Measurable) form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Move the TalkBack focus to the Color button (right of «Name»). | TalkBack reads a spoken label for the button (inferred: the atlas only shows that no label is exposed). |

---

### TC-MEAS-011 Habit row controls have accessible labels
**Priority:** Low · **Area:** MEAS · **Source:** atlas qa/atlas/creating-a-habit.md (Habits list: five unlabeled clickable views per row; mismatch row 7)
**Preconditions:** TalkBack is on. The habit `reconqa Run` exists (see TC-MEAS-007) and the Habits list is shown.

| # | Step | Expected |
|---|---|---|
| 1 | Move the TalkBack focus through the controls in the `reconqa Run` row, one at a time. | Each of the 5 clickable controls in the row reads a spoken label (inferred: the atlas only shows that no label is exposed). |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind | Suggested question |
|---|---|---|---|---|
| 1 | AC3: Target hint is "e.g. 10" | Target hint is «e.g. 15» (Create habit (Measurable)) | mismatch | Which hint is right? TC-MEAS-003 follows the app. |
| 2 | AC4: Target Type offers "At least", "Exactly" and "At most" | Only «At least» and «At most» (R5) | missing in app | Is "Exactly" planned, or should the ticket drop it? TC-MEAS-004 follows the app. |
| 3 | AC5: empty Name shows "Name is required" | Yes or No form shows «Cannot be blank» (message 1). Empty Name on the Measurable form was not tested. | mismatch | Which text is wanted? Needs a check of the Measurable form (open question). TC-MEAS-009 follows the app. |
| 4 | AC2: the form lists eight fields | A Color button is shown as well | missing in ticket | Should the Color button be in the list? Covered by TC-MEAS-002. |
| 5 | (not mentioned) | Color button has no label for screen readers | likely defect (low) | Add a label? Reproduced by TC-MEAS-010. |
| 6 | (not mentioned) | Question may be empty when saving (R3) | missing in ticket | Is an optional Question intended? Covered by TC-MEAS-008. |
| 7 | (not mentioned) | Five clickable views per habit row have no label | likely defect (low) | Add labels? Reproduced by TC-MEAS-011. |

Answered by the knowledge base: none (no knowledge base in this project).

## Open questions
- AC6 gives no text for the Target message; the app shows «Cannot be blank». Confirm that is acceptable.
- Empty Name on the Measurable form, empty Unit, and Name/Unit length limits are not covered by the atlas.
- Frequency dialog validation (0, blank, large values), Color picker, Reminder and Notes are not explored.
- No success message after save was captured.
