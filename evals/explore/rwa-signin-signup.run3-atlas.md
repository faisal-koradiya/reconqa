# Sign in and sign up, incl. first-time onboarding (atlas)
App version: not shown in the UI · Explored: 2026-11-26 · Environment: local (http://localhost:3100) · Source: live app

## Screens

### Sign in — /signin
How to reach: open the app URL; `/` redirects to `/signin` when logged out. Also reached after logout, and after a successful sign-up.
Page title: "Cypress Real World App". Footer text "Built by" with a link to https://cypress.io (external, not followed).

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Username | text | yes | empty on blur shows M1 | none seen (floating label "Username") |
| Password | password-style text | yes | fewer than 4 characters shows M2 | none seen (floating label "Password") |
| Remember me | checkbox | no | unchecked by default | – |

Buttons and links:
- "Sign In": disabled while a field is invalid or a required field has not been filled/blurred (observed disabled after the Username error and after the Password error). Enabled with valid username and a 4-character password. Submits.
- "Don't have an account? Sign Up": goes to /signup.

### Sign up — /signup
How to reach: click "Don't have an account? Sign Up" on /signin.

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| First Name | text | yes (marked *) | empty on blur shows M4 | floating label "First Name *" |
| Last Name | text | yes (marked *) | empty on blur shows M5 | floating label "Last Name *" |
| Username | text | yes (marked *) | empty on blur shows M1 | floating label "Username *" |
| Password | password-style text | yes (marked *) | empty on blur shows M6; fewer than 4 chars shows M2 | floating label "Password *" |
| Confirm Password | password-style text | yes (marked *) | empty on blur shows M7; different from Password shows M8 | floating label "Confirm Password *" |

Buttons and links:
- "Sign Up": disabled while any field is invalid/untouched-invalid. On success goes to /signin (no success message seen).
- "Have an account? Sign In": goes to /signin.

### Onboarding dialog step 1 — / (modal over the home feed)
How to reach: first sign-in of a newly created account; the modal opens automatically on `/`.
Title "Get Started with Real World App". Body: "Real World App requires a Bank Account to perform transactions.Click Next to begin setup of your Bank Account." (no space after the period, as shown).
Buttons: "Logout" (returns to /signin), "Next" (goes to step 2).

### Onboarding dialog step 2 — Create Bank Account
How to reach: click "Next" in step 1.

| Field | Type | Required | Rules / limits | Hint / placeholder |
|---|---|---|---|---|
| Bank Name | text | yes | empty on blur: M9; 4 chars: M12; 12 chars ("reconqa-Bank") accepted | label/placeholder "Bank Name" |
| Routing Number | text | yes | empty on blur: M10; 8 digits: M13; 9 digits accepted | "Routing Number" |
| Account Number | text | yes | empty on blur: M11; 8 digits: M14; 9 digits accepted | "Account Number" |

Buttons: "Save" (disabled until all three are valid; enabled with valid values; goes to step 3), "Logout".

### Onboarding dialog step 3 — Finished
How to reach: click "Save" with valid bank details.
Text: "Finished", "You're all set!", "We're excited to have you aboard the Real World App!". Buttons: "Logout", "Done". "Done" closes the dialog; user stays on `/` (home feed with tabs Everyone / Friends / Mine, sidenav Home, My Account, Bank Accounts, Notifications, Logout).

## Messages
| # | Exact text | Screen | Where shown | Trigger |
|---|---|---|---|---|
| M1 | Username is required | Sign in | under Username field | focus then leave field empty (blur) |
| M1 | Username is required | Sign up | under Username field | leave field empty (blur) |
| M2 | Password must contain at least 4 characters | Sign in | under Password field | enter "abc", shown while typing/blur |
| M2 | Password must contain at least 4 characters | Sign up | under Password field | enter "abc" |
| M3 | Username or password is invalid | Sign in | alert banner above the heading | submit unknown username with a 4-character password |
| M4 | First Name is required | Sign up | under First Name | blur empty |
| M5 | Last Name is required | Sign up | under Last Name | blur empty |
| M6 | Enter your password | Sign up | under Password | blur empty |
| M7 | Confirm your password | Sign up | under Confirm Password | blur empty |
| M8 | Password does not match | Sign up | under Confirm Password | Password "abc" vs Confirm "abcd", on blur |
| M9 | Enter a bank name | Onboarding step 2 | under Bank Name | blur empty |
| M10 | Enter a valid bank routing number | Onboarding step 2 | under Routing Number | blur empty |
| M11 | Enter a valid bank account number | Onboarding step 2 | under Account Number | blur empty |
| M12 | Must contain at least 5 characters | Onboarding step 2 | under Bank Name | enter 4 characters |
| M13 | Must contain a valid routing number | Onboarding step 2 | under Routing Number | enter 8 digits |
| M14 | Must contain at least 9 digits | Onboarding step 2 | under Account Number | enter 8 digits |

## Rules
- R1 Required-field errors appear on blur, not before interaction (observed).
- R2 Password minimum length is 4 characters on both Sign in and Sign up (observed with 3 chars rejected; 4 chars accepted on sign-in).
- R3 Confirm Password must equal Password on Sign up (observed).
- R4 Sign In and Sign Up buttons stay disabled while the form is invalid (observed).
- R5 A failed sign-in shows M3 and clears both fields (observed); the message does not say which of the two was wrong (observed).
- R6 Successful sign-up redirects to /signin; it does not log the user in (observed).
- R7 First sign-in of a new account shows the 3-step onboarding modal: welcome, bank account, finished (observed).
- R8 Bank Name needs at least 5 characters; Routing Number needs 9 digits; Account Number needs at least 9 digits (observed at the tested boundaries only; routing "valid" rule inferred to be exactly 9 digits).
- R9 Sign-up with an already existing username was not rejected: it showed no error and redirected to /signin (observed once; whether the second account overwrote or coexists is unknown).
- R10 "Done" closes the onboarding modal and leaves the user on `/` (observed).

## Open questions
- Duplicate username on sign-up: confirm actual behaviour (R9) and whether the second sign-in works with either password.
- Upper length limits (names, username, password, bank fields) and non-digit input for routing/account numbers not probed.
- Whether the Password field is masked (`type=password`) was not checked.
- Whether "Remember me" persists the session was not checked.
- Whether a Sign In with only Username filled enables the button; blur of Password alone on Sign in did not show a message.
- Whether onboarding resumes at the same step after Logout mid-flow.
- Whether leaving the page mid-onboarding re-shows the modal on next sign-in.
- Console showed errors/warnings on load (counts only; content not reviewed).
- No evidence screenshots were taken in this run.
- App version not displayed anywhere seen.

## Notes
