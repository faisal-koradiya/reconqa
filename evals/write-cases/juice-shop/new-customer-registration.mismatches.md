# Labelled mismatches: sample ticket vs frozen atlas

Ticket: `examples/juice-shop/tickets/new-customer-registration.md`
Atlas: `examples/juice-shop/qa/atlas/login-and-registration.md`
Hand-labelled. A `/write-cases` run should flag every row marked **mismatch** and none marked **match**.
Used for mismatch precision/recall in M2b (target precision ≥ 80%).

| AC | Ticket says | App (atlas) | Label |
|---|---|---|---|
| 1 | Reachable from login | "Not yet a customer?" link on login | match |
| 2 | Five mandatory fields | Five required fields | match |
| 3 | Valid email | "Email address is not valid." on bad format | match |
| 4 | Password at least 8 characters | 5–40 enforced; 8 is only in the advisory list | **mismatch** |
| 5 | Mismatch error under repeat field | "Passwords do not match" under Repeat Password | match |
| 6 | Strong-password advice | "Show password advice" toggle with five criteria | match |
| 7 | Question fixed, form says so | Hint "This cannot be changed later!" | match |
| 8 | "This email is already registered." | Actual text "Email must be unique" | **mismatch** |
| 9 | Must accept terms | No terms checkbox on the form | **mismatch** |
| 10 | Logged in automatically, goes to product list | Redirects to login with a success snackbar; not logged in | **mismatch** |
| — | (not in ticket) | Password counter shows "/20" while the limit is 40 | **atlas-only finding** (should be raised as a question or likely defect, not as a ticket mismatch) |
