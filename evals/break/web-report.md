# Break report: Login and registration, registration form (2026-11-27)
App version: not shown in the UI · Environment: local (http://localhost:3000) · Actions used: 30 of 40 · Monkey seed: none

## Findings
| # | Severity | What I did | What happened | Evidence | Repeated |
|---|---|---|---|---|---|
| 1 | major | 1. Open #/register. 2. Register `reconqa@example` with password `Reconqa#1234`, any security question, answer `reconqa answer`. 3. Open #/register again. 4. Register `RECONQA@example` with the same other values. | The second registration succeeded (HTTP 201, redirect to #/login). The atlas rule R8 says emails must be unique, but the same address in a different letter case is accepted as a new account. | POST /api/Users/ => 201 for both | Yes: `ReconQA@example` was also accepted (201, redirect to #/login) |
| 2 | minor | 1. Open #/register. 2. Type the 41-character value (x × 41) in Password. 3. Type the same 41 characters in Repeat Password. 4. Fill the other fields with valid values. | Password is silently cut to 40 characters (counter "40/20") but Repeat Password keeps all 41. The form shows "Passwords do not match" and Register stays disabled, with no hint that Password was cut. | qa/breaks/shots/pw41.png | Seen once |
| 3 | minor | 1. Open #/register. 2. Type any password, for example `Reconqa#1234`. | The Password counter reads "12/20" while the hint says 5-40 characters, and Repeat Password reads "12/40". The 20 limit contradicts the stated 40. | Snapshot of the form after step 2 | Yes (shown on every load of the form) |
| 4 | minor | 1. Open #/register. 2. Type `reconqa@example` (no dot in the domain) in Email. 3. Fill the other fields with valid values. | The form accepts it and Register becomes enabled. It registered successfully (HTTP 201). Whether this is intended is unclear. | POST /api/Users/ => 201 | Seen once |

## Held up well
- Email `reconqa@@example.test`: shows "Email address is not valid." and Register stays disabled.
- Double-clicking Register on a valid form sent exactly one POST /api/Users/ (one account created).
- Different mixed-case and valid emails registered and redirected to #/login with no server error.

## Test data left behind
- Accounts created: `reconqa@example`, `RECONQA@example`, `ReconQA@example` (password `Reconqa#1234`).
- Not tested (budget and the scripting gate): the rest of the catalogue values for Email, Password and Answer, Back or reload during a save, and the very long (5000) value.
