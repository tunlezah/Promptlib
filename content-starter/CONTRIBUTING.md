# Contributing to the prompt library

Everything on the site comes from the files in this repository. Adding or improving an artefact is a merge request;
the pipeline validates it and the site republishes itself a few minutes after the merge.

## Add an artefact in ten minutes

1. Copy a starter file from `templates/` into the matching folder under `library/`:

   | Type | Folder | Entry file |
   |---|---|---|
   | prompt | `library/prompts/` | `<id>.md` |
   | system-prompt | `library/system-prompts/` | `<id>.md` |
   | skill | `library/skills/<id>/` | `SKILL.md` (+ supporting files) |
   | rule | `library/rules/` | `<id>.md` |
   | agent | `library/agents/` | `<id>.md` |
   | command | `library/commands/` | `<id>.md` |
   | hook | `library/hooks/` | `<id>.md` (JSON body) |
   | mcp | `library/mcp/` | `<id>.md` (JSON body) |
   | plugin | `library/plugins/<id>/` | `README.md` (+ plugin files) |
   | workflow | `library/workflows/` | `<id>.md` |

   The folder is only for tidiness; the `type` field in the frontmatter is what the site uses.

2. Fill in the frontmatter. Every field is commented in the template. Ids in `models`, `assistants`, `categories`
   and `roles` must exist in `library/taxonomy.yml`. The schema is in `schema/artifact.schema.json`.

3. Write the body: the artefact itself, exactly as someone would paste it. Use `{{name}}` for fill-in fields and
   declare each one under `variables` (with a `description`, a `default`, and optionally `options` for a picker or
   `multiline: true` for a big box).

4. Supporting files go next to the entry file: per-model variants under `variants/`, a sample reply under
   `examples/`. Reference them with relative paths (`variants/<id>.claude.md`, `examples/<id>.md`).

5. Test the artefact on at least one real model and record the model name under `tested_on`.

6. Open a merge request using the template. The pipeline runs the same checks the site build runs and fails with a
   message that names the file and the field.

## What the pipeline checks

- Frontmatter matches the JSON Schema (required fields, allowed values, patterns).
- `id` is unique across the repository.
- Every id in `models`, `assistants`, `categories`, `roles`, `related`, `variants[].for` and collections exists.
- `{{placeholders}}` in the body are declared (undeclared ones are warnings and render as plain text).
- Bodies with `format: json` or `format: yaml` parse.
- No secrets: API keys, tokens, private keys, passwords in URLs. Use `${ENV_VAR}` placeholders instead.
- Size limits: 64 KB per entry body, 2 MB and 200 files per folder artefact.
- `source` links and taxonomy `docs_url`s respond (warning only; `--strict-links` turns it into an error).
- Exactly one collection has `start_here: true`.

Run the checks yourself from a checkout of the app repo: `CONTENT_PATH=../this-repo npm run validate`.

## Review checklist (for maintainers)

- [ ] Title says what it does, in plain words; summary makes sense to someone who has never seen the prompt.
- [ ] `difficulty` is honest: beginner means no setup and no jargon.
- [ ] Variables are named, described and have sensible defaults; the default text reads well when nothing is filled in.
- [ ] No secrets, internal hostnames or personal data anywhere in the file or its folder.
- [ ] `license` is set; `source` credits where it came from if it was adapted.
- [ ] `tested_on` names at least one real model; an `example_output` is present for prompts where one helps.
- [ ] `related` points at things a reader would actually want next.
- [ ] For skills, agents and commands: the installed file works as-is (`install_frontmatter` has what the assistant needs).
- [ ] `status` set to `reviewed` only after you tried it.

## Versioning

Any change to the body bumps `version` (patch `x.y.Z` for wording, minor `x.Y.0` for behaviour, major `X.0.0` for a
rewrite) and sets `updated` to today. The site shows a compact history per artefact from Git; if the build cannot see
Git history it falls back to the optional `changelog` list in the frontmatter, newest first.

Metadata-only changes (tags, categories, related) do not need a version bump.

## Deprecating

Set `status: deprecated` and add the replacement to `related`. Do not delete files; links elsewhere may point at them.

## Taxonomy changes

Adding a model, assistant, category or role is a change to `library/taxonomy.yml` in its own merge request. Keep
labels short: they appear on chips. Assistants can carry `install` paths per type, an `install_note`, and an
`open_url_template` for hosts that accept a prefilled prompt in a URL.
