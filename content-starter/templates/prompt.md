---
# Copy this file to library/prompts/<id>.md and fill it in. Delete the comments if you like.
id: my-prompt                      # unique slug: lowercase letters, digits, hyphens
title: My prompt                   # what it does, in plain words
summary: >                         # one paragraph; the first thing people read on a card
  What this does and when to use it.
type: prompt
format: markdown                   # markdown | xml | json | yaml | text
models: [any]                      # ids from taxonomy.yml; 'any' means model-agnostic
assistants: [chat-app]             # ids from taxonomy.yml; omit for chat-only
categories: [getting-started]      # 1-5 ids from taxonomy.yml
tags: []
roles: [everyone]                  # ids from taxonomy.yml
difficulty: beginner               # beginner | intermediate | advanced
variables:                         # optional; each appears in the body as {{name}}
  - name: topic
    description: What the prompt should work on
    default: ""
# requires: ["Something the reader needs before using this"]
# example_output: examples/my-prompt.md
# why_it_works: One to three sentences for learners.
author: Your Name
license: CC0-1.0
version: 1.0.0
created: 2026-01-01
updated: 2026-01-01
status: draft                      # draft | reviewed | deprecated
tested_on: []
related: []
---
Write the prompt here. Use {{topic}} where the reader should fill something in.
