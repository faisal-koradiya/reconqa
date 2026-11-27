# App driver adapter: Playwright MCP

Tested with `@playwright/mcp` 0.0.85. Tool names below assume the server is installed as
`playwright` (prefix `mcp__playwright__`); if yours differs, set `capabilities.app_driver.server_prefix`.

Recommended server flags: `--isolated --allowed-origins "<app url>;<each app.extra_origins>"` (keeps
the browser on your app; a separate API host must be listed or every API call is blocked),
`--image-responses omit` (screenshots go to files, not into the conversation; saves tokens),
and `--output-dir` outside the atlas folder (it also collects snapshots and console logs).
Add `--headless` for unattended runs, `--storage-state <app.auth.browser_state>` for a logged-in start.

Add it to a project (local scope, run in the project folder):

    claude mcp add playwright -- npx -y @playwright/mcp@0.0.85 --isolated --headless \
      --allowed-origins "http://localhost:3000" --image-responses omit --output-dir .playwright-output

Add `--storage-state .reconqa/auth/state.json` once that file exists (a logged-in start).
To avoid a prompt on every browser step, allow its tools in `.claude/settings.local.json`:
`{"permissions": {"allow": ["mcp__playwright__*"]}}` (use your prefix if you named the server differently). Example: `examples/juice-shop/.mcp.json`.

| Need | Tool |
|---|---|
| Open a URL | `browser_navigate` |
| Read the page as text (preferred) | `browser_snapshot` |
| Click / type / choose / press | `browser_click`, `browser_type`, `browser_select_option`, `browser_press_key` |
| Fill several fields | `browser_fill_form` |
| Evidence screenshot | `browser_take_screenshot` (give a `filename`) |
| Wait for text or time | `browser_wait_for` |
| Console errors | `browser_console_messages` |
| Close | `browser_close` |

Safety notes: tools that read cookies, storage or full request headers are asked by the ReconQA
gate (they can show login tokens). Keep `--output-dir` outside the project or gitignored: traces,
videos and snapshots can contain personal data. When a page asks "are you sure?" before deleting
or paying, dismiss the dialog (`browser_handle_dialog` with accept false) unless the step is allowed.
