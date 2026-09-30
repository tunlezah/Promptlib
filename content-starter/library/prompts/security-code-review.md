---
id: security-code-review
title: Security code review
summary: Ask the model to review a piece of code as a security reviewer, prioritising the flaws you care about and reporting them in a fixed format with severity, location and a fix. Paste the code after the prompt.
type: prompt
format: markdown
models: [claude, gpt, gemini, any]
assistants: [claude-code, cursor, chat-app]
categories: [security, code-review]
tags: [owasp, review, injection, authentication]
roles: [developer, security]
difficulty: beginner
variables:
  - name: language
    description: Programming language of the code under review
    default: Python
    options: [Python, Go, Rust, TypeScript, Java, C#, C]
  - name: focus
    description: What to prioritise
    default: injection and authentication flaws
requires: ["The code you want reviewed (paste it after the prompt or open the file in your assistant)"]
example_output: examples/security-code-review.md
why_it_works: >
  It states the reviewer's role, the scope, what to prioritise and the exact output format, so the
  model reports findings instead of rewriting your code or wandering into style comments.
variants:
  - for: claude
    file: variants/security-code-review.claude.md
  - for: gpt
    file: variants/security-code-review.gpt.md
author: Mark
license: CC0-1.0
version: 1.2.0
created: 2026-06-02
updated: 2026-09-21
status: reviewed
tested_on: ["Claude Sonnet 4.5", "GPT-5", "Gemini 2.5 Pro"]
related: [threat-model-brainstorm, secure-coding-rules, cve-triage]
changelog:
  - version: 1.2.0
    date: 2026-09-21
    note: Added confidence column and the "no findings" instruction.
  - version: 1.1.0
    date: 2026-07-14
    note: Added per-model variants.
  - version: 1.0.0
    date: 2026-06-02
    note: First version.
---
You are a senior application security engineer reviewing {{language}} code.

Review the code below for security defects. Prioritise {{focus}}, then cover the rest of the OWASP Top 10.

Rules:
- Report only real, exploitable or likely-exploitable issues. Do not comment on style.
- If you are unsure whether something is exploitable, say so and give your confidence as low, medium or high.
- Do not rewrite the whole file. Show only the lines that need to change.
- If you find nothing, say "No security findings" and list what you checked.

For each finding give:
1. **Title** and severity (critical / high / medium / low)
2. **Where**: file and line or function name
3. **What can go wrong**: one or two sentences an engineer can act on
4. **Fix**: the minimal change, as a code snippet
5. **Confidence**: low / medium / high

Finish with a three-line summary: number of findings by severity, the single most important fix, and anything you could not assess without more context.

Code to review:
