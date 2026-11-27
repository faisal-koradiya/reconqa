# Tracker adapter: Jira (Atlassian's MCP server)

> **Not yet tested on a real account.** Built from the public API documentation and tested
> against a fake server, with every safety check covered by automated tests. Please open an issue
> if something doesn't work on your site.

ReconQA files bugs to Jira through Atlassian's own remote MCP server. Connect it once (it opens a
browser to log in to your Atlassian site with your own account):

    claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp

Then set in `.reconqa/kit.yml`:

    capabilities:
      tracker:
        tool: jira
        server_prefix: mcp__atlassian__   # the prefix your install uses (mcp__<name you chose>__)
        project: QA                       # the Jira project key; writes to any other project are denied
        site: yourteam.atlassian.net      # your Atlassian site (or its cloudId); other sites are denied
    tracker_policy:
      filing: file-after-approval         # default draft-only: nothing is ever filed

Use a test project (or a project your lead agreed to) while you try it.

## What the write gate does (tool map: `jira.json`)

- Reads (`getJiraIssue`, `searchJiraIssuesUsingJql`, issue types, fields) pass.
- **Creating an issue or a comment is asked every time, with the payload shown.** It is denied when
  `filing: draft-only`, when the site is not `site`, when the project is not `project` (a create's `projectKey`, or the prefix
  of an issue key like `QA-12`), when only a numeric issue id is given (it can't be checked), when
  an assignee is set and `tracker_policy.assignee` is not `allowed`, when the text holds a token or
  a real person's email, or when the same payload was already sent.
- Transitions (moving or closing an issue), worklogs, issue links and Atlassian's generic
  "execute" tools are denied, like deletes.
- Confluence and any other tool on this server are denied. Jira tools on a **second** Atlassian
  connection (another name in Claude Code) are denied too: their target can't be checked.
- Shell routes (`curl … /rest/api/…` with POST) are denied; use the MCP tool.

## Filing a draft

`/reconqa:draft-bug` writes the draft first (`qa/bugs/<name>.md`). To file it, ask "file this bug".
ReconQA reads the project's issue types and required fields, builds the payload (summary, a
description with steps, expected, actual, environment and evidence; issue type Bug unless the
project has none), shows it, and calls `createJiraIssue` only after you approve the gate's
question. The issue key goes back into the draft as `Filed: <link>`.

Screenshots are not uploaded (the MCP server has no attachment tool); the description names the
file in `qa/bugs/shots/`.
