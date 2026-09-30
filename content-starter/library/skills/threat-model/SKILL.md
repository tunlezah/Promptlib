---
id: threat-model
title: Threat model skill
summary: >-
  A skill that walks a coding assistant through producing a threat model for the current repository: it maps components and trust boundaries from the code, applies STRIDE, fills a fixed template and writes the result to docs/threat-model.md. Includes the checklist and template it uses.
type: skill
format: markdown
models: [claude, any]
assistants: [claude-code, cursor, codex-cli]
categories: [security, agents]
tags: [stride, threat-modelling, skill]
roles: [security, developer]
difficulty: advanced
requires: ["A coding assistant that supports skills (Claude Code, Cursor, Codex CLI)", "Read access to the repository being modelled"]
why_it_works: >
  The skill forces the assistant to read the code before theorising, works from a checklist instead
  of free association, and writes to a fixed template so successive runs can be diffed.
install_frontmatter:
  name: threat-model
  description: Produce or update a STRIDE threat model for this repository and write it to docs/threat-model.md. Use when asked to threat model, review architecture security, or before a security review.
author: Mark
license: CC0-1.0
version: 2.0.0
created: 2026-06-25
updated: 2026-09-12
status: reviewed
tested_on: ["Claude Code 2.x with Sonnet 4.5"]
related: [threat-model-brainstorm, secure-coding-rules, security-review-kit-plugin]
---
# Threat model

Produce or update a threat model for this repository.

## Steps

1. **Map the system from the code, not from memory.** Read the entry points (HTTP handlers, CLI commands, queue consumers, cron jobs), the data stores, and the outbound calls. List each component with the file that defines it. Identify trust boundaries: anywhere data crosses from less trusted to more trusted (network edge, user input, third-party APIs, files on disk, environment).

2. **Read `checklist.md` in this skill folder** and answer every question for each trust boundary. Record "not applicable" explicitly rather than skipping.

3. **Apply STRIDE per boundary.** For each of Spoofing, Tampering, Repudiation, Information disclosure, Denial of service and Elevation of privilege, list credible threats with: attacker goal, entry point, existing control (cite the code), gap, and severity (high / medium / low).

4. **Fill `templates/threat-model.md`** and write it to `docs/threat-model.md`. If the file already exists, update it in place and add a dated entry to its changelog section describing what changed since the last run.

5. **Report** in the conversation: the five highest-severity gaps with file references, and any places where you could not determine behaviour from the code.

## Rules

- Cite a file and line for every existing control and every gap.
- Do not propose fixes in the threat model document itself; list gaps. Fixes go in the conversation summary as suggestions.
- Do not run the application or any network command.
- If the repository has more than about forty entry points, model the ones touching the assets named in the request first and say what was left out.
