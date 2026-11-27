# Story: Help customers choose a strong password

*Fictional fixture ticket (ReconQA eval). Juice Shop registration, password advice.*

As a new customer, I want advice while choosing a password so that my account is harder to break into.

## Acceptance criteria
1. A "Show password advice" switch on the registration form shows or hides the advice.
2. The advice lists: one lower-case letter, one upper-case letter, one digit, one special character, at least 8 characters.
3. Each item shows whether the current password meets it.
4. Under the password field, the hint "Password must be 5-40 characters long." is always shown.
5. A character counter under the password field shows the count out of 40.
6. Weak passwords (fewer than 3 criteria met) cannot be registered.
7. The advice is hidden by default.
