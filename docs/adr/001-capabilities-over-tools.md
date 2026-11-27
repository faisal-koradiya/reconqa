# ADR-001: Skills name capabilities, not tools

Status: accepted (2026-11-26)

## Context
QA teams use very different tools: GitHub Issues or Jira or Linear for bugs; spreadsheets, CSV or a test
management tool for cases; Slack, email or nothing for status. A QA plugin that names one tool inside
its skills only fits teams that use that tool, and every new tool means editing every skill.

## Decision
- Skills talk about **capabilities**: `tracker`, `test_management`, `docs`, `comms`, `app_driver`.
- `.reconqa/kit.yml` maps each capability to a tool (`tool: github-issues`, `tool: csv`, `tool: none`).
- Everything tool-specific lives in one adapter per tool: `plugins/reconqa/adapters/<capability>/<tool>.md`.
  - **Frontmatter** (machine-readable): default MCP server prefix, each tool name with `read | write | delete`,
    field paths (status, assignee, links), tested server version. Hooks read this; they never guess.
  - **Body** (for the model): when to use which tool, known quirks.
  - **Scripts** for anything that must be exact: field mapping, rich-text conversion, counting nested folders.
- `tool: none` is always allowed. Skills skip that step cleanly and fall back (local file, pasted ticket text).
- At most two maintained adapters per capability; others are labelled "community".

## Consequences
- A new tool = one adapter file (+ scripts), no skill changes.
- Hooks can enforce rules on any tool because adapters declare which calls write or delete.
- Cost: an extra layer of indirection; adapters must be kept in step with MCP server versions
  (`doctor` checks that the declared tool names still exist).
