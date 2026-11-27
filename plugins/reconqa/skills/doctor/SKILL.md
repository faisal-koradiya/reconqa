---
name: doctor
description: Check that ReconQA is ready in this project (Node.js, settings, app reachable, saved login, browser helper, tracker, write gate) and explain how to fix each problem in plain words. Use when the user runs /reconqa:doctor, when another ReconQA command fails for a setup reason, or when the user asks why ReconQA isn't working.
allowed-tools: Bash(node:*), Read, Edit
---

# ReconQA doctor

Run exactly this, as one Bash call:

    node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.mjs" --project .

It costs no tokens beyond this conversation and changes nothing.

Then explain the result to the user. Assume they may be new to AI tools and terminals:

1. Start with one line: ready, or how many problems there are.
2. For each `[FAIL]`, in order: what it means in one plain sentence, then the fix. Show any command
   in a code block so it can be copied. Say where to run it ("in this folder, in a normal terminal,
   not inside Claude Code") when the fix is a terminal command, and that Claude Code must be
   restarted after changing a helper.
3. Mention `[warn]` lines briefly; `[info]` lines only if they matter for what the user wants to do.
4. Offer to make file changes the doctor suggests (`.gitignore`, `.claude/settings.local.json`,
   `.mcp.json`, `.reconqa/kit.yml`): show the exact change and write it only when the user says yes.
   Never run commands that register or remove helpers yourself; the user runs those.

Never print the contents of `.reconqa/auth/` files or any token.
