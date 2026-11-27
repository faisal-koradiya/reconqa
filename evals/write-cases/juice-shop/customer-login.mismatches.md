# Labelled mismatches: customer-login ticket vs frozen Juice Shop atlas

Atlas: `examples/juice-shop/qa/atlas/login-and-registration.md`. Hand-labelled.

| AC | Ticket says | App (atlas) | Label |
|---|---|---|---|
| 1 | Email + Password, required | Both required, error on blur | match |
| 2 | "Log in" disabled until both filled | R1: disabled while empty, enabled after both filled | match |
| 3 | Eye icon show/hide | "Show password" icon button | match |
| 4 | "Incorrect email or password. Please try again." | "Invalid email or password." | **mismatch** |
| 5 | Error doesn't say which field | M3 is generic | match |
| 6 | "Forgot your password?" link | Present | match |
| 7 | Log in with Apple | Only "Log in with Google" and "Log in with Passkey" | **mismatch** (missing in app) |
| 8 | "Create account" link | Link text is "Not yet a customer?" | **mismatch** |
