# Test cases: Helpful login errors

Ticket: tickets/kb-04-login-errors.md · Atlas: qa/atlas/login-and-registration.md

### TC-LOG-001 Wrong password for an existing account shows the generic login error
**Priority:** P1 · **Area:** LOG · **Source:** kb-04-login-errors.md AC1 + decision registration/D6 + atlas login-and-registration.md (M3, R3)
**Preconditions:** Browser is logged out. Register reconqa-log001@example.test first with password Reconqa#2026 (any security question and answer). Then open the login page through the Account menu.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-log001@example.test in «Email». Enter Wrong#Pass99 in «Password». | The «Log in» button should be enabled. |
| 2 | Click «Log in». | An alert banner «Invalid email or password.» should be shown under the «Login» heading. The login page should stay open. |
| 3 | Read the banner. | The banner should not say whether the email or the password was wrong. |

---

### TC-LOG-002 Unknown email shows the same generic login error
**Priority:** P1 · **Area:** LOG · **Source:** kb-04-login-errors.md AC1 + decision registration/D6 + atlas login-and-registration.md (M3, R3)
**Preconditions:** Browser is logged out. The login page is open. Use an email that has no account, for example reconqa-log002-unknown@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-log002-unknown@example.test in «Email». Enter Reconqa#2026 in «Password». | The «Log in» button should be enabled. |
| 2 | Click «Log in». | An alert banner «Invalid email or password.» should be shown under the «Login» heading. The login page should stay open. |
| 3 | Read the banner. | The banner text should be the same as for a wrong password with an existing account. |

---

### TC-LOG-003 Log in button is disabled until both fields are filled
**Priority:** P1 · **Area:** LOG · **Source:** kb-04-login-errors.md AC2 + atlas login-and-registration.md (R1)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Log in» button without typing anything. | The «Log in» button should be disabled. |
| 2 | Enter reconqa-log003@example.test in «Email». Enter Reconqa#2026 in «Password». | The «Log in» button should be enabled. |

---

### TC-LOG-004 Empty email shows an error under the field
**Priority:** P2 · **Area:** LOG · **Source:** kb-04-login-errors.md AC3 + atlas login-and-registration.md (M1, R2)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Email», then click outside the field without typing. | The error «Please provide an email address.» should be shown under the «Email» field. |
| 2 | Look at the «Log in» button. | The «Log in» button should be disabled. |

---

### TC-LOG-005 Empty password shows an error under the field
**Priority:** P2 · **Area:** LOG · **Source:** atlas login-and-registration.md (M2, R2); not in the ticket (mismatch row 1)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Password», then click outside the field without typing. | The error «Please provide a password.» should be shown under the «Password» field. |
| 2 | Look at the «Log in» button. | The «Log in» button should be disabled. |

---

## Answered by the knowledge base
- AC1 (separate messages "Your password is incorrect." and "No account with this email."): decision registration/D6. The login error stays generic, one message for both cases, so TC-LOG-001 and TC-LOG-002 expect «Invalid email or password.». The ticket's two messages are not tested.

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | Nothing about the password field (AC3 covers only email) | «Please provide a password.» under «Password» when left empty (M2, R2) | missing in ticket | Should the ticket add the password error to AC3? Covered by TC-LOG-005. |

AC2 and AC3 match the atlas (R1, M1).

## Open questions
- AC2: does «Log in» stay disabled when only one of the two fields is filled? The atlas only observed the empty form and the fully filled form.
- AC1: the atlas observed «Invalid email or password.» with an unknown email. A wrong password for an existing account is covered by the atlas rule R3 but was not tried with a real account. TC-LOG-001 needs to confirm it.
