# Test cases: Stronger passwords

Ticket: tickets/kb-01-password-policy.md · Atlas: qa/atlas/login-and-registration.md

### TC-PWD-001 A password of 5 characters is accepted
**Priority:** P1 · **Area:** PWD · **Source:** kb-01-password-policy.md AC1 + decision registration/D3 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-pwd001@example.test in «Email». Enter Ab1#x in «Password» and in «Repeat Password». | No error message should be shown under «Password» or «Repeat Password». |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-PWD-002 A password of 7 characters is accepted
**Priority:** P2 · **Area:** PWD · **Source:** kb-01-password-policy.md AC1 + decision registration/D3 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-pwd002@example.test in «Email». Enter Abc123# in «Password» and in «Repeat Password». | No error message should be shown under «Password» or «Repeat Password». |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-PWD-003 A password of 4 characters is rejected
**Priority:** P1 · **Area:** PWD · **Source:** kb-01-password-policy.md AC1 + decision registration/D3 + atlas login-and-registration.md (M10)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter Ab1# in «Password», then click in «Email» to leave the field. | The message «Password must be 5-40 characters long.» should be shown under «Password». |
| 2 | Fill the other fields with valid values (email reconqa-pwd003@example.test, same password in «Repeat Password», any security question and answer). | The «Register» button should stay disabled. |

---

### TC-PWD-004 A password of 40 characters is accepted
**Priority:** P2 · **Area:** PWD · **Source:** kb-01-password-policy.md AC2 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-pwd004@example.test in «Email». Enter the letter a repeated 40 times in «Password» and in «Repeat Password». | No error message should be shown under «Password» or «Repeat Password». |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-PWD-005 Password counter after typing 41 characters
**Priority:** P3 · **Area:** PWD · **Source:** kb-01-password-policy.md AC2 + known issue registration/K1 + atlas login-and-registration.md (R6)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type the letter a 41 times in «Password». | The counter under the field should show «40/20». |
| 2 | Read the hint under the field. | The hint «Password must be 5-40 characters long.» should be shown. |

---

### TC-PWD-006 Password advice switch shows the strength bar and checklist
**Priority:** P2 · **Area:** PWD · **Source:** kb-01-password-policy.md AC3 + atlas login-and-registration.md (User Registration screen)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Password» and type Reconqa#2026. | The password should be masked. |
| 2 | Turn on the switch «Show password advice». | A strength bar and a checklist should be shown. |
| 3 | Read the checklist. | The checklist should contain exactly these items: «contains at least one lower character», «contains at least one upper character», «contains at least one digit», «contains at least one special character», «contains at least 8 characters». |

---

## Answered by the knowledge base
- AC1 (at least 8 characters): decision registration/D3. The limit stays at 5 to 40 until the planned security update. TC-PWD-001 to TC-PWD-003 expect the current limit, so no mismatch row.
- AC2 (counter): known issue registration/K1. The app shows «40/20»; TC-PWD-005 reproduces it and it is not reported again.

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| none | | | | |

## Open questions
- AC3: is «Show password advice» off by default, and does the checklist update while typing? The atlas only says what is shown when the switch is on.
- The checklist item «contains at least 8 characters» is shown while the app accepts 5 characters (D3). Should the checklist change with the planned policy? The atlas does not say whether the item is ticked for passwords of 5 to 7 characters.
- Whether the Password field stops accepting input at 40 characters or only shows an error is not confirmed in the atlas (inferred from the counter).
