# Test cases: Change password (SHOP-88)
Ticket: tickets/change-password.md · Atlas: none yet (pre-UI, written 2026-11-27) · Similar feature read: qa/atlas/login-and-registration.md
Pre-UI cases: reconcile with the real screen once it is built (`/reconqa:reconcile qa/cases/change-password.md`).
Note for running later: the kit's `deny_actions` blocks changing passwords, so a run needs a throwaway account created for the run and the team's approval.

## Questions (before the cases)
Ticket items are numbered AC1–AC6 in the order of the ticket.

| # | Item | Kind | Question |
|---|---|---|---|
| Q1 | AC1 | missing in ticket | Where in account settings is the page, and what is its title? Cases say "the change password page". |
| Q2 | AC2 | missing in ticket | No error text is given. Borrowed from registration: "Please provide a password." for Current Password and New Password, and "Please repeat your password." for Repeat New Password. Is it the same here? |
| Q3 | AC3 | missing in ticket | "Same length rule as at registration": registration shows 5-40 characters. Confirm 5-40 and the error text borrowed from registration ("Password must be 5-40 characters long."). Does the field cap input at 40, or show an error at 41? (No case for 41 until answered.) |
| Q4 | AC4 | missing in ticket | The ticket gives no exact text. Borrowed from registration: "Passwords do not match". Same here? Is it shown on blur, on submit, or both? |
| Q5 | AC5 | missing in ticket | Message text for a wrong current password is not given (the login message is not borrowed: it is about login). Which text? Is it under the field or a banner? |
| Q6 | AC6 | missing in ticket | Confirmation text is not given. Where is it shown (toast, banner) and does the form clear? |
| Q7 | AC1 | missing in ticket | Is the Change button disabled while the form is empty or invalid (as Log in and Register are), or does it show errors on click? Cases say "if it is enabled". |
| Q8 | none | missing in ticket | May the new password equal the current one? |
| Q9 | AC6 | missing in ticket | Do other open sessions of the same user stay signed in after the change? |

Borrowed from similar feature (login-and-registration): 4 texts (M5, M6, M10, M11). Each is marked in the cases and listed in Q2-Q4.

---

### TC-CHPW-001 Page shows the three fields and the Change button
**Priority:** P1 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC1 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it.

| # | Step | Expected |
|---|---|---|
| 1 | Open account settings and go to the change password page. | The page should show three fields labelled ‹expected: Current Password [src: ticket:tickets/change-password.md#L8]›, ‹expected: New Password [src: ticket:tickets/change-password.md#L8]› and ‹expected: Repeat New Password [src: ticket:tickets/change-password.md#L8]›. |
| 2 | Look at the buttons on the page. | The page should show a button labelled ‹expected: Change [src: ticket:tickets/change-password.md#L8]›. |

---

### TC-CHPW-002 Successful change shows a confirmation
**Priority:** P1 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC6 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Open the change password page.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `Old-pass-1` as current password, `New-pass-2` as new password and `New-pass-2` as the repeat. | No error should be shown under any field. |
| 2 | Select the ‹expected: Change [src: ticket:tickets/change-password.md#L8]› button. | A confirmation message should be shown (text not given in the ticket, see Q6). |

---

### TC-CHPW-003 User stays signed in after a change
**Priority:** P1 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC6 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Open the change password page.

| # | Step | Expected |
|---|---|---|
| 1 | Change the password from `Old-pass-1` to `New-pass-2` with a matching repeat. | A confirmation message should be shown. |
| 2 | Open another page of the app, then reload it. | The user should still be signed in. No login page should be shown. |

---

### TC-CHPW-004 New password works at the next login and the old one is refused
**Priority:** P1 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC6 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Change the password to `New-pass-2`, then sign out.

| # | Step | Expected |
|---|---|---|
| 1 | Sign in with the email and `Old-pass-1`. | The sign-in should be refused with an error message. |
| 2 | Sign in with the email and `New-pass-2`. | The sign-in should succeed. |

---

### TC-CHPW-005 Empty Current Password shows an error
**Priority:** P2 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC2 + similar:login-and-registration#M5 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Open the change password page.

| # | Step | Expected |
|---|---|---|
| 1 | Select the Current Password field, then leave it without typing. | An error should be shown under the Current Password field: ‹expected: Please provide a password. [src: similar:login-and-registration#M5]›. |
| 2 | Fill New Password and Repeat New Password with `New-pass-2`, then select ‹expected: Change [src: ticket:tickets/change-password.md#L8]› if it is enabled. | The password should not be changed, and the error under Current Password should remain. |

---

### TC-CHPW-006 Empty New Password shows an error
**Priority:** P2 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC2 + similar:login-and-registration#M5 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Open the change password page.

| # | Step | Expected |
|---|---|---|
| 1 | Select the New Password field, then leave it without typing. | An error should be shown under the New Password field: ‹expected: Please provide a password. [src: similar:login-and-registration#M5]›. |

---

### TC-CHPW-007 Empty Repeat New Password shows an error
**Priority:** P2 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC2 + similar:login-and-registration#M6 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Open the change password page.

| # | Step | Expected |
|---|---|---|
| 1 | Select the Repeat New Password field, then leave it without typing. | An error should be shown under the Repeat New Password field: ‹expected: Please repeat your password. [src: similar:login-and-registration#M6]›. |

---

### TC-CHPW-008 New Password of 4 characters is refused
**Priority:** P1 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC3 + similar:login-and-registration#M10 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Open the change password page.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `Old-pass-1` as current password and `Ab1!` as new password and repeat. | An error should be shown under the New Password field: ‹expected: Password must be 5-40 characters long. [src: similar:login-and-registration#M10]›. |
| 2 | Select ‹expected: Change [src: ticket:tickets/change-password.md#L8]› if it is enabled. | The password should not be changed. Signing in later with `Old-pass-1` should still work. |

---

### TC-CHPW-009 New Password of 5 characters is accepted
**Priority:** P2 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC3 + similar:login-and-registration#R6 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Open the change password page.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `Old-pass-1` as current password and `Ab1!x` as new password and repeat. | No length error should be shown under the New Password field. |
| 2 | Select ‹expected: Change [src: ticket:tickets/change-password.md#L8]›. | A confirmation message should be shown. |

---

### TC-CHPW-010 New Password of 40 characters is accepted
**Priority:** P3 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC3 + similar:login-and-registration#R6 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Open the change password page.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `Old-pass-1` as current password and `Ab1!` followed by 36 times `x` (40 characters in all) as new password and repeat. | No length error should be shown under the New Password field. |
| 2 | Select ‹expected: Change [src: ticket:tickets/change-password.md#L8]›. | A confirmation message should be shown. |

---

### TC-CHPW-011 Different New and Repeat passwords are refused
**Priority:** P1 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC4 + similar:login-and-registration#M11 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Open the change password page.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `Old-pass-1` as current password, `New-pass-2` as new password and `New-pass-3` as the repeat, then leave the repeat field. | The user should be told the passwords do not match: ‹expected: Passwords do not match [src: similar:login-and-registration#M11]›. |
| 2 | Select ‹expected: Change [src: ticket:tickets/change-password.md#L8]› if it is enabled. | The password should not be changed. Signing in later with `Old-pass-1` should still work. |

---

### TC-CHPW-012 Wrong Current Password is refused
**Priority:** P1 · **Area:** CHPW · **Source:** ticket:tickets/change-password.md#AC5 + atlas none yet
**Preconditions:** Register `reconqa-<random>@example.test` with password `Old-pass-1`, then sign in with it. Open the change password page.

| # | Step | Expected |
|---|---|---|
| 1 | Enter `Wrong-pass-9` as current password and `New-pass-2` as new password and repeat. | The form should accept the input without a length or mismatch error. |
| 2 | Select ‹expected: Change [src: ticket:tickets/change-password.md#L8]›. | A message should be shown that the current password is wrong (text not given in the ticket, see Q5). The password should not be changed. |
| 3 | Sign out and sign in with `Old-pass-1`. | The sign-in should succeed. |
