# Labelled mismatches: password-advice ticket vs frozen Juice Shop atlas

Atlas: `examples/juice-shop/qa/atlas/login-and-registration.md`. Hand-labelled.

| AC | Ticket says | App (atlas) | Label |
|---|---|---|---|
| 1 | "Show password advice" switch | Present (switch) | match |
| 2 | Five criteria | Five checklist items, same meaning | match |
| 3 | Each item shows met / not met | Atlas lists the items but doesn't record a met/not-met state | open question (atlas doesn't cover) |
| 4 | Hint "Password must be 5-40 characters long." | Same, always visible | match |
| 5 | Counter out of 40 | Counter shows "n/20" ("40/20" at 40 chars) | **mismatch** (likely defect in the app) |
| 6 | Weak passwords blocked | Atlas doesn't record registering with a weak password | open question (atlas doesn't cover) |
| 7 | Hidden by default | Switch is "no"/off on load (field table) | match |
