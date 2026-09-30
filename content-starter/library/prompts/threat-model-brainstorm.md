---
id: threat-model-brainstorm
title: Threat model brainstorm (STRIDE)
summary: Describe a system in a few sentences and get a STRIDE-organised list of threats, each with an attacker goal, a likely entry point and a mitigation, ranked by how much you should worry. A fast first pass before a proper threat modelling session.
type: prompt
format: markdown
models: [claude, gpt, any]
assistants: [chat-app, claude-code]
categories: [security]
tags: [stride, threat-modelling, architecture]
roles: [security, developer]
difficulty: intermediate
variables:
  - name: system_description
    description: What the system does, who uses it, what it stores, and how the pieces talk to each other
    default: ""
    multiline: true
  - name: assets
    description: The things you most want to protect
    default: user credentials and personal data
requires: ["A short description of the system, including its trust boundaries if you know them"]
why_it_works: >
  STRIDE gives the model a checklist so it covers tampering and repudiation, which brainstorms
  usually skip, and the ranking forces a judgement rather than a flat list.
author: Mark
license: CC0-1.0
version: 1.1.0
created: 2026-06-15
updated: 2026-09-05
status: reviewed
tested_on: ["Claude Opus 4.1", "GPT-5"]
related: [security-code-review, threat-model, secure-coding-rules]
---
Act as a security architect running a first-pass threat model.

System:
{{system_description}}

Assets to protect: {{assets}}

Work through STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege). For each category list the two or three most credible threats. For every threat give:

- **Attacker goal** in one sentence
- **Entry point** (which component or trust boundary)
- **Mitigation** (the standard control, named specifically: for example "parameterised queries", not "input validation")
- **Worry level**: high / medium / low, with a short reason

Then list the five threats to address first, and three questions you would ask the team to sharpen the model. Do not invent components the description does not mention; if something is unclear, say what you assumed.
