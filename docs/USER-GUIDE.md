# ReconQA user guide

For testers who are new to AI tools. You don't need to know how AI works or how to program. If you
can copy a command into a window and press Enter, you can use ReconQA.

The whole setup takes about 20 minutes, and you do it once. Your first try uses a practice app
that comes with ReconQA, so you can't break anything at work while you learn.

## Contents

1. [What ReconQA does](#1-what-reconqa-does)
2. [Words you'll see](#2-words-youll-see)
3. [What you need](#3-what-you-need)
4. [Install, step by step](#4-install-step-by-step)
5. [Your first try (10 minutes, no app needed)](#5-your-first-try-10-minutes-no-app-needed)
6. [Using it on your own app](#6-using-it-on-your-own-app)
7. [Reading what it gives you](#7-reading-what-it-gives-you)
8. [Filing a bug](#8-filing-a-bug)
9. [Permission questions: when to say yes](#9-permission-questions-when-to-say-yes)
10. [Cost and usage](#10-cost-and-usage)
11. [When something goes wrong](#11-when-something-goes-wrong)
12. [Questions people ask](#12-questions-people-ask)

## 1. What ReconQA does

Think of a new tester joining your team. Before writing any test cases, a good one opens the app,
clicks around, types wrong things into forms and writes down every message the app shows. Only
then do they read the ticket and write cases. When the ticket says one thing and the app does
another, they ask the team which one is right.

ReconQA does the same, using Claude (an AI assistant made by Anthropic) to do the clicking and
writing.

**On a product that already exists** (most teams), the first job is usually the old material: test
cases written over the years and a user manual. ReconQA explores the app, then reads your old cases
and manual and gives you a **conflict list**: every place where they no longer match the app. The
team's answers go into a **knowledge base**, so the same question isn't asked twice. See
[6.5](#65-bring-in-old-test-cases-and-the-manual).

**For each ticket:**

1. **Explore.** It opens your app in a browser, tries the screens you name, and writes down what it
   sees in a notes file called the atlas.
2. **Write cases.** You give it a ticket. It writes test cases using the real text from the atlas,
   in your team's format, and lists every place where the ticket and the app disagree.
3. **Run cases.** It can run those cases in the browser for you and mark each step pass or fail.
4. **Draft bugs.** When a test step fails, it reproduces the problem, takes a screenshot and writes
   a full bug report. It sends the report to your bug tracker only if you say yes.

Everything it writes is a normal text file on your computer. You read it, change it and decide
what to do with it.

**Bug trackers.** ReconQA can send bug reports to GitHub Issues (after you approve each one). If
your team uses Jira, TestRail or something else, you still get the test cases (also as a CSV file
for import) and the bug reports as files, and you copy them in yourself.

## 2. Words you'll see

| Word | What it means |
|---|---|
| Claude | The AI assistant that does the work. |
| Claude Code | A program from Anthropic that lets Claude work with files and tools on your computer. You type to it in a terminal. |
| Terminal | A window where you type commands. On Windows it's called PowerShell or Terminal; on Mac, Terminal. |
| Plugin | An add-on for Claude Code. ReconQA is a plugin. |
| Command | Something you type that starts with `/`, like `/reconqa:explore`. |
| MCP server | A small helper program that gives Claude a new ability, such as using a browser or talking to GitHub. |
| Atlas | ReconQA's app notes: screens, fields, rules and the exact messages it saw. One file per area of the app. |
| Settings file (kit) | ReconQA's settings for your project, in `.reconqa/kit.yml`. You can ask Claude to change it for you in plain words. |
| Mismatch | A place where the ticket and the app disagree. |
| Conflict list | The list of places where your old test cases or manual no longer match the app. |
| Knowledge base | ReconQA's notes per feature (in `qa/kb/`): what the team decided, which bugs are already known, which cases cover what. |
| Decision | An answer from your team to a question ("the minimum stays 5 characters"), kept with who decided and when. |
| Pre-UI cases | Test cases written before the screen exists. Texts taken from the ticket are marked ‹expected: …› until they are checked against the real screen (with `/reconqa:reconcile`). |
| Grounded | A test case is grounded when every exact app text in it was really seen in the app. |
| Gate | ReconQA's safety check. It asks you before anything is sent to your bug tracker, before the knowledge base changes, and before risky browser actions. Its questions start with "ReconQA:". |
| Production | The live site real customers use. ReconQA never works on it. |
| Test or staging server | A copy of the app for testing. This is where ReconQA works. |
| Token | The unit Claude's usage is measured in. More work means more tokens. |

## 3. What you need

- A computer with macOS, Windows or Linux.
- A Claude account that includes Claude Code (the Pro, Max, Team and Enterprise plans do). Not
  sure? Ask your lead: "Do I have a Claude account that includes Claude Code?" 
- **Node.js** version 20 or newer. It's a free program that runs ReconQA's small helper scripts.
- **Google Chrome**, for the browser ReconQA drives (for websites; not needed for an API).
- For an Android app only: Android's `adb` tool (it comes with Android Studio), and an emulator or
  a test phone.
- **Git**, to download ReconQA. (You can also download the ZIP from GitHub instead.)
- For your own app (later, not for the first try): a web app, Android app or API you are allowed to test, on your
  computer, a test server or a staging server. ReconQA refuses to work on the live (production)
  site. Before you use it at work, ask your lead: "Can I run an AI testing helper against our test
  server?"

If your company laptop blocks installing programs, ask IT to install them. A message you can send:

> Hi, I'd like to try ReconQA, a free, open-source test case helper for Claude Code
> (github.com/faisal-koradiya/reconqa). Could you install Node.js (LTS), Google Chrome, Git and
> Claude Code (docs.claude.com/en/docs/claude-code) on my laptop? It runs only against our test
> servers. Thanks!

Then continue at section 4.3.

## 4. Install, step by step

Take your time with this part. You do it only once.

### 4.0 Open a terminal

A terminal is a window where you type commands instead of clicking.

- **Mac:** press Cmd and Space, type `Terminal`, press Enter.
- **Windows:** click Start, type `PowerShell`, press Enter.

Two things you'll use:

- You type a command and press Enter. Copy commands from this guide exactly. When a guide shows
  words in angle brackets like `<your app address>`, replace the whole thing, brackets included,
  with your own value.
- `cd` means "go into a folder". `cd Documents` goes into your Documents folder. A new terminal
  starts in your home folder.

### 4.1 Install Node.js

1. Go to [nodejs.org](https://nodejs.org) and download the **LTS** version.
2. Run the installer and accept the defaults.
3. Close the terminal, open a new one (so it sees the new program) and type:
   ```
   node --version
   ```
   You should see something like `v22.11.0`. Any number of 20 or higher is fine.

### 4.2 Install Claude Code

These commands come from Anthropic's official page,
[docs.claude.com/en/docs/claude-code](https://docs.claude.com/en/docs/claude-code/overview), where
you can check them. Use the one for your computer:

- **Mac** (Terminal):
  ```
  curl -fsSL https://claude.ai/install.sh | bash
  ```
  This downloads Anthropic's official installer and runs it. That's normal and safe to paste. It
  may ask for your Mac password (typing doesn't show on screen; press Enter after). It prints some
  lines while it works; wait until you get the prompt back.
- **Windows** (PowerShell):
  ```
  irm https://claude.ai/install.ps1 | iex
  ```
  Same as on Mac: Anthropic's official installer, safe to paste.

If typing `claude` afterwards says "command not found" (Mac) or "not recognized" (Windows), close
the terminal and open a new one, then try again.

If your company blocks these, ask IT to install Claude Code for you.

Then type `claude` in the terminal. The first time, it opens a browser page to sign in with your
Claude account. After that you'll see a prompt where you can type to Claude. Type `/exit` to leave.

### 4.3 Get ReconQA

If you don't have Git: on Mac, typing `git` in the terminal offers to install it; on Windows,
download it from [git-scm.com](https://git-scm.com). Then, in a new terminal:

```
cd Documents
git clone https://github.com/faisal-koradiya/reconqa.git
```

This creates a folder `Documents/reconqa` with ReconQA in it. (On Windows, `cd Documents\reconqa`
with a backslash works too.) Each new terminal starts in your home
folder, so later you type `cd Documents` first to get back here. (No Git? On the ReconQA GitHub page,
click **Code**, then **Download ZIP**, and unzip it into Documents as a folder called `reconqa`.)

### 4.4 Add ReconQA to Claude Code

Check you're in Documents: type `pwd` and press Enter. The last part of what it prints should be
`Documents`. If not, type `cd Documents`.

Start Claude Code by typing `claude`. Then type these two lines one at a time, pressing Enter after
each. The first tells Claude Code where the ReconQA folder is (a "marketplace" is just a place
Claude Code can install add-ons from); the second installs it:

```
/plugin marketplace add ./reconqa
/plugin install reconqa@reconqa
```

Each line should finish with a short success message. If you see an error instead, check that
`pwd` showed Documents and that a `reconqa` folder is there.

Restart Claude Code (type `/exit`, then `claude` again). Type `/reconqa` and you should see the
ReconQA commands in the list. Type `/exit` to leave.

## 5. Your first try (10 minutes, no app needed)

ReconQA comes with a finished example for a public demo shop called Juice Shop, so you can see
results before setting anything up.

1. Claude Code works on the folder you start it in, so first go into the example's folder:
   ```
   cd Documents/reconqa/examples/juice-shop
   claude
   ```
2. A question may appear about a new "MCP server" called `playwright` (the browser helper). Pick
   the option that says to continue **without** it: this first try doesn't need a browser.
   Nothing breaks.
3. Type:
   ```
   /reconqa:write-cases tickets/new-customer-registration.md
   ```
4. Claude will ask permission to run a few commands that start with `node`, with a question like
   "Do you want to proceed?" and numbered options. These are ReconQA's own checks. Pick **Yes**.
   If something asks for anything else and you're not sure, pick **No**. Nothing breaks.
5. After a minute or two it tells you where it saved the cases. Open
   `Documents/reconqa/examples/juice-shop/qa/cases/new-customer-registration.md`:
   - **Mac:** in Finder, right-click the file, choose Open With, then TextEdit.
   - **Windows:** right-click the file, choose Open with, then Notepad.
   (If you have VS Code, it shows the tables nicely.)

The ticket in this example has four mistakes on purpose. Look at the **Mismatches / questions**
table at the end of the file: ReconQA should have found them, for example that the ticket asks for
an 8-character password while the app accepts 5.

**Try the existing-product path too.** The example also has 100 old test cases and a short manual
with outdated parts hidden in them. Type:
```
/reconqa:kb import samples/old-cases.csv
```
It will say the file "already exists". That's normal: the example was imported once already. Type
this instead (`--replace` only redoes the example's own report):
```
/reconqa:kb import samples/old-cases.csv --replace
``` After a minute, open `qa/reports/import-old-cases.md` and look at the
**Conflicts** table: old cases that expect something the app no longer does.

## 6. Using it on your own app

Always start Claude Code **in your own project folder** (any folder where you want the QA files to
live), not inside the `reconqa` folder.

### 6.1 Set up (once per project)

```
/reconqa:setup
```

It asks three things:

1. **Your app's address**, for example `http://localhost:3000` or `https://test.example.com`, and
   what kind of server it is (local, test or staging).
2. **Whether the app needs a login** for the parts you want to test.
3. **Which browser helper to use** (the tool that opens your app):
   - **Playwright** (the default). It opens its own clean browser. Pick this if you're not sure.
   - **Your own Chrome**, through the Claude in Chrome extension. Pick this if your company doesn't
     let you install Playwright, or your app's login only works in your normal browser. Make a
     separate Chrome profile with only test accounts in it first.
   - **Another tool**, if someone on your team has added it to ReconQA (see
     `plugins/reconqa/adapters/app/README.md`).

It shows the settings it wants to save and waits for your OK. Then it runs the doctor (below) and
helps you fix anything missing. Usually that's one command to add the browser helper, which you
copy into a normal terminal in your project folder, then restart Claude Code.

### 6.2 Save a login (only if your app needs one)

```
/reconqa:login
```

(Using your own Chrome? Skip this: just log in to your app in your test Chrome profile.)

A Chrome window opens on your app. Log in with a **test** account, wait until the app shows you're
logged in, then close the window. ReconQA saves the login session (not your password) to
`.reconqa/auth/state.json`. It never sees what you type.

That file works like a key to the test account, so keep it private. ReconQA keeps it out of git.
Sessions expire like any login; when exploring lands on a login page again, run `/reconqa:login`
again.

### 6.3 Check everything with the doctor

```
/reconqa:doctor
```

It checks Node.js, your settings, whether the app answers, the saved login, the browser helper, the
tracker and the safety gate, and explains each problem with the exact fix. It changes nothing and
costs almost nothing. Run it whenever something doesn't work.

### 6.4 Explore an area

```
/reconqa:explore login and sign-up
```

Name the part of the app in plain words: "checkout", "profile settings", "search". ReconQA opens a
browser in the background, clicks through that area, tries empty and wrong input, and writes the
atlas file, for example `qa/atlas/login-and-sign-up.md`. This takes one or two minutes.

It won't make payments, change passwords or security settings, or delete anything. It only creates
test data (like a new user) if you allowed that in setup, and every name it creates starts with
`reconqa`.

Read the atlas once. If something is wrong, fix it in the file: it's your notes, and the next steps
trust it.

### 6.5 Bring in old test cases and the manual

Skip this if your team has none. Otherwise this is usually the most useful first result.

1. **Ask your lead first.** Old test cases and manuals are company documents. When you import them,
   Claude (Anthropic's AI) reads them, like anything you paste into a Claude chat. Never import
   files with customer data in them.
2. **Get the files.** Test cases: export them as CSV from your spreadsheet or test tool (Excel,
   TestRail, Xray, Zephyr and similar all can). Manual: save it as Markdown (`.md`) or text
   (`.txt`); for a Word file or PDF, use "Save as" or copy the text into a `.txt` file. ReconQA
   stops if it finds a password, a token or a real person's email address in a file. It can't spot
   customer names or phone numbers, so look for those yourself.
3. **Explore first** the areas the old cases are about (6.4). ReconQA only compares with what it has
   seen; cases about areas it hasn't explored are listed as "not checked".
4. **Import:**
   ```
   /reconqa:kb import exports/old-cases.csv
   /reconqa:kb import docs/user-manual.md
   ```
   ReconQA copies the file into `qa/sources/` and writes the conflict list to
   `qa/reports/import-<name>.md`. Each row shows the old text, what the app shows now (both copied
   exactly), the type (outdated case, manual vs app, not in the app, needs a decision) and a question
   for your team.
5. **Read the result.** Open the report and read the **Conflicts** table first: one row per
   difference. "Not checked" means ReconQA hasn't looked at that screen yet (explore it, then import
   again). The `[src: …]` tags say where each text came from, so anyone can check it.
6. It then offers to add the old cases to the knowledge base (so it knows what is already covered)
   and the parts of the manual that are still right. It shows the change first; say yes or no.

If an old case or the manual contains something that reads like an order to an AI ("ignore your
instructions"), ReconQA lists it under "Flagged text" and does not follow it.

### 6.6 Record your team's answers

When your team answers a question from the conflict list or a mismatch table:
```
/reconqa:kb answer minimum password length
```
ReconQA asks what was decided, who decided (a role such as "Product owner", never an email) and
when, shows the entry, and saves it after you say yes. **Record only answers you got in writing**
(a ticket comment, a message): a wrong decision makes ReconQA stop asking about something that may
be a real bug. Tell the team when you record one. From then on, `write-cases` follows that
answer instead of asking again. A decision is about what the team **wants**; the exact screen text
still comes from the atlas. If the app changes later, `/reconqa:kb check` marks the decision as
"stale" (may be out of date) so you know to ask again.

**Which `kb` commands do I need?** After an import, only `kb answer`, whenever your team decides
something. `kb build`, `kb search` and `kb check` are optional helpers.

To sort everything into features the first time: `/reconqa:kb build` (it proposes a list; you
confirm it). To look something up: `/reconqa:kb search duplicate email`.

### 6.7 Write test cases

```
/reconqa:write-cases tickets/my-story.md
```

You can give a file, or paste the ticket text right after the command. The result goes to
`qa/cases/` as a readable file and a CSV you can import into a spreadsheet or test tool. If the
knowledge base already answers one of the ticket's questions, it's listed under "Answered by the
knowledge base" instead of being asked again.

**The screen isn't built yet?** Add `--pre-ui`:
```
/reconqa:write-cases tickets/my-story.md --pre-ui
```
Exact texts from the ticket are then marked ‹expected: …› with where they came from, because
nobody has seen the screen yet. When the screen is ready, run
`/reconqa:reconcile qa/cases/my-story.md`: it checks every ‹expected› text against the real screen,
converts the ones that match (after you say yes) and lists the ones that changed as questions.

### 6.8 Run the cases

```
/reconqa:run-cases qa/cases/my-story.md
```

ReconQA runs each case in the browser, step by step, and writes down what the app actually did. Each
step gets **pass**, **fail**, **blocked** (it couldn't be done, for example a step that would need a
payment) or **not run** (an earlier step failed). Every failure gets a screenshot. You get a report
in `qa/runs/` and a CSV you can import into a test tool.

To run only some cases, add their IDs: `/reconqa:run-cases qa/cases/my-story.md TC-REG-001 TC-REG-004`.

The AI can misjudge a step, so look at each failure (the screenshot helps) before you report it.
For a real failure, the report gives you the next command to draft the bug.

### 6.9 Draft a bug

When a step fails while you test:

```
/reconqa:draft-bug TC-REG-004 step 2
```

or describe it in your own words. ReconQA tries the step twice, takes a screenshot, notes the app
version and writes `qa/bugs/<name>.md`.

### 6.10 Extreme mode: try to break it

Once an area is explored, `/reconqa:break <area>` spends a set number of steps trying to break
it: very long and strange text, emoji, double clicks on Save, Back in the middle of saving, wrong
types on an API, and on Android a random "monkey" that taps around inside your app (it asks you
first). Everything it finds goes into `qa/breaks/<area>-<date>.md` with steps to repeat it, and
`/reconqa:draft-bug qa/breaks/<file>.md #1` turns a finding into a bug report.

It only works on a test server where creating test data is allowed, and it never tries to log in
as someone else or see other people's data: that is security testing, which needs separate
permission.

### 6.11 Testing an Android app or an API

The commands are the same. Only setup is different: in `/reconqa:setup`, say what you test.

**An Android app.** ReconQA uses `adb`, the Android tool that talks to a phone or emulator (an
emulator is a pretend phone on your computer; Android Studio makes one). You need:

- the app installed on an emulator (recommended) or on a **test** phone with USB debugging on;
- the device name from `adb devices` (for example `emulator-5554`) and the app's package name
  (for example `org.example.app`; ask your developers if you don't know it).

ReconQA only taps inside that one app, on that one device. If your own phone is plugged in too, it
is left alone. A real phone is refused unless you say it is a test phone. Log in to the app on the
device yourself; ReconQA uses that login. Full details:
[Android driver guide](../plugins/reconqa/adapters/app/android-adb.md).

Good to know: on Android, many error messages only show as a red icon until you tap the field.
ReconQA knows this and taps each field to read the message.

**An API** (for example a REST service your app talks to). You need the API's address on a test
server, and, if your team has one, its OpenAPI or Swagger file (a document listing the API's
addresses and fields). ReconQA reads that file like a manual: it checks every claim against what
the API really answers, and lists where they disagree.

If the API needs a login, setup asks for the **names** of two settings, not the password itself.
You then run one command, shown by setup, that gives the test user and password to ReconQA's API
helper only. Claude never sees them. Full details:
[API driver guide](../plugins/reconqa/adapters/app/http-api.md).

On an API, ReconQA reads freely, creates test records only if you allowed it in setup, and only
changes or deletes records it created itself in the same run.

## 7. Reading what it gives you

**The atlas** has a section per screen, a table of fields with their rules, numbered rules (R1,
R2...) and numbered messages (M1, M2...). Things it saw are marked as observed; things it guessed
are marked as inferred. Open questions are listed at the end.

**Test cases** look like this:

| # | Step | Expected |
|---|---|---|
| 1 | Enter Ab1! (4 characters) in «Password», then click outside the field. | «Password must be 5-40 characters long.» should be shown under the field. |

Text in «angle quotes» is copied exactly from the app. ReconQA checks every one against the atlas
before it finishes, so you won't find made-up messages there. Each case also has a priority, a
precondition and the ticket point it covers.

**The mismatch table** at the end is often the most useful part. Each row says what the ticket
says, what the app shows, what kind of difference it is, and a question to ask your team:

| Kind | Meaning |
|---|---|
| mismatch | The ticket and the app say different things. |
| missing in app | The ticket asks for something the app doesn't have. |
| missing in ticket | The app does something the ticket doesn't mention. |
| likely defect | Probably a bug in the app. |

Take these questions to your product owner or developer before you start testing.

## 8. Filing a bug

By default ReconQA only writes bug reports as files in `qa/bugs/`. You copy them into your bug
tracker yourself: open the file, copy the title and text into a new bug, and attach the screenshot
it names. That always works, with any tool.

If your team uses **Jira** or **GitHub Issues**, ReconQA can file the bug for you. Ask Claude, for
example: "turn on ReconQA bug filing to Jira project QA" (or "to GitHub for <owner/repo>"). It
shows you the settings change first. The Jira or GitHub helper needs to be connected once;
`/reconqa:doctor` tells you how (for Jira it is Atlassian's own helper: you log in in your browser,
no keys to copy). Details: [Jira](../plugins/reconqa/adapters/tracker/jira.md),
[GitHub](../plugins/reconqa/adapters/tracker/github-issues.md). (Jira filing is new and not yet
tested on a real Jira site; GitHub filing is.)
When ReconQA wants to file, Claude Code shows a question with the full bug text and the line
"ReconQA write, check before approving". Read it. Say yes only if it's right. Say no and nothing is
sent.

ReconQA will never delete or close issues, assign people, file in a different project, or file the
same bug twice. Attach the screenshot yourself; the issue tells you where the file is.

### Test cases into TestRail

If your team keeps test cases in **TestRail**, `/reconqa:upload qa/cases/<name>.md` adds them,
and `/reconqa:upload qa/runs/<report>.md` adds a test run with pass, fail and blocked results.
Every upload shows you a preview first, and nothing is sent until you say yes. It only adds; it
never changes or deletes anything in TestRail. Setup takes five minutes:
[TestRail guide](../plugins/reconqa/adapters/test-management/testrail.md). (New, and not yet tested on a
real TestRail account.)

## 9. Permission questions: when to say yes

Claude Code asks before doing things. Here is what you'll see with ReconQA:

| Question about | What it is | Usual answer |
|---|---|---|
| Running `node ...reconqa/scripts/...` | ReconQA's own checks | Yes. You can choose "don't ask again". |
| Browser actions (`playwright`) | Clicking and typing in your app | Yes, while exploring. |
| Writing files in `qa/` | Saving the atlas, cases or bugs | Yes. |
| Changing `.reconqa/kit.yml` | Changing your settings | Read what changes first. |
| "this changes the knowledge base" | Saving a decision, known issue or feature note in `qa/kb/` | Read it first: what's there steers future test cases. |
| "adds «…» screen text to cases written before the screen existed" | Something is trying to mark ticket text as confirmed screen text without checking the real screen | No. Then run `/reconqa:reconcile`, which checks it first. |
| "runs your own JavaScript inside the app page" or "sends a file from this computer" | A riskier browser action | Only if you asked for it. |
| "ReconQA write, check before approving" | Sending something to your bug tracker | Read the whole text. Yes only if it's right. |
| Anything you don't understand | | No. Then ask Claude "what was that for?" |

A real question looks like this: a box with the tool name, the details, and numbered options such
as "1. Yes", "2. Yes, and don't ask again", "3. No". ReconQA's own safety questions start with
"ReconQA:".

Saying no is always safe. Claude will stop or try another way.

## 10. Cost and usage

On a Claude subscription (the usual case at work) there's no charge per run. Each run uses part
of your plan's usage allowance, like a chat does. If you use it up, Claude Code tells you, and you
wait until it resets (usually a few hours). Nothing breaks and nothing is billed extra.

### Tokens

AI usage is counted in **tokens**: small pieces of text, about 3 to 4 characters or three quarters
of a word each. Both your plan's allowance and API prices are measured in tokens.

ReconQA works in many small **requests**: each time Claude reads a page, clicks or checks a file,
that's one request. Every request sends the conversation so far again. To keep that cheap, the
repeated part is read from a **cache** (a short-term memory on Anthropic's side) at a twentieth of
the normal price.

Prices for Claude Sonnet 5.5, the model we measured with (Anthropic list prices, November 2026):

| Kind of token | Per million tokens | Per token |
|---|---|---|
| Read from cache (the repeated conversation) | $0.10 | $0.0000001 |
| New input, first time (stored in the cache for an hour) | $4.00 | $0.000004 |
| New input, not cached | $2.00 | $0.000002 |
| Written by Claude (output) | $10.00 | $0.00001 |

### What each command uses

Measured runs (from the examples in this project):

| Command | Requests | Read from cache | New input | Output | Cost | Per request |
|---|---|---|---|---|---|---|
| Explore one area | 38 | 1,806,706 | 53,611 | 10,104 | $0.50 | $0.013 |
| Write cases for one ticket | 9 | 300,202 | 35,752 | 12,747 | $0.30 | $0.033 |
| Run 14 cases | 61 | 4,123,397 | 89,625 | 19,643 | $0.97 | $0.016 |
| Draft one bug | 20 | 781,332 | 33,379 | 4,426 | $0.26 | $0.013 |
| Doctor | 2 | 44,828 | 22,804 | 549 | $0.10 | $0.050 |
| Import 100 old cases | 14 | 585,554 | 73,798 | 7,962 | $0.43 | $0.031 |
| Import a short manual | 12 | 327,758 | 33,576 | 4,755 | $0.21 | $0.018 |

Example: the 14-case run cost 4,123,397 × $0.0000001 + 89,625 × $0.000004 + 19,643 × $0.00001 =
$0.41 + $0.36 + $0.20 = $0.97. Input that wasn't cached was a few hundred tokens, under a cent.

Other models cost more or less (Claude Opus 5.5 is about twice Sonnet 5.5). Prices change, so
check [anthropic.com/pricing](https://www.anthropic.com/pricing) for current ones. To see the
numbers for your own runs, a developer can run `node scripts/token-usage.mjs` on the Claude Code
session files (`~/.claude/projects/<your project>/`).

You explore an area once and reuse its atlas for every ticket in that area, so the expensive step
doesn't repeat. Explore again after the app changes. Reconciling a cases file with the real screen
cost about $0.22 (12 requests); writing cases with the knowledge base costs about the same as
without it, because only the feature's decisions and known issues are read (capped by
`kb.token_cap`).

## 11. When something goes wrong

| What you see | What to do |
|---|---|
| Anything about setup, the browser or the tracker | Run `/reconqa:doctor` first. It names the problem and the fix. |
| `/reconqa` commands don't appear | Restart Claude Code. Check `/plugin` lists reconqa as installed. |
| "Google Chrome was not found" | Install Chrome from google.com/chrome, then run `/reconqa:login` again. |
| "node: command not found" | Install Node.js (section 4.1) and open a new terminal. |
| "App is not reachable" | Open the app address in your own browser. Start the app if it's down, or fix the address in `.reconqa/kit.yml`. |
| "production environment" refusal | ReconQA only works on local, test or staging servers. Use a test server. |
| Explore stops at a login page | Your saved login session has expired. Run `/reconqa:login` again. |
| Explore stops at a code from your phone (MFA) | That's on purpose. Use a test account without MFA, or save a session after logging in yourself. |
| "not grounded" while writing cases | A case used app text that isn't in the atlas. ReconQA fixes this itself; if it keeps happening, explore the area again. |
| A write was refused by "ReconQA:" | The gate blocked something unsafe. The message says why. |
| Something else | Copy the message, then ask Claude in the same window "what does this mean?" |

## 12. Questions people ask

**Will it change my app or my data?** Only in the ways you allow. It never deletes, pays or
changes security settings, and creates test data only if you turned that on, always named
`reconqa...`. Use a test server.

**Does it send my data anywhere?** ReconQA has no tracking and no server. Claude Code sends the
conversation to Anthropic so Claude can work, as with any Claude use. That includes what ReconQA
reads from your test app (page text, and screenshots it takes) and the files you import. So get your lead's OK before using
it on a work app. Files stay on your computer unless you approve a bug filing.

**Can it be wrong?** Yes. It can miss a screen or misread a rule. That's why it marks what it saw
versus what it guessed, checks its quotes against the atlas, and asks you questions instead of
deciding for you. Review its work as you would a colleague's.

**Do I need to know how to code?** No. You type commands and read Markdown files, which are plain
text with a little formatting.

**Can I change the case format?** Yes. ID pattern, priorities, how many steps, banned words and
your team's own rules all live in `.reconqa/kit.yml`. Ask Claude "change my ReconQA case IDs to
QA-{n}" and it will show you the change first.

**Does it work with Jira or TestRail?** Not yet. Today it files to GitHub Issues and exports CSV,
and it can import old test cases exported from them as CSV. More tools are planned.

**How do I remove what ReconQA wrote?** Everything is in two folders in your project: `qa/` (app
notes, cases, reports, knowledge base) and `.reconqa/` (settings). Delete them to start over. If
your project folder is a shared Git repository, check with your team before committing them.

**Does it test mobile apps or APIs?** Not yet: web apps in a browser only. Android, APIs and
devices are planned.

Found a problem or have an idea? Open an issue on the ReconQA GitHub page.
