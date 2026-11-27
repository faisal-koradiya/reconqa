# Golden list: OWASP Juice Shop 20.4.0, Login and User Registration

Hand-labelled from source code only (no browser, no running app). Use it to score an
automated explorer's recall on these two screens. Each item has an ID (G1, G2, ...) so it can
be marked found / missed.

## How to read the sources

Paths are relative to the packaged release root `juice-shop_20.4.0-SNAPSHOT/`.

| Short name | Path |
|---|---|
| `en` | `frontend/dist/frontend/assets/i18n/en.json` (`key`, line number) |
| `main` | `frontend/dist/frontend/main.js`, the compiled Angular templates. It is minified onto a few lines, so items cite the component selector (`app-login`, `app-register`, `app-password-strength`, `app-password-strength-info`, navbar) and the template element instead of a line |
| `login.ts` | `frontend/src/app/login/login.component.ts` |
| `register.ts` | `frontend/src/app/register/register.component.ts` |
| `pws.ts` | `frontend/src/app/password-strength/password-strength.component.ts` |
| `pwsi.ts` | `frontend/src/app/password-strength-info/password-strength-info.component.ts` |
| `snack.ts` | `frontend/src/app/Services/snack-bar-helper.service.ts` |
| `routing` | `frontend/src/app/app.routing.ts` |
| `server` | `server.ts` |
| `routes/login.ts` | server-side login handler |
| `i18n-srv` | `i18n/en.json` (server-side message catalogue) |
| `sq.yml` | `data/static/securityQuestions.yml` |
| `cfg` | `config/default.yml` |

UI strings are in English (default language). Quoted strings are verbatim; everything else is
in my own words.

Scoring notes: an item counts as found if the explorer reports the same behaviour or string. For
messages, the exact text matters. Items marked UNCONFIRMED cannot be settled from source alone
and should be scored leniently or checked by hand.

---

## 1. Screens and states

| ID | Screen / state | How to reach it | Source |
|---|---|---|---|
| G1 | Login page, card title "Login" | Route `#/login`. From the top navbar: "Account" button, then menu item "Login". Also via the "Already a customer?" link on the registration page | `routing` line 163; `en` `TITLE_LOGIN` (6), `ACCOUNT` (219); `main` navbar (`navbarAccount` button, `navbarLoginButton` menu item with `routerLink /login`, text `TITLE_LOGIN`) |
| G2 | User Registration page, card title "User Registration" | Route `#/register`, or the "Not yet a customer?" link on the login page | `routing` line 175; `en` `TITLE_REGISTRATION` (24); `main` `app-register` h1 |
| G3 | Login page with an error banner above the form (`role="alert"`, red error style) after a failed login | Submit wrong credentials | `main` `app-login` (`p.error` rendered only when `error()` is set); `login.ts` 116-131 |
| G4 | Registration page with an error banner above the form (`role="alert"`) after a server-side rejection | Register with an email that already exists | `main` `app-register` (`p.error`, text `error()`); `register.ts` 114-123 |
| G5 | Successful login: user leaves the login page and lands on the product search/list (`/search`), or on the URL in the `redirectUrl` query parameter if one was given; the navbar now shows the user as logged in | Log in with valid credentials | `login.ts` 113, 166-169 |
| G6 | Successful registration: app navigates to the login page and shows a snackbar confirmation | Complete the registration form and submit | `register.ts` 112-113 |
| G7 | Registration page with the "Show password advice" toggle switched on: an extra card listing the five password criteria with a tick or error icon per row | Toggle "Show password advice" | `main` `app-register` (slide toggle `passwordInfoToggle`, `app-password-strength-info` rendered only when `checked`) |
| G8 | Users with two-factor auth enabled are sent to a separate 2FA entry page (`/2fa/enter`) after a correct email/password, instead of being logged in | Log in as a user that has 2FA set up | `login.ts` 117-120 |

## 2. Fields and controls per screen

### 2a. Login page

| ID | Element | Details | Source |
|---|---|---|---|
| G9 | Email field | Label "Email", no placeholder text, plain text input (no `type="email"`), id `email`, aria-label "Text field for the login email". Required. No email-format check on this screen | `main` `app-login` consts; `en` `LABEL_EMAIL` (9); `login.ts` 62 |
| G10 | Password field | Label "Password", masked by default, id `password`, aria-label "Text field for the login password". Required (min length 1). No max length or complexity check on login | `main` `app-login`; `en` `LABEL_PASSWORD` (10); `login.ts` 63-64 |
| G11 | Show/hide password toggle | Icon button inside the password field (eye icon `visibility` / `visibility_off`). Tooltip and aria-label switch between "Show password" and "Hide password"; clicking switches the input between masked and plain text | `main` `app-login` (button `password-toggle-button`); `en` `SHOW_PWD_TOOLTIP` (300), `HIDE_PWD_TOOLTIP` (301) |
| G12 | "Forgot your password?" link | Small link under the password field, goes to `/forgot-password` | `main` `app-login` (`routerLink /forgot-password`); `en` `FORGOT_PASSWORD` (157) |
| G13 | "Log in" button | Primary raised button with an `exit_to_app` icon, id `loginButton`, aria-label "Login". Disabled until both email and password contain something | `main` `app-login` (`disabled` bound to empty email or empty password); `en` `BTN_LOGIN` (17) |
| G14 | "Remember me" checkbox | id `rememberMe`, aria-label "Checkbox to stay logged in or not logged in". When ticked at login, the email is stored in the browser; on the next visit the box comes back ticked. The email field itself is NOT pre-filled by this code | `main` `app-login`; `en` `REMEMBER_ME` (21); `login.ts` 77, 105-109 |
| G15 | Divider with the word "or" | A horizontal line with the text "or" between the main form and the alternative login buttons | `main` `app-login` (`breakLine` / `textOnLine`); `en` `LABEL_OR` (207) |
| G16 | "Log in with Passkey" button | Outlined button with a key icon, id `loginButtonPasskey`, aria-label "Login with Passkey". Always rendered. Uses the email typed in the field if any | `main` `app-login`; `en` `BTN_PASSKEY_LOGIN` (19); `login.ts` 134-146 |
| G17 | "Log in with Google" button | Raised button with the Google logo, id `loginButtonGoogle`, aria-label "Login with Google". Rendered ONLY when the page's origin is in the configured list of authorized OAuth redirects. The default list includes `http://localhost:3000` and `http://127.0.0.1:3000`, so on a default local run it is shown; on an unlisted host/port it is hidden | `main` `app-login` (block rendered when `oauthUnavailable` is false); `login.ts` 80-94; `cfg` 66-78; `en` `BTN_GOOGLE_LOGIN` (18) |
| G18 | "Not yet a customer?" link | Small link at the bottom of the card, id `newCustomerLink`, goes to `/register` | `main` `app-login` (`routerLink /register`); `en` `NO_CUSTOMER` (22) |

### 2b. User Registration page

| ID | Element | Details | Source |
|---|---|---|---|
| G19 | Email field | Label "Email", text input (no `type="email"`), id `emailControl`, aria-label "Email address field". Required; must be a valid email format (Angular's built-in email validator) | `main` `app-register`; `en` `LABEL_EMAIL` (9); `register.ts` 61-62 |
| G20 | Password field | Label "Password", masked, id `passwordControl`, aria-label "Field for the password". Required, 5 to 40 characters. No show/hide toggle on this screen | `main` `app-register`; `en` `LABEL_PASSWORD` (10); `register.ts` 63-65 |
| G21 | Password hint (left) | Always-visible hint under the password field: an exclamation-circle icon and italic text "Password must be 5-40 characters long." | `main` `app-register` (first `mat-hint` with `fa-exclamation-circle` and `INVALID_PASSWORD_LENGTH` with `length: 5-40`); `en` `INVALID_PASSWORD_LENGTH` (28) |
| G22 | Password character counter (right) | Right-aligned counter N/20, shown as e.g. "/20" showing the typed length. Note the denominator is 20 even though the allowed maximum is 40 (counter and rule disagree, a likely real defect) | `main` `app-register` (second `mat-hint align=end`, text `length + "/20"`); `register.ts` 65 |
| G23 | Repeat Password field | Label "Repeat Password", masked, id `repeatPasswordControl`, aria-label "Field to confirm the password". Required; must equal the password | `main` `app-register`; `en` `LABEL_PASSWORD_REPEAT` (29); `register.ts` 66-72 |
| G24 | Repeat Password character counter | Right-aligned counter N/40, shown as e.g. "/40" | `main` `app-register` (`mat-hint align=end`, text `length + "/40"`) |
| G25 | "Show password advice" slide toggle | Off by default. When on, shows the password criteria card (see G48-G53) | `main` `app-register` (`mat-slide-toggle`); `en` `SHOW_PASSWORD_ADVICE` (11) |
| G26 | Password strength bar | A progress bar under the toggle; hidden while the password is empty; fills and changes colour as the password meets more criteria (see G54-G55) | `main` `app-password-strength` (`mat-progress-bar`, `hidden` when length is 0); `pws.ts` |
| G27 | Security Question dropdown | Label "Security Question", select list, id `securityQuestionControl`, aria-label "Selection list for the security question". Options come from the server (see section 5). Required; nothing selected by default | `main` `app-register` (`mat-select`, options from `securityQuestions()`); `en` `LABEL_SECURITY_QUESTION` (153); `register.ts` 73-79, 87-94 |
| G28 | Security Question hint | Always-visible hint with exclamation-circle icon: "This cannot be changed later!" | `main` `app-register`; `en` `CANNOT_BE_CHANGED_LATER` (154) |
| G29 | Answer field | Label "Answer", placeholder "Answer to your security question", text input, id `securityAnswerControl`, aria-label "Field for the answer to the security question". Required; no length limit in the client | `main` `app-register`; `en` `SECURITY_ANSWER` (26), `SECURITY_ANSWER_PLACEHOLDER` (184); `register.ts` 80 |
| G30 | "Register" button | Primary raised button with a `person_add` icon, id `registerButton`, aria-label "Button to complete the registration". Disabled while any field is invalid | `main` `app-register` (`disabled` bound to `registerForm().invalid()`); `en` `BTN_REGISTER` (31) |
| G31 | "Already a customer?" link | Link at the bottom, id `alreadyACustomerLink`, goes to `/login` | `main` `app-register` (`routerLink /login`); `en` `ALREADY_A_CUSTOMER` (23) |

## 3. Exact user-visible messages

### 3a. Login page

| ID | Trigger | Exact text | Where shown | Source |
|---|---|---|---|---|
| G32 | Email field left empty (after touching it) | "Please provide an email address." | under Email field | `en` `MANDATORY_EMAIL` (7); `main` `app-login` |
| G33 | Password field left empty (after touching it) | "Please provide a password." | under Password field | `en` `MANDATORY_PASSWORD` (8); `main` `app-login` |
| G34 | Wrong email or password | "Invalid email or password." | error banner above the form; server returns HTTP 401 | `routes/login.ts` 52; `i18n-srv` line 620; `login.ts` 126 |
| G35 | After a failed login, both the email and password fields are cleared | (behaviour, no text) | form | `login.ts` 128-129 |
| G36 | Any field focused after an error | Error banner disappears | banner | `main` `app-login` (`focus` handler sets `error` to null) |
| G37 | Passkey login fails or is cancelled with no server message | "Passkey login failed." (or the browser's / server's own error text when one is given) | error banner | `en` `PASSKEY_LOGIN_FAILED` (20); `login.ts` 141-145 |

### 3b. User Registration page

| ID | Trigger | Exact text | Where shown | Source |
|---|---|---|---|---|
| G38 | Email empty | "Please provide an email address." | under Email | `en` `MANDATORY_EMAIL` (7); `main` `app-register` |
| G39 | Email not a valid address | "Email address is not valid." | under Email | `en` `INVALID_EMAIL` (25); `main` `app-register` |
| G40 | Password empty | "Please provide a password." | under Password | `en` `MANDATORY_PASSWORD` (8); `main` `app-register` |
| G41 | Password shorter than 5 or longer than 40 | "Password must be 5-40 characters long." | under Password (same text as the always-on hint, G21) | `en` `INVALID_PASSWORD_LENGTH` (28); `main` `app-register` |
| G42 | Repeat Password empty | "Please repeat your password." | under Repeat Password | `en` `MANDATORY_PASSWORD_REPEAT` (27); `main` `app-register` |
| G43 | Repeat Password differs from Password | "Passwords do not match" (no full stop) | under Repeat Password | `en` `PASSWORDS_NOT_MATCHING` (30); `register.ts` 67-71 |
| G44 | No security question chosen | "Please select a security question." | under Security Question | `en` `MANDATORY_SECURITY_QUESTION` (155); `main` `app-register` |
| G45 | Answer empty | "Please provide an answer to your security question." | under Answer | `en` `MANDATORY_SECURITY_ANSWER` (156); `main` `app-register` |
| G46 | Email already registered | "Email must be unique" (server sends "email must be unique"; the page capitalises the first letter) | error banner above the form; server returns HTTP 400 | `models/user.ts` 56-58 (`unique: true`); `node_modules/sequelize/lib/dialects/abstract/query.js` 115; `node_modules/finale-rest/lib/Controllers/base.js` 182-188; `register.ts` 116-120 |
| G47 | Registration succeeded | "Registration completed successfully. You can now log in." Snackbar with an "X" dismiss action, auto-closes after 5 seconds, shown on the login page | `en` `CONFIRM_REGISTER` (32); `register.ts` 113; `snack.ts` 46-47 |

Also on the registration page: the error banner clears when any field gets focus (same pattern as
G36; `main` `app-register` `focus` handlers). Not scored separately.

### 3c. Password advice card (registration, toggle on)

Each row shows a check icon (`done`, primary colour) when met, or an error icon (`error`, red)
when not met.

| ID | Exact row text | Rule checked | Source |
|---|---|---|---|
| G48 | "contains at least one lower character" | at least one a-z | `en` `LOWER_CASE_CRITERIA_MSG` (12); `pws.ts` 52 |
| G49 | "contains at least one upper character" | at least one A-Z | `en` `UPPER_CASE_CRITERIA_MSG` (13); `pws.ts` 56 |
| G50 | "contains at least one digit" | at least one 0-9 | `en` `DIGITS_CRITERIA_MSG` (14); `pws.ts` 60 |
| G51 | "contains at least one special character" | at least one ASCII punctuation or space | `en` `SPECIAL_CHARS_CRITERIA_MSG` (15); `pws.ts` 64 |
| G52 | "contains at least 8 characters" | length 8 or more | `en` `MIN_CHARS_CRITERIA_MSG` (16) with `value: 8`; `pws.ts` 21, 48 |
| G53 | Row order on screen: lower case, upper case, digit, special character, 8 characters | | `main` `app-password-strength-info` template |

## 4. Business rules

| ID | Rule | Source |
|---|---|---|
| G54 | Strength meter score = share of the five criteria met (0, 20, 40, 60, 80, 100 %). It is advisory only: a password that passes 5-40 length but fails every criterion can still be registered | `pws.ts` 31-40; `register.ts` 63-65 (only length is enforced) |
| G55 | Strength bar colour by score: red at 20 % (bar is hidden only when the password is empty), orange-red at 40 %, yellow at 60 %, yellow-green at 80 %, green at 100 % | `pws.ts` 23, 43-45; `main` `app-password-strength` styles |
| G56 | The meter's 8-character criterion differs from the enforced 5-character minimum (a 5-7 character password is accepted but shows the 8-character row as unmet) | `pws.ts` 48; `register.ts` 64 |
| G57 | Password length must be 5 to 40 characters (client-side). Server trims leading/trailing spaces from email, password and repeat before saving, so the stored length can differ from what was typed | `register.ts` 64-65; `server` 440-451 |
| G58 | Email must be unique across users (checked by the server, not the client). Uniqueness is on the stored value as typed (after trimming); the client does not lower-case it. Whether `A@x.com` and `a@x.com` are treated as different is UNCONFIRMED | `models/user.ts` 56-58; `server` 443 |
| G59 | Security question and answer are both mandatory, and the question cannot be changed after registration (stated by the hint) | `register.ts` 73-80; `en` `CANNOT_BE_CHANGED_LATER` |
| G60 | Registration is two calls: create the user, then save the security answer for that user. Only after both succeed does the app go to the login page | `register.ts` 106-113 |
| G61 | Login has no client-side email-format or password-length rules; it only requires both fields to be non-empty | `login.ts` 61-65 |
| G62 | After login the user goes to `/search`, or to the `redirectUrl` query parameter if present. The login token is kept for 8 hours (cookie expiry) | `login.ts` 113, 149-153 |
| G63 | Any items added to the basket as a guest are merged into the user's basket on login | `login.ts` 156-162 |

## 5. Security question list (exact texts, in seed order)

Loaded from the server (`GET /api/SecurityQuestions`) and shown in the dropdown in this order
(seed order = id order). The dropdown displays the `question` text as-is.

| ID | Question | Source |
|---|---|---|
| G64 | "Your eldest siblings middle name?" | `sq.yml` 3 |
| G65 | "Mother's maiden name?" | `sq.yml` 5 |
| G66 | "Mother's birth date? (MM/DD/YY)" | `sq.yml` 7 |
| G67 | "Father's birth date? (MM/DD/YY)" | `sq.yml` 9 |
| G68 | "Maternal grandmother's first name?" | `sq.yml` 11 |
| G69 | "Paternal grandmother's first name?" | `sq.yml` 13 |
| G70 | "Name of your favorite pet?" | `sq.yml` 15 |
| G71 | "Last name of dentist when you were a teenager? (Do not include 'Dr.')" | `sq.yml` 17 |
| G72 | "Your ZIP/postal code when you were a teenager?" | `sq.yml` 19 |
| G73 | "Company you first work for as an adult?" | `sq.yml` 21 |
| G74 | "Your favorite book?" | `sq.yml` 23 |
| G75 | "Your favorite movie?" | `sq.yml` 25 |
| G76 | "Number of one of your customer or ID cards?" | `sq.yml` 27 |
| G77 | "What's your favorite place to go hiking?" | `sq.yml` 29 |

Total: 14 questions.

---

## UNCONFIRMED

These cannot be settled from source alone; check by hand or score leniently.

- **U1 (G32-G33, G38-G45): when field errors appear.** The templates render each error when the
  validator fails, but Angular Material normally only shows `mat-error` once a field has been
  touched (focused then left) or the form submitted. Whether the new signal-forms binding keeps
  that behaviour was not verified.
- **U2 (G20, G41): whether typing past 40 characters is blocked.** The 40 limit is a validator; it
  is not clear from source whether it also sets a `maxlength` attribute on the input. Either the
  input stops at 40, or it accepts more and shows G41.
- **U3 (G58): case sensitivity of the unique-email check.**
- **U4 (G64-G77): dropdown order.** Assumed to follow seed (id) order; the list API call sends no
  sort parameter.
- **U5 (G17): Google button visibility** depends on the host and port the lab runs on; shown for
  the default `http://localhost:3000`, hidden on unlisted origins.
- **U6 (G55): exact colour boundaries.** Derived from the formula in `pws.ts`; at 20 % the bar is
  red, at 40 % orange-red. The visual shade may vary with the Material theme.

## Out of scope (deliberately not listed)

Challenge/hacking side effects of login and registration, SQL-injection behaviour, OAuth token
handling, the 2FA entry screen's own contents, the forgot-password screen's contents, and admin
pages.
