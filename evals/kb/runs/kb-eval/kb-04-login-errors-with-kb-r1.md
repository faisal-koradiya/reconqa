# Test cases: Helpful login errors

Ticket: tickets/kb-04-login-errors.md · Atlas: qa/atlas/login-and-registration.md

### TC-LOGIN-001 Login with an unknown email shows the generic error
**Priority:** P1 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC1 + decision registration/D6 + atlas login-and-registration.md (M3, R3)
**Preconditions:** Browser is logged out. The login page is open. Use an email that has no account, for example reconqa-nouser-7431@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-nouser-7431@example.test in «Email». Enter Reconqa#2026 in «Password». | The «Log in» button should be enabled. |
| 2 | Click «Log in». | An alert banner «Invalid email or password.» should be shown under the «Login» heading. The login page should stay open. |
| 3 | Look at the area under the «Email» field and under the «Password» field. | No error text should be shown under either field. |

---

### TC-LOGIN-002 Login with a wrong password shows the same generic error
**Priority:** P1 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC1 + decision registration/D6 + atlas login-and-registration.md (M3, R3) + mismatch row 1
**Preconditions:** Browser is logged out. The login page is open. Use the email of the test account demo-customer (from app.auth.test_accounts).

| # | Step | Expected |
|---|---|---|
| 1 | Enter the email of demo-customer in «Email». Enter Wrong#Pass9 in «Password». | The «Log in» button should be enabled. |
| 2 | Click «Log in». | An alert banner «Invalid email or password.» should be shown under the «Login» heading. The login page should stay open. |
| 3 | Compare the banner text with the one from an unknown email (TC-LOGIN-001). | The banner text should be the same and should not say whether the email or the password was wrong. |

---

### TC-LOGIN-003 The Log in button is disabled while the form is empty
**Priority:** P2 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC2 + atlas login-and-registration.md (R1)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Log in» button without entering anything. | The «Log in» button should be disabled. |
| 2 | Click the disabled «Log in» button. | The page should stay on the login page and no banner should be shown. |

---

### TC-LOGIN-004 The Log in button is enabled after both fields are filled
**Priority:** P2 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC2 + atlas login-and-registration.md (R1)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-btn-5521@example.test in «Email». Enter Reconqa#2026 in «Password». | The «Log in» button should be enabled. |

---

### TC-LOGIN-005 Leaving Email empty shows an error under the field
**Priority:** P1 · **Area:** LOGIN · **Source:** kb-04-login-errors.md AC3 + atlas login-and-registration.md (M1, R2)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Click into «Email», then click into «Password» without typing anything. | The text «Please provide an email address.» should be shown under the «Email» field. |
| 2 | Look at the «Log in» button. | The «Log in» button should be disabled. |

---

### TC-LOGIN-006 Leaving Password empty shows an error under the field
**Priority:** P2 · **Area:** LOGIN · **Source:** atlas login-and-registration.md (M2, R2) · not in ticket (mismatch row 4)
**Preconditions:** Browser is logged out. The login page is open and both fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Click into «Password», then click into «Email» without typing anything. | The text «Please provide a password.» should be shown under the «Password» field. |
| 2 | Look at the «Log in» button. | The «Log in» button should be disabled. |

---

## Answered by the knowledge base
- AC1 (separate messages for wrong password and unknown email): decision registration/D6 says the message must not say which field was wrong. TC-LOGIN-001 and TC-LOGIN-002 expect one generic message. The text comes from the atlas.

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | AC1: the ticket gives two separate messages for a wrong password and an unknown email | One generic banner for both (M3, R3); settled by decision registration/D6 | mismatch (answered by decision registration/D6) | None: the ticket should be corrected to match D6. |
| 2 | AC2: the button stays disabled until email and password are filled in | Disabled on the empty form, enabled once both are filled (R1); the state with only one field filled is not covered | match | Open question: is the button disabled when only one field is filled? |
| 3 | AC3: an error under Email when it is left empty | M1 under Email on blur (R2) | match | None. |
| 4 | Not mentioned | M2 under Password when it is left empty (R2) | missing in ticket | Add this rule to the ticket? Covered by TC-LOGIN-006. |

## Open questions
- Is the «Log in» button disabled when only one of the two fields is filled? The atlas does not cover it, so no case checks it.
