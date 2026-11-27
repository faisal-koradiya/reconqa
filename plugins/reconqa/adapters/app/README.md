# App drivers

The app driver is the tool ReconQA uses to open and use your app. Pick one in `.reconqa/kit.yml`
under `capabilities.app_driver.tool`:

- `playwright` (default): its own clean browser; works without a screen. See `playwright.md`.
- `claude-in-chrome`: your own Chrome window through the Claude in Chrome extension. See `claude-in-chrome.md`.
- `android-adb`: ReconQA's built-in Android driver (emulator or test phone). See `android-adb.md`.
- `http-api`: ReconQA's built-in REST/JSON API driver. See `http-api.md`.
- `none`: no browser; exploring and running cases are off.
- **Any other tool** with an MCP server: add a tool map (below).

## Adding another driver

Every driver needs two files here, named after it (lowercase, dashes):

1. `<name>.json`, the tool map the write gate reads:

        {
          "default_prefix": "mcp__<server name>__",
          "target": "web",
          "allow": ["<tools that read or use the app>"],
          "ask":   ["<tools that run code, upload files or change stored state>"],
          "deny":  ["<tools that must never run>"],
          "ask_reasons":  { "<tool>": "<what it does, in plain words>" },
          "deny_reasons": { "<tool>": "<why it is blocked>" }
        }

   **Every tool the server has must be in one of the three lists.** A tool that is not listed is
   blocked, so a new server version cannot slip in an unchecked tool. List the server's tools with
   `/mcp` in Claude Code.
2. `<name>.md`, a short guide: setup, how login works, and a table of which tool does what. The
   skills read it to know the tool names.

Then set `capabilities.app_driver.tool: <name>` and run `node scripts/kit.mjs validate` and
`npm test` in the ReconQA folder. `target` must match `app.target` in your kit (`web`, `android` and `api` work today).
