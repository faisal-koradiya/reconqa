# Test cases: Smoother sign-up

Ticket: tickets/kb-02-registration-flow.md · Atlas: qa/atlas/login-and-registration.md

## Comparison of ticket and atlas

| # | Ticket says | App shows (atlas ref) | Kind |
|---|---|---|---|
| AC4 | The "Already a customer?" link takes the user back to the login page. | Link goes to #/login (User Registration, buttons and links) | match |

Answered by the knowledge base:
- AC1 (automatic login, product list): decision registration/D1. The login page is intended; cases expect it (TC-REG-201).
- AC2 (accept terms before registering): decision registration/D2. Out of scope; no cases written and not reported as a bug.
- AC3 (message "This email is already registered." under the email field): decision registration/D4. The banner is intended; cases expect it (TC-REG-202).

---

### TC-REG-201 After registration the login page opens and the user is not logged in
**Priority:** P2 · **Area:** REG · **Source:** kb-02-registration-flow.md AC1 + decision registration/D1 + atlas login-and-registration.md (R9, M13)
**Preconditions:** Browser is logged out. The registration page is open. Use a new email, for example reconqa-kb201@example.test.

| # | Step | Expected |
|---|---|---|
| 1 | Enter the new email in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | The login page should open, not the product list. A toast «Registration completed successfully. You can now log in.» should be shown. |
| 4 | Open the Account menu in the top bar. | The menu should offer «Login», which shows the user is not logged in. |

---

### TC-REG-202 Registering with an email that already has an account shows a banner
**Priority:** P1 · **Area:** REG · **Source:** kb-02-registration-flow.md AC3 + decision registration/D4 + atlas login-and-registration.md (M12, R8)
**Preconditions:** Browser is logged out. Register reconqa-kb202@example.test first with valid data (password Reconqa#2026, any security question and answer). Then open the registration page again.

| # | Step | Expected |
|---|---|---|
| 1 | Enter reconqa-kb202@example.test in «Email». Enter Reconqa#2026 in «Password» and in «Repeat Password». | No error message should be shown under the three fields. |
| 2 | Choose «Name of your favorite pet?» in «Security Question» and enter Rex in «Answer». | The «Register» button should be enabled. |
| 3 | Click «Register». | An alert banner «Email must be unique» should be shown under the «User Registration» heading. The account should not be created a second time. |

---

### TC-REG-203 The "Already a customer?" link opens the login page
**Priority:** P3 · **Area:** REG · **Source:** kb-02-registration-flow.md AC4 + atlas login-and-registration.md (User Registration)
**Preconditions:** Browser is logged out. The registration page is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Already a customer?». | The login page should open. The «Log in» button should be shown and should be disabled while the form is empty. |

---

## Open questions
- None. All ticket items are either matched by the atlas or answered by a decision.
