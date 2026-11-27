# Test Cases: First-time users add a bank account during onboarding

App: Cypress Real World App. Source: ticket.md (AC 1–10).

**Notes**
- Exact validation error texts are not in the ticket. Where the text is not specified, steps say "an inline error appears" and the tester records the actual text. Candidates in the real app: **Enter a bank name**, **Enter a routing number**, **Enter an account number**. Confirm against the spec.
- The ticket rules differ from what the stock app is known to do, so check them closely. Examples: the stock app may require a bank name of 5 characters rather than 3, and may use a different routing-number or account-number rule. Treat the ticket as the source of truth and log any mismatch as a defect.
- Preconditions common to all cases unless stated: the app is running, and a brand-new user was created via **Sign Up** and then signed in for the first time (user "NEWUSER").

---

## TC-01 Onboarding dialog opens on first sign-in (AC1)
| Step | Expected |
|---|---|
| 1. Open the app and click **Don't have an account? Sign Up** | The **Sign Up** form is shown |
| 2. Complete **First Name**, **Last Name**, **Username**, **Password**, **Confirm Password** and click **Sign Up** | The user is redirected to the sign-in page |
| 3. Sign in with the new credentials and click **Sign In** | The onboarding dialog opens immediately over the app |
| 4. Click outside the dialog and press Esc | The dialog cannot be dismissed this way, and the app behind it is not usable (AC1) |
| 5. Try to click the side navigation items behind the dialog | Nothing behind the dialog responds |

## TC-02 Dialog does not reappear for a returning user (AC1)
| Step | Expected |
|---|---|
| 1. Complete the onboarding (TC-05) or skip it (TC-10), then sign out | The **Sign In** page is shown |
| 2. Sign in again with the same user | The onboarding dialog does not open. The user lands on the transactions feed |
| 3. Sign in as a seeded existing user with a bank account | No onboarding dialog |

## TC-03 Step 1 content and navigation (AC2)
| Step | Expected |
|---|---|
| 1. Sign in as a new user | Step 1 of the dialog is displayed |
| 2. Read the text | It explains why a bank account is needed, namely to send and receive payments |
| 3. Check the controls | A **Next** button is visible and enabled |
| 4. Click **Next** | Step 2 is displayed |

## TC-04 Step 2 fields and required validation (AC3)
| Step | Expected |
|---|---|
| 1. Reach Step 2 | Fields **Bank Name**, **Routing Number**, **Account Number** are shown, along with a **Save** button and a **Skip for now** link |
| 2. Observe **Save** | **Save** is disabled |
| 3. Click into **Bank Name**, then click out without typing | A required-field error is shown for **Bank Name** |
| 4. Repeat for **Routing Number** | A required-field error is shown |
| 5. Repeat for **Account Number** | A required-field error is shown |
| 6. Leave one field empty and fill the other two with valid values | **Save** stays disabled |

## TC-05 Happy path: save a bank account (AC7, AC9, AC10)
| Step | Expected |
|---|---|
| 1. On Step 2, enter **Bank Name** `Chase Bank`, **Routing Number** `123456789`, **Account Number** `1234567890` | No errors are shown. **Save** becomes enabled |
| 2. Click **Save** | A confirmation step is shown with the text **Your bank account has been added.** |
| 3. Close the dialog (confirmation-step close/done button) | The dialog closes. The user is taken to the transactions feed |
| 4. Open **Bank Accounts** from the side navigation | **Chase Bank** is listed, and the account number is shown masked or in the app's normal format |

## TC-06 Bank Name length boundaries (AC4, AC7)
Use a valid Routing Number `123456789` and Account Number `1234567890`.

| Step | Expected |
|---|---|
| 1. Bank Name = `ab` (2 characters) | An inline error is shown. **Save** is disabled |
| 2. Bank Name = `abc` (3 characters) | No error. **Save** is enabled |
| 3. Bank Name = `abcd` (4 characters) | No error. **Save** is enabled |
| 4. Bank Name = a 3-character name with spaces only (`   `) | Treated as invalid. **Save** is disabled |
| 5. Clear the field | The required error is shown. **Save** is disabled |
| 6. Bank Name = 100+ characters, or special characters such as `Bänk & Co.` | The behavior is consistent. Record whether it is accepted, as the ticket has no maximum |

## TC-07 Routing Number: exactly 9 digits (AC5, AC7)
Use a valid Bank Name `Chase Bank` and Account Number `1234567890`.

| Step | Expected |
|---|---|
| 1. Routing Number = `12345678` (8 digits) | An inline error is shown. **Save** is disabled |
| 2. Routing Number = `123456789` (9 digits) | No error. **Save** is enabled |
| 3. Routing Number = `1234567890` (10 digits) | An inline error is shown. **Save** is disabled |
| 4. Routing Number = `12345678a` | The input is rejected or an error is shown. **Save** is disabled |
| 5. Routing Number = `123-45-678` or `123 456 789` | An error is shown. **Save** is disabled |
| 6. Routing Number = `000000000` | Record behavior. The ticket only requires 9 digits, so it is expected to be valid |

## TC-08 Account Number: 10 to 12 digits (AC6, AC7)
Use a valid Bank Name `Chase Bank` and Routing Number `123456789`.

| Step | Expected |
|---|---|
| 1. Account Number = `123456789` (9 digits) | An inline error is shown. **Save** is disabled |
| 2. Account Number = `1234567890` (10 digits) | No error. **Save** is enabled |
| 3. Account Number = `12345678901` (11 digits) | No error. **Save** is enabled |
| 4. Account Number = `123456789012` (12 digits) | No error. **Save** is enabled |
| 5. Account Number = `1234567890123` (13 digits) | An inline error is shown. **Save** is disabled |
| 6. Account Number = `12345abcde67` | The input is rejected or an error is shown. **Save** is disabled |

## TC-09 Save button state follows validity (AC7)
| Step | Expected |
|---|---|
| 1. Reach Step 2 with all fields empty | **Save** is disabled |
| 2. Enter a valid Bank Name only | **Save** is disabled |
| 3. Add a valid Routing Number | **Save** is disabled |
| 4. Add a valid Account Number | **Save** is enabled |
| 5. Change Routing Number to an invalid value | **Save** becomes disabled again |
| 6. Fix it | **Save** is enabled again |
| 7. Click a disabled **Save** (before step 4, or at step 5) | Nothing happens. No bank account is created |

## TC-10 Skip for now (AC8)
| Step | Expected |
|---|---|
| 1. On Step 2, click **Skip for now** | The onboarding dialog closes. The user is taken to the transactions feed |
| 2. Open **Bank Accounts** | The list is empty. No bank account was created |
| 3. Click **Create** and add a valid account (**Bank Name**, **Routing Number**, **Account Number**) then **Save** | The account is added successfully later |
| 4. Sign out and sign in again | The onboarding dialog does not reappear |
| 5. Repeat with **Skip for now** after typing partial data in Step 2 | The dialog closes and the partial data is not saved |

## TC-11 Skip availability on Step 1 (AC2, AC8)
| Step | Expected |
|---|---|
| 1. Review Step 1 | Record whether **Skip for now** is present. The ticket places it in Step 2, so the absence of the link on Step 1 is not a defect |

## TC-12 Confirmation step content and close (AC9, AC10)
| Step | Expected |
|---|---|
| 1. Save a valid account | The confirmation step shows **Your bank account has been added.** The wording and punctuation match exactly |
| 2. Check the confirmation step | There is no way to go back and re-submit the form without closing the dialog, and no duplicate accounts are created |
| 3. Close the dialog | The user is on the transactions feed (URL is `/`). The feed shows the transaction tabs (**Everyone**, **Friends**, **Mine**) |
| 4. Reload the browser | The dialog does not reappear |

## TC-13 Interrupted onboarding (AC1)
| Step | Expected |
|---|---|
| 1. As a new user, reach Step 2 and enter valid data but do not save. Reload the page | Record behavior: the dialog reopens at Step 1 because onboarding was not completed, or it does not reopen. Compare with the ticket, since the user must not be left unable to use the app without a bank account option |
| 2. Sign out mid-dialog and sign in again | Same check as above. The user can reach the transactions feed after completing or skipping |
| 3. Press the browser Back button while the dialog is open | The dialog and app state remain consistent. No crash |

## TC-14 Server/network failure on Save
| Step | Expected |
|---|---|
| 1. On Step 2, enter valid data. Block the bank-account API request (offline mode or devtools) | |
| 2. Click **Save** | An error is displayed and the dialog stays on Step 2 with the entered data retained. The confirmation step is not shown |
| 3. Restore the network and click **Save** again | The account is saved and the confirmation step is shown. Only one account exists |
| 4. Double-click **Save** quickly with valid data | Only one bank account is created |

## TC-15 Keyboard and accessibility
| Step | Expected |
|---|---|
| 1. Open the dialog and press Tab repeatedly | Focus stays within the dialog and follows a logical order: **Next**; then **Bank Name**, **Routing Number**, **Account Number**, **Save**, **Skip for now** |
| 2. Activate **Next**, **Save** and **Skip for now** with Enter or Space | Each behaves as with a click |
| 3. Trigger a validation error | The error text is associated with its field and is readable by a screen reader |
| 4. Resize to a mobile viewport (375px wide) | The dialog is fully usable and no content is cut off |
