# Test cases: Fewer security questions

Ticket: tickets/kb-03-security-questions.md · Atlas: qa/atlas/login-and-registration.md

## 1. Ticket vs app (knowledge base: none found, `qa/kb/index.md` does not exist)

| # | Ticket says | App shows (atlas ref) | Kind | Suggested question |
|---|---|---|---|---|
| 1 | AC1: the list offers 6 questions instead of the current long list | User Registration screen: «Security Question» has 14 options (field table, options list) | mismatch | Is the 6-question list not built yet, or is 14 still intended? Which 6 questions should remain? |
| 2 | AC2: the form says the security question cannot be changed later | Hint «This cannot be changed later!» on «Security Question» (field table, R10) | match | None. The exact wording comes from the app. |
| 3 | AC3: empty answer shows an error under the answer field | M8 «Please provide an answer to your security question.» under «Answer» on blur (R4) | match | None. |
| 4 | Not mentioned | M7 «Please select a security question.» when the dropdown is left without a choice | missing in ticket | Should M7 stay unchanged with the shorter list? |

## Cases

### TC-SEC-001 Security question list offers 14 options
**Priority:** P1 · **Area:** SEC · **Source:** kb-03-security-questions.md AC1 + atlas login-and-registration.md (User Registration, options list) + mismatch row 1
**Preconditions:** Browser is logged out. The registration page is open (Login screen → «Not yet a customer?»).

| # | Step | Expected |
|---|---|---|
| 1 | Open the «Security Question» dropdown. | The dropdown should list 14 options. |
| 2 | Read the options from top to bottom. | The first option should be «Your eldest siblings middle name?» and the last option should be «What's your favorite place to go hiking?». |
| 3 | Check the options between them. | They should be, in order: «Mother's maiden name?», «Mother's birth date? (MM/DD/YY)», «Father's birth date? (MM/DD/YY)», «Maternal grandmother's first name?», «Paternal grandmother's first name?», «Name of your favorite pet?», «Last name of dentist when you were a teenager? (Do not include 'Dr.')», «Your ZIP/postal code when you were a teenager?», «Company you first work for as an adult?», «Your favorite book?», «Your favorite movie?», «Number of one of your customer or ID cards?». |

---

### TC-SEC-002 Security question field shows the "cannot be changed" hint
**Priority:** P2 · **Area:** SEC · **Source:** kb-03-security-questions.md AC2 + atlas login-and-registration.md (User Registration, R10)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the «Security Question» field before touching it. | The hint «This cannot be changed later!» should be shown for the field. |
| 2 | Choose «Name of your favorite pet?» in «Security Question». | The hint «This cannot be changed later!» should still be shown. |

---

### TC-SEC-003 Empty answer shows an error under the answer field
**Priority:** P1 · **Area:** SEC · **Source:** kb-03-security-questions.md AC3 + atlas login-and-registration.md (M8)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Answer», then click in «Email» without typing in «Answer». | The message «Please provide an answer to your security question.» should be shown under the «Answer» field. |
| 2 | Look at the «Register» button. | The «Register» button should be disabled. |

---

### TC-SEC-004 Error under the answer field disappears once an answer is typed
**Priority:** P3 · **Area:** SEC · **Source:** kb-03-security-questions.md AC3 + atlas login-and-registration.md (M8, R4)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click in «Answer», then click in «Email» without typing in «Answer». | The message «Please provide an answer to your security question.» should be shown under the «Answer» field. |
| 2 | Click in «Answer» and type Rex. | The message «Please provide an answer to your security question.» should no longer be shown. |

---

### TC-SEC-005 Leaving the security question unchosen shows an error
**Priority:** P2 · **Area:** SEC · **Source:** atlas login-and-registration.md (M7) + mismatch row 4
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Open the «Security Question» dropdown, close it without choosing an option, then click in «Answer». | The message «Please select a security question.» should be shown under the «Security Question» field. |
| 2 | Look at the «Register» button. | The «Register» button should be disabled. |

---

## Open questions
- Which 6 questions should the list contain, and in which order (AC1)? The app currently shows 14.
- Should the hint wording stay «This cannot be changed later!» or change as the ticket describes it in its own words (AC2)?
