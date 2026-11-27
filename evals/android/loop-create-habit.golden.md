# Golden list: Loop Habit Tracker 2.3.2, creating a habit (Android emulator)

Built by hand before any model run: from the app's source (tag v2.3.2, `EditHabitActivity.kt`
`validate()`, `res/values/strings.xml`) and checked on the emulator with the ReconQA Android driver.
Area given to explore: "creating a habit (both habit types)". Start state: one habit already on the
list, or none (empty state).

## 1. Screens and dialogs

| ID | Item | How to reach | Source |
|---|---|---|---|
| G1 | Habit list screen titled "Habits" with an "Add habit" button | App start | emulator |
| G2 | Habit type dialog offering "Yes or No" and "Measurable" | Add habit | HabitTypeDialog.kt, emulator |
| G3 | Yes or No hint "e.g. Did you wake up early today? Did you exercise? Did you play chess?" | Habit type dialog | strings.xml, emulator |
| G4 | Measurable hint "e.g. How many miles did you run today? How many pages did you read?" | Habit type dialog | strings.xml, emulator |
| G5 | Form screen titled "Create habit" with a "SAVE" button (shown as Save in some atlases) | Either habit type | emulator |

## 2. Fields: Yes or No form

| ID | Field | Details | Source |
|---|---|---|---|
| G6 | Name, placeholder "e.g. Exercise", required | Yes or No form | emulator, validate() |
| G7 | Question, placeholder "e.g. Did you exercise today?", optional | Yes or No form | emulator |
| G8 | Frequency, default "Every day" | Yes or No form | emulator |
| G9 | Reminder, default "Off" | both forms | strings.xml reminder_off |
| G10 | Notes, placeholder "(Optional)" | both forms | emulator |
| G11 | Color picker button next to Name (no text label on the button itself) | both forms | emulator |

## 3. Fields: Measurable form

| ID | Field | Details | Source |
|---|---|---|---|
| G12 | Name, placeholder "e.g. Run", required | Measurable form | emulator, validate() |
| G13 | Question, placeholder "e.g. How many miles did you run today?" | Measurable form | emulator |
| G14 | Unit, placeholder "e.g. miles", optional | Measurable form | emulator |
| G15 | Target, placeholder "e.g. 15", required | Measurable form | emulator, validate() |
| G16 | Target Type, default "At least"; options "At least" and "At most" | Measurable form | emulator |
| G17 | Frequency options "Every day", "Every week", "Every month" | Measurable form, Frequency | emulator |

## 4. Messages

| ID | Exact text | Where and when | Source |
|---|---|---|---|
| G18 | "Cannot be blank" on Name (Yes or No), after Save with Name empty | error icon on the field; text in a popup when the field has focus | validate(), emulator |
| G19 | "Cannot be blank" on Name (Measurable), after Save with Name empty | same | validate() |
| G20 | "Cannot be blank" on Target (Measurable), after Save with Target empty | same | validate() |
| G21 | Empty list text "You have no active habits" | Habit list with no habits | emulator |

## 5. Rules and behaviour (human marks)

| ID | Rule | Source |
|---|---|---|
| G22 | Save with a name only (Yes or No) creates the habit and returns to the list, where the new habit shows | emulator |
| G23 | Unit and Question are not required on the Measurable form | validate() |
| G24 | Leaving the form with Back discards the input without asking | emulator |
| G25 | Day check boxes on the habit list have no text label or description (screen readers cannot name them) | emulator |
