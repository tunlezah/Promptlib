---
id: explain-this-error
title: Explain this error message
summary: Paste any error message and get a plain-English explanation of what went wrong, the most likely causes in order, and the first thing to try. Good for people who have never debugged anything.
type: prompt
format: markdown
models: [any]
assistants: [chat-app, claude-code, cursor]
categories: [getting-started, coding]
tags: [debugging, beginner, errors]
roles: [everyone, developer]
difficulty: beginner
variables:
  - name: error
    description: The full error message, copied exactly
    default: ""
    multiline: true
  - name: context
    description: What you were doing when it happened
    default: running the program
why_it_works: >
  Asking for causes in likelihood order and a single first step stops the model from listing twenty
  possibilities and leaving you to guess.
author: Mark
license: CC0-1.0
version: 1.0.1
created: 2026-05-10
updated: 2026-08-02
status: reviewed
tested_on: ["Claude Sonnet 4.5", "GPT-5 mini", "Gemma 3 27B"]
related: [plain-english-rewrite, patient-tutor]
---
I got this error while {{context}}:

```
{{error}}
```

Explain it to me in plain English. I am not an expert.

1. In one sentence, what does the error mean?
2. List the most likely causes, most likely first. No more than four.
3. Tell me the single first thing to try, as a numbered step-by-step.
4. Tell me what to paste back to you if that does not work.

Do not guess at code you cannot see. If you need to see something, ask for it.
