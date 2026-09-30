---
id: block-secrets-commit
title: Block commits that contain secrets (hook)
summary: A Claude Code hook configuration that runs before any git commit the assistant tries to make and blocks it if the staged diff contains something that looks like an API key, token or private key. The hook exits non-zero with a message the assistant sees, so it fixes the problem instead of committing.
type: hook
format: json
models: [any]
assistants: [claude-code]
categories: [security, agents]
tags: [hooks, secrets, git, guardrail]
roles: [developer, security]
difficulty: advanced
requires: ["Claude Code 1.0.38 or later", "bash and git on PATH"]
why_it_works: >
  A PreToolUse hook runs deterministically before the tool call, so the guard does not depend on the
  model remembering a rule.
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-08-15
updated: 2026-08-15
status: reviewed
tested_on: ["Claude Code 2.x on Linux and macOS"]
related: [secure-coding-rules, format-on-save, commit-conventions]
---
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | grep -qE '^\\s*git\\s+commit' && { git diff --cached -U0 | grep -E '(AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)' >/dev/null && { echo 'Blocked: the staged diff contains something that looks like a secret. Remove it and use an environment variable instead.' >&2; exit 2; }; }; exit 0"
          }
        ]
      }
    ]
  }
}
