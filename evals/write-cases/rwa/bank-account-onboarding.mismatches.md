# Labelled mismatches: RWA onboarding ticket vs atlas

Ticket: `evals/write-cases/rwa/bank-account-onboarding.ticket.md`
Atlas: `evals/explore/rwa-signin-signup.run3-atlas.md` (live explore, 2026-11-26). Hand-labelled.

| AC | Ticket says | App (atlas) | Label |
|---|---|---|---|
| 1 | Dialog on first sign-in | 3-step modal on first sign-in (R7) | match |
| 2 | Step 1 explains, has "Next" | "Get Started with Real World App" + "Next" | match |
| 3 | Three required fields | Bank Name, Routing Number, Account Number, all required | match |
| 4 | Bank Name ≥ 3 characters | ≥ 5: "Must contain at least 5 characters" | **mismatch** |
| 5 | Routing exactly 9 digits | 8 digits rejected, 9 accepted (exactly-9 partly inferred) | match |
| 6 | Account 10–12 digits | 9 digits accepted ("Must contain at least 9 digits") | **mismatch** |
| 7 | "Save" disabled until valid | Same (step 2) | match |
| 8 | "Skip for now" link | No skip; only "Logout" and "Save" | **mismatch** (missing in app) |
| 9 | "Your bank account has been added." | "Finished" / "You're all set!" / "We're excited to have you aboard the Real World App!" | **mismatch** |
| 10 | Goes to transactions feed | "Done" closes; user stays on `/` home feed | match |
| — | (not in ticket) | Step 1 body has no space after the period ("transactions.Click") | **atlas-only finding** (likely defect) |
