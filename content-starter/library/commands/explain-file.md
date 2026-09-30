---
id: explain-file
title: /explain-file slash command
summary: >-
  A slash command that explains a file to someone new to the codebase: what it is for, how it fits with the rest, the tricky parts, and what to read next. Pass the file path as the argument.
type: command
format: markdown
models: [any]
assistants: [claude-code, cursor, gemini-cli]
categories: [coding, learning]
tags: [slash-command, onboarding, explain]
roles: [developer, everyone]
difficulty: beginner
install_frontmatter:
  description: Explain a file to a newcomer
  argument-hint: "<path>"
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-07-30
updated: 2026-07-30
status: reviewed
tested_on: ["Claude Code 2.x", "Cursor"]
related: [patient-tutor, docs-writer]
---
Explain `$ARGUMENTS` to someone who joined the team this week.

Read the file and the files it imports or is imported by (one level each way). Then answer, briefly:

1. **What is this file for?** One or two sentences.
2. **How does it fit in?** Who calls it, what it calls. A tiny diagram in text is fine.
3. **Walk through it top to bottom** in plain language, a sentence or two per function or section. Skip the obvious.
4. **Tricky parts.** Anything surprising, any hidden assumption, any place a change is likely to break something else.
5. **Read next.** Two or three files that would help most.

Do not rewrite or refactor anything. Do not suggest improvements unless something is clearly broken.
