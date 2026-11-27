# Test cases: Smoother sign-up

Ticket: tickets/kb-02-registration-flow.md · Atlas: qa/atlas/login-and-registration.md

### TC-REG-201 After registering the user is sent to the login page, not logged in
**Priority:** P1 · **Area:** REG · **Source:** kb-02-registration-flow.md AC1 + atlas login-and-registration.md (R9, M13) + mismatch row 1
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-k201@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open, not the product list. A toast «Registration completed successfully. You can now log in.» should be shown. |
| 4 | Open the Account menu in the top bar. | The menu should offer «Login», which shows the user is not logged in. |

---

### TC-REG-202 The registration form has no terms and conditions acceptance
**Priority:** P2 · **Area:** REG · **Source:** kb-02-registration-flow.md AC2 + atlas login-and-registration.md (User Registration screen, R4) + mismatch row 2
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-k202@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Look at all fields and controls of the registration form. | The form should show only «Email», «Password», «Repeat Password», «Show password advice», «Security Question» and «Answer». No checkbox for terms and conditions should be shown. |
| 2 | Enter the new email in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled without any terms control being used. |

---

### TC-REG-203 Registering with an email that already has an account is rejected
**Priority:** P1 · **Area:** REG · **Source:** kb-02-registration-flow.md AC3 + atlas login-and-registration.md (M12, R8) + mismatch row 3
**Preconditions:** Browser is logged out. Register reconqa-k203@example.test first with valid data (password Reconqa#2026, any security question and answer). Then open the registration page again.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-k203@example.test in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | An alert banner «Email must be unique» should be shown under the «User Registration» heading. The account should not be created a second time. |
| 4 | Look at the area under the «Email» field. | The text "This email is already registered." should not be shown under the field. |

---

### TC-REG-204 The "Already a customer?" link opens the login page
**Priority:** P2 · **Area:** REG · **Source:** kb-02-registration-flow.md AC4 + atlas login-and-registration.md (User Registration screen)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Already a customer?». | The login page should open (address ending in #/login) with the fields «Email» and «Password» and the «Log in» button. |

---

### TC-REG-205 Registration email without @ shows a format error
**Priority:** P2 · **Area:** REG · **Source:** atlas login-and-registration.md (M9, R5), not covered by the ticket
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-bad-email in «Email», then click in «Password». | The message «Email address is not valid.» should be shown under the «Email» field. |
| 2 | Enter Reconqa#2026 in «Password» and in «Repeat Password». Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should stay disabled. |

---

### TC-REG-206 Password of 4 characters is rejected
**Priority:** P2 · **Area:** REG · **Source:** atlas login-and-registration.md (M10, R6), not covered by the ticket
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter abcd in «Password», then click in «Repeat Password». | The message «Password must be 5-40 characters long.» should be shown under the «Password» field. |

---

### TC-REG-207 Repeat Password that differs from Password is rejected
**Priority:** P2 · **Area:** REG · **Source:** atlas login-and-registration.md (M11, R7), not covered by the ticket
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Reconqa#2026 in «Password». Enter Reconqa#2027 in «Repeat Password», then click in «Answer». | The message «Passwords do not match» should be shown under the «Repeat Password» field. |

---

### TC-REG-208 Password counter after typing 41 characters
**Priority:** P3 · **Area:** REG · **Source:** atlas login-and-registration.md (R6), not covered by the ticket + mismatch row 4
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type 41 characters (for example the letter a repeated 41 times) in «Password». | The counter under the field should show n/40 with n equal to the number of characters typed in the field. |
| 2 | Read the hint under the field. | The hint «Password must be 5-40 characters long.» should be shown. |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | AC1: after registering the user is logged in automatically and sees the product list | Redirect to the login page with the toast «Registration completed successfully. You can now log in.» (R9, M13) | mismatch | Should registration log the user in, as the ticket says? Cases TC-REG-201 test the app's behaviour. |
| 2 | AC2: the user must accept the terms and conditions before registering | The registration form has no terms control; «Register» is enabled once the five fields are valid (User Registration screen, R4) | missing in app | Is a terms checkbox still to be built? Which text should it have? (TC-REG-202) |
| 3 | AC3: "This email is already registered." under the email field | «Email must be unique» in an alert banner under the «User Registration» heading (M12, R8) | mismatch | Which text and position are wanted? Should the app or the ticket change? (TC-REG-203) |
| 4 | not mentioned | Counter shows «40/20» after typing 41 characters, while the hint says 5-40 (R6) | likely defect (low), TC-REG-208 | Should the counter show n/40? |

AC4 ("Already a customer?" → login page) matches the atlas (TC-REG-204).

## Answered by the knowledge base
None: no knowledge base exists in this project.

## Open questions
- AC1: if automatic login is wanted, should the user land on the product list at once, and what happens to the toast?
- Password of exactly 5 and exactly 40 characters: the atlas only records the hint and the 4-character error, so no case checks these boundaries yet.
- Whether the registration email check is case-insensitive (atlas: not tested).
