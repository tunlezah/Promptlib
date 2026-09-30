---
id: python-style
title: Python style rules
summary: >-
  A short rules file that tells a coding assistant how to write Python in your repository: typing, formatting, error handling, tests and what not to do. Drop it into CLAUDE.md, .cursor/rules or AGENTS.md.
type: rule
format: markdown
models: [any]
assistants: [claude-code, cursor, codex-cli, github-copilot, windsurf, cline]
categories: [coding, agents]
tags: [python, style, rules]
roles: [developer]
difficulty: beginner
why_it_works: >
  Rules that name the tools (ruff, pytest) and give a concrete "never" list are followed far more
  reliably than a general request to "follow best practice".
install_frontmatter:
  description: Python conventions for this repository
  globs: ["**/*.py"]
  alwaysApply: false
author: Mark
license: CC0-1.0
version: 1.1.0
created: 2026-05-25
updated: 2026-08-30
status: reviewed
tested_on: ["Claude Code", "Cursor"]
related: [secure-coding-rules, commit-conventions]
---
# Python conventions

- Python 3.12+. Type-annotate every function signature. Prefer `list[str]` over `List[str]`.
- Format with `ruff format`; lint with `ruff check`. Do not hand-format.
- Use `pathlib.Path`, never string concatenation for paths.
- Raise specific exceptions. Never `except Exception: pass`. Never bare `except:`.
- Log with the `logging` module, not `print`, outside of CLI entry points.
- Tests live in `tests/`, use `pytest`, one behaviour per test, names read as sentences: `test_rejects_empty_username`.
- Dataclasses or Pydantic models for structured data, not dicts with string keys.
- No new dependencies without saying why in the pull request.
- Do not add docstrings that repeat the function name. Do add one when the *why* is not obvious.
