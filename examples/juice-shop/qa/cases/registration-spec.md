# Test cases: Customer registration

Ticket: tickets/registration-spec.md · Atlas: none yet (pre-UI, written 2026-11-26)

Pre-UI cases: no screen exists yet. Exact texts come from the ticket and are marked as expected text with a source. Reconcile with the real screen once it is built (`/reconqa:reconcile qa/cases/registration-spec.md`).

Test data: every case that registers an account uses a fresh email like `reconqa-<random>@example.test` and a valid password such as `Reconqa-Pass1` (13 characters).

## 1. Questions (gaps and contradictions in the ticket)
| # | Ticket item | Question |
|---|---|---|
| 1 | AC1 | What is the text of the link on the login page that opens the registration form? The ticket only names the link back, ‹expected: Already a customer? [src: ticket:tickets/registration-spec.md#AC1]›. |
| 2 | AC2 | How are required fields shown (asterisk, text)? What message appears when a field other than email and password is empty, e.g. an empty Answer? |
| 3 | AC3, AC4 | "When the user leaves the field": is validation on blur only, or also on submit? |
| 4 | AC5 | What happens with a password longer than 40 characters? The ticket gives a message only for a shorter one. No case written until answered. |
| 5 | AC5 | Is the message for 1 to 7 characters the same when the field is empty? AC4 gives a different message for empty. |
| 6 | AC8 | Which security questions are offered? Where is the warning that it cannot be changed shown (next to the question, next to the answer)? |
| 7 | AC9 | What happens when the terms box is not ticked: is the button disabled or is an error shown, and with what text? |
| 8 | AC10 | What does the Google sign-up do (new account, redirect, which page afterwards)? The external sign-in is not covered by these cases beyond its presence. |
| 9 | AC11 | Is the email uniqueness check case-insensitive? Is it shown on leaving the field or only on submit? |
| 10 | AC12 | Is the user logged in automatically after registering? (AC12 implies not.) |
| 11 | General | Is there a maximum length for the email? |
| 12 | Wording | Message punctuation differs: the messages for AC4 (password) and AC6 (mismatch) have no full stop, the others do. Is that intended? |

---

### TC-REG-001 Open the registration form from the login page and go back
**Priority:** P1 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC1
**Preconditions:** The test user is not logged in.

| # | Step | Expected |
|---|---|---|
| 1 | Open the login page. | The login page should be shown. |
| 2 | Use the link on the login page that leads to the registration form. | The registration form should be shown. |
| 3 | Click the link ‹expected: Already a customer? [src: ticket:tickets/registration-spec.md#AC1]›. | The login page should be shown again. |

---

### TC-REG-002 Registration form has all five fields
**Priority:** P2 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC2
**Preconditions:** The test user is not logged in.

| # | Step | Expected |
|---|---|---|
| 1 | Open the registration form from the login page. | The form should show the fields ‹expected: Email [src: ticket:tickets/registration-spec.md#AC2]›, ‹expected: Password [src: ticket:tickets/registration-spec.md#AC2]›, ‹expected: Repeat Password [src: ticket:tickets/registration-spec.md#AC2]›, ‹expected: Security question [src: ticket:tickets/registration-spec.md#AC2]› and ‹expected: Answer [src: ticket:tickets/registration-spec.md#AC2]›. |

---

### TC-REG-003 Empty email shows an error on leaving the field
**Priority:** P2 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC4
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click into the Email field, leave it empty, then click into the Password field. | The message ‹expected: Please provide an email address. [src: ticket:tickets/registration-spec.md#AC4]› should be shown for the Email field. |

---

### TC-REG-004 Invalid email format shows an error on leaving the field
**Priority:** P1 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC3
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type `reconqa-invalid` (no `@`) into the Email field, then click into the Password field. | The message ‹expected: Email address is not valid. [src: ticket:tickets/registration-spec.md#AC3]› should be shown for the Email field. |
| 2 | Replace the email with `reconqa-<random>@example.test`, then click into the Password field. | The message should disappear. |

---

### TC-REG-005 Empty password shows an error on leaving the field
**Priority:** P2 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC4
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Click into the Password field, leave it empty, then click into the Repeat Password field. | The message ‹expected: Please provide a password [src: ticket:tickets/registration-spec.md#AC4]› should be shown for the Password field. |

---

### TC-REG-006 Password with 7 characters is rejected
**Priority:** P1 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC5
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type `Abcde-1` (7 characters) into the Password field, then click into the Repeat Password field. | The message ‹expected: Password must be 8 to 40 characters. [src: ticket:tickets/registration-spec.md#AC5]› should be shown for the Password field. |

---

### TC-REG-007 Password with 8 characters is accepted
**Priority:** P1 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC5
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type `Abcde-12` (8 characters) into the Password field, then click into the Repeat Password field. | No password length message should be shown. |

---

### TC-REG-008 Password with 40 characters is accepted
**Priority:** P2 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC5
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type `Abcdefghij-Abcdefghij-Abcdefghij-12345` (40 characters) into the Password field, then click into the Repeat Password field. | No password length message should be shown. |

---

### TC-REG-009 Different repeated password shows an error
**Priority:** P1 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC6
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type `Reconqa-Pass1` into the Password field and `Reconqa-Pass2` into the Repeat Password field, then click into the Email field. | The message ‹expected: Passwords do not match [src: ticket:tickets/registration-spec.md#AC6]› should be shown under the Repeat Password field. |

---

### TC-REG-010 Empty repeated password shows an error
**Priority:** P2 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC6
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Type `Reconqa-Pass1` into the Password field. Click into the Repeat Password field, leave it empty, then click into the Email field. | The message ‹expected: Please repeat your password. [src: ticket:tickets/registration-spec.md#AC6]› should be shown for the Repeat Password field. |

---

### TC-REG-011 Show password tips switch
**Priority:** P3 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC7
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Turn on the switch ‹expected: Show password tips [src: ticket:tickets/registration-spec.md#AC7]›. | Advice on strong passwords should be shown. |
| 2 | Turn the switch off. | The advice should be hidden. |

---

### TC-REG-012 No security question chosen shows an error
**Priority:** P2 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC8
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Open the Security question field and close it without choosing an entry, then click into the Answer field. | The message ‹expected: Please choose a security question. [src: ticket:tickets/registration-spec.md#AC8]› should be shown. |

---

### TC-REG-013 Warning that the security question cannot be changed
**Priority:** P3 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC8
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the security question part of the form. | The form should say ‹expected: This cannot be changed later! [src: ticket:tickets/registration-spec.md#AC8]›. |

---

### TC-REG-014 Registration without accepting the terms is not possible
**Priority:** P1 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC9
**Preconditions:** The registration form is open. Use a fresh email `reconqa-<random>@example.test`.

| # | Step | Expected |
|---|---|---|
| 1 | Fill Email, Password and Repeat Password with valid values (`Reconqa-Pass1`), choose any security question and type `reconqa` into the Answer field. Leave ‹expected: I accept the terms and conditions [src: ticket:tickets/registration-spec.md#AC9]› unticked. | The form should be filled and the box should be unticked. |
| 2 | Try to send the form with ‹expected: Create account [src: ticket:tickets/registration-spec.md#AC10]›. | The account should not be created and the login page should not show a success message. |
| 3 | Log in on the login page with the same email and password. | The login should fail because no account exists. |

---

### TC-REG-015 Register a new customer
**Priority:** P1 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC10, ticket:tickets/registration-spec.md#AC12
**Preconditions:** The registration form is open. Use a fresh email `reconqa-<random>@example.test`.

| # | Step | Expected |
|---|---|---|
| 1 | Fill Email, Password and Repeat Password (`Reconqa-Pass1`), choose any security question, type `reconqa` into the Answer field and tick ‹expected: I accept the terms and conditions [src: ticket:tickets/registration-spec.md#AC9]›. | No error messages should be shown. |
| 2 | Click ‹expected: Create account [src: ticket:tickets/registration-spec.md#AC10]›. | The login page should be shown with the message ‹expected: Registration successful. Please log in. [src: ticket:tickets/registration-spec.md#AC12]›. |

---

### TC-REG-016 Log in with the newly registered account
**Priority:** P2 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC12
**Preconditions:** The registration form is open. Use a fresh email `reconqa-<random>@example.test`.

| # | Step | Expected |
|---|---|---|
| 1 | Register the account with password `Reconqa-Pass1`, any security question, answer `reconqa` and the terms ticked. | The login page should be shown with the message ‹expected: Registration successful. Please log in. [src: ticket:tickets/registration-spec.md#AC12]›. |
| 2 | Log in with the same email and password. | The login should succeed. |

---

### TC-REG-017 Email that already has an account is rejected
**Priority:** P1 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC11
**Preconditions:** The test user is not logged in. Use a fresh email `reconqa-<random>@example.test`.

| # | Step | Expected |
|---|---|---|
| 1 | Register the email with password `Reconqa-Pass1`, any security question, answer `reconqa` and the terms ticked. | The login page should be shown with a success message. |
| 2 | Open the registration form again and fill it with the same email and valid values, terms ticked. | No error messages should be shown yet. |
| 3 | Click ‹expected: Create account [src: ticket:tickets/registration-spec.md#AC10]›. | The message ‹expected: Email must be unique. [src: ticket:tickets/registration-spec.md#AC11]› should be shown. |
| 4 | Check where the app is after the click. | The registration form should still be shown and no second account should be created. |

---

### TC-REG-018 Sign up with Google is offered
**Priority:** P3 · **Area:** REG · **Source:** ticket:tickets/registration-spec.md#AC10
**Preconditions:** The registration form is open.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the buttons on the registration form. | The buttons ‹expected: Create account [src: ticket:tickets/registration-spec.md#AC10]› and ‹expected: Sign up with Google [src: ticket:tickets/registration-spec.md#AC10]› should be shown. |
