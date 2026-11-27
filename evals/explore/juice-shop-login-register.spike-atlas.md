# Login and registration (atlas)
App version: 20.4.0-SNAPSHOT (from /rest/admin/application-version: `{"version":"20.4.0-SNAPSHOT"}`; app title "OWASP Juice Shop") · Explored: 2026-11-26 · Source: live app

On first load a cookie banner ("This website uses fruit cookies to ensure you get the juiciest tracking experience.", buttons "But me wait!" / "Me want it!") and a "Welcome to OWASP Juice Shop" dialog (button "Dismiss", accessible name "Close Welcome Banner") appear. Both were dismissed.

## Screens
### Login — #/login
How to reach: open http://127.0.0.1:3000/#/login (also reached via "Not yet a customer?" is the reverse; from Register via "Already a customer?"). Screenshot: atlas/shots/login.png

| Field | Type | Required | Rules / limits | Hint text |
|---|---|---|---|---|
| Email (accessible name "Text field for the login email", id `email`) | text | Yes (asterisk) | Empty after touch shows error M1. No format validation seen on this screen (inferred: only tried one valid-looking address) | none |
| Password (accessible name "Text field for the login password", id `password`) | password (masked) | Yes (asterisk) | Empty after touch shows error M2 | none |
| Remember me | checkbox ("Checkbox to stay logged in or not logged in") | No | Not exercised | — |

Buttons and links:
- "Log in" (id `loginButton`): disabled until both fields filled; submits. Success → #/search (observed).
- Eye icon button "Show password" (next to password): clicking changed the password input type from `password` to `text` (observed).
- "Forgot your password?" → #/forgot-password (href observed; not visited).
- "Log in with Passkey" and "Log in with Google" buttons (not clicked).
- "Not yet a customer?" → #/register.

### User Registration — #/register
How to reach: open #/register directly, or click "Not yet a customer?" on Login (link href observed; direct navigation used). Screenshot: atlas/shots/register.png

| Field | Type | Required | Rules / limits | Hint text |
|---|---|---|---|---|
| Email (accessible name "Email address field", id `emailControl`) | text | Yes | Format validated, see M3 and R4 | none |
| Password (accessible name "Field for the password", id `passwordControl`) | password | Yes | Min 5; input truncates at 40 chars (41 typed → 40 kept). Error M4 below 5. | "Password must be 5-40 characters long." with counter "0/20" (counter denominator is 20 even though max is 40; at 40 chars it read "40/20") |
| Repeat Password (accessible name "Field to confirm the password", id `repeatPasswordControl`) | password | Yes | Must equal Password (M6). 41 chars were accepted in this field (no truncation seen) | counter "0/40" |
| Show password advice | toggle switch | No | When on, lists criteria (see R8) | — |
| Security Question (accessible name "Selection list for the security question") | dropdown (mat-select) | Yes | 14 options (see below) | "This cannot be changed later!" |
| Answer (accessible name "Field for the answer to the security question") | text | Yes | Empty after touch shows M7 | placeholder "Answer to your security question" |

Security question options, in order: "Your eldest siblings middle name?", "Mother's maiden name?", "Mother's birth date? (MM/DD/YY)", "Father's birth date? (MM/DD/YY)", "Maternal grandmother's first name?", "Paternal grandmother's first name?", "Name of your favorite pet?", "Last name of dentist when you were a teenager? (Do not include 'Dr.')", "Your ZIP/postal code when you were a teenager?", "Company you first work for as an adult?", "Your favorite book?", "Your favorite movie?", "Number of one of your customer or ID cards?", "What's your favorite place to go hiking?"

Buttons and links:
- "Register" (accessible name "Button to complete the registration", id `registerButton`): disabled while the form is empty/invalid; enabled once all valid.
- "Already a customer?" → #/login.

## Messages
| # | Exact text | Where shown | Trigger |
|---|---|---|---|
| M1 | Please provide an email address. | Login, under Email | Email touched and left empty |
| M2 | Please provide a password. | Login, under Password; also Register, under Password | Password touched/left empty |
| M3 | Email address is not valid. | Register, under Email | Email `abc`, `user@`, `@example.test`, `a b@example.test` |
| M4 | Password must be 5-40 characters long. | Register, under Password (as error) and as permanent hint | Password of 4 chars (`abcd`) |
| M5 | Please repeat your password. | Register, under Repeat Password | Repeat Password touched/left empty |
| M6 | Passwords do not match | Register, under Repeat Password (no trailing period) | Repeat differs from Password (`Different#1` vs `Explore#12345`) |
| M7 | Please select a security question. | Register, under Security Question | Dropdown opened and closed without selecting |
| M8 | Please provide an answer to your security question. | Register, under Answer | Answer touched and left empty |
| M9 | Invalid email or password. | Login, red text above/near the form (class `error`) | Submit unknown email `notauser@example.test` with `Wrong#12345`; stayed on #/login |
| M10 | Registration completed successfully. You can now log in. | Snackbar (with "X" close) | Valid registration submitted |
| M11 | Email must be unique | Register, error text on page | Register again with an already registered email |

## Rules
- R1 Login button is disabled until Email and Password are both non-empty — observed (disabled when empty; enabled after typing).
- R2 Login with wrong credentials stays on #/login and shows M9 — observed.
- R3 Login with the newly registered account (`explorer-mwx3eq7l@example.test` / `Explore#12345`) goes to #/search — observed.
- R4 Registration email: `a@b` and `user@example` (no dot in domain) raised no email error — observed; other malformed values in M3 raised it — observed.
- R5 Password length 5 and 40 accepted, 4 rejected — observed; typing over 40 is truncated to 40 — observed.
- R6 Repeat Password must match Password — observed.
- R7 All six registration fields are required; Register stays disabled until all valid — observed (disabled when invalid, enabled after full valid fill).
- R8 "Show password advice" lists: "contains at least one lower character", "contains at least one upper character", "contains at least one digit", "contains at least one special character", "contains at least 8 characters" — observed for `Explore#12345` (all shown as done). These are advice only: a 5-char password `abcde` still had Register enabled and the form was submitted (rejected only for duplicate email, M11) — observed.
- R9 Successful registration shows M10 and redirects to #/login — observed.
- R10 Duplicate email is rejected with M11 — observed.
- R11 Errors show only after a field is touched (blurred) — observed.
- R12 Security question was answered "Your eldest siblings middle name?" / "Rex" in the happy path — observed.

## Open questions
- Is a 5-char password with a unique email accepted (advice says 8)? The only 5-char attempt used a duplicate email.
- Whether login email format validation exists (only tried well-formed and empty).
- Behaviour of "Remember me", "Log in with Passkey", "Log in with Google", and "Forgot your password?" (not exercised; other area).
- Why the Password counter shows "/20" while max is 40.
- Whether the Repeat Password field has any max length (41 chars accepted, no error seen while mismatched).
- Email case sensitivity for uniqueness; very long email and email length limit not tested.
- Console showed errors during the session (e.g. after the failed login); content not inspected.
