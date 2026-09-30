---
id: write-commit-message
title: Write a commit message from a diff
summary: Paste a diff and get a conventional commit message with a short subject line and a body that explains why, not what. Works in any chat app or straight from a coding assistant.
type: prompt
format: markdown
models: [any]
assistants: [chat-app, claude-code, cursor, github-copilot]
categories: [coding, getting-started]
tags: [git, commits, conventional-commits]
roles: [developer]
difficulty: beginner
why_it_works: >
  The constraints (72 characters, imperative mood, why over what) match what reviewers actually want
  and the model follows a concrete format far better than "write a good commit message".
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-05-12
updated: 2026-05-12
status: reviewed
tested_on: ["Claude Sonnet 4.5", "GPT-5 mini"]
related: [commit-conventions, review-pr]
---
Write a commit message for the diff below.

Format:
- Subject line in the form `type(scope): summary`, imperative mood, 72 characters or fewer, no full stop. Types: feat, fix, docs, refactor, test, chore, perf, build, ci.
- A blank line.
- A body of one to three short paragraphs explaining *why* the change was made and any trade-off. Do not describe what the diff already shows.
- If the change is breaking, add a `BREAKING CHANGE:` footer.

Output only the commit message, no commentary.

Diff:
