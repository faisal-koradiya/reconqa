# Customer registration: overview

New visitors create a customer account from the login page. The form asks for an email, a
password (twice) and a security question with its answer. After registering, the user logs in.

## Rules
- All five fields are required; "Register" stays disabled until the form is valid. [src: atlas:login-and-registration#R4]
- The email format is checked when the user leaves the field. [src: atlas:login-and-registration#R5]
- Passwords are 5 to 40 characters long: "Password must be 5-40 characters long." [src: atlas:login-and-registration#M10]
- Repeat Password must equal Password, otherwise "Passwords do not match" shows under the repeat field. [src: atlas:login-and-registration#M11]
- Each email can register only once; a duplicate shows "Email must be unique" as a banner. [src: atlas:login-and-registration#M12]
- The security question cannot be changed after registration, and the form says so. [src: atlas:login-and-registration#R10]

## Flows
- Login page → "Not yet a customer?" → registration form. [src: atlas:login-and-registration#User Registration]
- Valid registration → login page with the toast "Registration completed successfully. You can now log in." [src: atlas:login-and-registration#M13]

## From the manual
Statements from the imported user manual that the atlas confirms. Conflicting ones are in
qa/reports/import-user-manual.md until the team answers them.
- All five registration fields are required. [src: manual:qa/sources/user-manual.md#Creating an account; atlas:login-and-registration#R4]
- Different passwords show "Passwords do not match" under the second password field. [src: manual:qa/sources/user-manual.md#Creating an account; atlas:login-and-registration#M11]
- An email without an @ shows "Email address is not valid." when the user leaves the field. [src: manual:qa/sources/user-manual.md#Creating an account; atlas:login-and-registration#M9]
- The security question cannot be changed later, and the form says "This cannot be changed later!" [src: manual:qa/sources/user-manual.md#Security questions; atlas:login-and-registration#User Registration]

## Notes
The ticket and the app still disagree on the minimum password length and on the duplicate-email
message; see the mismatches in the cases file. Only decisions.md settles them.
