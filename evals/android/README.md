# Android: Loop Habit Tracker on an emulator

Does ReconQA work on an Android app with the same commands? We used
[Loop Habit Tracker](https://github.com/iSoron/uhabits) 2.3.2 (open source, GPL-3.0) on a standard
Android 15 emulator, with ReconQA's built-in Android driver. A second, real phone was plugged into
the same computer the whole time; the driver never touched it.

**Explore** "creating a habit (both habit types)". Before any AI run we wrote down 25 facts about
the area by hand, from the app's source and the emulator (`loop-create-habit.golden.md`).

| Run | Facts found | False facts | Time | Cost |
|---|---|---|---|---|
| 1 | 20 of 25 (80%) | 0 | 4 min | $0.34 |
| 2 | 21 of 25 (84%) | 0 | 2.5 min | $0.29 |

In run 1 the explorer did not find the Android guide; we fixed how skills locate it, and in run 2
it read the guide and also caught the habit list's day buttons having no label for screen readers.
Both runs found the trap of this app: field errors show only as a red icon, and the message
("Cannot be blank") appears only after tapping the field. Both missed that Back throws away a
half-filled form without asking (the guide now asks for this check).

**Write cases** for a fictional ticket with 3 hidden mistakes (`loop/tickets/measurable-habits.md`,
key in `loop/ticket-key.json`): 11 cases, all 72 marked screen texts found in the atlas, **3 of 3**
mistakes found ("e.g. 10" is "e.g. 15"; there is no "Exactly"; the message is "Cannot be blank"),
no false ones. It also said where the atlas could not settle a point instead of guessing. $0.26.

**Run cases** on the emulator (5 of the 11): 4 passed, 1 blocked. The blocked one checks what a
screen reader says; the driver cannot hear TalkBack, so it said a person must check it by hand.
$0.44.

**Limits.** One app, one area, two explore runs; the ticket and the facts list are ours. Text can
only be typed in plain ASCII (an adb limit).

Files: `loop/` (config, atlas, ticket, cases, run report), `runs/` (atlases, costs, our marks),
`loop-create-habit.golden.md` (the facts list).
