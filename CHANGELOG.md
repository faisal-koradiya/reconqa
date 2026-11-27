# Changelog

All notable changes to ReconQA. Versions follow semver.

## [0.1.0] - 2026-11-27

First public release.

### Added
- Android apps: a built-in driver (adb, one device and one app, emulator by default); explore, write and run cases on Android.
- REST APIs: a built-in driver (one server, writes only on test servers, changes only its own records, login from environment variables); team API specs are compared with what the server does.
- Learn from similar features: cases written before a screen exists borrow exact texts from a similar, already explored screen, marked as borrowed; `kb similar`.
- Extreme mode, `/reconqa:break`: odd inputs from a fixed catalogue, double and repeated actions, malformed API requests, and a seeded in-app monkey on Android; break reports with steps and evidence.
- Jira bug filing through Atlassian's official MCP server, pinned to one site and project (not yet tested on a real account).
- TestRail upload, `/reconqa:upload`: cases and run results, always previewed first; adds only (not yet tested on a real account).
- Evals for Android, API, similar features and extreme mode (`evals/`).

### Security
- Review fixes for the Android, API, Jira, TestRail and extreme-mode work: risky POSTs refused, strict own-record detection, logcat limited to the app, in-app checks before typing and after every monkey tap, shell commands that print environment variables blocked, Jira writes from other Atlassian connections denied, TestRail approvals show a protected saved preview, secrets and real emails never uploaded.


### Security (earlier in 0.1.0)
- Review fixes for phase F: the gate asks before ReconQA's own scripts write the knowledge base or convert pre-UI text, and before interpreter one-liners write protected files; reconcile re-checks the plan and keeps paths inside the project; sources are pinned to their folders; driver tools are recognised by name under any prefix; session-revealing browser tools are asked; imports with real email addresses are refused unless allowed; quoted text is refused in decisions.

### Added
- README rewritten for starter testers (what it is in plain words, a "do these three things first" box for existing products, a short word list, results as plain sentences, one-paragraph costs, how to undo) and a new 41-second story GIF showing the existing-product path.
- Second test app (`evals/second-app/`): the same skills on Actual Budget, an open-source budgeting app run locally: explore (schedules, rules), import of 30 old cases in another export layout (9/9 planted found), write-cases, pre-UI cases and reconcile (11/11). `.reconqa/work/` is now gitignored.
- Docs: user guide and technical specification cover the existing-system path (import, conflict list, knowledge base, decisions, pre-UI cases, reconcile), with the starter-persona fixes (ask your lead before importing company documents, how to read the conflict list, how to undo); `scripts/check-docs.mjs` checks every command, script and config key the docs name.
- Evals for the existing-system path (`evals/kb/`, `evals/reconcile/`): import, reconcile and knowledge-base runs, 3 each with the spread reported, and a CI gate re-scoring the saved outputs (`scripts/check-evals-kb.mjs`).
- `/reconqa:reconcile <cases file>`: once the screen exists, `reconcile.mjs` sorts every ‹expected› text into confirmed, different or not found; the model may only re-sort different and not-found items (checked by `check-plan`); after the user approves, only confirmed texts become «screen text» and a report lists the differences as questions. Answer key and scorer (`evals/reconcile/`, `scripts/score-reconcile.mjs`).
- Cases before the screen exists: `write-cases --pre-ui` (or no atlas and the screen not built) marks expected screen text as `‹expected: text [src: ticket:…#AC3]›`; `check-cases` verifies each one word for word against its ticket, manual or imported source and refuses «» in such files; the gate asks when «» is added to them; `run-cases` warns about open expectations.
- Skills use the knowledge base: `/reconqa:kb build` (feature map from atlas, cases, tickets and bug drafts, confirmed by the user) and `/reconqa:kb answer` (records a team decision through `kb.mjs add-decision`, dry run first); `write-cases` loads the feature's decisions and known issues and does not ask answered questions again; `draft-bug` stops on an open known issue; `check-cases` verifies cited decisions and known issues exist and are still active. Example: a follow-up ticket and its cases.
- Import of existing material: `/reconqa:kb import <file>` for old test cases (CSV; common export column names) and manuals (Markdown, text). The script copies the file to `qa/sources` (refused if it holds a password or token), splits it into cases or sections with references, flags command-like text (kept as data, never followed), and compares quoted text with the atlas; the skill writes a conflict report (outdated case, manual vs app, not in app, needs a decision) that `kb.mjs check-import` verifies word for word. Imported cases count toward coverage. Example: 100 old cases and a manual for Juice Shop with planted outdated items, the reports from a live run, and a scorer (`scripts/score-import.mjs`).
- Feature knowledge base format (`qa/kb`): index, overview, decisions, known issues, generated coverage; templates; `check-kb.mjs` (sources exist, quotes word for word, index and folders agree, no secrets, decisions are intent only and go stale when the cited atlas fact changes, token cap, coverage up to date); `kb.mjs` (init, new-feature, coverage, stamp, search, load); the gate asks before model writes to the KB; Juice Shop example KB.
- Safety base for more targets: the write gate loads every app driver tool map (`adapters/app/*.json`) and denies any tool on a driver prefix that the map doesn't list; risky browser tools (run JavaScript in the page, upload files, change cookies or storage) are asked. Shell writes to devices are blocked (`adb install/push/shell…`, `mosquitto_pub`, `mqtt pub`, serial-port writes and terminals). `app.target` in the config (only `web` works today).
- Browser helper choice: Playwright (default), your own Chrome through the Claude in Chrome extension, or any tool with its own map (`adapters/app/README.md`). Setup asks; doctor and login follow the choice.
- `test-data.mjs`: really random prefixed test emails and names for explore and run-cases. Found in testing: the model's own "random" email repeated one from an earlier run, and the app correctly refused it as a duplicate.
- `run-cases` skill: runs written cases in the browser, pass/fail/blocked/observed per step with the actual result, screenshots for failures, report written case by case; `check-run.mjs` validates the report against the cases file and writes a CSV; `run` settings and `output.runs`.
- Beginner path: `login` skill (opens a browser window, the user logs in with a test account, the session is saved without ReconQA seeing the password; old session kept until the new one is valid) and `doctor` skill + script (Node, settings, app, saved login incl. expiry, git-ignore and file permissions, browser helper args vs kit, allow rule, tracker, gate; prints the exact fix). `setup` now ends with the doctor. Juice Shop example's browser helper uses the saved session.
- Docs: technical guide and beginner user guide, rewritten for testers new to AI after two starter-persona reviews; README redesign with a 37-second walk-through GIF (`docs/media/make-story.mjs`) and the side-by-side GIF.
- M3 bugs + safe writes: `draft-bug` skill (reproduce twice, screenshot, live version, check script); write gate hooks (ask with payload, deny deletes/closing/other repos/assignees/duplicates/secrets/real emails/shell routes, config edits asked, fails closed, no effect outside ReconQA projects); GitHub Issues tool map.
- M2 write cases: `write-cases` skill (ticket + atlas, mismatch list, open questions), case templates (Markdown, CSV), grounding check, case checker, mismatch scorer, 6 fixture tickets with labels, CI gate over committed outputs.
- M1 explore: `explore` and `setup` skills, Playwright adapter, pre-flight check, test-data policy (`app.test_data`, environment kinds, `extra_origins`), recall scorer, Juice Shop demo setup, frozen example atlas.
- Spikes: hook proof (headless, fake MCP server) and explore measurements.
- M0 security hardening: compiled config re-derived and checked, dangerous keys rejected, guardrails cannot be weakened by any layer, secret scan per layer, safe paths, parser depth cap, rule regex checks.
- M0 foundations: MIT licence, ADR-001 (capabilities) and ADR-002 (config layers + gated writes), review-gate personas, plugin + marketplace manifests, config schema (`kit.yml`), defaults, a dependency-free YAML-subset parser, config validator/compiler, plugin structure check, CI.
