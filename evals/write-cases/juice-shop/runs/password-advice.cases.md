# Test cases: password advice on registration

Ticket: tickets/password-advice.ticket.md · Atlas: qa/atlas/login-and-registration.md (Juice Shop 20.4.0, explored 2026-11-26)

### TC-PWD-001 Switch shows the password advice
**Priority:** P1 · **Area:** PWD · **Source:** password-advice.ticket.md (criterion 1) + atlas qa/atlas/login-and-registration.md
**Preconditions:** Logged out. The app is open at http://localhost:3000.

| # | Step | Expected |
|---|---|---|
| 1 | Open the registration page: go to #/register. | The registration form should show the fields Email, Password and Repeat Password, and the switch «Show password advice». |
| 2 | Turn on the switch «Show password advice». | A strength bar and a checklist should appear on the form. |

---

### TC-PWD-002 Advice checklist lists the five items
**Priority:** P1 · **Area:** PWD · **Source:** password-advice.ticket.md (criterion 2) + atlas qa/atlas/login-and-registration.md
**Preconditions:** Logged out. The registration page #/register is open.

| # | Step | Expected |
|---|---|---|
| 1 | Turn on the switch «Show password advice». | The checklist should show exactly five items. |
| 2 | Read the checklist items in order. | The items should read «contains at least one lower character», «contains at least one upper character», «contains at least one digit», «contains at least one special character» and «contains at least 8 characters». |

---

### TC-PWD-003 Length hint is always visible under the Password field
**Priority:** P2 · **Area:** PWD · **Source:** password-advice.ticket.md (criterion 4) + atlas qa/atlas/login-and-registration.md
**Preconditions:** Logged out. The registration page #/register is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look under the Password field without typing. | The hint «Password must be 5-40 characters long.» should be visible, together with a character counter. |
| 2 | Type the characters abc into Password. | The hint «Password must be 5-40 characters long.» should still be visible. |
| 3 | Turn on the switch «Show password advice». | The hint «Password must be 5-40 characters long.» should still be visible. |

---

### TC-PWD-004 Password counter after 41 characters
**Priority:** P3 · **Area:** PWD · **Source:** password-advice.ticket.md (criterion 5) + atlas qa/atlas/login-and-registration.md · Mismatch row 1
**Preconditions:** Logged out. The registration page #/register is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type 41 characters (the letter a, 41 times) into Password. | The counter under Password should read «40/20». |

---

### TC-PWD-005 Password of 4 characters is rejected
**Priority:** P2 · **Area:** PWD · **Source:** password-advice.ticket.md (criterion 4) + atlas qa/atlas/login-and-registration.md
**Preconditions:** Logged out. The registration page #/register is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type Ab1! into Password. | The field should accept the characters. |
| 2 | Move focus out of Password. | The message «Password must be 5-40 characters long.» should show under the Password field. |

---

### TC-PWD-006 Register with a 5-character password
**Priority:** P1 · **Area:** PWD · **Source:** password-advice.ticket.md (criterion 4) + atlas qa/atlas/login-and-registration.md
**Preconditions:** Logged out. The registration page #/register is open. Use a new email, for example reconqa-<random>@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Type the new email into Email. | No message should show under Email. |
| 2 | Type Ab1!x into Password and into Repeat Password. | No message should show under Repeat Password. |
| 3 | Select «Name of your favorite pet?» in Security Question. | The option should be selected. |
| 4 | Type Rex into Answer. | The button «Register» should be enabled. |
| 5 | Click «Register». | The app should open #/login and show the toast «Registration completed successfully. You can now log in.». |

---

### TC-PWD-007 Register with a 40-character password
**Priority:** P2 · **Area:** PWD · **Source:** password-advice.ticket.md (criterion 4) + atlas qa/atlas/login-and-registration.md
**Preconditions:** Logged out. The registration page #/register is open. Use a new email, for example reconqa-<random>@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Type the new email into Email. | No message should show under Email. |
| 2 | Type 40 characters (Ab1! followed by the letter x, 36 times) into Password and into Repeat Password. | No message should show under Repeat Password. |
| 3 | Select «Name of your favorite pet?» in Security Question and type Rex into Answer. | The button «Register» should be enabled. |
| 4 | Click «Register». | The app should open #/login and show the toast «Registration completed successfully. You can now log in.». |

---

### TC-PWD-008 Repeat Password must match Password
**Priority:** P2 · **Area:** PWD · **Source:** atlas qa/atlas/login-and-registration.md (not in ticket) · Mismatch row 3
**Preconditions:** Logged out. The registration page #/register is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type Ab1!xyz into Password. | The field should accept the characters. |
| 2 | Type Ab1!xyZ into Repeat Password, then move focus out of it. | The message «Passwords do not match» should show under Repeat Password. |

---

### TC-PWD-009 Password is required
**Priority:** P2 · **Area:** PWD · **Source:** atlas qa/atlas/login-and-registration.md (not in ticket)
**Preconditions:** Logged out. The registration page #/register is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click into Password, then move focus out without typing. | The message «Please provide a password.» should show under the Password field. |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | Criterion 5: counter under Password shows the count out of 40. | Counter reads "n/20"; after 41 characters it shows "40/20" (atlas, User Registration, Password row; R6). Severity guess: low. Case TC-PWD-004. | likely defect | Should the Password counter show "n/40"? |
| 2 | Not mentioned. | Repeat Password must equal Password (message "Passwords do not match") (atlas R7, M11). Case TC-PWD-008. | missing in ticket | Add this rule to the ticket? |
| 3 | Not mentioned. | Password is required, with a message on blur (atlas M5). Case TC-PWD-009. | missing in ticket | Add this rule to the ticket? |

## Open questions
- Criterion 3 (each advice item shows whether the password meets it): the atlas lists the items but did not record per-item states, so no case checks it.
- Criterion 6 (weak passwords, fewer than 3 criteria met, cannot be registered): not explored in the atlas, so no case checks it. The atlas only records a 5-40 character rule, which is looser than the 8-character advice item.
- Criterion 7 (advice hidden by default) and hiding the advice again by turning the switch off: the atlas only says "When on: strength bar and checklist", so these are not checked.
- Whether the Password field stops accepting input at 40 characters (inferred from the counter only).
