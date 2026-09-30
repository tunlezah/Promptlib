---
id: meeting-notes-to-actions
title: Turn meeting notes into decisions and actions
summary: Paste rough meeting notes or a transcript and get a clean record of decisions, action items with owners and dates, and open questions. Nothing is invented; missing owners are flagged.
type: prompt
format: markdown
models: [any]
assistants: [chat-app]
categories: [productivity, writing]
tags: [meetings, notes, actions]
roles: [everyone, manager]
difficulty: beginner
why_it_works: >
  Separating decisions from actions from questions is the structure people actually need afterwards,
  and telling the model to mark unknown owners stops it from assigning work to whoever spoke last.
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-06-20
updated: 2026-06-20
status: reviewed
tested_on: ["Claude Sonnet 4.5", "Gemini 2.5 Flash"]
related: [plain-english-rewrite]
---
Below are notes from a meeting. Turn them into a record with three sections:

**Decisions** — one line each, past tense ("We agreed to ...").

**Actions** — a table: action | owner | due date. If the owner or date is not stated, write "unassigned" or "no date" in bold. Do not guess.

**Open questions** — things raised but not resolved.

Keep the original wording where it is clear. Do not add advice or summaries. If the notes contain nothing for a section, write "None recorded".

Notes:
