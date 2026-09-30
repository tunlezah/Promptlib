---
title: How to contribute
summary: Add or improve an artefact in about ten minutes.
order: 5
---
Artefacts live in the **content repository** as plain files. Adding one is a merge request; nothing is published until a maintainer merges it, and the site rebuilds itself within a few minutes of the merge.

## Steps

1. Open the [Contribute](../../contribute/) page and copy the template for your artefact type, or copy a file from `templates/` in the content repository.
2. Create the file under the matching folder in `library/` (for example `library/prompts/my-prompt.md`). Skills and plugins are folders with a `SKILL.md` or `README.md` entry file.
3. Fill in the frontmatter. Every field has a comment in the template. Ids in `models`, `assistants`, `categories` and `roles` must come from `taxonomy.yml`.
4. Write the body. Use `{{name}}` for fill-in fields and declare each under `variables`.
5. Test the prompt on at least one real model and note it under `tested_on`. If you can, save a good reply as an example file and reference it in `example_output`.
6. Open a merge request. The pipeline validates the file and tells you exactly what is wrong if anything is.

## What reviewers look for

- The title says what it does, in plain words.
- The summary makes sense to someone who has never seen the prompt.
- `difficulty` is honest. Beginner means no setup and no jargon.
- Variables are named and have defaults.
- No secrets, no internal hostnames, no personal data.
- `license` is set and `status` is `draft` until a maintainer has tried it.

## Changing an existing artefact

Any change to the body bumps `version` (patch for wording, minor for behaviour, major for a rewrite) and sets `updated` to today. The site shows the history.
