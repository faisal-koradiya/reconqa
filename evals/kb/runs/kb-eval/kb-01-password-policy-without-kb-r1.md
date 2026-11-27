# Test cases: Stronger passwords

Ticket: tickets/kb-01-password-policy.md · Atlas: qa/atlas/login-and-registration.md

## 1. Ticket vs atlas
No knowledge base exists (qa/kb/index.md is missing), so no question is answered by a decision.

| # | Ticket says | App shows (atlas ref) | Kind | Suggested question |
|---|---|---|---|---|
| 1 | AC1: a new password must be at least 8 characters long. | Hint «Password must be 5-40 characters long.»; a 4-character password gives «Password must be 5-40 characters long.» (M10, R6). The minimum is 5, not 8. The checklist item «contains at least 8 characters» is advice only. | mismatch | Is the minimum 8 (app must change) or 5 (ticket must change)? |
| 2 | AC2: the counter under the password field shows the real maximum of 40. | Counter reads «n/20» and «40/20» after typing 41 characters, while the hint and «Repeat Password» counter use 40 (R6). Existing draft: qa/bugs/password-counter-shows-20.md. | likely defect (severity: low), reproduced by TC-PWD-004 | Confirm the counter should read n/40. |
| 3 | AC3: the user can switch on password advice to see a strength bar and a checklist. | Switch «Show password advice»; when on, a strength bar and a checklist (atlas, User Registration). | match | none |

## 2. Cases

### TC-PWD-001 A 4-character password is rejected with the length message
**Priority:** P2 · **Area:** PWD · **Source:** kb-01-password-policy.md AC1 + atlas login-and-registration.md (M10, R6) + mismatch row 1
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Ab1! in «Password». | The field should accept the input. |
| 2 | Click outside the field. | The message «Password must be 5-40 characters long.» should be shown under «Password». |

---

### TC-PWD-002 A 7-character password is accepted by the registration form
**Priority:** P1 · **Area:** PWD · **Source:** kb-01-password-policy.md AC1 + atlas login-and-registration.md (R4, R6; acceptance of 7 characters is inferred from the hint, not observed) + mismatch row 1
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-pwd002@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Ab1!abc (7 characters) in «Password» and in «Repeat Password». | No error message should be shown under «Password». |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-PWD-003 A 5-character password is accepted by the registration form
**Priority:** P2 · **Area:** PWD · **Source:** kb-01-password-policy.md AC1 + atlas login-and-registration.md (R4, R6; acceptance of 5 characters is inferred from the hint, not observed) + mismatch row 1
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-pwd003@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Ab1!a (5 characters) in «Password» and in «Repeat Password». | No error message should be shown under «Password». |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-PWD-004 The password counter shows the real maximum of 40
**Priority:** P3 · **Area:** PWD · **Source:** kb-01-password-policy.md AC2 + atlas login-and-registration.md (User Registration table, R6) + mismatch row 2
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Ab1! followed by 36 letters x (40 characters in total) in «Password». | The field should hold all 40 characters. |
| 2 | Read the character counter under «Password». | The counter should show 40/40 (per ticket; the app is observed to show «40/20»). |
| 3 | Read the hint under «Password» and the counter under «Repeat Password». | The hint should read «Password must be 5-40 characters long.» and the counter under «Repeat Password» should end in «/40». |

---

### TC-PWD-005 Password advice switch shows the strength bar and checklist
**Priority:** P2 · **Area:** PWD · **Source:** kb-01-password-policy.md AC3 + atlas login-and-registration.md (User Registration screen, advice checklist)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Switch on «Show password advice». | A strength bar and a checklist should be shown. |
| 2 | Read the checklist items. | The checklist should list «contains at least one lower character», «contains at least one upper character», «contains at least one digit», «contains at least one special character» and «contains at least 8 characters». |
| 3 | Enter Ab1!abcd in «Password». | The strength bar and checklist should still be shown while typing. |

---

## Open questions
- AC1: minimum length 8 or 5 (mismatch row 1)? Acceptance of 5- and 7-character passwords was not observed in the atlas (inferred from the hint); TC-PWD-002 and TC-PWD-003 need a run to confirm.
- Does «Password» hard-cap at 40 characters or only show an error? The atlas calls the cap inferred from the counter.
- How the checklist items and strength bar change while typing was not explored in the atlas.
