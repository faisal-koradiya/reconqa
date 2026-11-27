# Story: People sign up for an account

*Fictional fixture ticket (ReconQA eval). Cypress Real World App sign-up screen.*

As a new user, I want to create an account so that I can send money to friends.

## Acceptance criteria
1. Sign up asks for First Name, Last Name, Username, Password and Confirm Password; all are required.
2. The password must be at least 8 characters.
3. If the two passwords differ, "Password does not match" is shown.
4. The "Sign Up" button stays disabled while the form is invalid.
5. A username that is already taken is rejected with "Username already exists".
6. After signing up, the user is taken to the sign-in page.
7. A link "Have an account? Sign In" leads back to sign in.
8. After sign-up a success message "Account created" is shown.
