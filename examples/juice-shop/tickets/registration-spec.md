# Story: Customer registration (spec, written before the screen was built)

*Fictional sample ticket for the ReconQA demo, written the way specs are written before a screen
exists. Some texts were changed during development; ReconQA's reconcile step finds which.*

As a new visitor, I want to create a customer account so that I can place orders.

## Acceptance criteria
1. The login page has a link "Already a customer?" on the registration form to go back, and the registration form is reached from the login page.
2. The form has the fields "Email", "Password", "Repeat Password", "Security question" and "Answer". All are required.
3. An email without a valid format shows "Email address is not valid." when the user leaves the field.
4. An empty email shows "Please provide an email address." and an empty password shows "Please provide a password" when the user leaves the field.
5. The password must be 8 to 40 characters long; a shorter one shows "Password must be 8 to 40 characters."
6. If the repeated password differs, the form shows "Passwords do not match" under the repeat field. An empty repeat field shows "Please repeat your password."
7. A switch "Show password tips" shows advice on strong passwords.
8. If no security question is chosen, the form shows "Please choose a security question." The form also says "This cannot be changed later!"
9. The user must tick "I accept the terms and conditions" before registering.
10. The button "Create account" sends the form. A user can also use "Sign up with Google".
11. If the email already has an account, the form shows "Email must be unique."
12. After registering, the user sees "Registration successful. Please log in." on the login page.
