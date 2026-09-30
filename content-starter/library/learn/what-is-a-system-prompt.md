---
title: What is a system prompt?
summary: Instructions that apply to a whole conversation, not just one message.
order: 2
---
A **system prompt** is a set of instructions the model reads before the conversation starts and keeps in mind for every reply. It is where you put things that should always be true: the model's role, its tone, rules it must follow, and things it must never do.

A normal prompt is one message. A system prompt is the standing orders.

## Where you put it

- **Chat apps**: look for "custom instructions", "personality", "system prompt" or a "project" setting. Paste the text there.
- **Open WebUI / Ollama**: Workspace → Models → System prompt.
- **Coding assistants**: they have their own equivalents, usually a file in the repository. In this library those are called **rules**.
- **API and gateways**: the `system` field of the request. The **Send to AI** panel on each page does this for you when the artefact is a system prompt.

## What makes a good one

- Short, concrete rules beat long descriptions. "Lead with the answer" works; "be helpful and concise" barely does.
- Say what to do when the model does not know something.
- Name the habits you do not want, specifically.
- Test it with a few real questions; adjust one rule at a time.

Try [Terse senior engineer](../../library/terse-senior-engineer/) or [Patient tutor](../../library/patient-tutor/) to see the difference a system prompt makes.

## Next

- [Fill-in fields (variables)](../variables/)
- [Skills, rules, commands and hooks: which is which?](../skill-vs-rule/)
