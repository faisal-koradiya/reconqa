# Test cases: First-time users add a bank account during onboarding

Ticket: tickets/bank-account-onboarding.md · Atlas: qa/atlas/sign-in-and-sign-up.md · Environment: local (http://localhost:3100)
Where the ticket and the app disagree, the cases test the app's behaviour and point to the mismatch row (MM#) below.
Common precondition "new account": an account created on the sign-up page with a username starting with `reconqa`, not yet signed in.

### TC-ONB-001 Onboarding dialog opens on first sign-in
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC1) + atlas sign-in-and-sign-up.md
**Preconditions:** New account (see top of file).

| # | Step | Expected |
|---|---|---|
| 1 | Open http://localhost:3100/signin. | The sign-in page is shown. |
| 2 | Enter the new account's username in «Username» and its password in «Password», then click «Sign In». | A dialog titled «Get Started with Real World App» opens over the home feed at `/`. |

---

### TC-ONB-002 Step 1 explains the need for a bank account and offers Next
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC2) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, signed in for the first time, onboarding dialog open on step 1.

| # | Step | Expected |
|---|---|---|
| 1 | Read the dialog text and the buttons. | The body reads «Real World App requires a Bank Account to perform transactions.Click Next to begin setup of your Bank Account.» (no space after the period, as the app shows it; see MM8). The buttons «Logout» and «Next» are shown. |
| 2 | Click «Next». | Step 2 of the dialog opens with the fields «Bank Name», «Routing Number» and «Account Number». |

---

### TC-ONB-003 Step 2 starts empty with Save disabled
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC3, AC7) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 2.

| # | Step | Expected |
|---|---|---|
| 1 | Look at the fields and the buttons without typing. | «Bank Name», «Routing Number» and «Account Number» are empty. No error message is shown (errors appear on blur only). |
| 2 | Check the «Save» button. | «Save» is disabled. «Logout» is shown. |

---

### TC-ONB-004 Required-field errors appear on blur
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC3) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 2.

| # | Step | Expected |
|---|---|---|
| 1 | Click into «Bank Name», then click outside the field. | «Enter a bank name» is shown under «Bank Name». |
| 2 | Click into «Routing Number», then click outside the field. | «Enter a valid bank routing number» is shown under «Routing Number». |
| 3 | Click into «Account Number», then click outside the field. | «Enter a valid bank account number» is shown under «Account Number». |
| 4 | Check the «Save» button. | «Save» is still disabled. |

---

### TC-ONB-005 Bank Name with 4 characters is rejected (ticket says 3 is the minimum, MM1)
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC4) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 2.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `Abcd` in «Bank Name». | «Must contain at least 5 characters» is shown under «Bank Name». |
| 2 | Enter valid values in «Routing Number» (`123456789`) and «Account Number» (`123456789`). | «Save» stays disabled because of the Bank Name error. |

---

### TC-ONB-006 Bank Name with 5 characters is accepted
**Priority:** Medium · **Area:** ONB · **Source:** bank-account-onboarding.md (AC4) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 2. The atlas only shows 4 characters rejected and 12 accepted; 5 is the boundary implied by the message and is unconfirmed (R8).

| # | Step | Expected |
|---|---|---|
| 1 | Enter `Abcde` in «Bank Name» and leave the field. | No error is shown under «Bank Name». |
| 2 | Enter `123456789` in «Routing Number» and `123456789` in «Account Number». | «Save» becomes enabled. |

---

### TC-ONB-007 Routing Number with 8 digits is rejected
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC5) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 2.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `12345678` in «Routing Number» and leave the field. | «Must contain a valid routing number» is shown under «Routing Number». |
| 2 | Fill «Bank Name» with `reconqa-Bank` and «Account Number» with `123456789`. | «Save» stays disabled. |

---

### TC-ONB-008 Routing Number with 9 digits is accepted
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC5) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 2.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `123456789` in «Routing Number» and leave the field. | No error is shown under «Routing Number». |

---

### TC-ONB-009 Routing Number with 10 digits (upper boundary, not probed in the app)
**Priority:** Medium · **Area:** ONB · **Source:** bank-account-onboarding.md (AC5) + atlas sign-in-and-sign-up.md (open question)
**Preconditions:** New account, onboarding dialog open on step 2. The ticket says exactly 9 digits; the atlas never tried 10 (MM5).

| # | Step | Expected |
|---|---|---|
| 1 | Enter `1234567890` in «Routing Number» and leave the field. | Record what the app does. Per ticket, an error is shown and the number is not accepted. |
| 2 | Fill «Bank Name» with `reconqa-Bank` and «Account Number» with `123456789`. | Record whether «Save» is enabled. Per ticket it stays disabled. |

---

### TC-ONB-010 Account Number with 8 digits is rejected
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC6) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 2.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `12345678` in «Account Number» and leave the field. | «Must contain at least 9 digits» is shown under «Account Number». |
| 2 | Fill «Bank Name» with `reconqa-Bank` and «Routing Number» with `123456789`. | «Save» stays disabled. |

---

### TC-ONB-011 Account Number with 9 digits is accepted (ticket says 10 is the minimum, MM2)
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC6) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 2.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `123456789` in «Account Number» and leave the field. | No error is shown under «Account Number». |
| 2 | Fill «Bank Name» with `reconqa-Bank` and «Routing Number» with `123456789`. | «Save» becomes enabled. |

---

### TC-ONB-012 Account Number with 12 and 13 digits (upper boundary, not probed in the app)
**Priority:** Low · **Area:** ONB · **Source:** bank-account-onboarding.md (AC6) + atlas sign-in-and-sign-up.md (open question)
**Preconditions:** New account, onboarding dialog open on step 2. The ticket allows up to 12 digits; the atlas never tried an upper limit (MM3).

| # | Step | Expected |
|---|---|---|
| 1 | Enter `123456789012` in «Account Number» and leave the field. | No error is shown. |
| 2 | Replace the value with `1234567890123` and leave the field. | Record what the app does. Per ticket, an error is shown and the number is not accepted. |

---

### TC-ONB-013 Save stays disabled until all three fields are valid
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC7) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 2.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `reconqa-Bank` in «Bank Name» and `123456789` in «Routing Number». Leave «Account Number» empty. | «Save» is disabled. |
| 2 | Enter `123456789` in «Account Number». | «Save» becomes enabled. |
| 3 | Clear «Routing Number» and leave the field. | «Enter a valid bank routing number» is shown and «Save» is disabled again. |

---

### TC-ONB-014 No "Skip for now" option in the dialog (MM4)
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC8) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 1.

| # | Step | Expected |
|---|---|---|
| 1 | Look for a skip link on step 1. | Only «Logout» and «Next» are shown. Per ticket a "Skip for now" link should exist; record that it is missing. |
| 2 | Click «Next» and look for a skip link on step 2. | Only «Save» and «Logout» are shown. No skip link. |

---

### TC-ONB-015 Saving valid details shows the final step
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC9) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 2.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `reconqa-Bank` in «Bank Name», `123456789` in «Routing Number» and `123456789` in «Account Number». | «Save» is enabled. |
| 2 | Click «Save». | Step 3 shows «Finished», «You're all set!» and «We're excited to have you aboard the Real World App!». The buttons «Logout» and «Done» are shown. The ticket's text "Your bank account has been added." is not shown (MM6). |

---

### TC-ONB-016 Done closes the dialog and leaves the user on the home feed
**Priority:** High · **Area:** ONB · **Source:** bank-account-onboarding.md (AC10) + atlas sign-in-and-sign-up.md
**Preconditions:** New account, onboarding dialog open on step 3 after saving valid details.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Done». | The dialog closes. The user stays on `/` and sees the home feed with the tabs «Everyone», «Friends» and «Mine» (MM7). |
| 2 | Look at the side navigation. | The entries «Home», «My Account», «Bank Accounts», «Notifications» and «Logout» are shown. |

---

### TC-ONB-017 Logout from the first onboarding step
**Priority:** Low · **Area:** ONB · **Source:** atlas sign-in-and-sign-up.md (not in ticket, MM9)
**Preconditions:** New account, onboarding dialog open on step 1.

| # | Step | Expected |
|---|---|---|
| 1 | Click «Logout». | The user is taken to `/signin`. |

---

## Mismatches / questions
| # | Ticket says | App shows (atlas ref) | Kind: mismatch / missing in app / missing in ticket / likely defect | Suggested question |
|---|---|---|---|---|
| MM1 | AC4: Bank Name at least 3 characters. | 4 characters rejected with «Must contain at least 5 characters» (M12, R8). | mismatch | Is the minimum 3 or 5? |
| MM2 | AC6: Account Number 10 to 12 digits. | 8 digits rejected, 9 digits accepted; message «Must contain at least 9 digits» (M14, R8). | mismatch | Is the minimum 9 or 10 digits? |
| MM3 | AC6: upper limit of 12 digits. | No upper limit probed (open questions). | missing in app (unconfirmed) | Does the app reject more than 12 digits? Covered by TC-ONB-012. |
| MM4 | AC8: «Skip for now» link to add an account later. | Step 1 has «Logout» and «Next»; step 2 has «Save» and «Logout». No skip link (screens step 1, 2). | missing in app | Is the skip option still planned? Can a user reach the app without a bank account? |
| MM5 | AC5: Routing Number exactly 9 digits. | 8 digits rejected, 9 accepted; 10 digits not probed (R8). | match for 8 and 9; 10 unconfirmed | Is a 10-digit routing number rejected? Covered by TC-ONB-009. |
| MM6 | AC9: confirmation says "Your bank account has been added." | Step 3 shows «Finished», «You're all set!» and «We're excited to have you aboard the Real World App!». | mismatch | Which confirmation text is correct? |
| MM7 | AC10: closing takes the user to the transactions feed. | «Done» closes the dialog; the user stays on `/` (home feed, R10). | mismatch (likely the same page under another name) | Is the home feed the "transactions feed"? |
| MM8 | Not mentioned. | Step 1 body has no space after the period: «transactions.Click». | likely defect (text) | Should there be a space? |
| MM9 | Not mentioned. | «Logout» in every onboarding step; required-field messages M9 to M11 on blur. | missing in ticket | Add to the acceptance criteria? |
| MM10 | AC1: dialog opens before the user can use the app. | Modal opens over `/` on first sign-in (R7). Not checked: whether Escape or a click outside closes it; whether it returns after Logout mid-flow. | open question | Can the dialog be dismissed without finishing? Not covered by a case. |
