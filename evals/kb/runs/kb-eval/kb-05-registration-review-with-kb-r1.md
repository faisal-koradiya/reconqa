# Test cases: Registration review fixes

Ticket: tickets/kb-05-registration-review.md · Atlas: qa/atlas/login-and-registration.md

## 1. Ticket compared with the app

Acceptance criteria numbered in order as written in the ticket.

**Answered by the knowledge base**
- AC1 (accept terms and conditions): decision registration/D2. Out of scope; no cases written and not reported as a bug.
- AC2 (passwords under 8 characters refused): decision registration/D3. The limit stays 5 to 40; cases expect the current limit (TC-REG-201 to TC-REG-203).
- AC3 (signed in automatically after registering): decision registration/D1. The login page is expected after registering (TC-REG-206).

**Known issue**
- AC4 (counter shows the correct limit): known issue registration/K1 is open. TC-REG-204 reproduces it; not reported again.

**Match**
- AC5 (mismatched repeat password shows an error under the repeat field): atlas M11 and R7 show the same behaviour (TC-REG-205).

**Mismatches (for a PO or developer to decide or fix)**
None new.

## 2. Cases

### TC-REG-201 A password of 4 characters is refused
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC2 + decision registration/D3 + atlas login-and-registration.md (M10, R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Password», type abcd, then click in «Repeat Password». | The message «Password must be 5-40 characters long.» should be shown under the «Password» field. |
| 2 | Type abcd in «Repeat Password». Enter reconqa-rr201@example.test in «Email». Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should stay disabled. |

---

### TC-REG-202 A password of 5 characters is accepted
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC2 + decision registration/D3 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-rr202@example.test in «Email». Enter abcde in «Password» and in «Repeat Password». | No error message should be shown under the «Password» field. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-REG-203 A password of 7 characters is accepted
**Priority:** P2 · **Area:** REG · **Source:** kb-05-registration-review.md AC2 + decision registration/D3 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-rr203@example.test in «Email». Enter abcdefg in «Password» and in «Repeat Password». | No error message should be shown under the «Password» field. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-REG-204 The password counter shows "/20" for a 41-character password
**Priority:** P3 · **Area:** REG · **Source:** kb-05-registration-review.md AC4 + known issue registration/K1 + atlas login-and-registration.md (User Registration screen, R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Password» and type 41 characters (the letter a, 41 times). | The counter under the field should show «40/20». |

---

### TC-REG-205 A repeat password that differs from the password shows an error
**Priority:** P1 · **Area:** REG · **Source:** kb-05-registration-review.md AC5 + atlas login-and-registration.md (M11, R7)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Reconqa#2026 in «Password». | No error message should be shown under the «Password» field. |
| 2 | Enter Reconqa#2027 in «Repeat Password», then click in «Email». | The message «Passwords do not match» should be shown under the «Repeat Password» field. |
| 3 | Enter reconqa-rr205@example.test in «Email». Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should stay disabled. |

---

### TC-REG-206 After registration the login page opens
**Priority:** P2 · **Area:** REG · **Source:** kb-05-registration-review.md AC3 + decision registration/D1 + atlas login-and-registration.md (R9, M13)
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-rr206@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open. A toast «Registration completed successfully. You can now log in.» should be shown. |
| 4 | Open the Account menu in the top bar. | The menu should offer «Login». |

---

## Open questions
- Whether the «Password» field stops accepting input at 40 characters or only shows an error (atlas open question; not covered by a case).
