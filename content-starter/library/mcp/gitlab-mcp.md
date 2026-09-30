---
id: gitlab-mcp
title: GitLab MCP server config
summary: An MCP server entry that gives a coding assistant read access to GitLab issues, merge requests and pipelines through the community GitLab MCP server. The token comes from an environment variable; nothing sensitive is in the file.
type: mcp
format: json
models: [any]
assistants: [claude-code, cursor, windsurf, cline]
categories: [agents]
tags: [mcp, gitlab, issues, merge-requests]
roles: [developer]
difficulty: advanced
requires: ["Node.js 20+ (npx)", "A GitLab personal access token with read_api scope in the GITLAB_TOKEN environment variable", "Network access from your machine to the GitLab instance"]
why_it_works: >
  Referencing the token by environment variable keeps the config safe to commit and lets each
  developer use their own credentials.
author: Mark
license: CC0-1.0
version: 1.0.0
created: 2026-09-02
updated: 2026-09-02
status: draft
tested_on: ["Claude Code 2.x", "Cursor"]
related: [filesystem-mcp, review-pr]
---
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@zereight/mcp-gitlab"],
      "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": "${GITLAB_TOKEN}",
        "GITLAB_API_URL": "https://gitlab.example.com/api/v4",
        "GITLAB_READ_ONLY_MODE": "true"
      }
    }
  }
}
