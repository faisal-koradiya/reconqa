# Story: New customers can create an account

*Fictional sample ticket for the ReconQA demo. Written to read like a typical story, including the
kind of gaps and drift real tickets have.*

As a new visitor, I want to create a customer account so that I can place orders and track them.

## Acceptance criteria
1. The registration page is reachable from the login page.
2. The form asks for email, password, repeat password, a security question and its answer. All are mandatory.
3. The email must be a valid address.
4. The password must be at least 8 characters long.
5. Password and repeated password must match; if not, the user sees an error under the repeat field.
6. Users can see advice on how to make a strong password.
7. The security question cannot be changed after registration, and the form tells the user so.
8. If the email is already registered, show "This email is already registered."
9. The user must accept the terms and conditions before registering.
10. After a successful registration the user is logged in automatically and taken to the product list.
