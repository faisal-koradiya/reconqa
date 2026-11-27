# Golden list: Cypress Real World App, Sign in and Sign up (local auth mode)

Built from source only (rwa commit 0729f68). Paths are relative to the app repo. Items marked UNCONFIRMED could not be settled by reading code.

## 1. Screens, states and routes

| ID | Item | How to reach | Source |
|---|---|---|---|
| G1 | Sign in screen, page heading "Sign in" | Route `/signin`; also where any unknown path redirects when logged out | src/containers/App.tsx:66-76, SignInForm.tsx:95-97 |
| G2 | Sign up screen, page heading "Sign Up" | Route `/signup`, or the link "Don't have an account? Sign Up" on Sign in | App.tsx:63-65, SignUpForm.tsx:265-267 |
| G3 | Logged-out visitor to any other path (for example `/`, `/foo`) is redirected to `/signin` | Open any path other than `/signin` or `/signup` while logged out | App.tsx:69-75 |
| G4 | Sign in screen in error state: red alert box above the logo showing the last auth error | Submit invalid credentials | SignInForm.tsx:87-91 |
| G5 | Both screens show the app logo and a footer containing "Built by" followed by a Cypress logo link to `https://cypress.io` (opens new tab) | Visible on both screens | Footer.tsx:9-26, SignInForm.tsx:93,177-179, SignUpForm.tsx:263,385-387 |
| G6 | Logged-in user lands on the home route `/` after sign-in (private routes render only when authorized) | Successful sign-in | authMachine.ts:159-162, App.tsx:43-57 |
| G7 | After successful sign-up the app navigates to `/signin` (no auto login) | Successful sign-up | authMachine.ts:150-155 |
| G8 | Browser tab title is "Cypress Real World App" | Any screen | index.html:24 |
| G9 | Sign in screen has the Username field focused on load | Open `/signin` | SignInForm.tsx:118 |
| G10 | Sign up screen has the First Name field focused on load | Open `/signup` | SignUpForm.tsx:289 |

## 2. Fields per screen

### Sign in

| ID | Field | Details | Source |
|---|---|---|---|
| G11 | "Username" | text input, id `username`, no required asterisk, validated as required; error shown once touched or edited | SignInForm.tsx:109-125 |
| G12 | "Password" | password-masked input, id `password`, no required asterisk, min length 4, required | SignInForm.tsx:126-141, 28-30 |
| G13 | "Remember me" | checkbox, unchecked by default; when set the server session lasts 30 days, otherwise session cookie | SignInForm.tsx:142-151, backend/auth.ts:40-44 |
| G14 | "Sign In" | submit button (note capital I), full width | SignInForm.tsx:152-162 |
| G15 | "Don't have an account? Sign Up" | link to `/signup` | SignInForm.tsx:168-170 |
| G16 | No "Forgot password" link is rendered (the markup is commented out) | Absence check | SignInForm.tsx:165 |

### Sign up

| ID | Field | Details | Source |
|---|---|---|---|
| G17 | "First Name" | text, required asterisk shown (label renders as "First Name *"), id `firstName` | SignUpForm.tsx:279-296 |
| G18 | "Last Name" | text, required asterisk, id `lastName` | SignUpForm.tsx:297-313 |
| G19 | "Username" | text, required asterisk, id `username` | SignUpForm.tsx:314-330 |
| G20 | "Password" | password-masked, required asterisk, min length 4 | SignUpForm.tsx:331-347, 234-236 |
| G21 | "Confirm Password" | password-masked, required asterisk, must equal Password | SignUpForm.tsx:348-364, 237-239 |
| G22 | "Sign Up" | submit button, full width | SignUpForm.tsx:365-375 |
| G23 | "Have an account? Sign In" | link to `/signin` | SignUpForm.tsx:378 |
| G24 | No email, phone or other fields exist on Sign up; only the five above | Absence check | SignUpForm.tsx:248-254 |

## 3. Exact user-visible messages

| ID | Message | When | Source |
|---|---|---|---|
| G25 | "Username is required" | Sign in, Username empty after touch or edit | SignInForm.tsx:27 |
| G26 | "Password must contain at least 4 characters" | Sign in or Sign up, Password has 1 to 3 characters | SignInForm.tsx:29, SignUpForm.tsx:235 |
| G27 | "Enter your password" | Sign in or Sign up, Password empty (Sign up shows it after touch; Sign in only after the field was touched and then changed, see G42) | SignInForm.tsx:30, SignUpForm.tsx:236 |
| G28 | "First Name is required" | Sign up, First Name empty after touch or edit | SignUpForm.tsx:231 |
| G29 | "Last Name is required" | Sign up, Last Name empty after touch or edit | SignUpForm.tsx:232 |
| G30 | "Username is required" | Sign up, Username empty after touch or edit | SignUpForm.tsx:233 |
| G31 | "Confirm your password" | Sign up, Confirm Password empty | SignUpForm.tsx:238 |
| G32 | "Password does not match" | Sign up, Confirm Password differs from Password | SignUpForm.tsx:239 |
| G33 | "Username or password is invalid" | Red alert on Sign in after a failed login (any failure; wrong username and wrong password look identical) | authMachine.ts:163-165, SignInForm.tsx:87-91 |
| G34 | Server text "Incorrect username or password." exists in the login strategy but the UI replaces every login failure with G33, so it is not shown | Absence check (it can appear only in a raw API response) | backend/auth.ts:15, authMachine.ts:164 |
| G35 | No success banner or toast on sign-up; the only feedback is the move to `/signin` | After Sign up submit | authMachine.ts:63,153 |
| G36 | Absence check. Duplicate username on Sign up: the backend has no uniqueness check, so no "username taken" error exists and the new account is created | Sign up with an existing username (for example a seeded user) | backend/user-routes.ts:41-48, backend/database.ts:178-198 |
| G37 | Sign up server failure would put the HTTP client error text (not authored by the app) into context.message, but the Sign up screen never renders that message | Absence check | authMachine.ts:63-64,257-259, SignUpForm.tsx:247 (state unused) |

## 4. Business rules

| ID | Rule | Source |
|---|---|---|
| G38 | Submit buttons ("Sign In", "Sign Up") are disabled while the form is invalid or submitting | SignInForm.tsx:159, SignUpForm.tsx:372 |
| G39 | Sign in minimum password length is 4; Sign up minimum password length is 4; no maximum, no complexity rule | SignInForm.tsx:29, SignUpForm.tsx:235 |
| G40 | Sign up requires Confirm Password to equal Password exactly | SignUpForm.tsx:239 |
| G41 | No format rule on Username, First Name or Last Name beyond non-empty; the field is not trimmed in the client schema (a single space counts as a value) UNCONFIRMED (depends on yup string required treating whitespace) | SignUpForm.tsx:231-233 |
| G42 | Sign in Username error appears when the field is touched or its value changed; the Password error appears only when touched AND value differs from empty, so focusing and leaving an empty Password shows no helper text on Sign in | SignInForm.tsx:120-121, 136-137 |
| G43 | Sign up shows errors on every field once touched or changed (including Password and Confirm Password when left empty after blur) | SignUpForm.tsx:342-343, 359-360 |
| G44 | Whether the Sign in button starts disabled on an untouched empty form: UNCONFIRMED (isValid with empty initial values and validateOnMount unset depends on Formik defaults at runtime) | SignInForm.tsx:107,159 |
| G45 | Which text an empty Password shows when it fails both min and required ("Password must contain at least 4 characters" or "Enter your password"): UNCONFIRMED (depends on yup test order) | SignUpForm.tsx:234-236 |
| G46 | Sign in and Sign up are only reachable while logged out; a logged-in session renders the private app instead | App.tsx:52-61 |
| G47 | Server stores the password hashed; login compares hash; successful login returns the user object | backend/auth.ts:21,46, database.ts:179 |
| G48 | Sign up request is rejected by the server (HTTP 422) only if a present field has a wrong type, or HTTP failure if none of firstName/lastName/password/balance/avatar/defaultPrivacyLevel is sent; not reachable from the normal form | backend/validators.ts:24-31, 39-51, helpers.ts:124 |
| G49 | New users created via Sign up start with balance 0 and have no email or phone | backend/database.ts:187-189 |

## 5. Onboarding dialog for a brand-new user (shown on the home screen after first sign-in, when the user has no bank accounts)

| ID | Item | Source |
|---|---|---|
| G50 | A modal dialog opens over the home page when the user has zero bank accounts; it cannot be dismissed by the page, only by completing steps or using "Logout" | UserOnboardingContainer.tsx:55-63,73 |
| G51 | Step 1 title "Get Started with Real World App" | UserOnboardingContainer.tsx:75 |
| G52 | Step 1 body "Real World App requires a Bank Account to perform transactions." then "Click Next to begin setup of your Bank Account." (Next is bold) | UserOnboardingContainer.tsx:86-89 |
| G53 | Step 1 buttons: "Logout" (left) and "Next" (right) | UserOnboardingContainer.tsx:123,129 |
| G54 | Step 2 title "Create Bank Account" | UserOnboardingContainer.tsx:76 |
| G55 | Step 2 shows a bank form with three inputs identified by placeholders "Bank Name", "Routing Number", "Account Number" (all required) and a "Save" button; no "Next" button on this step, "Logout" remains | BankAccountForm.tsx:91,108,125,150, UserOnboardingContainer.tsx:127 |
| G56 | Step 2 validation: "Must contain at least 5 characters" (Bank Name under 5 chars) | BankAccountForm.tsx:10 |
| G57 | Step 2 validation: "Enter a bank name" (Bank Name empty) | BankAccountForm.tsx:10 |
| G58 | Step 2 validation: "Must contain a valid routing number" (Routing Number not exactly 9 chars) and "Enter a valid bank routing number" (empty) | BankAccountForm.tsx:11-13 |
| G59 | Step 2 validation: "Must contain at least 9 digits", "Must contain no more than 12 digits", "Enter a valid bank account number" (Account Number short, long, empty) | BankAccountForm.tsx:14-17 |
| G60 | Step 3 title "Finished" | UserOnboardingContainer.tsx:77 |
| G61 | Step 3 body "You're all set!" then "We're excited to have you aboard the Real World App!" | UserOnboardingContainer.tsx:105-108 |
| G62 | Step 3 buttons: "Logout" and "Done" (the Next button is relabelled "Done"); Done closes the dialog | UserOnboardingContainer.tsx:129 |
| G63 | Flow order is step 1, step 2, step 3, done; saving the bank account moves to step 3 immediately | userOnboardingMachine.ts:30-49, UserOnboardingContainer.tsx:67-70 |
| G64 | Whether step 3 is visible if the bank account save fails server-side: UNCONFIRMED (step advances before the save result) | UserOnboardingContainer.tsx:67-70 |
