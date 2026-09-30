---
id: summarise-advisory
title: Summarise a security advisory
summary: Turn a vendor advisory, CVE record or long security bulletin into a short brief for a chosen audience, with what is affected, how bad it is, and what to do. Paste the advisory text after the prompt.
type: prompt
format: markdown
models: [any]
assistants: [chat-app]
categories: [security, writing]
tags: [cve, advisory, triage, briefing]
roles: [security, analyst, manager]
difficulty: beginner
variables:
  - name: audience
    description: Who will read the summary
    default: engineering managers
    options: [engineering managers, developers, executives, help desk staff]
  - name: length
    description: How long the brief should be
    default: under 150 words
why_it_works: >
  Naming the audience changes the vocabulary and the level of detail; fixing the sections means
  nothing important is dropped.
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-07-01
updated: 2026-07-01
status: reviewed
tested_on: ["Claude Haiku 4.5", "GPT-5"]
related: [cve-triage, plain-english-rewrite]
---
Summarise the security advisory below for {{audience}}. Keep it {{length}}.

Use exactly these headings:
- **What is affected** (product, versions, platforms)
- **How bad is it** (severity, whether it is exploited in the wild, what an attacker gets)
- **Are we exposed** (what to check; say "unknown from the advisory" if it does not say)
- **What to do** (the fix or mitigation, in order of preference)

Do not add anything the advisory does not state. Quote version numbers exactly.

Advisory:
