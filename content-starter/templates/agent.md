---
id: my-agent
title: My agent
summary: >
  What this subagent does, what it must not do, and when to delegate to it.
type: agent
format: markdown
models: [any]
assistants: [claude-code, cursor]
categories: [agents]
tags: [subagent]
roles: [developer]
difficulty: intermediate
install_frontmatter:               # the assistant reads these from the installed file
  name: my-agent
  description: When the main assistant should delegate to this agent.
  tools: Read, Grep, Glob
author: Your Name
license: CC0-1.0
version: 1.0.0
created: 2026-01-01
updated: 2026-01-01
status: draft
tested_on: []
related: []
---
You are ...

When invoked:
1. ...

Report: ...
