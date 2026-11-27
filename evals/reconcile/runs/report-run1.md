# Reconcile: qa/cases/registration-spec.md (2026-11-26)
Atlas: qa/atlas/login-and-registration.md. 26 expected text(s): 14 confirmed and converted, 9 different, 3 not found.

## Different on the screen
The ticket (or manual) expected one text; the screen shows another. Each is a question for the team: change the screen, or accept the screen and update the source.

| # | Expected (source) | Screen shows | Question |
|---|---|---|---|
| 11 | "Password must be 8 to 40 characters." [src: ticket:tickets/registration-spec.md#AC5] | "Password must be 5-40 characters long." [src: atlas:login-and-registration#M10] | The screen allows 5-40 characters (hint and message), the ticket says 8 to 40: which limit is right? TC-REG-006/007 use 7 and 8 characters and depend on the answer. |
| 14 | "Show password tips" [src: ticket:tickets/registration-spec.md#AC7] | "Show password advice" [src: atlas:login-and-registration#User Registration] | The registration switch is labelled "Show password advice", the ticket says "Show password tips": change the screen, or update the ticket? |
| 15 | "Please choose a security question." [src: ticket:tickets/registration-spec.md#AC8] | "Please select a security question." [src: atlas:login-and-registration#M7] | The screen says "select", the ticket says "choose": change the screen, or update the ticket? |
| 18 | "Create account" [src: ticket:tickets/registration-spec.md#AC10] | "Register" [src: atlas:login-and-registration#User Registration] | The registration button sends the form but is labelled "Register", not "Create account": change the screen, or update the ticket? |
| 20 | "Create account" [src: ticket:tickets/registration-spec.md#AC10] | "Register" [src: atlas:login-and-registration#User Registration] | The registration button sends the form but is labelled "Register", not "Create account": change the screen, or update the ticket? |
| 21 | "Registration successful. Please log in." [src: ticket:tickets/registration-spec.md#AC12] | "Registration completed successfully. You can now log in." [src: atlas:login-and-registration#M13] | The success toast text differs from the ticket ("Registration successful. Please log in."): change the screen, or update the ticket? |
| 22 | "Registration successful. Please log in." [src: ticket:tickets/registration-spec.md#AC12] | "Registration completed successfully. You can now log in." [src: atlas:login-and-registration#M13] | The success toast text differs from the ticket ("Registration successful. Please log in."): change the screen, or update the ticket? |
| 23 | "Create account" [src: ticket:tickets/registration-spec.md#AC10] | "Register" [src: atlas:login-and-registration#User Registration] | The registration button sends the form but is labelled "Register", not "Create account": change the screen, or update the ticket? |
| 25 | "Create account" [src: ticket:tickets/registration-spec.md#AC10] | "Register" [src: atlas:login-and-registration#User Registration] | The registration button sends the form but is labelled "Register", not "Create account": change the screen, or update the ticket? |

## Not found on the screen
- 17. "I accept the terms and conditions" [src: ticket:tickets/registration-spec.md#AC9]: No terms-and-conditions checkbox exists on the registration screen; the form is valid without it, so TC-REG-014 cannot be run as written.
- 19. "I accept the terms and conditions" [src: ticket:tickets/registration-spec.md#AC9]: No terms-and-conditions checkbox exists on the registration screen.
- 26. "Sign up with Google" [src: ticket:tickets/registration-spec.md#AC10]: No sign-up with Google button on the registration screen; "Log in with Google" exists only on the login screen.

## Confirmed and converted
- 1. "Already a customer?" → «Already a customer?»
- 2. "Already a customer?" → «Already a customer?»
- 3. "Email" → «Email»
- 4. "Password" → «Password»
- 5. "Repeat Password" → «Repeat Password»
- 6. "Security question" → «Security Question» (same text apart from case or punctuation)
- 7. "Answer" → «Answer»
- 8. "Please provide an email address." → «Please provide an email address.»
- 9. "Email address is not valid." → «Email address is not valid.»
- 10. "Please provide a password" → «Please provide a password.» (same text apart from case or punctuation)
- 12. "Passwords do not match" → «Passwords do not match»
- 13. "Please repeat your password." → «Please repeat your password.»
- 16. "This cannot be changed later!" → «This cannot be changed later!»
- 24. "Email must be unique." → «Email must be unique» (same text apart from case or punctuation)

