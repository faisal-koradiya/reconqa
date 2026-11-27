# Story: Users sign in

*Fictional fixture ticket (ReconQA eval). Cypress Real World App sign-in screen.*

As a registered user, I want to sign in so that I can see my transactions.

## Acceptance criteria
1. Sign in asks for Username and Password; both are required.
2. Passwords shorter than 6 characters are rejected before submitting.
3. Wrong credentials show "Username or password is invalid".
4. After a failed attempt the username stays filled in so the user only retypes the password.
5. A "Remember me" checkbox is unchecked by default.
6. The "Sign In" button stays disabled while the form is invalid.
7. A link "Don't have an account? Sign Up" leads to sign up.
8. After 5 failed attempts the account is locked for 15 minutes.
