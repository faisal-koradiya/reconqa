# Extreme mode: trying to break three apps

`/reconqa:break <area>` attacks one area that ReconQA has already explored: odd, long and wrong
inputs from a fixed catalogue (`scripts/break-inputs.mjs`), double and repeated submits, wrong
types and malformed bodies on APIs, and on Android a seeded random "monkey" that stays inside the
app. Every finding needs numbered steps, evidence and whether it happened again
(`scripts/check-break.mjs`). One headless run per app, Claude Sonnet, about 25–40 actions each.

| App | Area | Findings | Most important | Time | Cost |
|---|---|---|---|---|---|
| 🌐 OWASP Juice Shop | registration form | 1 major, 3 minor | The same email in a different letter case (`RECONQA@…` vs `reconqa@…`) registers a second account, although emails must be unique | 106 s | $0.35 |
| 🔌 Real World App API | bank accounts | 4 major, 3 minor | A malformed JSON body returns an HTML error page with a **stack trace and server file paths**; identical creates make duplicates; length and format rules not enforced | 59 s | $0.25 |
| 📱 Loop Habit Tracker | creating a habit | 1 major, 1 minor | A name of only spaces saves a blank-looking habit (the app checks "empty", not "blank") | 127 s | $0.28 |

We checked the top finding for each app by hand afterwards: the email-case duplicate with two
plain sign-up requests (both answered 201), the stack trace with a malformed request, and the
spaces-only name against Loop's source (it checks "empty", not "blank"). All are real behaviour of
these open-source practice apps, not problems we planted. One caveat: our lab runs the Real World
App in development mode, and its web framework only shows stack traces in development, so that
finding may not appear on a production setup.

**The Android monkey**, run directly through the driver (no AI): 300 random taps, swipes, odd
text and back presses inside Loop, seed 7, no crash or freeze. The monkey checks after every tap
that the test app is still in front. In this run one tap ended on the home screen; the monkey
relaunched the app and went on, and nothing was ever tapped outside the app. Getting there took
three fixes: the monkey's own Back on the first screen counted as an escape; a review found it
checked only every 10 events, so a tap that opened another app could be followed by more taps
there; and the moment while a new screen opens (no window has focus yet) was read as an escape.
The monkey now refuses to run on a real phone or without permission to create test data.

**Safety in practice.** In the headless runs nobody could approve the monkey or scripted browser
code, so both were refused, and the reports say so. The test data each run left behind is listed
at the end of its report.

**Limits.** One run per app, part of each area (each report lists what was not tried), apps that
are known to be imperfect. A clean run doesn't prove an area is robust.

Files: `<app>-report.md` (the break reports as written), `<app>-summary.json` (time and cost).
