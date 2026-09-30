---
id: review-pr
title: /review-pr slash command
summary: >-
  A slash command that reviews the current branch against main: it summarises the change, runs the tests, checks for missing tests and secrets, and drafts a pull request description. Takes an optional base branch argument.
type: command
format: markdown
models: [claude, any]
assistants: [claude-code, cursor, github-copilot]
categories: [code-review, agents]
tags: [slash-command, pull-request, review]
roles: [developer]
difficulty: intermediate
install_frontmatter:
  description: Review the current branch against a base branch and draft a PR description
  argument-hint: "[base-branch]"
  allowed-tools: Bash(git *), Read, Grep, Glob
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-08-06
updated: 2026-08-06
status: reviewed
tested_on: ["Claude Code 2.x"]
related: [code-reviewer, write-commit-message, commit-conventions]
---
Review the current branch against `$ARGUMENTS` (default: `main`).

1. Run `git log --oneline <base>..HEAD` and `git diff <base>...HEAD --stat`. Summarise the change in three sentences.
2. Read the full diff. List: behaviour changes, new dependencies, changes to security-sensitive code (auth, crypto, input handling, permissions), and anything that touches CI or deployment.
3. Run the project's test command if one is obvious from the repository (package.json scripts, Makefile, pyproject). Report pass or fail with the failing test names.
4. Check for: new code without tests, secrets or credentials in the diff, commented-out code, TODOs added.
5. Draft a pull request description with the sections: What, Why, How tested, Reviewer notes.

Do not push, commit or edit files. Output the review and the draft description.
