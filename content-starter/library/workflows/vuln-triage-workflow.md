---
id: vuln-triage-workflow
title: Vulnerability triage workflow
summary: >-
  A chained set of steps that takes a new advisory from "we heard about it" to a filed ticket: summarise the advisory, inventory the affected component, triage against the stack, and write the ticket. Each step is a prompt from this library; the workflow tells you what to feed forward.
type: workflow
format: markdown
models: [claude, gpt, any]
assistants: [claude-code, chat-app]
categories: [security]
tags: [workflow, triage, vulnerability-management]
roles: [security, analyst]
difficulty: advanced
requires: ["The advisory text", "Your component inventory or SBOM", "The prompts this workflow references (linked under Related)"]
why_it_works: >
  Splitting triage into steps with a defined hand-off between them keeps each prompt small enough to
  be reliable, and makes it obvious where a human should check the output.
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-09-16
updated: 2026-09-16
status: draft
tested_on: ["Claude Sonnet 4.5 in Claude Code"]
related: [summarise-advisory, cve-triage, dependency-audit, security-analyst-assistant]
---
# Vulnerability triage workflow

Run these steps in order. A human checks the output of steps 2 and 3 before step 4.

## Step 1 — Summarise
Use **Summarise a security advisory** with audience "developers". Save the output as `summary.md`.

## Step 2 — Inventory
If you have an SBOM, extract the lines for the affected component and its versions. If not, run the **Dependency audit** skill in each candidate repository and collect the inventory tables. Save as `inventory.md`.

**Human check:** confirm the inventory covers every deployment, not just the repositories you remembered.

## Step 3 — Triage
Use **Triage a CVE against our stack** with the advisory text and `inventory.md` as the stack. Save as `triage.md`.

**Human check:** verify the version comparison in section 2 and the reachability claim in section 4 by hand. These are the two places models get wrong most often.

## Step 4 — Ticket
With the **Security analyst assistant** as the system prompt, ask:

> Write a ticket from summary.md and triage.md with the headings Summary, Affected systems, Exposure, Required action, Deadline (propose one from the severity), Evidence. Under 250 words.

File the ticket. Attach `summary.md` and `triage.md`.

## Step 5 — Record
Add a line to the triage log: advisory id, exposure verdict, ticket id, who checked steps 2 and 3.
