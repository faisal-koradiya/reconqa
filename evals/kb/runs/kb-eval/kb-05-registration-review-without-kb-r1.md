# Test cases: Registration review fixes

Ticket: tickets/kb-05-registration-review.md · Atlas: qa/atlas/login-and-registration.md

Knowledge base: none found (`qa/kb` does not exist), so no decisions or known issues were applied.

### TC-REG-201 Registration page has no terms and conditions checkbox
**Priority:** P2 · **Area:** REG · **Source:** kb-05-registration-review.md AC1 + atlas login-and-registration.md (User Registration) + mismatch row 1
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at all controls on the registration page. | The page should show «Email», «Password», «Repeat Password», «Show password advice», «Security Question» and «Answer». No checkbox about terms and conditions should be shown. |
| 2 | Fill all five fields with valid data, using a new email such as reconqa-rev201@example.test, password Reconqa#2026, any security question and answer Rex. | The «Register» button should be enabled without any other control being set. |

---

### TC-REG-202 Password of 4 characters is refused
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC2 + atlas login-and-registration.md (M10, R6) + mismatch row 2
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Ab1# in «Password», then click in «Repeat Password». | The message «Password must be 5-40 characters long.» should be shown under «Password». |
| 2 | Enter Ab1# in «Repeat Password», fill the other fields with valid data (new email reconqa-rev202@example.test) and look at the «Register» button. | The «Register» button should be disabled. |

---

### TC-REG-203 Password of 5 characters is accepted
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC2 + atlas login-and-registration.md (R6) + mismatch row 2
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-rev203@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Ab1#x in «Password» and in «Repeat Password». | No error message should be shown under «Password» or «Repeat Password». |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open and the toast «Registration completed successfully. You can now log in.» should be shown. |

---

### TC-REG-204 Password of 7 characters is accepted
**Priority:** P2 · **Area:** REG · **Source:** kb-05-registration-review.md AC2 + atlas login-and-registration.md (R6) + mismatch row 2
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-rev204@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Ab1#xyz in «Password» and in «Repeat Password». | No error message should be shown under «Password» or «Repeat Password». |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open and the toast «Registration completed successfully. You can now log in.» should be shown. |

---

### TC-REG-205 After registering the user is not signed in
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC3 + atlas login-and-registration.md (R9, M13) + mismatch row 3
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-rev205@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question», enter Rex in «Answer» and click «Register». | The login page should open, not the product list. The toast «Registration completed successfully. You can now log in.» should be shown. |
| 3 | Open the Account menu in the top bar. | The menu should offer «Login», which shows the user is not signed in. |

---

### TC-REG-206 Password counter after 41 characters
**Priority:** P2 · **Area:** REG · **Source:** kb-05-registration-review.md AC4 + atlas login-and-registration.md (User Registration, R6) + mismatch row 4
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Read the hint under «Password». | The hint «Password must be 5-40 characters long.» should be shown with a counter. |
| 2 | Type Aa1#Aa1#Aa1#Aa1#Aa1#Aa1#Aa1#Aa1#Aa1#Aa1#A (41 characters) in «Password». | The counter should read 40/20. |

---

### TC-REG-207 Mismatched repeat password shows an error under the repeat field
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC5 + atlas login-and-registration.md (M11, R7)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Reconqa#2026 in «Password». | No error message should be shown under «Password». |
| 2 | Enter Reconqa#2027 in «Repeat Password», then click in «Email». | The message «Passwords do not match» should be shown under «Repeat Password». |
| 3 | Fill the other fields with valid data (new email reconqa-rev207@example.test) and look at the «Register» button. | The «Register» button should be disabled. |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | AC1: user must tick a terms and conditions checkbox before the account is created | No such control among the registration fields; Register only needs the 5 fields (User Registration table, R4) | missing in app | Is the terms checkbox still to be built? Where should it appear? |
| 2 | AC2: passwords shorter than 8 characters are refused | Limit is 5-40; 4 characters gives M10, "Password must be 5-40 characters long." (R6) | mismatch | Should the minimum be 8 or 5? What should the message say? |
| 3 | AC3: user is signed in automatically after registering | Redirect to the login page with a success toast; no sign-in (R9, M13) | mismatch | Should registration sign the user in, or stay on the login page? |
| 4 | AC4: the password counter shows the correct limit | Hint says 5-40 but counter reads "n/20", and "40/20" after 41 characters (User Registration table, R6) | likely defect (medium), reproduced by TC-REG-206 | Which limit is right, 40 or 20? |
| 5 | AC5: mismatched repeat password shows an error under the repeat field | "Passwords do not match" under Repeat Password (M11, R7) | match | none |

Knowledge base: none found (`qa/kb` does not exist), so no decisions or known issues were applied.

Open question: whether Password hard-caps at 40 characters (atlas: inferred from the counter only).
