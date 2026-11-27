# Change password (atlas)
App version: not shown in the screens visited · Explored: 2026-11-27 · Environment: local (http://localhost:3000, OWASP Juice Shop) · Source: live app

Scope note: `app.deny_actions` forbids changing passwords, so the **Change** button was never clicked. Everything below was observed without submitting. Server-side behaviour (success message, wrong current password, redirect) is not mapped; see Open questions.

## Screens
### Change Password — #/privacy-security/change-password
How to reach: signed in (saved session) → «Account» (button "Show/hide account menu") → «Privacy & Security» → «Change Password».
The Privacy & Security submenu also lists: Privacy Policy, Request Data Export, Request Data Erasure, Change Password, 2FA Configuration, Manage Passkeys, Last Login IP.

Heading: «Change Password». Evidence: `shots/change-password/change-password.png` (taken with the form filled; the 4-character state).

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Current Password | password textbox (aria-label "Field to enter the current password") | yes (asterisk) | No counter shown; no other rule seen | placeholder «Please provide your current password.» |
| New Password | password textbox (aria-label "Field for the new password") | yes (asterisk) | 5–40 characters; counter «n/40»; the 41st character is not accepted (stopped at 40/40) | hint «Password must be 5-40 characters long.» with an exclamation-circle icon; counter «0/40» at start |
| Repeat New Password | password textbox (aria-label "Field to repeat the new password") | yes (asterisk) | Must equal New Password; 5–40 characters (same rule message as New Password); counter is labelled «n/20» | counter «0/20» at start; no placeholder |

Buttons and links:
- «Change» (aria-label "Button to confirm the change", edit icon): disabled at load and while any field is empty, the repeat doesn't match, or the length is under 5. Enabled once all three fields are filled, the new password is 5–40 characters and the repeat matches. Not clicked.
- No show/hide-password toggle, expander or "show more" control on this screen.
- The click target of Repeat New Password is overlapped by its own floating label, so a mouse click on it times out in Playwright. Reach it with Tab from New Password instead.

## Messages
| # | Exact text | Screen | Where shown | Trigger |
|---|---|---|---|---|
| M1 | Please provide your current password. | Change Password | Error text under Current Password | Field focused then left empty (on blur) |
| M2 | Please provide your new password. | Change Password | Error text under New Password | Field focused then left empty (on blur) |
| M3 | Please repeat your password. | Change Password | Error text under Repeat New Password | Field reached by Tab and left empty (on blur) |
| M4 | Password must be 5-40 characters long. | Change Password | Hint under New Password (always visible at start; becomes an error with the field marked invalid when the value is 4 characters) | Page load (hint); 4-character value in New Password (error) |
| M5 | Password must be 5-40 characters long. | Change Password | Error under Repeat New Password | 4-character value in Repeat New Password |
| M6 | Passwords do not match | Change Password | Error under Repeat New Password | Repeat is non-empty (or was visited) and differs from New Password; also appeared next to M3 when New Password was changed while Repeat was empty |

## Rules
- R1 Current, New and Repeat are all required; each shows its own message when left empty (observed: M1, M2, M3).
- R2 New Password must be 5–40 characters (observed: 4 characters gave M4 in invalid state; 5 characters was accepted with counter 5/40).
- R3 New Password cannot be typed beyond 40 characters (observed: 41-character entry ended at 40/40).
- R4 Repeat New Password must match New Password, otherwise M6 and «Change» stays disabled (observed).
- R5 Repeat New Password applies the same 5–40 length rule as New Password (observed: 4 matching characters gave M5 and «Change» stayed disabled).
- R6 Repeat New Password accepted 40 characters although its counter reads «/20» (observed: counter showed «40/20»). The counter's «20» looks inconsistent with the actual limit.
- R7 «Change» is enabled only when the form is valid (observed: disabled with empty fields, mismatch and 4-character values; enabled with all fields filled, 40-character matching new password).
- R8 No complexity rule (digits, symbols, case) was seen beyond length (inferred: the 5-character value «Ab1!x» and a 40-character value were accepted without further messages; lowercase-only or digits-only values were not tried).
- R9 Messages show on blur or on input, not on page load, except the length hint (observed).

## Open questions
- What is the success message, and where does the app go after a successful change? (Not run: password changes are in `app.deny_actions`.)
- What does the app say when the current password is wrong? (Not submitted.)
- What happens if the new password equals the current one?
- Are there complexity rules beyond length (lowercase-only, digits-only, spaces)?
- Is the «/20» on the Repeat counter intended? It differs from the 40 limit.
- Does Repeat New Password at exactly 41 characters get truncated? (40 and 41 were typed in one `fill`; final value was 40, so truncation is likely, but the exact state before the 41st character was not read.)
- Is the app version shown anywhere? Not seen on the screens visited.
- Behaviour when the session has expired while the form is open was not tested.

## Notes
