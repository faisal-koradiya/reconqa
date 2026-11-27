---
name: login
description: Save a logged-in browser session so ReconQA can explore pages behind a login. Opens a browser window where the user logs in with a test account themselves; ReconQA never sees, asks for or stores the password. Use when the user runs /reconqa:login, when exploring stops at a login page, or when the doctor says the saved login is missing or expired.
argument-hint: "[start page URL, if the login page is not the app's home page]"
allowed-tools: Bash(node:*), Read, Edit
---

# Save a login for exploring

Never ask for, accept, type or store a password. If the user pastes one, tell them it was not
saved and suggest they change it.

## 1. Before opening the browser
1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/kit.mjs" compile --project .` (stop on errors; if there is
   no `.reconqa/kit.yml`, tell the user to run `/reconqa:setup` first).
2. Tell the user, in plain words:
   - a browser window will open on their app;
   - log in with a **test** account (not their personal or an admin account), wait until the app
     shows they are logged in, then close the window;
   - they have up to 9 minutes.
   Wait for them to say they are ready.

## 2. Save
Run as one Bash call, and give it a long timeout (10 minutes), because it waits for the user:

    node "${CLAUDE_PLUGIN_ROOT}/adapters/app/<capabilities.app_driver.tool>-login.mjs" --project .

Add `--url <url>` only if the user gave a start page. Read `capabilities.app_driver.tool` from the
compiled config (default `playwright`). If no `<tool>-login.mjs` exists for that driver, do not run
anything: follow the "Login" section of `${CLAUDE_PLUGIN_ROOT}/adapters/app/<tool>.md` (for your own
Chrome, the user logs in in their test profile and nothing is saved) and stop here. If the script says no screen is available, show the user
its manual command and stop.

The script prints only counts and an expiry date. Never open, print or quote the saved file.

## 3. Make exploring use it
1. If the script warns that the file is not ignored by git, offer to add `.reconqa/auth/` to
   `.gitignore` (show the line; write only on yes).
2. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs" --project .` and help the user fix any
   `[FAIL]` about the browser helper (usually: it must be given the saved session, then Claude Code
   restarted). The user runs helper commands themselves.
3. Tell the user: the session expires like any login; when exploring lands on a login page again,
   run `/reconqa:login` again.
