---
name: upload
description: Send ReconQA test cases, or the results of a test run, to the team's test management tool (TestRail), always as a preview the user approves first. Use when the user runs /reconqa:upload <cases file or run report> or asks to put cases or results into TestRail.
argument-hint: <qa/cases/<name>.md | qa/runs/<name>-<date>.md> [--refs <ticket key>]
allowed-tools: Bash(node:*), Read, Glob
---

# Upload cases or results to test management

1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/kit.mjs" compile --project .` (stop on errors). Read
   `capabilities.test_management.tool`:
   - `testrail`: continue below. Tool names are in
     `${CLAUDE_PLUGIN_ROOT}/adapters/test-management/testrail.md`.
   - `csv` or `none`: nothing to upload; say the cases are already saved as CSV next to the .md
     (for `csv`) for the user to import by hand. Stop.
2. If the TestRail tools are missing, stop and suggest `/reconqa:doctor`.
3. Call the info tool once and tell the user which project and section the cases go to.
4. **Cases** (a file in `qa/cases/`): check it first with
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-cases.mjs" --project . <file>`; stop on problems.
   Pre-UI cases (header `Atlas: none yet`) can be uploaded, but say their expected texts are not
   checked yet. Call the preview tool with the file (and `refs` if the user gave a ticket key).
   **Results** (a run report in `qa/runs/`): check it with
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/check-run.mjs" --project . <report>`; the report's
   `Cases:` line names the cases file. Call the results preview with both.
5. Show the preview to the user **as it is**: how many, which, what is skipped, and the payload.
   Ask "Send this to TestRail?". Only on a clear yes call the upload tool with that batch id. The
   write gate asks once more; that is expected.
6. Report what was created (case ids, or the run link). Never retry a failed upload without
   asking; a new preview is needed.
