# Test cases: Registration review fixes

Ticket: tickets/kb-05-registration-review.md · Atlas: qa/atlas/login-and-registration.md

### TC-REG-201 Password of 4 characters is refused
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC2 + decision registration/D3 + atlas login-and-registration.md (M10, R6) + mismatch row 1
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Password», type Ab#1 (4 characters), then click in «Repeat Password». | The message «Password must be 5-40 characters long.» should be shown under the «Password» field. |
| 2 | Enter Ab#1 in «Repeat Password». Enter reconqa-rv201@example.test in «Email». Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should stay disabled. |

---

### TC-REG-202 Password of 5 characters is accepted
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC2 + decision registration/D3 + atlas login-and-registration.md (R6, R9) + mismatch row 1
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-rv202@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Ab#12 (5 characters) in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The registration should be accepted and the login page should open. |

---

### TC-REG-203 After registration the login page opens and the user is logged out
**Priority:** P2 · **Area:** REG · **Source:** kb-05-registration-review.md AC3 + decision registration/D1 + atlas login-and-registration.md (R9, M13)
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-rv203@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open. A toast «Registration completed successfully. You can now log in.» should be shown. |
| 4 | Open the Account menu in the top bar. | The menu should offer «Login», which shows the user is not logged in. |

---

### TC-REG-204 Password counter after typing 41 characters
**Priority:** P3 · **Area:** REG · **Source:** kb-05-registration-review.md AC4 + known issue registration/K1 + atlas login-and-registration.md (R6) + mismatch row 2
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type 41 characters (for example the letter a repeated 41 times) in «Password». | The counter under the field should show «40/20». |
| 2 | Read the hint under the field. | The hint «Password must be 5-40 characters long.» should be shown. |

---

### TC-REG-205 Mismatched repeat password shows an error under the repeat field
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC5 + atlas login-and-registration.md (M11, R7)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Reconqa#2026 in «Password». | No error message should be shown under «Password». |
| 2 | Enter Reconqa#2027 in «Repeat Password», then click in «Email». | The message «Passwords do not match» should be shown under the «Repeat Password» field. |
| 3 | Enter reconqa-rv205@example.test in «Email». Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should stay disabled. |
| 4 | Replace the «Repeat Password» value with Reconqa#2026. | The message «Passwords do not match» should disappear. |

---

## Answered by the knowledge base
- AC1 (terms and conditions): decision registration/D2. Out of scope, so no cases and no report.
- AC2 (minimum 8 characters): decision registration/D3. The limit stays at 5 to 40 for now; TC-REG-201 and TC-REG-202 test 4 and 5 characters.
- AC3 (automatic login): decision registration/D1. The login page after registering is intended; TC-REG-203 expects it.
- AC4 (counter): known issue registration/K1. Cited in TC-REG-204, not reported again.

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | AC2: passwords shorter than 8 characters are refused | Limit is 5 to 40; 4 characters gives «Password must be 5-40 characters long.» (M10, R6) | mismatch (already settled by decision registration/D3, listed for the ticket correction) | None open; ticket should say 5 instead of 8. |
| 2 | AC4: the counter shows the correct limit | Counter shows «40/20» after 41 characters (R6) | likely defect (known issue registration/K1, high-visibility, severity low) | None; already reported in K1. |

AC5 matches the app: «Passwords do not match» appears under «Repeat Password» (M11).

## Open questions
- Does the password field hard-cap at 40 characters, or only show the error? The atlas marks this as inferred, so no case checks it.
