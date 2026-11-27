# Test cases: New customers can create an account

Ticket: tickets/new-customer-registration.md · Atlas: qa/atlas/login-and-registration.md

### TC-REG-001 Open the registration page from the login page
**Priority:** P1 · **Area:** REG · **Source:** new-customer-registration.md AC1 + atlas login-and-registration.md
**Preconditions:** Browser is logged out and the home page is open at http://localhost:3000.

| # | Step | Expected |
|---|---|---|
| 1 | Open the Account menu in the top bar and choose «Login». | The login page should open. |
| 2 | Click «Not yet a customer?». | The registration page «User Registration» should open with the fields «Email», «Password», «Repeat Password», «Security Question» and «Answer». |

---

### TC-REG-002 Register with valid data
**Priority:** P1 · **Area:** REG · **Source:** new-customer-registration.md AC2, AC10 + atlas login-and-registration.md (mismatch row 3)
**Preconditions:** Registration page is open. Use a new email, for example reconqa-user-001@example.test (it is reused in TC-REG-013).

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open. A toast «Registration completed successfully. You can now log in.» should be shown. |

---

### TC-REG-003 After registration the user is not logged in automatically
**Priority:** P2 · **Area:** REG · **Source:** new-customer-registration.md AC10 + atlas login-and-registration.md (mismatch row 3)
**Preconditions:** Registration page is open. Use a new email, for example reconqa-user-002@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Fill all fields with valid data and click «Register». | The login page should open, not the product list. |
| 2 | Open the Account menu in the top bar. | The menu should offer «Login», which shows the user is still logged out. |

---

### TC-REG-004 Required text fields show an error when left empty
**Priority:** P1 · **Area:** REG · **Source:** new-customer-registration.md AC2 + atlas login-and-registration.md
**Preconditions:** Registration page is open and all fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Click into «Email», then click outside it. | «Please provide an email address.» should be shown under the field. |
| 2 | Click into «Password», then click outside it. | «Please provide a password.» should be shown under the field. |
| 3 | Click into «Repeat Password», then click outside it. | «Please repeat your password.» should be shown under the field. |
| 4 | Click into «Answer», then click outside it. | «Please provide an answer to your security question.» should be shown under the field. |

---

### TC-REG-005 Security question is required
**Priority:** P1 · **Area:** REG · **Source:** new-customer-registration.md AC2 + atlas login-and-registration.md
**Preconditions:** Registration page is open and all fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Open the «Security Question» dropdown, close it without choosing an option, then click outside it. | «Please select a security question.» should be shown under the dropdown. |

---

### TC-REG-006 Register button is disabled until the form is valid
**Priority:** P1 · **Area:** REG · **Source:** new-customer-registration.md AC2 + atlas login-and-registration.md
**Preconditions:** Registration page is open and all fields are empty.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Register» button. | The button should be disabled. |
| 2 | Fill every field except «Answer» with valid data. | The button should stay disabled. |
| 3 | Enter any text in «Answer». | The button should be enabled. |

---

### TC-REG-007 Invalid email format is rejected
**Priority:** P1 · **Area:** REG · **Source:** new-customer-registration.md AC3 + atlas login-and-registration.md
**Preconditions:** Registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-bad-email in «Email», then click outside the field. | «Email address is not valid.» should be shown under the field. |
| 2 | Replace it with reconqa-user-003@example.test and click outside the field. | The error should disappear. |

---

### TC-REG-008 Password one character below the minimum
**Priority:** P1 · **Area:** REG · **Source:** new-customer-registration.md AC4 + atlas login-and-registration.md (mismatch row 1)
**Preconditions:** Registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Ab1! (4 characters) in «Password», then click outside the field. | «Password must be 5-40 characters long.» should be shown under the field. |
| 2 | Add one character so the password is 5 characters long (Ab1!x). | The error should disappear. |

---

### TC-REG-009 Password of 7 characters is accepted by the app
**Priority:** P2 · **Area:** REG · **Source:** new-customer-registration.md AC4 + atlas login-and-registration.md (mismatch row 1)
**Preconditions:** Registration page is open. The ticket asks for at least 8 characters; the app hint says 5-40, so this case checks the app's behaviour.

| # | Step | Expected |
|---|---|---|
| 1 | Fill «Email», «Security Question» and «Answer» with valid data. Enter Ab1!xyz (7 characters) in «Password» and «Repeat Password». | No error should be shown under «Password». |
| 2 | Look at the «Register» button. | The button should be enabled. |

---

### TC-REG-010 Password at the maximum length
**Priority:** P2 · **Area:** REG · **Source:** atlas login-and-registration.md (missing in ticket, mismatch row 5)
**Preconditions:** Registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter a password of exactly 40 characters (Ab1! followed by 36 letters x) in «Password» and click outside the field. | No error should be shown under «Password». |
| 2 | Clear the field and type 41 letters a. | The field should hold at most 40 characters. The atlas shows the counter as «40/20» here (likely defect, see mismatch row 6). |

---

### TC-REG-011 Repeated password must match
**Priority:** P1 · **Area:** REG · **Source:** new-customer-registration.md AC5 + atlas login-and-registration.md
**Preconditions:** Registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Reconqa#2026 in «Password» and Reconqa#2027 in «Repeat Password», then click outside the field. | «Passwords do not match» should be shown under «Repeat Password». |
| 2 | Fix «Repeat Password» so it equals «Password». | The error should disappear. |

---

### TC-REG-012 Password advice can be shown
**Priority:** P3 · **Area:** REG · **Source:** new-customer-registration.md AC6 + atlas login-and-registration.md
**Preconditions:** Registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Turn on «Show password advice». | A strength bar and a checklist should appear. |
| 2 | Read the checklist. | It should list «contains at least one lower character», «contains at least one upper character», «contains at least one digit», «contains at least one special character» and «contains at least 8 characters». |
| 3 | Turn the switch off. | The strength bar and checklist should disappear. |

---

### TC-REG-013 Duplicate email is rejected
**Priority:** P1 · **Area:** REG · **Source:** new-customer-registration.md AC8 + atlas login-and-registration.md (mismatch row 2)
**Preconditions:** Registration page is open. An account already exists for reconqa-user-001@example.test (created in TC-REG-002).

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-user-001@example.test in «Email» and valid data in all other fields. | The «Register» button should be enabled. |
| 2 | Click «Register». | An alert banner «Email must be unique» should be shown under the «User Registration» heading. |
| 3 | Check the page. | The user should stay on the registration page. The ticket text "This email is already registered." should not be expected. |

---

### TC-REG-014 Security question warning and options
**Priority:** P2 · **Area:** REG · **Source:** new-customer-registration.md AC7 + atlas login-and-registration.md
**Preconditions:** Registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Security Question» field. | The hint «This cannot be changed later!» should be shown. |
| 2 | Open the dropdown and count the options. | There should be 14 options. The first should be «Your eldest siblings middle name?» and the last «What's your favorite place to go hiking?». |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | AC4: password at least 8 characters | Password length 5-40, hint «Password must be 5-40 characters long.» (Registration fields table, R6, M10). Advice checklist item «contains at least 8 characters» is not enforced. | mismatch | Is the minimum 5 or 8? Should the app be changed or the ticket? |
| 2 | AC8: "This email is already registered." | «Email must be unique», shown as a banner under the heading, not under the field (M12, R8) | mismatch | Should the message be reworded and shown at the Email field? |
| 3 | AC10: user is logged in automatically and taken to the product list | Redirect to #/login with toast «Registration completed successfully. You can now log in.» (M13, R9) | mismatch | Is auto-login wanted? |
| 4 | AC9: user must accept the terms and conditions | No terms field or checkbox on the registration form (Registration fields table) | missing in app | Is a terms checkbox planned? No case written for it. |
| 5 | Not mentioned | Password is limited to 40 characters (R6); 14 security questions; a message for each empty required field (M4-M8) | missing in ticket | Add these to the acceptance criteria? |
| 6 | Not mentioned | Password counter reads «40/20» after typing 41 characters (Registration fields table, R6) | likely defect | The counter limit 20 does not match the 5-40 range. |

Matches (no row needed): AC1, AC2 (five fields, all required), AC3, AC5 (error under the repeat field), AC6, AC7 (hint text).

Open questions (atlas does not cover): whether the password field hard-caps at 40 characters; mixed-case duplicate emails.
