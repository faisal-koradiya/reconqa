# Story: First-time users add a bank account during onboarding

*Fictional sample ticket for the ReconQA side-by-side demo (Cypress Real World App, lab only).*

As a new user, after my first sign-in I want to be guided to add a bank account, so that I can send
and receive payments.

## Acceptance criteria
1. On the first sign-in after sign-up, an onboarding dialog opens before the user can use the app.
2. Step 1 explains why a bank account is needed and has a "Next" button.
3. Step 2 asks for Bank Name, Routing Number and Account Number. All are required.
4. Bank Name must be at least 3 characters.
5. Routing Number must be exactly 9 digits.
6. Account Number must be 10 to 12 digits.
7. The "Save" button stays disabled until all three fields are valid.
8. The user can skip bank setup with a "Skip for now" link and add an account later.
9. After saving, a confirmation step says "Your bank account has been added."
10. Closing the dialog takes the user to the transactions feed.
