# App driver adapter: API (built in)

## Quick start for testers

1. **Ask your developers** for the API's address on a **test** server (for example
   `http://localhost:3001`) and, if they have one, the file that lists the API's addresses and
   fields (often called OpenAPI or Swagger). Put that file in your project folder.
2. **Ask for a test account** for the API, never a real person's account.
3. **Run `/reconqa:setup`** in Claude Code and choose API. It asks for the address, the file, and
   whether ReconQA may create test records, and writes the settings file for you. For the login it
   asks only for two **names** (like `QA_API_USER` and `QA_API_PASSWORD`), never the password.
4. **Connect the API helper with the login.** Setup prints one command. Copy it into the terminal,
   open in your project folder, replace only the parts in angle brackets (and the brackets) with
   the test user and password, and press Enter. This gives the login to ReconQA's API helper only;
   Claude never sees it. Then restart Claude Code.
5. **Run `/reconqa:doctor`.** Every line should start with `[ok]` (an `[info]` line is just a note).
   For each `[FAIL]` line it says what to do.

Claude Code asks you before each request at first ("Allow …?"). Saying yes each time is fine.
Before deleting anything, the question starts with "ReconQA:"; say no if you're unsure.

The rest of this page is the detail, for when you need it.

## How it works

ReconQA's own driver for REST/JSON APIs, `drivers/api/server.mjs`. It needs only Node.js. It talks
to **one API server**, named in `.reconqa/kit.yml`:

    app:
      target: api
      api:
        base_url: http://localhost:3001        # requests go only to this server
        spec: docs/openapi.json                # optional: OpenAPI 3 / Swagger 2, JSON or simple YAML,
                                               # a file in the project or a path on the server (/openapi.json)
        # Pick one way to log in, or none:
        token_env: QA_API_TOKEN                # the NAME of an environment variable holding a token
        login:                                 # or a session login, filled from environment variables
          path: /login
          body_env: { username: QA_API_USER, password: QA_API_PASSWORD }
      test_data:
        allow_create: true                     # lets ReconQA create and change test records (test servers only)
    capabilities:
      app_driver:
        tool: http-api

Setup writes this file; you only need to check it (if you edit it by hand, keep the spaces exactly
as they are). The kit holds only the **names** of environment variables, never the values. Use a test account,
never a real one.

## Set it up

1. Register the driver in your project folder (one time). Give it the login values here, so that
   only the driver gets them, not Claude's own terminal (`--scope local` keeps them in your user
   settings, outside the project):

        claude mcp add reconqa-api --scope local -e QA_API_USER=<test user> -e QA_API_PASSWORD=<test password> -- node <ReconQA plugin folder>/drivers/api/server.mjs

   Without a login: `claude mcp add reconqa-api --scope project -- node <ReconQA plugin folder>/drivers/api/server.mjs`.
   (Exporting the variables in the terminal before starting Claude Code also works, but then
   Claude's terminal has them too.) Either way the test password ends up in your terminal history
   and your user settings file: one more reason to use a test account only.

   Optional, later: to stop the "Allow …?" question on every request, add the allow rule that the
   doctor shows to `.claude/settings.local.json`. Deletes are still asked, every time.
2. Run `/reconqa:doctor`. It checks that the API answers.

## Tools

| Need | Tool |
|---|---|
| Read the team's spec (endpoints, required fields, limits) | `api_spec` |
| Log in with the test account | `api_login` |
| Read: GET, HEAD, OPTIONS | `api_get` (`path` like `/users/1`, optional `query`) |
| Create or change: POST, PUT, PATCH | `api_send` (`method`, `path`, JSON `body`) |
| Delete a record this run created (asked) | `api_delete` |
| What this run created | `api_created` |

## How exploring and running cases differ from the web

- An "area" is a group of endpoints (for example "bank accounts"). A "screen" in the atlas is an
  endpoint: method and path. Record for each: required and optional fields, types and limits, the
  status code and the **exact error body** for each bad input, and what a success returns.
- Start with `api_spec` if there is one, but treat it like a manual: it says what someone meant,
  not what the server does. Every claim in the atlas comes from a response you saw. Where the spec
  and the server disagree, write both in the atlas (spec says / server does): that is the conflict list.
- Probe each field: missing, empty, wrong type, too short and too long, a value outside an enum,
  an unknown extra field. One change per request, so each error body is tied to one cause.
- Before `api_login`, send one GET to see what the API answers without a login. Also check an id
  that does not exist, an id in the wrong format, and a wrong method.
- Created records get the test-data prefix in a name or text field, so they can be found later.
- Responses hide tokens, cookies and password-like fields (`[hidden]`). Do not try to work around it.

## Running cases

A case step is a request; its expected result is a status and body text, for example
"«422» and «bankName must contain at least 5 characters»". Record the actual status and body.

## Evidence in bugs and runs

Quote the request (method, path, body without secrets) and the status and body you got back. There
are no screenshots. The API version comes from a version endpoint or header if the API has one.

## Safety

- One server: paths are relative (`/users/1`); full URLs, `//host` and `..` are refused.
- Reads are free. POST, PUT and PATCH need `allow_create` and a local or test server (localhost, or
  an environment of kind local, test or staging). Production is refused. Note: `localhost` always
  counts as local; never point `base_url` at a tunnel (for example SSH port forwarding) to a live server.
- POST only creates new records in a collection (`POST /items`). POSTs that name an existing record
  (`POST /users/42/…`) or look like they change settings, passwords, roles or money, and GraphQL,
  are refused: note them as manual checks.
- PUT, PATCH and DELETE only touch records this run created (taken from the POST response).
- Credentials come from environment variables. The driver never returns them, and the session
  cookie or token is hidden in every response. The write gate blocks shell commands that print
  environment variables or name the login variables, so Claude cannot read them that way either.
