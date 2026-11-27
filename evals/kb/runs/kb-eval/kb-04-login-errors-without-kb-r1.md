# Test cases: Helpful login errors

Ticket: tickets/kb-04-login-errors.md · Atlas: qa/atlas/login-and-registration.md

### TC-LOGIN-001 Login with a wrong password shows an error on the login page
**Priority:** P1 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC1 + atlas login-and-registration.md (M3, R3) + mismatch row 1
**Preconditions:** Browser is logged out. Register reconqa-login001@example.test first with password Reconqa#2026 (any security question and answer). Then open the login page.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-login001@example.test in «Email». Enter Wrong#Pass99 in «Password». | The «Log in» button should be enabled. |
| 2 | Click «Log in». | An alert banner «Invalid email or password.» should be shown under the «Login» heading. The login page should stay open and the user should stay logged out. |
| 3 | Look at the page for the text "Your password is incorrect." | That text should not be shown anywhere on the page. |

---

### TC-LOGIN-002 Login with an unknown email shows an error on the login page
**Priority:** P1 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC1 + atlas login-and-registration.md (M3, R3) + mismatch row 1
**Preconditions:** Browser is logged out. The login page is open. Use an email that has no account, for example reconqa-nobody-login002@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-nobody-login002@example.test in «Email». Enter Reconqa#2026 in «Password». | The «Log in» button should be enabled. |
| 2 | Click «Log in». | An alert banner «Invalid email or password.» should be shown under the «Login» heading. The user should stay logged out. |
| 3 | Look at the page for the text "No account with this email." | That text should not be shown anywhere on the page. |

---

### TC-LOGIN-003 The error text is the same for a wrong password and for an unknown email
**Priority:** P2 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC1 + atlas login-and-registration.md (R3) + mismatch row 1
**Preconditions:** Browser is logged out. Register reconqa-login003@example.test first with password Reconqa#2026 (any security question and answer). Then open the login page.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-login003@example.test in «Email» and Wrong#Pass99 in «Password». Click «Log in». | An alert banner «Invalid email or password.» should be shown. |
| 2 | Reload the login page. Enter reconqa-nobody-login003@example.test in «Email» and Wrong#Pass99 in «Password». Click «Log in». | The same alert banner «Invalid email or password.» should be shown. The message should not say which of the two fields is wrong. |

---

### TC-LOGIN-004 The «Log in» button is disabled for an empty form and enabled once both fields are filled
**Priority:** P1 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC2 + atlas login-and-registration.md (R1)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Log in» button without entering anything. | The «Log in» button should be disabled. |
| 2 | Enter reconqa-login004@example.test in «Email». Enter Reconqa#2026 in «Password». | The «Log in» button should be enabled. |

---

### TC-LOGIN-005 Leaving «Email» empty shows an error under the field
**Priority:** P1 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC3 + atlas login-and-registration.md (M1, R2)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Click into «Email», then click outside the field without typing. | The text «Please provide an email address.» should be shown under the «Email» field. |
| 2 | Enter reconqa-login005@example.test in «Email». | The error text under the «Email» field should disappear. |

---

### TC-LOGIN-006 Leaving «Password» empty shows an error under the field
**Priority:** P2 · **Area:** LOGIN · **Source:** atlas login-and-registration.md (M2, R2) · missing in ticket (mismatch row 4)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Click into «Password», then click outside the field without typing. | The text «Please provide a password.» should be shown under the «Password» field. |
| 2 | Enter Reconqa#2026 in «Password». | The error text under the «Password» field should disappear. |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | AC1: wrong password shows "Your password is incorrect."; unknown email shows "No account with this email." | One message «Invalid email or password.» for a wrong login, which does not say which field is wrong (M3, R3) | mismatch | Should the app tell the two cases apart (this reveals which emails have accounts), or should the ticket use the single message? Cases TC-LOGIN-001 to 003 follow the app. |
| 2 | AC2: «Log in» stays disabled until email and password are filled in | Disabled for the empty form, enabled after both are filled (R1) | match | None. Disabled state with only one field filled was not observed; see open questions. |
| 3 | AC3: empty email shows an error under the field | «Please provide an email address.» under «Email» on blur (M1) | match | None. |
| 4 | Not mentioned | «Please provide a password.» under «Password» on blur (M2) | missing in ticket | Add the password error to the ticket? Covered by TC-LOGIN-006. |

### Open questions
- Is «Log in» disabled when only one of the two fields is filled? The atlas observed only the empty form and the fully filled form.
- AC1 wrong password: the atlas observed M3 for an unknown email; R3 states a wrong login gives M3, but a wrong password for an existing account was not listed as a separate observation. TC-LOGIN-001 and 003 will confirm it.
- Does the error under «Email» appear on submit or only on blur? The ticket does not say; the atlas observed blur only.
