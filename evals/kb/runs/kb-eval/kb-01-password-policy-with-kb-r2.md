# Test cases: Stronger passwords

Ticket: tickets/kb-01-password-policy.md · Atlas: qa/atlas/login-and-registration.md

## Answered by the knowledge base
- AC1 (minimum 8 characters): decision registration/D3. The minimum stays at 5 until the security update, so the cases expect 5 to 40 characters.
- AC2 (counter shows maximum of 40): known issue registration/K1. The counter is not reported again as a new defect; TC-PWD-005 reproduces it.

## Cases

### TC-PWD-001 A password of 4 characters is rejected
**Priority:** P1 · **Area:** PWD · **Source:** kb-01-password-policy.md AC1 + decision registration/D3 + atlas login-and-registration.md (M10, R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Password», type Ab#1 (4 characters), then click in «Repeat Password». | The message «Password must be 5-40 characters long.» should be shown under the «Password» field. |
| 2 | Fill the other fields with valid data (new email reconqa-pwd001@example.test, matching repeat password, any security question and an answer). | The «Register» button should stay disabled. |

---

### TC-PWD-002 A password of 5 characters is accepted
**Priority:** P1 · **Area:** PWD · **Source:** kb-01-password-policy.md AC1 + decision registration/D3 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email reconqa-pwd002@example.test in «Email». Enter Ab#1x (5 characters) in «Password» and in «Repeat Password». | No error message should be shown under «Password» or «Repeat Password». |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open and a toast «Registration completed successfully. You can now log in.» should be shown. |

---

### TC-PWD-003 A password of 40 characters is accepted
**Priority:** P2 · **Area:** PWD · **Source:** kb-01-password-policy.md AC2 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email reconqa-pwd003@example.test in «Email». Enter Reconqa#2026Reconqa#2026Reconqa#2026Reco (40 characters) in «Password» and in «Repeat Password». | No error message should be shown under «Password» or «Repeat Password». |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-PWD-004 The password hint is always visible
**Priority:** P3 · **Area:** PWD · **Source:** kb-01-password-policy.md AC1 + atlas login-and-registration.md (User Registration screen)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look under the «Password» field without typing. | The text «Password must be 5-40 characters long.» should be shown together with a character counter. |

---

### TC-PWD-005 Typing 41 characters shows the counter as 40/20
**Priority:** P3 · **Area:** PWD · **Source:** kb-01-password-policy.md AC2 + known issue registration/K1 + atlas login-and-registration.md (User Registration screen, R6) + mismatch row 2
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type Reconqa#2026Reconqa#2026Reconqa#2026Recon (41 characters) in «Password». | The counter under the field should show «40/20». |

---

### TC-PWD-006 Password advice switch shows the strength bar and checklist
**Priority:** P2 · **Area:** PWD · **Source:** kb-01-password-policy.md AC3 + atlas login-and-registration.md (User Registration screen)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the area under the «Password» field. | No strength bar and no checklist should be shown. |
| 2 | Turn on the switch «Show password advice». | A strength bar and a checklist should be shown. |
| 3 | Read the checklist. | The checklist should contain exactly these items: «contains at least one lower character», «contains at least one upper character», «contains at least one digit», «contains at least one special character», «contains at least 8 characters». |

---

### TC-PWD-007 Password advice checklist item for 8 characters matches the minimum accepted
**Priority:** P3 · **Area:** PWD · **Source:** kb-01-password-policy.md AC1 + decision registration/D3 + atlas login-and-registration.md (checklist, R6) + mismatch row 3
**Preconditions:** Browser is logged out. The registration page is open. The switch «Show password advice» is on.

| # | Step | Expected |
|---|---|---|
| 1 | Type Ab#1x (5 characters) in «Password». | The message «Password must be 5-40 characters long.» should not be shown under the field. |
| 2 | Look at the checklist item «contains at least 8 characters». | The item should be shown in the list; the atlas does not record how it looks for 5 characters (see open questions). |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | AC1: at least 8 characters | 5–40 characters (R6, M10) | Answered by decision registration/D3 | None: cases expect 5 to 40. |
| 2 | AC2: counter shows the real maximum of 40 | Counter shows "n/20", "40/20" after 41 characters (R6) | likely defect (severity: low; known issue registration/K1; TC-PWD-005) | None: already known. |
| 3 | AC1 only mentions 8 characters | Advice checklist has the item "contains at least 8 characters" while the form accepts 5 (checklist, R6) | missing in ticket | Should the checklist item change to 5 characters, or stay while the minimum is 5? |
| 4 | AC3: advice shows strength bar and checklist | Same (User Registration screen) | match | — |

## Open questions
- How does the checklist item «contains at least 8 characters» look for a password with fewer than 8 characters (atlas does not record the state)?
- Whether the Password field hard-caps at 40 characters or only shows an error (atlas: inferred from the counter).
