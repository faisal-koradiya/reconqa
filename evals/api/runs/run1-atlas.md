# Bank accounts (atlas)
App version: unknown (no version endpoint checked) · Explored: 2026-11-27 · Environment: default (local, http://localhost:3101/) · Source: live API, compared with docs/bank-accounts.openapi.json

## Screens

### GET /bankAccounts
How to reach: signed in with the test account (api_login → 200).
Spec says: 200 object with `results`; 401 not signed in.
Server does: 200, `{"results": [ {id, uuid, userId, bankName, accountNumber, routingNumber, isDeleted, createdAt, modifiedAt}, ... ]}`.
The list includes records with `isDeleted: true` (observed). 401 not probed (stayed logged in).

### POST /bankAccounts
| Field | Type | Required | Rules / limits (server) | Spec says |
|---|---|---|---|---|
| bankName | string | yes (observed: missing → error) | 16 and 59 chars accepted; 4 chars ("abcd") accepted; empty string accepted; number → 422 | string, min 5, max 50 |
| accountNumber | string | yes | 9 and 8 digits accepted; 13 digits accepted; empty accepted; "12345678a" accepted; number → 422 | pattern ^[0-9]{9,12}$ |
| routingNumber | string | yes | 9, 8 and 10 digits accepted; empty accepted; "12345678a" accepted; number → 422 | pattern ^[0-9]{9}$ |

- Empty body `{}` → 422, body lists each field as `{"msg":"Invalid value","param":<field>,"location":"body"}`.
- Wrong type (numbers) → 422, same shape plus a `value` key echoing the input.
- Extra unknown field `extra` was sent together with other bad values and the request succeeded; whether `extra` is stored is not shown (the response omits it).
- Success returns **200** (spec says 201) with `{"account": {...}}`; `isDeleted` false, `userId` set by the server.
- Exact duplicate not tested.

### GET /bankAccounts/{bankAccountId}
- Existing id → 200 `{"account": {...}}`.
- Id `does-not-exist` → **200 with `{}`** (spec says 404 / 422).

### DELETE /bankAccounts/{bankAccountId}
Not probed: the delete request was not approved in this run. Spec says 204, 401.

### OPTIONS /bankAccounts
204, no body.

## Messages
| # | Exact text | Screen | Where shown | Trigger |
|---|---|---|---|---|
| M1 | Invalid value | POST /bankAccounts | `errors[].msg` in the 422 body, one per field (`param`) | `{}` body (all three fields) |
| M2 | Invalid value | POST /bankAccounts | `errors[].msg`, with `value` echoed | bankName, accountNumber, routingNumber sent as numbers |

## Rules
- R1 Fields must be strings; numbers are rejected with 422 (observed).
- R2 Missing fields are rejected with 422 (observed, all three together; one-at-a-time not tested).
- R3 No length or pattern rules are enforced: 4-char bankName, 59-char bankName, 8/13-digit accountNumber, 8/10-digit routingNumber, letters, and empty strings were all accepted (observed). Conflicts with spec.
- R4 Create returns 200, not 201 (observed). Conflicts with spec.
- R5 Unknown id on GET returns 200 `{}` (observed). Conflicts with spec's 404/422.
- R6 The error message is the generic "Invalid value" with no field-specific text, unlike the spec's "lists the errors per field" intent (observed).
- R7 The list returns soft-deleted records (`isDeleted: true`) (observed).
- R8 Account numbers are returned in full, unmasked (observed).

## Open questions
- Is accepting empty strings and out-of-pattern values intended, or are the spec's min/max/pattern rules missing from the server?
- Should create return 201 and unknown ids 404?
- Does DELETE work (204), and does a deleted record disappear from GET and the list or just flip `isDeleted`?
- 401 without login, wrong method (405?), duplicate accounts, and each field missing alone were not probed.
- Should the list hide `isDeleted` records, and should account numbers be masked?

## Notes
(People may write here; kept on updates.)

Records created in this run (all prefixed "reconqa" except two): 7Y2WPltBL, i-ZTGZs9-, KmDatlLwL (bankName "abcd"), Sw3UNCTFM, 2q0rUU52Q, be8Xf_sMV1 (empty strings), 0xBH3W10p, CEToJK7B0y. Not cleaned up because delete was not approved.
