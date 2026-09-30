---
id: filesystem-mcp
title: Filesystem MCP server config (read-only docs folder)
summary: An MCP server entry that exposes one folder of reference documents to a chat assistant, read-only, so it can answer questions from your own notes and standards without you pasting them each time.
type: mcp
format: json
models: [any]
assistants: [claude-code, cursor, cline, continue]
categories: [agents, getting-started]
tags: [mcp, filesystem, knowledge]
roles: [developer, everyone]
difficulty: intermediate
requires: ["Node.js 20+ (npx)"]
variables:
  - name: docs_path
    description: Absolute path to the folder to expose
    default: /home/me/docs/standards
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-08-25
updated: 2026-08-25
status: reviewed
tested_on: ["Claude Code 2.x", "Cursor"]
related: [gitlab-mcp]
---
{
  "mcpServers": {
    "standards-docs": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "{{docs_path}}"]
    }
  }
}
