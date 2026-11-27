# Labelled mismatches: user-sign-up ticket vs RWA atlas

Atlas: `evals/explore/rwa-signin-signup.run3-atlas.md`. Hand-labelled.

| AC | Ticket says | App (atlas) | Label |
|---|---|---|---|
| 1 | Five required fields | Five required fields, errors on blur | match |
| 2 | Password ≥ 8 | ≥ 4 ("Password must contain at least 4 characters", R2) | **mismatch** |
| 3 | "Password does not match" | Same (M8) | match |
| 4 | "Sign Up" disabled while invalid | R4 | match |
| 5 | Taken username rejected | R9: accepted, no error, redirect to /signin | **mismatch** (likely defect in the app) |
| 6 | Goes to sign in | R6 | match |
| 7 | "Have an account? Sign In" | Present | match |
| 8 | "Account created" message | No success message seen (R6) | **mismatch** (missing in app) |
