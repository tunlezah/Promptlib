---
id: security-review-kit-plugin
title: Security review kit (plugin)
summary: A Claude Code plugin bundling the security review command, the secure coding rules and a hook that blocks secret commits into one installable unit. Install it once per machine and every project gets the same guard rails.
type: plugin
format: markdown
models: [claude]
assistants: [claude-code]
categories: [security, agents]
tags: [plugin, bundle, security]
roles: [security, developer]
difficulty: advanced
requires: ["Claude Code with plugin support"]
author: Mark
license: CC0-1.0
version: 0.3.0
created: 2026-09-08
updated: 2026-09-20
status: draft
tested_on: ["Claude Code 2.x"]
related: [security-code-review, secure-coding-rules, block-secrets-commit, threat-model]
---
# Security review kit

A Claude Code plugin that installs, together:

- `/security-review` — a command that runs the security code review prompt against the current diff.
- A hook that blocks `git commit` when the staged diff looks like it contains a secret.
- The secure coding rules as a skill the assistant can load when writing code.

## Install

Download the zip from the library and unpack it into `.claude/plugins/security-review-kit-plugin/`, or point `claude plugin install` at the folder. Restart Claude Code.

## Contents

```
.claude-plugin/plugin.json   # plugin manifest
commands/security-review.md  # the slash command
hooks.json                   # the secret-blocking hook
```

## Changing the rules

Edit `commands/security-review.md`. Keep the output format section; downstream tooling parses it.
