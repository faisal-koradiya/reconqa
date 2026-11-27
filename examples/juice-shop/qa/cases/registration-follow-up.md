# Test cases: Registration tidy-up

Ticket: tickets/registration-follow-up.md · Atlas: qa/atlas/login-and-registration.md

### TC-REG-101 After registration the login page opens and the user is logged out
**Priority:** P2 · **Area:** REG · **Source:** registration-follow-up.md AC1 + decision registration/D1 + atlas login-and-registration.md (R9)
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-fu101@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open, not the product list. A toast «Registration completed successfully. You can now log in.» should be shown. |
| 4 | Open the Account menu in the top bar. | The menu should offer «Login», which shows the user is not logged in. |

---

### TC-REG-102 Registering with an email that already has an account is rejected
**Priority:** P1 · **Area:** REG · **Source:** registration-follow-up.md AC3 + atlas login-and-registration.md (M12, R8) + mismatch row 1
**Preconditions:** Browser is logged out. Register reconqa-fu102@example.test first with valid data (password Reconqa#2026, any security question and answer). Then open the registration page again.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-fu102@example.test in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | An alert banner «Email must be unique» should be shown under the «User Registration» heading. The account should not be created a second time. |
| 4 | Look at the area under the «Email» field. | No text "This email is already registered." should be shown under the field. |

---

### TC-REG-103 Password advice switch shows the strength bar and checklist
**Priority:** P2 · **Area:** REG · **Source:** registration-follow-up.md AC4 + atlas login-and-registration.md (User Registration screen)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Password» and type Reconqa#2026. | The password should be masked. |
| 2 | Turn on the switch «Show password advice». | A strength bar and a checklist should be shown. |
| 3 | Read the checklist. | The checklist should contain exactly these items: «contains at least one lower character», «contains at least one upper character», «contains at least one digit», «contains at least one special character», «contains at least 8 characters». |

---

### TC-REG-104 Security question field warns that it cannot be changed later
**Priority:** P3 · **Area:** REG · **Source:** registration-follow-up.md AC5 + atlas login-and-registration.md (R10)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Security Question» field without choosing an option. | The hint «This cannot be changed later!» should be shown for the field. |
| 2 | Choose «Name of your favorite pet?» in «Security Question». | The hint «This cannot be changed later!» should still be shown. |

---

### TC-REG-105 Password counter after typing 41 characters
**Priority:** P3 · **Area:** REG · **Source:** known issue registration/K1 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type 41 characters (for example the letter a repeated 41 times) in «Password». | The counter under the field should show «40/20». |
| 2 | Read the hint under the field. | The hint «Password must be 5-40 characters long.» should be shown. |

---

## Answered by the knowledge base
- AC1 (automatic login): decision registration/D1. The login page after registering is intended. TC-REG-101 expects it.
- AC2 (terms and conditions): decision registration/D2. Out of scope, so no cases and no report.
- Counter «40/20»: known issue registration/K1. Cited in TC-REG-105, not reported again.

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | AC3: "This email is already registered." under the email field | «Email must be unique» in an alert banner under the «User Registration» heading (M12, R8) | mismatch | Which text and position are wanted? Should the app or the ticket change? |

## Open questions
- AC4: is «Show password advice» off by default, and does the checklist update while typing? The atlas only says what is shown when the switch is on.
- AC5: the ticket says "the form says" without giving the wording. The app hint is «This cannot be changed later!». Is that the wanted text?
