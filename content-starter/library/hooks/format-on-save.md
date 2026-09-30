---
id: format-on-save
title: Format files after every edit (hook)
summary: A Claude Code hook that runs the project's formatter on any file the assistant edits or writes, so formatting never shows up in diffs. Ships with ruff for Python and Prettier for JavaScript and TypeScript; swap in your own commands.
type: hook
format: json
models: [any]
assistants: [claude-code]
categories: [coding, agents]
tags: [hooks, formatting, ruff, prettier]
roles: [developer]
difficulty: intermediate
requires: ["jq on PATH", "The formatters you list (ruff, prettier) installed in the project"]
author: Mark
license: CC0-1.0
version: 1.1.0
created: 2026-07-22
updated: 2026-09-03
status: reviewed
tested_on: ["Claude Code 2.x"]
related: [block-secrets-commit, python-style]
---
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "f=$(jq -r '.tool_input.file_path'); case \"$f\" in *.py) ruff format \"$f\" >/dev/null 2>&1 || true;; *.js|*.ts|*.tsx|*.jsx|*.css|*.json|*.md) npx --no-install prettier --write \"$f\" >/dev/null 2>&1 || true;; esac; exit 0"
          }
        ]
      }
    ]
  }
}
