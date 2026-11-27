# Learn from similar features: Change password, before the screen exists

Most test cases are written before the screen is built, so there is nothing to look at yet. But
most new screens look like ones that already exist: an "edit" form like the "create" form, a
"change password" form like sign-up. ReconQA now finds the most similar feature it has already
explored and borrows its exact texts, marked as borrowed, for the team to confirm.

**Setup.** [OWASP Juice Shop](https://github.com/juice-shop/juice-shop) (MIT), where only the
**login and registration** screens had been explored. A fictional ticket for **Change password**
(`juice-shop/tickets/change-password.md`) names the fields and rules but gives **no message
texts** ("wording to follow the existing account screens"), which is common in real tickets.

1. `/reconqa:write-cases tickets/change-password.md --pre-ui`: `kb similar` picked registration
   (shared fields: Password, Repeat Password); the cases borrowed 4 message texts from it, each
   cited as `similar:login-and-registration#M<n>` and listed as a question for the team. $0.41.
2. Separately, the real Change password screen was explored (logged in, without submitting:
   changing passwords is on the deny list). $0.38.
3. Reconcile (a script, no AI) compared every expected text with the real screen.

| | Result |
|---|---|
| Message texts the ticket gave | 0 |
| Message texts predicted by borrowing | 4 |
| Borrowed texts exactly right on the real screen | **3 of 4**: «Please repeat your password.», «Password must be 5-40 characters long.», «Passwords do not match» |
| Borrowed text that differed | 1: "Please provide a password." vs «Please provide your new password.» and «Please provide your current password.»; reconcile lists it as a question, nothing is converted silently |
| All expected texts in the cases (labels from the ticket + borrowed) | 14 of 16 confirmed |

Without borrowing, the cases could only describe these messages ("an error about the length");
with it, three of them were checkable word for word before the screen existed.

**A bug this found in ReconQA itself.** Reconcile only read texts in "double quotes" from the
atlas, so the button «Change» was paired with the heading "Change Password". Fixed, with a test.

**Limits.** One feature pair, one run each, a ticket we wrote. Borrowing works when the two
features share a design system; the cases say so in their questions.

Files: `juice-shop/` (config, the registration atlas, the ticket, the pre-UI cases, the real
change-password atlas), `runs/` (cost of each run, the reconcile plan).
