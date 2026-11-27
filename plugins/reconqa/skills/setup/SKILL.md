---
name: setup
description: First-time ReconQA setup for a project. Asks three questions (app URL, Android app and device, or API base URL; how login works; which browser helper) and whether the team has old test cases or a manual, detects the tracker, then writes .reconqa/kit.yml after the user approves the diff. Use when the user runs /reconqa:setup or asks to set up or configure ReconQA in a project that has no .reconqa/kit.yml yet.
allowed-tools: Bash(node:*), Read, Write, Edit, Glob
---

# Set up ReconQA (v0.1: three questions)

Safe defaults cover everything else; the user can change any key in `.reconqa/kit.yml` later.
Run each script command exactly as written, one `node` command per Bash call.

## 1. Look first
- If `.reconqa/kit.yml` exists: show `node "${CLAUDE_PLUGIN_ROOT}/scripts/kit.mjs" show --project .`
  and ask whether to keep it. Only continue if the user wants to start again.
- Detect the tracker: if tools whose names start with `mcp__github__` (or another GitHub MCP
  server) are available, propose `github-issues` and ask for the `owner/repo`; otherwise `none`.
  Never guess a repo name.

## 2. Ask (one message, three questions and one optional)
1. **What you test and where.** A website: the **app URL**, e.g. `http://localhost:3000`, and whether
   it is `local`, `test`, `staging` or `production` (ReconQA will not explore production).
   An **Android app**: the app's package name (e.g. `org.example.app`) and the device serial from
   `adb devices` (e.g. `emulator-5554`); say an emulator is the safe default, and a real phone must
   be a test phone (`allow_real_device: true`). For Android, skip question 3: the driver is
   `android-adb` (`${CLAUDE_PLUGIN_ROOT}/adapters/app/android-adb.md`), and login means the test
   account already signed in on the device, so question 2 only needs the account label.
   An **API** (REST/JSON): the base URL (e.g. `http://localhost:3001`), its kind as for a website,
   and the path of an OpenAPI/Swagger file if the team has one. Skip question 3: the driver is
   `http-api` (`${CLAUDE_PLUGIN_ROOT}/adapters/app/http-api.md`). For question 2 ask how the API
   logs in (a token, or a login request with user and password) and the **names** of environment
   variables for them (e.g. `QA_API_TOKEN`); never the values.
2. **Login:** does exploring need a logged-in user? If yes, ask for a label for the test account
   (e.g. `qa-customer`); the session itself is saved after setup with `/reconqa:login`. Never ask for, accept or store a password. If the user pastes one, tell
   them it was not saved and suggest they change it.
3. **Browser helper** (which tool opens the app):
   - **Playwright** (default, recommended): its own clean browser, works without a screen.
   - **Your own Chrome** (Claude in Chrome extension): use it when installing Playwright is not
     allowed, or the login only works in your normal browser. Needs a separate test Chrome profile.
   - **Another tool**: only if a tool map for it exists in `${CLAUDE_PLUGIN_ROOT}/adapters/app/`
     (list the `.json` files there); otherwise point to `adapters/app/README.md` and use Playwright for now.
   Write `capabilities.app_driver.tool` only when it is not `playwright`.

4. **What you already have** (optional): "Do you have existing test cases (a CSV export from a
   spreadsheet or test tool) or a user manual (Markdown or text)?" Ask for the file paths, or say
   they can be added later. Don't read or import them now: importing needs the atlas first.

Also ask, as a yes/no with **no** as the default: may exploring create test data (sign up users,
add records)? Only offer yes for local or test environments.

## 3. Dry run, then write
Show the exact `kit.yml` you will write, for example:

    version: 1
    app:
      url: <url>
      environments:
        - name: <kind>
          url: <url>
          kind: <kind>
      auth:
        test_accounts: [<label>]     # or [] when no login
      test_data:
        allow_create: <true|false>
    capabilities:
      tracker:
        tool: <none|github-issues>
        repo: <owner/repo>           # only for github-issues
      app_driver:
        tool: <claude-in-chrome|…>   # only when not playwright

For Android, `app` has `target: android` and `android: {device: <serial>, package: <package>}`
instead of `url` and `environments`, and `app_driver.tool` is `android-adb`.
For an API, `app` has `target: api` and `api: {base_url: <url>, spec: <file>, token_env: <NAME>}`
(or `login: {path: <path>, body_env: {username: <NAME>, password: <NAME>}}`), and `app_driver.tool`
is `http-api`. Then show the user the guide's `claude mcp add reconqa-api --scope local -e …`
command to run themselves with the real values: the values never go in this chat or in kit.yml.

Write it only after the user says yes. Then:
1. Add these lines to the project's `.gitignore` if missing (show them first):
   `.reconqa/kit.local.yml`, `.reconqa/.compiled.json`, `.reconqa/pending/`, `.reconqa/work/`, `.reconqa/auth/`,
   `qa/atlas/**/shots/`
2. Validate: `node "${CLAUDE_PLUGIN_ROOT}/scripts/kit.mjs" compile --project .` and fix any error
   with the user.
3. Pre-flight: `node "${CLAUDE_PLUGIN_ROOT}/scripts/preflight.mjs" --project .`
4. If the user needs a login, run the `/reconqa:login` steps now (or tell them to run it next).
5. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs" --project .` and walk the user through every
   `[FAIL]` (usually: register the browser helper or Android driver with the exact command it prints, then restart
   Claude Code). Offer the allow rule from its `[warn]` line for `.claude/settings.local.json`
   (show it; write only on yes). The user runs helper commands themselves.
6. Tell the user what's next, depending on question 4:
   - **They have old cases or a manual** (the usual case on an existing product): explore the areas
     those cover (`/reconqa:explore <area>`, one area at a time), then
     `/reconqa:kb import <file>` for each file. The first result is the **conflict list**: where the
     old cases and the manual no longer match the app. Then `/reconqa:kb build` for the feature map.
   - **Nothing yet**: `/reconqa:explore <area>`, then `/reconqa:write-cases <ticket>`.
   Also: `/reconqa:doctor` any time something seems wrong, and where to change settings later.
