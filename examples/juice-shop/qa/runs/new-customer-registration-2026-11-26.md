# Test run: New customers can create an account

**Cases:** qa/cases/new-customer-registration.md · **Atlas:** qa/atlas/login-and-registration.md · **Environment:** local (http://localhost:3000) · **Version:** not shown by the app · **Date:** 2026-11-26
**Result:** 13 passed · 1 failed · 0 blocked · 0 not run

| Case | Result | Failed or blocked step | Note |
|---|---|---|---|
| TC-REG-001 | passed | | |
| TC-REG-002 | passed | | |
| TC-REG-003 | passed | | |
| TC-REG-004 | passed | | |
| TC-REG-005 | passed | | |
| TC-REG-006 | passed | | |
| TC-REG-007 | passed | | |
| TC-REG-008 | passed | | |
| TC-REG-009 | passed | | App accepts a 7-character password, which differs from the ticket (see mismatch 1). |
| TC-REG-010 | passed | | Counter reads «40/20» (see mismatch 6, likely defect). |
| TC-REG-011 | passed | | |
| TC-REG-012 | failed | 3 | Strength bar stays visible after the switch is turned off; the checklist disappears. |
| TC-REG-013 | passed | | App shows «Email must be unique» (see mismatch 2). |
| TC-REG-014 | passed | | |

## Test data used
- reconqa-8b422fd7@example.test: registered in TC-REG-002 (account created), reused in TC-REG-013 as the duplicate. Password as in the case. Security answer as in the case.
- reconqa-5b1e6487@example.test: registered in TC-REG-003 (account created). Password as in the case.
- reconqa-1883f2a1@example.test: typed into forms in TC-REG-006, TC-REG-007 and TC-REG-009, never submitted (no account created).
- Setup note: the browser started with a saved session for a different test account, so it was logged out before TC-REG-001 (precondition).

## TC-REG-001 Open the registration page from the login page
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | The Account menu offered «Login». Choosing it opened the login page (#/login). |
| 2 | pass | Clicking «Not yet a customer?» opened #/register with the heading «User Registration» and the fields «Email», «Password», «Repeat Password», «Security Question» and «Answer». |

---

## TC-REG-002 Register with valid data
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | Email reconqa-8b422fd7@example.test and the password entered in all three fields, then left the field. No error text was shown under the three fields. Only the permanent hint «Password must be 5-40 characters long.» was visible, with counter 12/20. |
| 2 | pass | «Name of your favorite pet?» chosen and «Rex» entered. The «Register» button was enabled. |
| 3 | pass | The login page opened (#/login). A toast «Registration completed successfully. You can now log in.» was shown. |

---

## TC-REG-003 After registration the user is not logged in automatically
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | Registered reconqa-5b1e6487@example.test. The login page opened (#/login), not the product list. |
| 2 | pass | The Account menu offered «Login» (menu item "Go to login page") and no user entry, so the user is logged out. |

---

## TC-REG-004 Required text fields show an error when left empty
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | «Please provide an email address.» was shown under «Email». |
| 2 | pass | «Please provide a password.» was shown under «Password». |
| 3 | pass | «Please repeat your password.» was shown under «Repeat Password». |
| 4 | pass | «Please provide an answer to your security question.» was shown under «Answer». |

---

## TC-REG-005 Security question is required
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | Opened the dropdown, closed it with Escape without choosing, clicked outside. «Please select a security question.» was shown under the dropdown. |

---

## TC-REG-006 Register button is disabled until the form is valid
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | The «Register» button was disabled. |
| 2 | pass | With every field except «Answer» filled, the button was still disabled. |
| 3 | pass | After entering «Rex» in «Answer» the button was enabled. |

---

## TC-REG-007 Invalid email format is rejected
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | «reconqa-bad-email» in «Email», then leaving the field: «Email address is not valid.» was shown under the field. |
| 2 | pass | Replaced with reconqa-1883f2a1@example.test and left the field. The error disappeared. |

---

## TC-REG-008 Password one character below the minimum
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | «Ab1!» (4 characters), then leaving the field: «Password must be 5-40 characters long.» was shown under the field as an error (field marked invalid). |
| 2 | pass | «Ab1!x» (5 characters): the field was no longer invalid and only the normal hint remained. |

---

## TC-REG-009 Password of 7 characters is accepted by the app
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | «Ab1!xyz» in «Password» and «Repeat Password» with valid email, question and answer. No error under «Password». |
| 2 | pass | The «Register» button was enabled. The form was not submitted. |

---

## TC-REG-010 Password at the maximum length
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | A 40-character password (checked: length 40) gave no error under «Password». |
| 2 | pass | Cleared the field and typed 41 letters «a» key by key. The field held 40 characters (maxlength 40). The counter read «40/20», as the atlas notes (mismatch 6). |

---

## TC-REG-011 Repeated password must match
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | «Reconqa#2026» and «Reconqa#2027», then leaving «Repeat Password»: «Passwords do not match» was shown under «Repeat Password». |
| 2 | pass | After fixing «Repeat Password» the error disappeared; only the counter «12/40» remained. |

---

## TC-REG-012 Password advice can be shown
**Result:** failed

| # | Result | Actual |
|---|---|---|
| 1 | pass | Turning on «Show password advice» showed a strength bar and a checklist. |
| 2 | pass | The checklist listed «contains at least one lower character», «contains at least one upper character», «contains at least one digit», «contains at least one special character» and «contains at least 8 characters». |
| 3 | fail | After turning the switch off the checklist disappeared, but the strength bar stayed visible (a progress bar about 394 by 4 px under the switch, visible in the screenshot). It was still there after a second read of the page. Expected: both disappear. The bar is also present with the switch never turned on once a password has been typed (seen in TC-REG-008). |

**Evidence:** qa/runs/shots/new-customer-registration-2026-11-26/TC-REG-012-step3.png
**Next:** /reconqa:draft-bug TC-REG-012 step 3

---

## TC-REG-013 Duplicate email is rejected
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | reconqa-8b422fd7@example.test and valid data in the other fields. The «Register» button was enabled. |
| 2 | pass | After clicking «Register» an alert banner «Email must be unique» was shown under the «User Registration» heading. |
| 3 | pass | The page stayed on #/register. The text "This email is already registered." was not shown. |

---

## TC-REG-014 Security question warning and options
**Result:** passed

| # | Result | Actual |
|---|---|---|
| 1 | pass | The hint «This cannot be changed later!» was shown under «Security Question». |
| 2 | pass | The dropdown had 14 options. The first was «Your eldest siblings middle name?» and the last «What's your favorite place to go hiking?». |

---
*Run with ReconQA: an AI ran these steps in the browser. Check each failure before reporting it.*
