# Test cases: customer-login

Ticket: tickets/customer-login.ticket.md · Atlas: qa/atlas/login-and-registration.md · Environment: local (http://localhost:3000)
Exact UI text is marked with guillemets and copied from the atlas.

### TC-LOGIN-001 Log in button is disabled on the empty login form
**Priority:** P1 · **Area:** LOGIN · **Source:** customer-login.ticket.md AC2 + atlas qa/atlas/login-and-registration.md (R1)
**Preconditions:** Browser is logged out. Welcome and cookie dialogs are dismissed.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/login. | The login page should show the fields «Email» and «Password», both empty. |
| 2 | Look at the button «Log in». | The button «Log in» should be disabled. |

### TC-LOGIN-002 Log in button is enabled once both fields are filled
**Priority:** P1 · **Area:** LOGIN · **Source:** customer-login.ticket.md AC2 + atlas qa/atlas/login-and-registration.md (R1)
**Preconditions:** Browser is logged out. Welcome and cookie dialogs are dismissed.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/login. | The button «Log in» should be disabled. |
| 2 | Type reconqa-user@example.test in «Email». | No further result is checked here. |
| 3 | Type any text in «Password». | The button «Log in» should be enabled. |

### TC-LOGIN-003 Email shows a required error when left empty
**Priority:** P2 · **Area:** LOGIN · **Source:** customer-login.ticket.md AC1 + atlas qa/atlas/login-and-registration.md (R2, M1)
**Preconditions:** Browser is logged out. Welcome and cookie dialogs are dismissed.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/login. | The login page should be shown. |
| 2 | Click into «Email», then click into «Password» without typing. | The message «Please provide an email address.» should appear under the «Email» field. |

### TC-LOGIN-004 Password shows a required error when left empty
**Priority:** P2 · **Area:** LOGIN · **Source:** customer-login.ticket.md AC1 + atlas qa/atlas/login-and-registration.md (R2, M2)
**Preconditions:** Browser is logged out. Welcome and cookie dialogs are dismissed.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/login. | The login page should be shown. |
| 2 | Click into «Password», then click into «Email» without typing. | The message «Please provide a password.» should appear under the «Password» field. |

### TC-LOGIN-005 Password can be shown and hidden
**Priority:** P2 · **Area:** LOGIN · **Source:** customer-login.ticket.md AC3 + atlas qa/atlas/login-and-registration.md (Login screen)
**Preconditions:** Browser is logged out. Welcome and cookie dialogs are dismissed.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/login and type reconqa-Pass1! in «Password». | The typed characters should be masked. |
| 2 | Click the icon button «Show password». | The typed text should be readable in the field. |
| 3 | Click the same icon button again. | The typed characters should be masked again. |

### TC-LOGIN-006 Wrong credentials show the app's error message
**Priority:** P1 · **Area:** LOGIN · **Source:** customer-login.ticket.md AC4, AC5 + atlas qa/atlas/login-and-registration.md (R3, M3); mismatch row 1
**Preconditions:** Browser is logged out. Email reconqa-unknown-<random>@example.test is not registered.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/login. | The login page should be shown. |
| 2 | Type reconqa-unknown-<random>@example.test in «Email» and reconqa-Pass1! in «Password». | The button «Log in» should be enabled. |
| 3 | Click «Log in». | The alert «Invalid email or password.» should appear under the «Login» heading. |
| 4 | Read the alert text. | The alert should not name one field as the wrong one. The page should stay on the login page. |

### TC-LOGIN-007 Forgot password link leads to the reset page
**Priority:** P3 · **Area:** LOGIN · **Source:** customer-login.ticket.md AC6 + atlas qa/atlas/login-and-registration.md (Login screen); mismatch row 3
**Preconditions:** Browser is logged out. Welcome and cookie dialogs are dismissed.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/login. | The link «Forgot your password?» should be shown. |
| 2 | Click «Forgot your password?». | The URL should change to #/forgot-password. |

### TC-LOGIN-008 Login page offers no Apple login
**Priority:** P2 · **Area:** LOGIN · **Source:** customer-login.ticket.md AC7 + atlas qa/atlas/login-and-registration.md (Login screen); mismatch row 2
**Preconditions:** Browser is logged out. Welcome and cookie dialogs are dismissed.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/login. | The login page should show the buttons «Log in with Passkey» and «Log in with Google». |
| 2 | Look for any Apple login button. | No Apple login button should be shown. |

### TC-LOGIN-009 Registration link is reachable from the login page
**Priority:** P2 · **Area:** LOGIN · **Source:** customer-login.ticket.md AC8 + atlas qa/atlas/login-and-registration.md (Login screen); mismatch row 4
**Preconditions:** Browser is logged out. Welcome and cookie dialogs are dismissed.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/login. | The link «Not yet a customer?» should be shown. |
| 2 | Click «Not yet a customer?». | The URL should change to #/register and the «User Registration» page should be shown. |

### TC-LOGIN-010 Registered customer can log in
**Priority:** P1 · **Area:** LOGIN · **Source:** customer-login.ticket.md user story + atlas qa/atlas/login-and-registration.md (R9, M13); see Open questions
**Preconditions:** Browser is logged out. Register reconqa-<random>@example.test with password reconqa-Pass1! through «User Registration» first, choosing any «Security Question» and any «Answer».

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/login. | The login page should be shown. |
| 2 | Type reconqa-<random>@example.test in «Email» and reconqa-Pass1! in «Password». | The button «Log in» should be enabled. |
| 3 | Click «Log in». | No error alert should appear and the page should leave #/login (per ticket, not observed in the atlas). |

### TC-REG-001 Password counter on registration matches the 40 character limit
**Priority:** P3 · **Area:** REG · **Source:** atlas qa/atlas/login-and-registration.md (User Registration, R6); mismatch row 5
**Preconditions:** Browser is logged out. Welcome and cookie dialogs are dismissed.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3000/#/register. | The hint «Password must be 5-40 characters long.» should be shown under «Password». |
| 2 | Type 41 characters in «Password». | The counter should show a maximum of 40, such as 40/40. |

---

## Mismatches / questions (one list per run, after the cases)
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | Error text is "Incorrect email or password. Please try again." (AC4) | «Invalid email or password.» (M3, R3) | mismatch | Which text is correct? Reproduced by TC-LOGIN-006. |
| 2 | Customers can log in with Apple (AC7) | Only «Log in with Passkey» and «Log in with Google» are listed (Login screen) | missing in app | Is Apple login planned for this release? See TC-LOGIN-008. |
| 3 | Forgot link is under the password field (AC6) | «Forgot your password?» exists and points to #/forgot-password; position and target page not explored | open question (not a mismatch) | PO to confirm placement; run explore on #/forgot-password. |
| 4 | Link text "Create account" (AC8) | «Not yet a customer?» pointing to #/register (Login screen) | mismatch (label only; same target) | Should the label be changed to match the ticket? See TC-LOGIN-009. |
| 5 | Not mentioned | Password counter shows "40/20" after 41 characters, against a 5-40 limit (R6) | likely defect, severity low, reproduced by TC-REG-001 | Is the counter maximum of 20 a bug? |
| 6 | Not mentioned | «Remember me» checkbox, «Log in with Passkey», «Log in with Google» on the login page | missing in ticket | Should these get acceptance criteria? |

## Open questions
- Successful login is not mapped in the atlas, so TC-LOGIN-010 expects only what the ticket states (customer sees the shopping cart and orders is not verified).
- Whether the button «Log in» stays disabled with only one field filled was not observed.
- Whether a registered email with a wrong password gives the same alert as an unknown email was not observed.
- «Remember me» behaviour and the «Forgot your password?» page are not explored.
