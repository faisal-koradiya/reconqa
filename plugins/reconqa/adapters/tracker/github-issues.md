# Tracker adapter: GitHub Issues (GitHub MCP server)

Install the GitHub MCP server for the project and set in `.reconqa/kit.yml`:

    capabilities:
      tracker:
        tool: github-issues
        server_prefix: mcp__github__   # the prefix your install uses
        repo: owner/name               # writes to any other repo are denied
    tracker_policy:
      filing: file-after-approval      # default draft-only: nothing is ever filed

What the write gate does with this server (tool map: `github-issues.json`):
- Reads (`get_issue`, `list_issues`, …) pass.
- Writes (`create_issue`, `update_issue`, `add_issue_comment`, `issue_write`) are **asked** every
  time, with the payload shown; denied when `filing: draft-only`, when the repo is not `repo`, when
  an assignee is set and `tracker_policy.assignee: never`, or when the same payload was already sent.
- Closing an issue counts as a delete. Deletes are always denied.
- Any other tool on this server is denied.
- Shell routes (`gh issue create`, `gh api … -X POST`, `curl -X POST …`) are denied; use the MCP tool.
