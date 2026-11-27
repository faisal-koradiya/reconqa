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

## D3 Minimum password length stays at 5
- Question: Tickets ask for at least 8 characters; the app accepts 5 to 40. [src: ticket:tickets/new-customer-registration.md#AC4; atlas:login-and-registration#R6 @be3f3a2b]
- Decision: Keep 5 to 40 for now. A stronger policy comes with the planned security update; until then cases expect the current limit.
- Who: Product owner (demo)
- Date: 2026-11-26
- Status: active

## D4 Duplicate email: keep the current message and place
- Question: Tickets ask for another duplicate-email message under the field; the app shows a banner. [src: ticket:tickets/new-customer-registration.md#AC8; atlas:login-and-registration#M12 @7b3ad9bd]
- Decision: Keep the current behaviour (banner under the heading). Tickets asking otherwise will be corrected.
- Who: Product owner (demo)
- Date: 2026-11-26
- Status: active

## D5 Security questions: keep the current list
- Question: Should the list of security questions be shortened? [src: atlas:login-and-registration#User Registration @bf202bac]
- Decision: No. Keep the current list of questions; shortening it is not planned.
- Who: Product owner (demo)
- Date: 2026-11-26
- Status: active

## D6 Login error stays generic
- Question: Should a failed login say whether the email or the password was wrong? [src: atlas:login-and-registration#R3 @8dd039e4]
- Decision: No. For security the message must not say which field was wrong. Keep one message for both.
- Who: Product owner (demo)
- Date: 2026-11-26
- Status: active
