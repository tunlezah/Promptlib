---
id: plain-english-rewrite
title: Rewrite this in plain English
summary: Paste any dense or jargon-heavy text and get a clear version at a reading level you choose, keeping every fact. Useful for policies, emails, technical notes and anything you have to explain to someone else.
type: prompt
format: markdown
models: [any]
assistants: [chat-app]
categories: [writing, getting-started]
tags: [plain-language, rewrite, editing]
roles: [everyone, writer, manager]
difficulty: beginner
variables:
  - name: level
    description: Target reader
    default: a smart 14-year-old
    options: [a smart 14-year-old, a new colleague, a busy executive, a non-native English speaker]
why_it_works: >
  "Keep every fact" is the constraint that stops simplification from becoming loss; naming a reader
  gives the model a concrete vocabulary target.
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-05-10
updated: 2026-05-10
status: reviewed
tested_on: ["Claude Haiku 4.5", "GPT-5 mini", "Llama 3.3 70B"]
related: [summarise-advisory, meeting-notes-to-actions]
---
Rewrite the text below so that {{level}} could understand it on first reading.

Rules:
- Keep every fact, number, name and caveat. Do not add anything.
- Short sentences. One idea per sentence. Everyday words.
- Replace jargon with a plain phrase; if a technical term is unavoidable, define it in brackets the first time.
- Keep the same structure (headings, lists) unless it gets in the way.

After the rewrite, list anything you were unsure how to simplify so I can check it.

Text:
