---
id: dependency-audit
title: Dependency audit skill
summary: A skill that has the assistant inventory a project's third-party dependencies from its lock files, check them against the advisory sources you point it at, and produce a short prioritised report of what to upgrade. Works with npm, pip, Go modules, Cargo and Maven.
type: skill
format: markdown
models: [claude, gpt, any]
assistants: [claude-code, cursor, github-copilot]
categories: [security, agents]
tags: [dependencies, sbom, supply-chain, skill]
roles: [developer, security]
difficulty: intermediate
requires: ["A lock file in the repository (package-lock.json, pnpm-lock.yaml, poetry.lock, go.sum, Cargo.lock or a Maven POM)", "Optionally: the project's own audit tool installed (npm audit, pip-audit, govulncheck, cargo audit)"]
install_frontmatter:
  name: dependency-audit
  description: Inventory third-party dependencies from lock files, run the ecosystem's audit tool if present, and write a prioritised upgrade report. Use when asked about vulnerable, outdated or risky dependencies.
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-09-14
updated: 2026-09-14
status: reviewed
tested_on: ["Claude Code 2.x with Sonnet 4.5", "Cursor with GPT-5"]
related: [cve-triage, vuln-triage-workflow, threat-model]
---
# Dependency audit

## Steps

1. Find every lock file in the repository. For each, list the ecosystem, the number of direct and transitive dependencies, and whether versions are pinned.
2. If the ecosystem's audit tool is installed (`npm audit --json`, `pip-audit -f json`, `govulncheck -json ./...`, `cargo audit --json`), run it and read the JSON. Do not install tools; if one is missing, say so and continue with the inventory.
3. Read `checklist.md` and check each item.
4. Write `docs/dependency-audit.md` with:
   - a table of findings: package | installed | fixed in | severity | reachable? (yes / no / unknown) | action
   - a "top three upgrades" list with the reason for each
   - a list of dependencies with no release in the last two years
5. Summarise in the conversation in five lines or fewer.

## Rules

- Quote the audit tool's output for every severity; do not assign severities yourself.
- "Reachable" means the vulnerable function is imported by first-party code. Grep for it; if you cannot tell, write "unknown".
- Never change lock files or run installs as part of this skill. Recommend; do not apply.
