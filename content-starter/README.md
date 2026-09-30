# Prompt library content

The prompts, system prompts, skills, rules, agents, commands, hooks, MCP configs, plugins and workflows shown on the
Prompt Library site. One artefact per file (or folder) under `library/`. See [CONTRIBUTING.md](CONTRIBUTING.md).

```
library/
  taxonomy.yml        models, assistants, categories, roles the site filters on
  prompts/            one .md per prompt (+ variants/, examples/ for support files)
  system-prompts/
  skills/<id>/SKILL.md
  rules/  agents/  commands/  hooks/  mcp/  plugins/<id>/README.md  workflows/
  collections/*.yml   curated, ordered lists; exactly one has start_here: true
  learn/*.md          beginner guides rendered as pages
templates/            a starter file per artefact type
schema/               JSON Schemas the pipeline validates against
```

The site itself (build, design, deploy) lives in the app repository. Merging to the default branch here triggers
its pipeline, and the site republishes within minutes.
