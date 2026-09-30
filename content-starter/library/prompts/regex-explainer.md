---
id: regex-explainer
title: Explain a regular expression
summary: Paste a regular expression and get a piece-by-piece explanation, three strings it matches, three it does not, and any traps such as catastrophic backtracking.
type: prompt
format: markdown
models: [any]
assistants: [chat-app, claude-code, cursor]
categories: [coding, learning]
tags: [regex, explain]
roles: [developer, everyone]
difficulty: beginner
variables:
  - name: regex
    description: The regular expression, exactly as written
    default: ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$
  - name: flavour
    description: Regex engine or language
    default: JavaScript
    options: [JavaScript, Python, PCRE, Go, Java, .NET]
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-08-20
updated: 2026-08-20
status: reviewed
tested_on: ["GPT-5 mini", "Qwen3 Coder"]
related: [explain-this-error]
---
Explain this {{flavour}} regular expression:

```
{{regex}}
```

1. Break it into pieces in a table: piece | what it matches | notes.
2. Give three example strings that match and three that do not, and say why for each.
3. Point out any traps: catastrophic backtracking, unescaped characters, anchors missing, behaviour that differs between engines.
4. If it looks like it is trying to validate something common (email, URL, IP address), say whether it is a reasonable approach and what it gets wrong.
