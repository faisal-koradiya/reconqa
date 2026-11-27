# Break report: Bank accounts (2026-11-27)
App version: unknown (no version endpoint checked) · Environment: default (local, http://localhost:3101/) · Actions used: 24 of unknown (explore.max_steps not set in kit.yml) · Monkey seed: none

## Findings
| # | Severity | What I did | What happened | Evidence | Repeated |
|---|---|---|---|---|---|
| 1 | major | 1. Log in with the test account. 2. POST /bankAccounts with the JSON body `"just a string"` (a bare string, not an object). | 400 with an HTML error page (`text/html`) instead of JSON. The page shows the full stack trace, including server file paths (`<lab>/rwa/node_modules/body-parser/...`). | 400, body starts `<!DOCTYPE html> ... SyntaxError: Unexpected token '"', ""just a string"" is not valid JSON at JSON.parse ... at createStrictSyntaxError (<home>/body-parser/lib/types/json.js:169:10)` | Yes (second body `"again"` gave the same page) |
| 2 | major | 1. POST /bankAccounts with `{"bankName":"reconqa","accountNumber":"123456789","routingNumber":"123456789"}` plus identical repeat, 3 times in a row (body: bankName "reconqa dup", accountNumber 111111111, routingNumber 222222222). | 3 records created with the same data (ids S2JwPK__Y, RRzyK2dAOp, T53TyuhtK), all 200. No duplicate check. | 200 x3, different `id` and `uuid` each time | Yes (3 of 3) |
| 3 | major | 1. POST with bankName `reconqa`, accountNumber `1234567890123456789012345678901234567890` (40 digits), routingNumber `123456789`. 2. POST with bankName = the 256-character value from the catalogue. | Both accepted with 200 and stored in full. Spec limits (bankName max 50, accountNumber 9 to 12 digits) are not enforced. | 200, response echoes the full 256-char bankName and the 40-digit accountNumber (ids KsB3_DNpL) | Yes, consistent with atlas R3 |
| 4 | major | 1. POST with accountNumber `1e3` and routingNumber `-1` (catalogue number values, sent as strings). | 200, stored as is. Pattern `^[0-9]{9}$` not enforced. | 200, id s4-YQmtus, accountNumber "1e3", routingNumber "-1" | Yes, consistent with atlas R3 |
| 5 | minor | 1. POST with bankName `reconqa   ` (trailing spaces), accountNumber `   `, routingNumber `   ` (spaces only). | 200. Spaces were silently trimmed: stored bankName "reconqa", accountNumber "" and routingNumber "". Spaces-only counts as empty and is accepted, though the same fields are "required" (a missing field gives 422). | 200, id Yh1B2c38_, `"accountNumber": ""` | Seen once |
| 6 | minor | 1. POST with body `[{"bankName":"reconqa","accountNumber":"123456789","routingNumber":"123456789"}]` (array). | 422 with the generic "Invalid value" for each field, no hint that an object is expected. | 422, `errors[].msg` "Invalid value" for bankName, accountNumber, routingNumber | Seen once |
| 7 | minor | 1. POST with extra fields `extra`, `id: "forced-id"`, `userId: "someone-else"`, `isDeleted: true` alongside valid values. | 200. The extra fields were ignored (new id, userId unchanged, isDeleted false). This is correct. It is listed here only because the unknown fields are accepted without any warning. | 200, id VvEDE3x0J, `"isDeleted": false` | Seen once |

## Held up well
- Wrong JSON types (null, `[]`, `{}`, `true`, numbers) in any field: 422 with the field named in `param`, no 5xx.
- Empty body (no body at all): 422 listing all three fields.
- Mass assignment: `id`, `userId` and `isDeleted` sent by the client were ignored.
- Text values from the catalogue (`<script>` tag, SQL-like string, emoji, right-to-left, Chinese, newline): stored and returned as plain text, no 5xx.
- GET /bankAccounts with `limit=-1&page=abc`: 200, no error.

## Not done
- Very long value (5000 characters), double-submit timing (the requests were sent one after another, not at the same time) and the DELETE and 401 paths. A GET with `%00` was refused by the driver before it was sent. The step limit (`explore.max_steps`) is not set in kit.yml, so I stopped when the main attacks were covered.

## Test data left behind
- 15 records created by this run, all with a "reconqa" bankName except KsB3_DNpL (256 x's, no prefix) and s4-YQmtus (prefix present): SG0ue_G6o, EKUCkeQUt, Yh1B2c38_, C12wpIs6w, S2JwPK__Y, RRzyK2dAOp, T53TyuhtK, VvEDE3x0J, KsB3_DNpL, s4-YQmtus.
- Earlier explore records (7Y2WPltBL, i-ZTGZs9-, KmDatlLwL, Sw3UNCTFM, 2q0rUU52Q, be8Xf_sMV1, 0xBH3W10p, CEToJK7B0y) are still present. Nothing was deleted.
