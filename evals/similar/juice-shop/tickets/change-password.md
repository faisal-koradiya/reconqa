# SHOP-88: Change password (fictional ticket for the ReconQA lab)

As a signed-in customer I want to change my password from my account settings, so that I can
replace a password I think someone else knows.

Acceptance criteria:

1. The page has three fields: Current Password, New Password and Repeat New Password, and a Change button.
2. All three fields are required; the user sees an error under a field left empty.
3. The new password follows the same length rule as at registration.
4. If New Password and Repeat New Password differ, the user is told the passwords do not match.
5. A wrong current password is refused with a message.
6. After a successful change the user sees a confirmation message and stays signed in.

Design is not ready yet: wording of messages to follow the existing account screens.
