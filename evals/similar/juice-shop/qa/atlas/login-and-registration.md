# Login and registration (atlas)
<!-- Frozen sample: produced by /reconqa:explore on Juice Shop 20.4.0 (2026-11-26), unedited. Used by the /write-cases demo and the grounding check. -->
App version: not shown in the UI (not found) · Explored: 2026-11-26 · Environment: local (http://localhost:3000) · Source: live app (OWASP Juice Shop)

## Screens

### Home (banners) — #/
How to reach: open http://localhost:3000. Browser started logged out (Account menu offered "Login").
- Welcome dialog "Welcome to OWASP Juice Shop!" with buttons "Help getting started" and "Close Welcome Banner" (label "Dismiss").
- Cookie dialog: "This website uses fruit cookies to ensure you get the juiciest tracking experience." Buttons "But me wait!" (learn more) and "Me want it!" (dismiss).
- Toast on load: "Language has been changed to English" with button "Force page reload".

### Login — #/login
How to reach: Account (top bar, "Show/hide account menu") → menu item "Login" ("Go to login page").

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Email | text | yes (*) | Required error on blur when empty | no placeholder |
| Password | password (masked) | yes (*) | Required error on blur when empty; "Show password" icon button toggles visibility | no placeholder |
| Remember me | checkbox | no | — | — |

Buttons and links:
- "Log in" (id loginButton): disabled while the form is empty. Enabled after both fields were filled.
- "Forgot your password?" → #/forgot-password (not explored).
- "Log in with Passkey" (not explored).
- "Log in with Google" (leaves the app origin; not clicked).
- "Not yet a customer?" → #/register.

### User Registration — #/register
How to reach: Login screen → "Not yet a customer?".

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Email | text | yes (*) | Format checked on blur; server enforces uniqueness | none |
| Password | password | yes (*) | 5–40 characters; counter shown as "n/20" (shows "40/20" after typing 41 chars) | "Password must be 5-40 characters long." (always visible under field, with counter) |
| Repeat Password | password | yes (*) | Must equal Password; counter "0/40" | none |
| Show password advice | switch | no | When on: strength bar and checklist | — |
| Security Question | dropdown | yes (*) | 14 options (see below) | "This cannot be changed later!" |
| Answer | text | yes (*) | — | placeholder "Answer to your security question" |

Security question options (in order): "Your eldest siblings middle name?", "Mother's maiden name?", "Mother's birth date? (MM/DD/YY)", "Father's birth date? (MM/DD/YY)", "Maternal grandmother's first name?", "Paternal grandmother's first name?", "Name of your favorite pet?", "Last name of dentist when you were a teenager? (Do not include 'Dr.')", "Your ZIP/postal code when you were a teenager?", "Company you first work for as an adult?", "Your favorite book?", "Your favorite movie?", "Number of one of your customer or ID cards?", "What's your favorite place to go hiking?".

Password advice checklist items: "contains at least one lower character", "contains at least one upper character", "contains at least one digit", "contains at least one special character", "contains at least 8 characters".

Buttons and links:
- "Register" (button label; aria "Button to complete the registration"): disabled while the form is incomplete/invalid; enabled once all fields valid.
- "Already a customer?" → #/login.

Screenshots: `shots/login-and-registration/login-invalid.png`, `shots/login-and-registration/register-filled.png`.

## Messages
| # | Exact text | Screen | Where shown | Trigger |
|---|---|---|---|---|
| M1 | Please provide an email address. | Login | under Email field | focus then leave Email while empty |
| M2 | Please provide a password. | Login | under Password field | focus then leave Password while empty |
| M3 | Invalid email or password. | Login | alert banner under the "Login" heading | submit with an unknown email and a password |
| M4 | Please provide an email address. | Registration | under Email field | focus then leave Email while empty |
| M5 | Please provide a password. | Registration | under Password field | focus then leave Password while empty |
| M6 | Please repeat your password. | Registration | under Repeat Password field | focus then leave Repeat Password while empty |
| M7 | Please select a security question. | Registration | under Security Question | open and close the dropdown without choosing, then leave it |
| M8 | Please provide an answer to your security question. | Registration | under Answer field | focus then leave Answer while empty |
| M9 | Email address is not valid. | Registration | under Email field | Email "reconqa-bad-email" (no @), on blur |
| M10 | Password must be 5-40 characters long. | Registration | under Password field (same text as the permanent hint) | Password of 4 characters, on blur |
| M11 | Passwords do not match | Registration | under Repeat Password field | Repeat differs from Password, on blur |
| M12 | Email must be unique | Registration | alert banner under the "User Registration" heading | Submit with an email that already exists (HTTP 400 from /api/Users/) |
| M13 | Registration completed successfully. You can now log in. | Login | toast with "X" button | Submit a valid registration |

## Rules
- R1 Login "Log in" button is disabled while the form is empty (observed).
- R2 Login Email and Password are required; errors show on blur (observed).
- R3 A wrong login returns HTTP 401 and shows M3 on the login page; the message does not say which field is wrong (observed).
- R4 Registration requires all 5 fields; "Register" stays disabled until the form is valid (observed for the empty form; enabling observed on the filled valid form).
- R5 Email format is validated on blur (observed with one invalid value).
- R6 Password length 5–40 (hint text observed; 4 chars gives M10 observed; 41 chars gave counter "40/20", so input appears capped at 40 — inferred from the counter).
- R7 Repeat Password must match Password (observed).
- R8 Emails must be unique; duplicate gives M12 (observed; the first address I tried was already taken, so the duplicate came from existing data, not from this run).
- R9 Successful registration redirects to #/login and shows M13 (observed).
- R10 Security question cannot be changed after registration (observed hint text).

## Open questions
- Not explored: "Forgot your password?" (#/forgot-password), "Log in with Passkey", "Log in with Google" (external origin), "Remember me" behaviour.
- Successful login not mapped: only accounts in `app.auth.test_accounts` may be used and no password was provided for this run.
- Email upper/lower length limit, and mixed-case duplicate emails, not tested.
- Whether the Password field hard-caps at 40 characters or only shows the error.
- Whether the Repeat Password "0/40" counter has a hard cap.
- Whether the 41-character mismatch message was due to truncation of one field.
- App version is not displayed anywhere that was visited.
- Console showed a 401 on /rest/user/login and a 400 on /api/Users/ (expected from the probes).

## Notes
