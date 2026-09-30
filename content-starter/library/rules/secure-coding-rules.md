---
id: secure-coding-rules
title: Secure coding rules
summary: >-
  Language-agnostic rules for a coding assistant that stop the most common security mistakes before they are written: no string-built queries or commands, secrets only from the environment, safe parsers, least privilege, and a habit of asking before weakening a control.
type: rule
format: markdown
models: [any]
assistants: [claude-code, cursor, codex-cli, github-copilot, windsurf, cline, aider]
categories: [security, agents]
tags: [secure-coding, rules, owasp]
roles: [developer, security]
difficulty: intermediate
why_it_works: >
  Each rule maps to a class of vulnerability the assistant would otherwise introduce silently, and the
  "ask before weakening" rule catches the cases a checklist cannot.
install_frontmatter:
  description: Security rules that apply to all code changes
  alwaysApply: true
author: Mark
license: CC0-1.0
version: 1.2.0
created: 2026-06-05
updated: 2026-09-19
status: reviewed
tested_on: ["Claude Code", "Cursor", "Codex CLI"]
related: [security-code-review, python-style, threat-model]
---
# Security rules for all code in this repository

1. **Never build a query, shell command, file path or template by concatenating untrusted input.** Use parameterised queries, argument arrays, path-join with a containment check, and auto-escaping templates.
2. **Secrets come from the environment or the secret manager.** Never write a key, token or password into source, tests, fixtures, logs or comments. If you see one, stop and tell me.
3. **Parse untrusted data with safe defaults**: YAML safe loaders, XML with external entities disabled, JSON with size limits, no `pickle` or `eval` on external data.
4. **Validate at the boundary, then trust the type.** Reject unexpected fields, enforce length and range, and normalise encodings once, at the edge.
5. **Least privilege by default**: new IAM roles, database users, file modes and container settings start with the minimum and are widened with a comment saying why.
6. **Authentication and authorisation are checked on every path**, including bulk, admin and background jobs. Do not copy an endpoint without copying its checks.
7. **Errors returned to users are generic; details go to logs.** Never include stack traces, SQL or internal hostnames in responses.
8. **Use the platform's crypto**: standard libraries, current algorithms, no home-made hashing, comparison with constant-time functions.
9. **Dependencies are pinned and come from the registry**, not from URLs or git refs, and the lock file is committed.
10. **Before disabling or weakening any security control** (a check, a header, TLS verification, a lint rule), stop and ask. Explain what you want to disable and why, and wait for approval.
