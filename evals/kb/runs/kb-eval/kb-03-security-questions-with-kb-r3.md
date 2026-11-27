# Test cases: Fewer security questions

Ticket: tickets/kb-03-security-questions.md · Atlas: qa/atlas/login-and-registration.md

## Answered by the knowledge base
- AC1 (6 questions instead of the long list): decision registration/D5, "Keep the current list of questions; shortening it is not planned." Cases expect the current 14 options, not 6.

### TC-REG-201 Security Question dropdown offers the current list of questions
**Priority:** P2 · **Area:** REG · **Source:** kb-03-security-questions.md AC1 + decision registration/D5 + atlas login-and-registration.md (User Registration screen)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Open the «Security Question» dropdown. | The dropdown should list 14 options in this order: «Your eldest siblings middle name?», «Mother's maiden name?», «Mother's birth date? (MM/DD/YY)», «Father's birth date? (MM/DD/YY)», «Maternal grandmother's first name?», «Paternal grandmother's first name?», «Name of your favorite pet?», «Last name of dentist when you were a teenager? (Do not include 'Dr.')», «Your ZIP/postal code when you were a teenager?», «Company you first work for as an adult?», «Your favorite book?», «Your favorite movie?», «Number of one of your customer or ID cards?», «What's your favorite place to go hiking?». |
| 2 | Choose «Your favorite book?». | The dropdown should close and «Your favorite book?» should be shown as the selected question. |

---

### TC-REG-202 The form says the security question cannot be changed later
**Priority:** P2 · **Area:** REG · **Source:** kb-03-security-questions.md AC2 + atlas login-and-registration.md (R10, User Registration screen)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Security Question» field without opening it. | The hint «This cannot be changed later!» should be shown for the field. |
| 2 | Choose «Name of your favorite pet?» in «Security Question». | The hint «This cannot be changed later!» should still be shown. |

---

### TC-REG-203 Leaving Answer empty shows an error under the field
**Priority:** P1 · **Area:** REG · **Source:** kb-03-security-questions.md AC3 + atlas login-and-registration.md (M8, R4)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Answer» and then click in «Email» without typing in «Answer». | The error «Please provide an answer to your security question.» should be shown under the «Answer» field. |
| 2 | Click in «Answer» and type Rex. | The error «Please provide an answer to your security question.» should no longer be shown under the «Answer» field. |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| 1 | AC2: the form says the security question cannot be changed later | Hint «This cannot be changed later!» under Security Question (User Registration screen, R10) | match | none |
| 2 | AC3: empty answer shows an error under the answer field | «Please provide an answer to your security question.» under Answer (M8) | match | none |
| 3 | Not in ticket | «Please select a security question.» under Security Question when the dropdown is closed without a choice (M7) | missing in ticket | Should a case for M7 be part of this story? |
