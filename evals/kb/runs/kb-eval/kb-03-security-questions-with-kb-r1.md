# Test cases: Fewer security questions

Ticket: tickets/kb-03-security-questions.md · Atlas: qa/atlas/login-and-registration.md

## 1. Ticket vs app

Match:
- AC2 matches: the Security Question field shows the hint «This cannot be changed later!» (atlas R10).
- AC3 matches: an empty Answer field shows «Please provide an answer to your security question.» under the field (atlas M8).

Answered by the knowledge base:
- AC1 (6 questions instead of the current list): decision registration/D5. The current list is kept and shortening is not planned. Cases expect the 14 options the app shows today. It is not reported as a mismatch.

Mismatches: none.

## 2. Cases

### TC-REG-201 Security Question dropdown offers the current 14 questions
**Priority:** P2 · **Area:** REG · **Source:** kb-03-security-questions.md AC1 + decision registration/D5 + atlas login-and-registration.md (User Registration screen)
**Preconditions:** Browser is logged out. The registration page is open (Login screen, then «Not yet a customer?»).

| # | Step | Expected |
|---|---|---|
| 1 | Open the «Security Question» dropdown. | The dropdown should list 14 options. |
| 2 | Read the first and the last option. | The first option should be «Your eldest siblings middle name?» and the last option should be «What's your favorite place to go hiking?». |
| 3 | Read the options between them in order. | The options should appear in this order: «Mother's maiden name?», «Mother's birth date? (MM/DD/YY)», «Father's birth date? (MM/DD/YY)», «Maternal grandmother's first name?», «Paternal grandmother's first name?», «Name of your favorite pet?», «Last name of dentist when you were a teenager? (Do not include 'Dr.')», «Your ZIP/postal code when you were a teenager?», «Company you first work for as an adult?», «Your favorite book?», «Your favorite movie?», «Number of one of your customer or ID cards?». |

### TC-REG-202 Security Question field warns that it cannot be changed later
**Priority:** P3 · **Area:** REG · **Source:** kb-03-security-questions.md AC2 + atlas login-and-registration.md (R10)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Security Question» field without selecting an option. | The hint «This cannot be changed later!» should be visible for the field. |
| 2 | Select any security question from the dropdown. | The hint «This cannot be changed later!» should still be visible. |

### TC-REG-203 Empty answer shows an error under the Answer field
**Priority:** P1 · **Area:** REG · **Source:** kb-03-security-questions.md AC3 + atlas login-and-registration.md (M8)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click into the «Answer» field and leave it empty. | The field should show the placeholder «Answer to your security question». |
| 2 | Click into another field, so that «Answer» loses focus. | The message «Please provide an answer to your security question.» should appear under the «Answer» field. |
| 3 | Fill Email (reconqa-sq203@example.test), Password and Repeat Password (Reconqa#2026), and select any security question, leaving «Answer» empty. | The «Register» button should stay disabled. |

---

## Open questions
- Whether the «Register» button stays disabled with only the Answer missing was seen on the empty form, not on a form where only Answer is empty (atlas R4). TC-REG-203 step 3 checks it.
- Is the message under «Answer» removed once text is typed? The atlas does not cover it.
