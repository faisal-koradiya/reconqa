# Customer registration: decisions

Answers the team gave to open questions. A decision settles what the team **wants** (intent). It
never decides exact screen text: that comes only from the atlas. Record new ones with
`/reconqa:kb answer`. When the atlas fact a decision cites changes, the check marks it stale.

<!-- Demo data: the decisions below are examples written for the ReconQA demo, not real team answers. -->

## D1 No automatic login after registration
- Question: The ticket wants an automatic login after registration; the app sends the user to the login page. [src: ticket:tickets/new-customer-registration.md#AC10; atlas:login-and-registration#R9 @b1a1037b]
- Decision: The current behaviour is intended. Cases expect the login page after registering; the ticket will be corrected.
- Who: Product owner (demo)
- Date: 2026-11-26
- Status: active

## D2 Terms and conditions are not part of this release
- Question: The ticket asks users to accept the terms; the form has no such field. [src: ticket:tickets/new-customer-registration.md#AC9; atlas:login-and-registration#R4 @1c7cadcf]
- Decision: Out of scope for now. Do not write cases for it and do not report it as a bug.
- Who: Product owner (demo)
- Date: 2026-11-26
- Status: active
