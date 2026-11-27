# API: bank accounts on the Real World App

Can ReconQA test an API, and compare the team's API spec with what the server really does? We ran
the [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app) (MIT licence)
locally and wrote a short OpenAPI spec for its bank-account endpoints, the way a team writes one
from its stories (`rwa/docs/bank-accounts.openapi.json`). We hid 5 claims in it that the server
does not keep (`rwa/planted.json`), and checked them with plain requests before any AI run.

ReconQA explored "bank accounts" with the built-in API driver: it read the spec, logged in with a
test account it never saw (the driver got the user and password, Claude did not), and probed each
endpoint and field.

| | Result |
|---|---|
| Hidden spec mistakes found | 4 of 5 |
| Not tested | 1: "DELETE answers 204". Deletes need a person's OK, and this run had nobody to give it. The explorer said so instead of guessing |
| Conflicts that weren't real | 0 |
| Extra true findings | the list includes deleted accounts; empty strings are accepted; account numbers come back unmasked |
| Time and cost | 46 s, $0.18 |

The four it found: create answers 200, not 201; a 4-character bank name is accepted (the spec says
at least 5); routing numbers of any length or with letters are accepted (the spec says exactly 9
digits); an unknown account id answers 200 with `{}`, not 404.

**Safety in practice.** It created 8 test accounts on the lab server (6 named `reconqa…`; two were
tests of empty names). It could not change or delete anything it hadn't created, and it listed what
it left behind.

**Limits.** One run, one area, a spec we wrote ourselves. It did not try the API without a login
(it logged in first) or an id in the wrong format; the guide now asks for both.

Files: `rwa/` (config, spec, answer key), `runs/` (atlas, cost and our scoring).
