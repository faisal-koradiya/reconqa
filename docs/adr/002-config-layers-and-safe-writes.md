# ADR-002: Config layers, compiled config, and gated writes

Status: accepted (2026-11-26)

## Context
Teams differ in case style, bug templates, words they avoid, and how careful the agent must be with their
tools. The plugin must fit each team without code changes, and must never write to a team's tracker
without the user's say-so. A rule that only lives in a prompt is followed most of the time, not always.

## Decision: config
- One readable YAML file per layer, merged in order (later wins):
  1. plugin defaults `plugins/reconqa/templates/kit.default.yml`
  2. team `.reconqa/kit.yml` (committed)
  3. personal `.reconqa/kit.local.yml` (gitignored; v0.2)
  Maps merge key by key; lists and scalars replace.
- Checked against `schema/kit.schema.json`. Errors name the file and line, and suggest the closest key for typos.
- Secret-looking values are refused. Credentials live in env vars or MCP config only.
- YAML is parsed by a small bundled parser (`scripts/lib/yaml-lite.mjs`) that supports a documented subset,
  so the plugin needs no installs. Unsupported YAML (anchors, tags, multiple documents) fails with a clear message.
- `kit.mjs compile` writes `.reconqa/.compiled.json` with a hash of every source layer.
  Hooks read only this file and **refuse to act** if it is missing or its hash no longer matches
  (someone edited `kit.yml` and didn't recompile). Skills compile automatically at start.

## Decision: writes to external tools (built in M3, designed now)
1. A skill that wants to write first saves a dry run (target, operation, payload, fingerprint) under `.reconqa/pending/`.
2. Approval comes only from the user: Claude Code's own permission prompt, or the user typing `approve <id>`.
   The model cannot write to `.reconqa/pending/`.
3. On the write call, the hook checks the fingerprint, replaces the call's input with the approved payload,
   and marks the dry run used, so a retry can't create a duplicate.
4. Hooks fail closed: any error blocks the write with a clear message.
5. Routes around the gate are blocked: unlisted tools on a gated server, tracker writes through the shell, deletes.
6. `guardrails.require_approval` cannot be turned off in v0.1 (the schema only allows `true`).

## Consequences
- Teams change behaviour by editing YAML; no forks.
- A hand edit that breaks the config is caught with a file:line message instead of odd behaviour.
- Writes are safe against mistakes and prompt injection. They are not safe against a determined user or
  model with unrestricted shell access; the README states this limit.
- Cost: a compile step, and a small parser to maintain. The spike in M0+ proves the hook properties before M3.
