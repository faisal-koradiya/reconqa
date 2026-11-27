# Test cases: user sign-up

### TC-SIGNUP-001 Sign up with valid data
**Priority:** High · **Area:** signup · **Source:** tickets/user-sign-up.ticket.md (AC 1, 4, 6) + atlas qa/atlas/sign-in-and-sign-up.md
**Preconditions:** Logged out. Username to register: reconqa-<random> (not used before).

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3100/signup | Fields «First Name *», «Last Name *», «Username *», «Password *» and «Confirm Password *» are shown. «Sign Up» is disabled. |
| 2 | Enter First Name reconqa-First, Last Name reconqa-Last, the Username, Password abcd1234 and Confirm Password abcd1234 | No error message is shown. «Sign Up» is enabled. |
| 3 | Click «Sign Up» | The app opens /signin. The user is not signed in. |

---

### TC-SIGNUP-002 Required-field messages on sign-up
**Priority:** High · **Area:** signup · **Source:** tickets/user-sign-up.ticket.md (AC 1) + atlas qa/atlas/sign-in-and-sign-up.md
**Preconditions:** Logged out. /signup is open and all fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Click into «First Name *», then click outside the field | «First Name is required» is shown under First Name. |
| 2 | Click into «Last Name *», then click outside the field | «Last Name is required» is shown under Last Name. |
| 3 | Click into «Username *», then click outside the field | «Username is required» is shown under Username. |
| 4 | Click into «Password *», then click outside the field | «Enter your password» is shown under Password. |
| 5 | Click into «Confirm Password *», then click outside the field | «Confirm your password» is shown under Confirm Password. |
| 6 | Look at the «Sign Up» button | «Sign Up» is disabled. |

---

### TC-SIGNUP-003 Sign Up button follows form validity
**Priority:** High · **Area:** signup · **Source:** tickets/user-sign-up.ticket.md (AC 4) + atlas qa/atlas/sign-in-and-sign-up.md
**Preconditions:** Logged out. /signup is open and all fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Sign Up» button | «Sign Up» is disabled. |
| 2 | Enter First Name reconqa-First, Last Name reconqa-Last, Username reconqa-<random> and Password abcd1234. Leave Confirm Password empty | «Sign Up» is disabled. |
| 3 | Enter Confirm Password abcd12345 and click outside the field | «Password does not match» is shown. «Sign Up» is disabled. |
| 4 | Change Confirm Password to abcd1234 | The error is gone. «Sign Up» is enabled. |

---

### TC-SIGNUP-004 Confirm Password differs from Password
**Priority:** High · **Area:** signup · **Source:** tickets/user-sign-up.ticket.md (AC 3) + atlas qa/atlas/sign-in-and-sign-up.md
**Preconditions:** Logged out. /signup is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Password abcd1234 | No error message is shown under Password. |
| 2 | Enter Confirm Password abcd12345 and click outside the field | «Password does not match» is shown under Confirm Password. |
| 3 | Fill First Name, Last Name and Username with valid values | «Sign Up» stays disabled. |

---

### TC-SIGNUP-005 Password of 3 characters is rejected
**Priority:** High · **Area:** signup · **Source:** tickets/user-sign-up.ticket.md (AC 2), mismatch row 1 + atlas qa/atlas/sign-in-and-sign-up.md
**Preconditions:** Logged out. /signup is open.

| # | Step | Expected |
|---|---|---|
| 1 | Fill First Name reconqa-First, Last Name reconqa-Last and Username reconqa-<random> | No error message is shown. |
| 2 | Enter Password abc and Confirm Password abc | «Password must contain at least 4 characters» is shown under Password. |
| 3 | Look at the «Sign Up» button | «Sign Up» is disabled. |

---

### TC-SIGNUP-006 Password of 4 characters is accepted
**Priority:** Medium · **Area:** signup · **Source:** tickets/user-sign-up.ticket.md (AC 2), mismatch row 1 + atlas qa/atlas/sign-in-and-sign-up.md
**Preconditions:** Logged out. /signup is open. Username to register: reconqa-<random>.

| # | Step | Expected |
|---|---|---|
| 1 | Fill First Name reconqa-First, Last Name reconqa-Last and the Username | No error message is shown. |
| 2 | Enter Password abcd and Confirm Password abcd | «Password must contain at least 4 characters» is not shown. «Sign Up» is enabled. |
| 3 | Click «Sign Up» | The app opens /signin. |

---

### TC-SIGNUP-007 Sign up with a username that already exists
**Priority:** High · **Area:** signup · **Source:** tickets/user-sign-up.ticket.md (AC 5), mismatch rows 2 and 3 + atlas qa/atlas/sign-in-and-sign-up.md
**Preconditions:** Logged out. Username to register: reconqa-<random> (not used before). No account with it exists yet.

| # | Step | Expected |
|---|---|---|
| 1 | Open /signup. Enter First Name reconqa-First, Last Name reconqa-Last, the Username, Password abcd1234 and Confirm Password abcd1234. Click «Sign Up» | The app opens /signin. |
| 2 | Click «Don't have an account? Sign Up» | The app opens /signup. |
| 3 | Enter First Name reconqa-Other, Last Name reconqa-Second, the same Username, Password wxyz5678 and Confirm Password wxyz5678 | «Sign Up» is enabled. |
| 4 | Click «Sign Up» | No error message is shown. The app opens /signin. |

---

### TC-SIGNUP-008 Link back to sign in
**Priority:** Low · **Area:** signup · **Source:** tickets/user-sign-up.ticket.md (AC 7) + atlas qa/atlas/sign-in-and-sign-up.md
**Preconditions:** Logged out. /signup is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Have an account? Sign In» | The app opens /signin. |
| 2 | Look at the page | A «Sign In» button and a link «Don't have an account? Sign Up» are shown. |

---

### TC-SIGNUP-009 No success message after sign-up
**Priority:** Medium · **Area:** signup · **Source:** tickets/user-sign-up.ticket.md (AC 8), mismatch row 4 + atlas qa/atlas/sign-in-and-sign-up.md
**Preconditions:** Logged out. Username to register: reconqa-<random> (not used before).

| # | Step | Expected |
|---|---|---|
| 1 | Open /signup. Enter First Name reconqa-First, Last Name reconqa-Last, the Username, Password abcd1234 and Confirm Password abcd1234 | «Sign Up» is enabled. |
| 2 | Click «Sign Up» | The app opens /signin. No success message is shown, and the text Account created appears nowhere on the page. |

---

### TC-SIGNUP-010 First sign-in after sign-up shows onboarding
**Priority:** Medium · **Area:** signup · **Source:** atlas qa/atlas/sign-in-and-sign-up.md (R6, R7; not in ticket), mismatch row 6
**Preconditions:** Logged out. Username to register: reconqa-<random> (not used before).

| # | Step | Expected |
|---|---|---|
| 1 | Open /signup. Enter First Name reconqa-First, Last Name reconqa-Last, the Username, Password abcd1234 and Confirm Password abcd1234. Click «Sign Up» | The app opens /signin. |
| 2 | Enter the Username in «Username» and abcd1234 in «Password», then click «Sign In» | The app opens / with a dialog titled «Get Started with Real World App». |
| 3 | Look at the dialog buttons | Buttons «Logout» and «Next» are shown. |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind | Suggested question |
|---|---|---|---|---|
| 1 | AC 2: password at least 8 characters | Minimum is 4 characters; «Password must contain at least 4 characters» (Sign up fields, M2, R2). Cases TC-SIGNUP-005, TC-SIGNUP-006 | mismatch | Is the limit 4 or 8? Should the message state the limit? |
| 2 | AC 5: taken username rejected with "Username already exists" | No rejection, no message, redirect to /signin (R9). Case TC-SIGNUP-007 | mismatch | What should happen on a duplicate username? |
| 3 | AC 5 (same behaviour) | A second account with an existing username is accepted (R9). Severity guess: high. Case TC-SIGNUP-007 | likely defect | Does the second account overwrite the first or coexist? Can the first user still sign in? |
| 4 | AC 8: success message "Account created" | None seen; /signin opens directly (Sign up buttons, R6). Case TC-SIGNUP-009 | missing in app | Is a success message required? |
| 5 | Not mentioned | Required-field messages for First Name, Last Name, Username, Password, Confirm Password (M1, M4–M7). Case TC-SIGNUP-002 | missing in ticket | Add these messages to the acceptance criteria? |
| 6 | Not mentioned | First sign-in of a new account opens a 3-step onboarding dialog (R7). Case TC-SIGNUP-010 | missing in ticket | Is onboarding part of this story? |

## Open questions
- Atlas observed 4 characters accepted only on Sign in; acceptance on Sign up (TC-SIGNUP-006) is inferred from R2.
- Upper length limits for names, username and password were not probed.
- Whether the Password fields are masked was not checked.
