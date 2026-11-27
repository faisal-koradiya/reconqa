# Built with Claude Code

How ReconQA was designed, built and tested with Claude Code, and what went wrong along the way.
For what the plugin does, see the [README](../README.md); for the design, the
[technical guide](TECHNICAL.md).

## The idea

AI writes test cases quickly, but from the ticket alone. When the ticket is wrong, the cases are
wrong too, and nobody notices until someone runs them. ReconQA turns the order around: **look at
the app first, write down exactly what it shows, and only then read the ticket**. Everything else
(old test cases, manuals, API specs, team answers) is checked against what the app really does.

## What is in it, by Claude Code feature

| Claude Code feature | Used for |
|---|---|
| **Plugin with skills** | 11 commands (`setup`, `explore`, `write-cases`, `run-cases`, `draft-bug`, `kb`, `reconcile`, `break`, `upload`, `login`, `doctor`), each a `SKILL.md` that tells Claude what to do and which checking scripts to run |
| **Hooks** | A `PreToolUse` write gate (`hooks/gate.mjs`) that sees every tool call: tool maps per driver with deny by default, asks with the exact payload before tracker writes, blocks shell routes around it (curl to a tracker, `adb shell`, printing environment variables), and protects its own approval state so the model cannot approve itself. A `PostToolUse` hook records approved writes |
| **MCP servers** | Uses Playwright MCP or Claude in Chrome for web apps, GitHub MCP for issues, and two servers written from scratch for **Android** (adb) and **REST APIs**, each 300 to 400 lines of Node with no dependencies |
| **Subagents** | Eight reviewer personas in `.claude/agents/`: AI lead, security and privacy, QA practitioner, product manager, first-time installer, clean-room auditor, and two beginner testers. They review at every milestone, given file paths only |
| **Headless mode** | `claude -p` runs the real skills against local practice apps with `--max-budget-usd` caps, for evals and repeat runs |
| **Project memory** | `CLAUDE.md` holds the working rules (clean room, every external write goes through an approved dry run) |

Plain Node scripts do everything that can be checked without a model: config validation,
grounding (does every quoted UI string exist in the atlas?), case and bug report rules, import
and reconcile plans, scoring. The model is used only where judgment is needed.

## How it was tested

- **209 automated tests**, run in CI on Windows, macOS and Linux with Node 20 and 22. The drivers
  are tested with a fake adb and a fake HTTP server, so CI needs no phone and no network.
- **Evals with hidden mistakes.** For each test I wrote an answer key before any AI run: outdated
  cases hidden among 100 old ones, wrong lines in a manual, mistakes in tickets and an API spec,
  and a hand-made list of facts about an Android screen. Then the real skills ran headless and
  were scored for what they found and what they wrongly claimed. Results and files are in
  [`evals/`](../evals/).
- **Review gates.** Each milestone ended with two persona reviews. For example, the security review
  of the Android and API drivers found 10 problems. Among them: a POST could reach records the run
  had not created, and logcat could return other apps' logs. All 10 were fixed with a test each
  before moving on.

Live eval runs together cost about $17 at API prices; each was capped.

## What went wrong, and what I changed

- **The explorer could not find its own instructions.** In the first Android run, the skill named
  the driver guide through a path variable that was not expanded, so the model worked without it
  and missed an accessibility finding. Fix: the pre-flight script now prints the guide's absolute
  path. The next run read it and found the issue (80% → 84% of the facts).
- **Field errors on Android hid from the accessibility tree.** "Cannot be blank" lives in a popup
  window that a normal UI dump leaves out; it only appears with `uiautomator dump --windows`, and
  only after tapping the field. Found by hand before writing the driver, now in the guide.
- **A second phone was plugged in.** During the Android work a personal phone was connected
  next to the emulator. A community Android MCP server I compared can switch devices, so I
  wrote a driver that is pinned to one device serial on every call and refuses real phones unless
  allowed.
- **An eval measured its own earlier answer.** Repeat runs at first copied a folder that still
  held the previous run's report, and the model reused it. Lesson: eval copies must start clean.
- **My answer key was wrong once.** I had marked a ticket line as a mismatch; the model called it
  a match in meaning and was right. I corrected the key and wrote down why.
- **A promise in the docs was not quite true.** The API guide said the model never sees login
  values. But values exported in the terminal are visible to Claude's own shell too. Fix: give them
  only to the driver (`claude mcp add -e …`), block shell commands that print environment variables,
  and say honestly in the guide what is and is not protected.

## Clean room

This is a personal project. Nothing comes from any employer or client: all examples use public
open-source practice apps (OWASP Juice Shop, Cypress Real World App, Actual Budget, Loop Habit
Tracker), every text was written fresh, a pre-commit hook blocks a list of words, and a
clean-room reviewer checks every file before release.
