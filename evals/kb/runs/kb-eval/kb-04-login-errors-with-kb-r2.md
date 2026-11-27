# Test cases: Helpful login errors

Ticket: tickets/kb-04-login-errors.md · Atlas: qa/atlas/login-and-registration.md

## 1. Ticket and atlas compared

**Answered by the knowledge base**
- AC1 (separate messages for wrong password and unknown email): decision registration/D6. The login error stays generic. Cases expect the one message «Invalid email or password.» for both; the ticket texts are not tested.

**Matches**
- AC2: «Log in» is disabled while the form is empty and enabled once both fields are filled (atlas R1).
- AC3: leaving «Email» empty shows an error under the field (atlas M1, R2).

**Missing in ticket**
- Leaving «Password» empty shows «Please provide a password.» (atlas M2). Covered by TC-LOGIN-005.

**Mismatches for a PO or developer to decide:** none open.

## 2. Cases

### TC-LOGIN-001 Wrong password shows the generic login error
**Priority:** P1 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC1 + decision registration/D6 + atlas login-and-registration.md (M3, R3)
**Preconditions:** Browser is logged out. Register reconqa-<random>@example.test with password Reconqa#2026 first (any security question and answer). Open the login page.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-<random>@example.test in «Email» and WrongPass#1 in «Password». | The «Log in» button should be enabled. |
| 2 | Click «Log in». | An alert banner «Invalid email or password.» should be shown under the «Login» heading. The login page should stay open. |
| 3 | Read the banner and the area under both fields. | No text "Your password is incorrect." should be shown anywhere on the page. |

---

### TC-LOGIN-002 Unknown email shows the generic login error
**Priority:** P1 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC1 + decision registration/D6 + atlas login-and-registration.md (M3, R3)
**Preconditions:** Browser is logged out. The login page is open. Use an email that was never registered, for example reconqa-unknown-<random>@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-unknown-<random>@example.test in «Email» and WrongPass#1 in «Password». | The «Log in» button should be enabled. |
| 2 | Click «Log in». | An alert banner «Invalid email or password.» should be shown under the «Login» heading. |
| 3 | Read the banner. | The banner should be the same text as in TC-LOGIN-001 and should not say that the email is unknown. No text "No account with this email." should be shown on the page. |

---

### TC-LOGIN-003 Log in button is disabled while the form is empty
**Priority:** P2 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC2 + atlas login-and-registration.md (R1)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Log in» button. | The «Log in» button should be disabled. |
| 2 | Enter reconqa-<random>@example.test in «Email» and any text in «Password». | The «Log in» button should be enabled. |
| 3 | Clear both fields. | The «Log in» button should be disabled again. |

---

### TC-LOGIN-004 Empty email shows an error under the field
**Priority:** P2 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC3 + atlas login-and-registration.md (M1, R2)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Click into «Email», then click into «Password» without typing. | The text «Please provide an email address.» should be shown under the «Email» field. |
| 2 | Enter reconqa-<random>@example.test in «Email». | The text «Please provide an email address.» should no longer be shown. |

---

### TC-LOGIN-005 Empty password shows an error under the field
**Priority:** P3 · **Area:** LOGIN · **Source:** atlas login-and-registration.md (M2, R2); not in the ticket (missing in ticket)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Click into «Password», then click into «Email» without typing. | The text «Please provide a password.» should be shown under the «Password» field. |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind | Suggested question |
|---|---|---|---|---|
| – | – | – | – | No open mismatches. AC1 is answered by decision registration/D6. |

Open questions (atlas does not cover):
- Atlas observed M3 only for an unknown email (R3 says "a wrong login"). TC-LOGIN-001 assumes a wrong password on a real account gives the same banner; confirm when run.
- Is «Log in» still disabled when only one of the two fields is filled? Atlas observed only the empty and the fully filled form.
