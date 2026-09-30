---
id: my-mcp-server
title: My MCP server config
summary: >
  What the server connects the assistant to and what it needs to run. Secrets come from environment variables, never from this file.
type: mcp
format: json
models: [any]
assistants: [claude-code, cursor]
categories: [agents]
tags: [mcp]
roles: [developer]
difficulty: advanced
requires: ["Node.js 20+ (npx)"]
author: Your Name
license: CC0-1.0
version: 1.0.0
created: 2026-01-01
updated: 2026-01-01
status: draft
tested_on: []
related: []
---
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "some-mcp-server"],
      "env": { "API_TOKEN": "${MY_TOKEN}" }
    }
  }
}
