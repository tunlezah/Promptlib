---
title: "Skills, rules, commands and hooks: which is which?"
summary: A field guide to the artefact types coding assistants use, and when to reach for each.
order: 4
---
Coding assistants such as Claude Code, Cursor, Codex CLI and Copilot can be configured with files in your repository. Different tools use different names, and this library uses one set of names for all of them. The **Install** button on each page translates to the right path for your assistant.

| Type | What it is | When to use it |
|---|---|---|
| **Prompt** | Text you send once. | A one-off task. |
| **System prompt** | Standing instructions for a chat conversation. | Setting a persona or house rules in a chat app or gateway. |
| **Rule** | Standing instructions for a coding assistant, stored in the repository (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules`). | Conventions everyone wants applied to every change: style, security, commit format. |
| **Skill** | A folder with a `SKILL.md` and supporting files the assistant loads when a task matches its description. | A repeatable procedure with steps, checklists or templates: threat modelling, release notes, migrations. |
| **Command** | A slash command (`/review-pr`) that expands to a prompt, optionally with arguments. | Something you trigger by hand several times a day. |
| **Agent** | A subagent with its own instructions and tool permissions that the main assistant delegates to. | A narrow job that benefits from isolation: read-only review, documentation writing. |
| **Hook** | A shell command the assistant runs automatically before or after a tool call. Deterministic; the model cannot skip it. | Guard rails and housekeeping: block secret commits, run the formatter. |
| **MCP config** | Connects the assistant to an external tool or data source through the Model Context Protocol. | Giving the assistant access to GitLab, a database, a folder of documents. |
| **Plugin** | A bundle of the above, installed as one unit. | Sharing a whole setup across projects. |
| **Workflow** | Several prompts or skills chained with hand-offs between them. | Multi-step processes where a human checks the middle. |

## Rule of thumb

- If you would say it to every new team member on day one, it is a **rule**.
- If it has steps, it is a **skill**.
- If you type it, it is a **command**.
- If it must never be skipped, it is a **hook**.

## Next

- [How to contribute](../how-to-contribute/)
