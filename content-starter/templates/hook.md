---
id: my-hook
title: My hook
summary: >
  What this hook runs, when, and what it prevents or automates.
type: hook
format: json
models: [any]
assistants: [claude-code]
categories: [agents]
tags: [hooks]
roles: [developer]
difficulty: advanced
requires: ["jq on PATH"]
author: Your Name
license: CC0-1.0
version: 1.0.0
created: 2026-01-01
updated: 2026-01-01
status: draft
tested_on: []
related: []
---
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "exit 0" }
        ]
      }
    ]
  }
}
