---
# Skills are folders: library/skills/<id>/SKILL.md plus any supporting files.
id: my-skill
title: My skill
summary: >
  What the skill makes the assistant do, step by step, and what it produces.
type: skill
format: markdown
models: [any]
assistants: [claude-code, cursor]
categories: [agents]
tags: [skill]
roles: [developer]
difficulty: intermediate
requires: ["A coding assistant that supports skills"]
install_frontmatter:               # written to the installed SKILL.md; the assistant reads these
  name: my-skill
  description: When the assistant should load this skill, in one sentence.
author: Your Name
license: CC0-1.0
version: 1.0.0
created: 2026-01-01
updated: 2026-01-01
status: draft
tested_on: []
related: []
---
# My skill

## Steps
1. ...
2. ...

## Rules
- ...
