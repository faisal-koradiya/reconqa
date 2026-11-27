# Test cases: Stronger passwords

Ticket: tickets/kb-01-password-policy.md · Atlas: qa/atlas/login-and-registration.md

### TC-REG-201 Password of 4 characters is rejected
**Priority:** P2 · **Area:** REG · **Source:** kb-01-password-policy.md AC1 + decision registration/D3 + atlas login-and-registration.md (R6, M10)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type Ab#1 in «Password». | The counter under the field should show 4 typed characters. |
| 2 | Click in «Repeat Password» to leave «Password». | The message «Password must be 5-40 characters long.» should be shown under the «Password» field. |

---

### TC-REG-202 Password of 5 characters is accepted
**Priority:** P2 · **Area:** REG · **Source:** kb-01-password-policy.md AC1 + decision registration/D3 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-pw202@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Ab#1x in «Password» and in «Repeat Password». | No error message should be shown under the «Password» field. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-REG-203 Password of 7 characters is accepted
**Priority:** P2 · **Area:** REG · **Source:** kb-01-password-policy.md AC1 + decision registration/D3 + atlas login-and-registration.md (R6, R9, M13)
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-pw203@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Ab#1xyz in «Password» and in «Repeat Password». | No error message should be shown under the «Password» field. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open. A toast «Registration completed successfully. You can now log in.» should be shown. |

---

### TC-REG-204 Password counter after typing 41 characters
**Priority:** P3 · **Area:** REG · **Source:** kb-01-password-policy.md AC2 + known issue registration/K1 + atlas login-and-registration.md (R6) + mismatch row 2
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type 41 characters (for example the letter a repeated 41 times) in «Password». | The counter under the field should show «40/20». |
| 2 | Read the hint under the field. | The hint «Password must be 5-40 characters long.» should be shown. |

---

### TC-REG-205 Password advice switch shows the strength bar and checklist
**Priority:** P2 · **Area:** REG · **Source:** kb-01-password-policy.md AC3 + atlas login-and-registration.md (User Registration screen) + mismatch row 3
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type Reconqa#2026 in «Password». | The password should be masked. |
| 2 | Turn on the switch «Show password advice». | A strength bar and a checklist should be shown. |
| 3 | Read the checklist. | The checklist should contain exactly these items: «contains at least one lower character», «contains at least one upper character», «contains at least one digit», «contains at least one special character», «contains at least 8 characters». |

---

## Answered by the knowledge base
- AC1 (at least 8 characters): decision registration/D3. The limit stays at 5 to 40 for now, so TC-REG-201 to TC-REG-203 expect the current limit and no mismatch row is raised.
- AC2 (counter): known issue registration/K1. Cited in TC-REG-204, not reported again.

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | AC1: no mention of an upper limit or of the hint text | Hint «Password must be 5-40 characters long.» always visible under the field (R6, M10) | missing in ticket | Should the ticket state the 5 to 40 range that D3 keeps for now? |
| 2 | AC2: the counter shows the real maximum of 40 | Counter reads «40/20» after typing 41 characters (R6) | likely defect (severity: low, already known as K1) | Covered by known issue registration/K1; reproduced by TC-REG-204. |
| 3 | AC3: strength bar and checklist after switching on the advice | Checklist item «contains at least 8 characters» while the app accepts 5 characters (User Registration screen, R6) | likely defect (severity: low) | Should the checklist item match the accepted minimum? Decision D3 does not cover the checklist text. Reproduce with TC-REG-205 and TC-REG-202. |

## Open questions
- AC3: is «Show password advice» off by default, and does the checklist update while typing? The atlas only says what is shown when the switch is on.
- Does the «Password» field hard-cap input at 40 characters, or only show an error? The atlas marks the cap as inferred from the counter, so no 40-character case is written.
