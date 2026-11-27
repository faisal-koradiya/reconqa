# Test cases: Registration review fixes

Ticket: tickets/kb-05-registration-review.md · Atlas: qa/atlas/login-and-registration.md

### TC-REG-201 Password of 4 characters is refused
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC2 + decision registration/D3 + atlas login-and-registration.md (M10, R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-r201@example.test in «Email». Enter abcd in «Password». Click in «Repeat Password» to leave «Password». | The message «Password must be 5-40 characters long.» should be shown under the «Password» field. |
| 2 | Enter abcd in «Repeat Password». Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be disabled. |

---

### TC-REG-202 Password of 5 characters is not refused
**Priority:** P2 · **Area:** REG · **Source:** kb-05-registration-review.md AC2 + decision registration/D3 + atlas login-and-registration.md (R6; acceptance of exactly 5 characters is inferred from the hint text, not observed)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-r202@example.test in «Email». Enter abcde in «Password» and in «Repeat Password». | No error message should be shown under the «Password» field. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-REG-203 Password counter after typing 41 characters
**Priority:** P3 · **Area:** REG · **Source:** kb-05-registration-review.md AC4 + known issue registration/K1 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type 41 characters (for example the letter a repeated 41 times) in «Password». | The counter under the field should show «40/20». |
| 2 | Read the hint under the field. | The hint «Password must be 5-40 characters long.» should be shown. |

---

### TC-REG-204 After registering the login page opens and the user is not signed in
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC3 + decision registration/D1 + atlas login-and-registration.md (R9, M13)
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-r204@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open. A toast «Registration completed successfully. You can now log in.» should be shown. |
| 4 | Open the Account menu in the top bar. | The menu should offer «Login», which shows the user is not signed in. |

---

### TC-REG-205 Mismatched repeat password shows an error under the repeat field
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC5 + atlas login-and-registration.md (M11, R7)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-r205@example.test in «Email». Enter Reconqa#2026 in «Password». | No error message should be shown under the «Password» field. |
| 2 | Enter Reconqa#2027 in «Repeat Password». Click in «Answer» to leave «Repeat Password». | The message «Passwords do not match» should be shown under the «Repeat Password» field. |
| 3 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be disabled. |
| 4 | Replace the «Repeat Password» value with Reconqa#2026. | The message «Passwords do not match» should disappear. The «Register» button should be enabled. |

---

## Answered by the knowledge base
- AC1 (terms and conditions): decision registration/D2. Out of scope for now, so no cases and no report.
- AC2 (at least 8 characters): decision registration/D3. The current limit of 5 to 40 stays; TC-REG-201 and TC-REG-202 test it.
- AC3 (automatic sign-in): decision registration/D1. The login page after registering is intended; TC-REG-204 expects it.
- AC4 (counter limit): known issue registration/K1. Reproduced in TC-REG-203, not reported again.

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | Not mentioned (AC2 asks for 8 characters) | Password advice checklist item «contains at least 8 characters» while the field accepts 5 to 40 characters (User Registration screen, R6) | missing in ticket | Should the checklist item change to match the 5-character minimum, or is it a hint only? |

AC5 matches the atlas (M11, R7).

## Open questions
- Does a 5-character password register successfully? The atlas shows the hint and the 4-character error only.
- When the password is 41 characters, is the input capped at 40 or only flagged? The atlas marks this as unknown.
