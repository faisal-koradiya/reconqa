# Test management: TestRail (built-in helper)

> **Not yet tested on a real account.** Built from the public API documentation and tested
> against a fake server, with every safety check covered by automated tests. Please open an issue
> if something doesn't work on your site.

ReconQA's own small TestRail helper, `drivers/testrail/server.mjs` (Node only). TestRail has no
official MCP server, so the helper talks to TestRail's public REST API (v2). It only **adds**:
test cases, and test runs with results. It never edits or deletes anything in TestRail.

## Quick start for testers

1. In TestRail, open *My Settings → API Keys* and create a key. Ask your admin if API access is off.
2. Note three numbers from TestRail addresses: the project id, the section id where new cases
   should go (and the suite id, only if your project has several suites).
3. Add to `.reconqa/kit.yml` (or ask in plain words and ReconQA shows the change first):

        capabilities:
          test_management:
            tool: testrail
            base_url: https://yourteam.testrail.io
            project_id: 3
            section_id: 7
            user_env: TESTRAIL_USER        # names of settings, not the values
            key_env: TESTRAIL_API_KEY

4. Connect the helper, giving it your email and key (only the helper gets them; replace the parts
   in angle brackets, including the brackets), then restart Claude Code:

        claude mcp add reconqa-testrail --scope local -e TESTRAIL_USER=<your email> -e TESTRAIL_API_KEY=<your key> -- node <ReconQA plugin folder>/drivers/testrail/server.mjs

5. Run `/reconqa:doctor`, then `/reconqa:upload qa/cases/<name>.md`.

## How uploading works

Every upload has two steps. First a **preview**: ReconQA builds exactly what it would send and
shows it (titles, steps, priorities, what is skipped because it is already in TestRail). Nothing is
sent. If you say yes, the **upload** sends that preview, and Claude Code asks you once more.

- Case titles start with the ReconQA case id (`TC-REG-001 …`), so a second upload skips cases that
  are already there.
- Steps go into separate steps with expected results (template "Test Case (Steps)").
- Priorities: the first in your case scale (P1) becomes TestRail's highest priority, and so on.
- After upload, `qa/cases/<name>.testrail.json` remembers which TestRail case belongs to which
  ReconQA case, so `/reconqa:upload qa/runs/<report>.md` can add a test run with pass, fail and
  blocked results to the right cases.

| Need | Tool |
|---|---|
| Check the connection | `testrail_info` |
| Preview cases | `testrail_preview_cases` (`file`, optional `refs`) |
| Preview a run with results | `testrail_preview_results` (`file`, `cases`) |
| Send a preview (asked) | `testrail_upload` (`batch`) |

## Safety

- Only `base_url` (https, or localhost) is contacted; the API key is sent only there.
- The email and key come from environment variables given to the helper; error messages hide the key.
- The helper has no edit or delete tools; the write gate blocks any tool not in `testrail.json`.
