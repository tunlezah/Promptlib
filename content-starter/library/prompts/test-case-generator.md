---
id: test-case-generator
title: Generate test cases for a function
summary: Give the model a function and get a table of test cases covering the happy path, edge cases, error handling and one property-based idea, then the tests themselves in your framework. Aimed at engineers who want coverage quickly without reading generated boilerplate first.
type: prompt
format: markdown
models: [claude, gpt, qwen, any]
assistants: [claude-code, cursor, github-copilot]
categories: [testing, coding]
tags: [unit-tests, tdd, edge-cases]
roles: [developer]
difficulty: intermediate
variables:
  - name: language
    description: Language of the function
    default: TypeScript
    options: [TypeScript, Python, Go, Rust, Java, C#]
  - name: framework
    description: Test framework to use
    default: Vitest
why_it_works: >
  Asking for the table first makes the model enumerate cases before writing code, which catches more
  edge cases than going straight to tests.
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-08-28
updated: 2026-08-28
status: reviewed
tested_on: ["Claude Sonnet 4.5", "Qwen3 Coder 30B"]
related: [security-code-review, review-pr]
---
I will give you a {{language}} function. Generate tests for it using {{framework}}.

Step 1. Before writing any code, list the test cases in a table: name | input | expected result | why this case matters. Cover:
- the normal path
- boundaries (empty, zero, one, maximum, unicode, whitespace)
- invalid input and how the function should fail
- concurrency or ordering if relevant
- one property that should always hold, suitable for a property-based test

Step 2. Write the tests. One test per row. Use descriptive names that read as sentences. No shared mutable state between tests. Do not mock anything the function does not call.

Step 3. Tell me which cases you could not decide the expected result for, so I can confirm the intended behaviour.

Function:
