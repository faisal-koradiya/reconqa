# Labelled mismatches: user-sign-in ticket vs RWA atlas

Atlas: `evals/explore/rwa-signin-signup.run3-atlas.md`. Hand-labelled.

| AC | Ticket says | App (atlas) | Label |
|---|---|---|---|
| 1 | Two required fields | Both required, errors on blur | match |
| 2 | Minimum 6 characters | Minimum 4 (R2, "Password must contain at least 4 characters") | **mismatch** |
| 3 | "Username or password is invalid" | Same (M3) | match |
| 4 | Username kept after failure | Both fields cleared (R5) | **mismatch** |
| 5 | "Remember me" unchecked by default | Same | match |
| 6 | "Sign In" disabled while invalid | R4 | match |
| 7 | "Don't have an account? Sign Up" | Present | match |
| 8 | Lock after 5 failures | Not explored | open question (atlas doesn't cover) |
