# Test cases: Users sign in
Ticket: tickets/user-sign-in.ticket.md · Atlas: qa/atlas/sign-in-and-sign-up.md · App: http://localhost:3100 (local)

### TC-SIGNIN-001 Sign in form initial state
**Priority:** Medium · **Area:** SIGNIN · **Source:** user-sign-in.ticket.md criteria 1, 5, 6 + atlas qa/atlas/sign-in-and-sign-up.md (Sign in — /signin)
**Preconditions:** Logged out. App is reachable at http://localhost:3100.

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3100. | The browser lands on /signin. |
| 2 | Look at the form. | Fields «Username» and «Password» and a «Remember me» checkbox are shown. |
| 3 | Check the state of «Remember me» and «Sign In». | «Remember me» is unchecked. «Sign In» is disabled. |

---

### TC-SIGNIN-002 Username is required
**Priority:** Medium · **Area:** SIGNIN · **Source:** user-sign-in.ticket.md criteria 1, 6 + atlas qa/atlas/sign-in-and-sign-up.md (M1, R1, R4)
**Preconditions:** Logged out, on /signin.

| # | Step | Expected |
|---|---|---|
| 1 | Click into «Username», then click into «Password» without typing anything. | «Username is required» is shown under Username. |
| 2 | Check the «Sign In» button. | «Sign In» is disabled. |

---

### TC-SIGNIN-003 Password of 3 characters is rejected
**Priority:** High · **Area:** SIGNIN · **Source:** user-sign-in.ticket.md criterion 2 + atlas qa/atlas/sign-in-and-sign-up.md (M2, R2); see mismatch row 1
**Preconditions:** Logged out, on /signin.

| # | Step | Expected |
|---|---|---|
| 1 | Type reconqa-user in «Username». | No error is shown under Username. |
| 2 | Type abc in «Password». | «Password must contain at least 4 characters» is shown under Password. |
| 3 | Check the «Sign In» button. | «Sign In» is disabled. |

---

### TC-SIGNIN-004 Password of 4 characters is accepted by the form
**Priority:** High · **Area:** SIGNIN · **Source:** user-sign-in.ticket.md criteria 2, 6 + atlas qa/atlas/sign-in-and-sign-up.md (R2, R4); see mismatch row 1
**Preconditions:** Logged out, on /signin.

| # | Step | Expected |
|---|---|---|
| 1 | Type reconqa-user in «Username». | No error is shown. |
| 2 | Type abcd in «Password». | No password error is shown. |
| 3 | Check the «Sign In» button. | «Sign In» is enabled. |

---

### TC-SIGNIN-005 Wrong credentials show an error
**Priority:** High · **Area:** SIGNIN · **Source:** user-sign-in.ticket.md criterion 3 + atlas qa/atlas/sign-in-and-sign-up.md (M3, R5)
**Preconditions:** Logged out, on /signin. The username reconqa-unknown-<random> does not exist.

| # | Step | Expected |
|---|---|---|
| 1 | Type reconqa-unknown-<random> in «Username». | No error is shown. |
| 2 | Type abcd in «Password». | No error is shown. |
| 3 | Click «Sign In». | «Username or password is invalid» is shown in an alert banner above the heading. The URL stays /signin. |

---

### TC-SIGNIN-006 Fields are cleared after a failed sign-in
**Priority:** High · **Area:** SIGNIN · **Source:** user-sign-in.ticket.md criterion 4 + atlas qa/atlas/sign-in-and-sign-up.md (R5); see mismatch row 2
**Preconditions:** Logged out, on /signin. The username reconqa-unknown-<random> does not exist.

| # | Step | Expected |
|---|---|---|
| 1 | Type reconqa-unknown-<random> in «Username» and abcd in «Password». | No error is shown. |
| 2 | Click «Sign In». | «Username or password is invalid» is shown. |
| 3 | Look at «Username» and «Password». | Both fields are empty. |

---

### TC-SIGNIN-007 Sign Up link opens the sign-up screen
**Priority:** Medium · **Area:** SIGNIN · **Source:** user-sign-in.ticket.md criterion 7 + atlas qa/atlas/sign-in-and-sign-up.md (Sign in — /signin)
**Preconditions:** Logged out, on /signin.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Don't have an account? Sign Up». | The URL is /signup. |
| 2 | Look at the form. | Fields «First Name», «Last Name», «Username», «Password» and «Confirm Password» are shown. |

---

### TC-SIGNIN-008 Registered user signs in successfully
**Priority:** High · **Area:** SIGNIN · **Source:** user-sign-in.ticket.md intro + atlas qa/atlas/sign-in-and-sign-up.md (R6, R7)
**Preconditions:** Logged out. Register a new account first: on /signup use username reconqa-<random>, password abcd1234, any first and last name.

| # | Step | Expected |
|---|---|---|
| 1 | On /signup fill «First Name», «Last Name», «Username», «Password» and «Confirm Password» (same password in both), then click «Sign Up». | The URL is /signin. The user is not logged in. |
| 2 | Type the new username in «Username» and abcd1234 in «Password». | «Sign In» is enabled. |
| 3 | Click «Sign In». | The URL is /. The dialog «Get Started with Real World App» is shown. |

---

### TC-SIGNIN-009 Sign-up with an existing username is not rejected
**Priority:** Medium · **Area:** SIGNIN · **Source:** user-sign-in.ticket.md (not covered) + atlas qa/atlas/sign-in-and-sign-up.md (R9); see mismatch row 4
**Preconditions:** Logged out. Pick a username reconqa-<random> and register it once on /signup (password abcd1234); you are redirected to /signin.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Don't have an account? Sign Up». | The URL is /signup. |
| 2 | Fill every field using the same username reconqa-<random> and password abcd1234. | No error is shown. «Sign Up» is enabled. |
| 3 | Click «Sign Up». | No error message is shown. The URL is /signin. |

---

## Mismatches / questions (one list per run, after the cases)
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | Passwords shorter than 6 characters are rejected (criterion 2) | Minimum is 4 characters; M2 «Password must contain at least 4 characters» (R2, M2). Cases: TC-SIGNIN-003, TC-SIGNIN-004 | mismatch | Is the minimum 6 or 4? Fix the ticket or the app. |
| 2 | After a failed attempt the username stays filled in (criterion 4) | A failed sign-in clears both fields (R5). Case: TC-SIGNIN-006 | mismatch | Should the username be kept after a failed sign-in? |
| 3 | After 5 failed attempts the account is locked for 15 minutes (criterion 8) | Not covered by the atlas; not probed | open question | Confirm lockout is implemented. Needs exploration with a disposable account before a case is written. |
| 4 | Nothing | Sign-up with an existing username showed no error and redirected to /signin (R9). Case: TC-SIGNIN-009 | likely defect (severity guess: medium) | Should a duplicate username be rejected on sign-up? |
| 5 | Both fields are required (criterion 1) | Required message exists for Username (M1) only; no message for an empty Password on Sign in (atlas open questions) | open question | What should show for an empty Password? |
| 6 | Nothing | «Username is required» appears on blur (M1, R1) | missing in ticket | Add to the ticket (covered by TC-SIGNIN-002). |

## Open questions
- Whether «Remember me» keeps the session after the browser is closed (not checked in the atlas).
- Whether the Password field is masked (not checked in the atlas).
