---
id: commit-conventions
title: Commit and pull request conventions
summary: >-
  Rules that tell the assistant how to shape commits and pull requests in your repository: conventional commit types, small commits, what a PR description must contain, and when to ask rather than push.
type: rule
format: markdown
models: [any]
assistants: [claude-code, cursor, codex-cli, github-copilot]
categories: [coding, agents]
tags: [git, commits, pull-requests, rules]
roles: [developer]
difficulty: beginner
install_frontmatter:
  description: How to write commits and pull requests in this repository
  alwaysApply: true
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-07-20
updated: 2026-07-20
status: reviewed
tested_on: ["Claude Code", "Cursor"]
related: [write-commit-message, python-style, review-pr]
---
# Commits and pull requests

- Commit messages follow Conventional Commits: `type(scope): summary`. Types: feat, fix, docs, refactor, test, chore, perf, build, ci.
- Subject line 72 characters or fewer, imperative mood, no full stop. Body explains why, not what.
- One logical change per commit. Do not mix a refactor with a behaviour change.
- Never amend, rebase or force-push a branch someone else has pushed to.
- Do not commit generated files unless the repository already tracks them.
- A pull request description has: what changed, why, how it was tested, and anything reviewers should look at first.
- Run the project's formatter and tests before every commit. If tests fail, do not commit; tell me.
- Ask before pushing to any branch other than the one you created for this task.
