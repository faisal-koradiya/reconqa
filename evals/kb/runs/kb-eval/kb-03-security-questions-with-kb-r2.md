# Test cases: Fewer security questions

Ticket: tickets/kb-03-security-questions.md · Atlas: qa/atlas/login-and-registration.md · Written: 2026-11-26

## 1. Ticket vs app

| # | Ticket says | App shows (atlas ref) | Kind | Suggested question |
|---|---|---|---|---|
| AC2 | The form says the security question cannot be changed later. | Hint «This cannot be changed later!» under Security Question (User Registration, R10). | match | none |
| AC3 | Leaving the answer empty shows an error under the answer field. | «Please provide an answer to your security question.» under Answer (M8). | match | none |

**Answered by the knowledge base**
- AC1 (6 questions instead of the long list): `decision registration/D5`. The current list is kept and shortening is not planned, so the cases expect the current 14 options. The ticket will be corrected.

---

### TC-REG-201 Security question list offers the current 14 options
**Priority:** P2 · **Area:** REG · **Source:** tickets/kb-03-security-questions.md#AC1 + atlas login-and-registration.md + decision registration/D5
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Open the «Security Question» dropdown. | The dropdown should offer exactly 14 options, in this order: «Your eldest siblings middle name?», «Mother's maiden name?», «Mother's birth date? (MM/DD/YY)», «Father's birth date? (MM/DD/YY)», «Maternal grandmother's first name?», «Paternal grandmother's first name?», «Name of your favorite pet?», «Last name of dentist when you were a teenager? (Do not include 'Dr.')», «Your ZIP/postal code when you were a teenager?», «Company you first work for as an adult?», «Your favorite book?», «Your favorite movie?», «Number of one of your customer or ID cards?», «What's your favorite place to go hiking?». |

---

### TC-REG-202 Form warns that the security question cannot be changed later
**Priority:** P3 · **Area:** REG · **Source:** tickets/kb-03-security-questions.md#AC2 + atlas login-and-registration.md
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Security Question» field without choosing an option. | The hint «This cannot be changed later!» should be shown for the field. |
| 2 | Choose «Name of your favorite pet?» in «Security Question». | The hint «This cannot be changed later!» should still be shown. |

---

### TC-REG-203 Empty answer shows an error under the Answer field
**Priority:** P1 · **Area:** REG · **Source:** tickets/kb-03-security-questions.md#AC3 + atlas login-and-registration.md
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Choose «Name of your favorite pet?» in «Security Question». | No error message should be shown under «Security Question». |
| 2 | Click in «Answer», then click in «Email» without typing anything. | The message «Please provide an answer to your security question.» should be shown under the «Answer» field. |
| 3 | Type Rex in «Answer». | The message should disappear. |

---

### TC-REG-204 Register stays disabled while the answer is empty
**Priority:** P2 · **Area:** REG · **Source:** tickets/kb-03-security-questions.md#AC3 + atlas login-and-registration.md (R4)
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-sq204@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question». Leave «Answer» empty. | The «Register» button should be disabled. |
| 3 | Type Rex in «Answer». | The «Register» button should be enabled. |

---

### TC-REG-205 Leaving the security question unselected shows an error
**Priority:** P3 · **Area:** REG · **Source:** atlas login-and-registration.md (M7, missing in ticket)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Open the «Security Question» dropdown, close it without choosing an option, then click in «Answer». | The message «Please select a security question.» should be shown under «Security Question». |

---

## Open questions
- None from the ticket. AC1 is settled by `decision registration/D5`; the ticket text should be corrected by the PO.
