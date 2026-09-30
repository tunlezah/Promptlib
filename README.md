# Prompt Library

A static web app that catalogues AI prompts and related artefacts — system prompts, skills, rules, agents, slash
commands, hooks, MCP configs, plugins and workflows — for everyone from first-time prompt writers to engineers who
ship agent tooling. Content lives in a separate Git repository as plain Markdown files; this repository holds the
site. Developed on GitHub, deployed to GitLab Pages, self-contained enough to run on an isolated network.

- **Two repos.** This app repo builds and deploys the site. A content repo (start from [`content-starter/`](content-starter/)) holds the artefacts. Merging a prompt republishes the site within minutes.
- **Static, offline-safe.** Plain HTML with progressive enhancement, no CDNs, no fonts, no telemetry, vendored libraries, strict Content-Security-Policy. Reading and copying work without JavaScript.
- **For two audiences.** A *Start here* rail and Learn pages for newcomers; install one-liners, downloads, `index.json`, feeds and keyboard shortcuts for engineers.
- **Send to AI.** Optional panel that sends the filled-in prompt to your own gateway (mTLS, bearer or none; OpenAI chat/responses, Anthropic messages or Ollama APIs) and streams the reply. Hidden unless configured.

Documentation: [ARCHITECTURE.md](ARCHITECTURE.md) · [DECISIONS.md](DECISIONS.md) · [docs/SETUP.md](docs/SETUP.md) (five-minute GitLab setup) · [docs/AI-GATEWAY.md](docs/AI-GATEWAY.md) · [docs/DESIGN-TOKENS.md](docs/DESIGN-TOKENS.md) · content format: [content-starter/CONTRIBUTING.md](content-starter/CONTRIBUTING.md)

## Quick start

Requires Node.js 20 or newer (22 LTS recommended). No global tools.

```sh
npm ci
npm run dev            # builds into public/ from content-starter/ and serves http://127.0.0.1:4173/ with rebuild on change
```

Point the build at a real content repo with a local path or a Git URL:

```sh
CONTENT_PATH=../prompt-library-content npm run build
# or
CONTENT_GIT_URL=https://gitlab.example.com/team/prompt-library-content.git npm run fetch-content && CONTENT_PATH=.content-cache/content npm run build
```

## Scripts

| Script | What it does |
|---|---|
| `npm run validate` | Validates the content repo: schema, unique ids, taxonomy ids, cross-references, placeholders, JSON/YAML bodies, secrets, size limits. Readable errors naming file and field. Flags: `--check-links`, `--strict-links`, `--json`, `--content <path>`, `--write-index <file>`. |
| `npm run build` | Validates, then builds the site into `public/` (`--out <dir>` to change). Fails on any validation error. |
| `npm run dev` | Build, serve and rebuild on change. `npm run serve` serves an existing build. `--port`, `--dir`. |
| `npm run fetch-content` | Clones or updates the content repo (`CONTENT_GIT_URL`, or `CI_JOB_TOKEN` / a deploy token with `content.project`). |
| `npm test` | Unit tests (validator, config, variables) and the build test (every artefact has a page, index.json, feeds, CSP, downloads). |
| `npm run test:e2e` | Playwright browser tests on desktop and a 390 px viewport against a test build with a sub-path base and a mocked AI endpoint. |
| `npm run ci` | `validate` + `build` + `test`, what both CI files run. |

## Configuration

Everything is in [`site.config.yml`](site.config.yml) (commented). Any value can be overridden at build time by an environment variable, and any string may contain `${VAR}`, substituted from the environment.

| Key | Env override | Notes |
|---|---|---|
| `site.name`, `site.tagline` | `SITE_NAME`, `SITE_TAGLINE` | |
| `site.url` | `SITE_URL` | Absolute URL for feeds, sitemap, canonical links and install one-liners. Derived from `CI_PAGES_URL` on GitLab. |
| `site.base_path` | `SITE_BASE_PATH` | `/` for a root domain, `/project/` for a project Pages site. Derived from `CI_PAGES_URL`. |
| `header.*` | `HEADER_TEXT`, `HEADER_BACKGROUND`, `HEADER_FOREGROUND`, `HEADER_LINK`, `HEADER_STICKY`, `HEADER_REPEAT_AT_BOTTOM` | A one-line marking banner on every page (and in print). Empty text hides it. |
| `content.mode` | `CONTENT_MODE` | `build-time` (default) or `runtime` (see ARCHITECTURE.md). |
| `content.host`, `content.project`, `content.branch`, `content.root` | `CONTENT_HOST`, `CONTENT_PROJECT`, `CONTENT_BRANCH`, `CONTENT_ROOT` | Where the content lives on GitLab and the folder inside the repo (default `library`). Used for view/edit/issue links. |
| `content.path` | `CONTENT_PATH` | Local checkout of the content repo. Defaults to the bundled `content-starter`. |
| `content.web_url_template`, `issue_url_template`, `api_url_template` | | GitLab URL shapes; change only for non-standard hosts. |
| `content.limits.*` | | Body/folder size and file-count limits enforced by the validator. |
| `features.*` | `FEATURE_FAVOURITES`, `FEATURE_OPEN_IN_LINKS`, `FEATURE_SEND_TO_AI`, `FEATURE_FEEDBACK_LINKS`, `FEATURE_RSS` | Booleans. |
| `ai.endpoints[]` | any `${VAR}` you reference, e.g. `AI_TEAM_HEADER` | Endpoints the site may call. Empty list hides the feature. See [docs/AI-GATEWAY.md](docs/AI-GATEWAY.md). |

The CSP `connect-src` of every page is set to exactly the configured AI origins (plus the GitLab host in runtime mode), so the browser cannot send a prompt anywhere else.

## How the two repositories work together

1. A contributor opens a merge request in the **content repo**. Its pipeline clones this app repo and runs `npm run validate` against the MR, failing with a readable message if anything is wrong.
2. On merge to the content repo's default branch, its pipeline triggers this repo's pipeline (multi-project pipeline, or a trigger token).
3. This repo's `.gitlab-ci.yml` clones the content repo with `CI_JOB_TOKEN` (or a deploy token), validates, builds, runs the build test and publishes `public/` to GitLab Pages.

GitHub Actions (`.github/workflows/ci.yml`) runs validate, build, tests and browser tests on every push and pull request using the bundled starter content (or the content repo when `CONTENT_GIT_URL` is set), with an optional GitHub Pages preview. The GitLab pipeline is the production one.

The step-by-step version with the exact GitLab settings is in [docs/SETUP.md](docs/SETUP.md).

## What the build produces

`public/` contains pre-rendered HTML for the home page, every artefact (`/library/<id>/`), every collection, every filter landing page (`/browse/type|model|assistant|category/<id>/`), every learn page, contribute, favourites, try, 404 and offline pages; `index.json` (the full catalogue with bodies for CLIs and agents), `search-index.json`, `feed.xml` and `feed.json`, `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `sw.js`; `downloads/<id>.<ext>` install-ready files and `downloads/<id>.zip` for folder artefacts; and `assets/` with one stylesheet, the client modules and the vendored libraries.

## Repository layout

```
site.config.yml          site configuration (with comments)
schema/                  JSON Schemas for artefacts, collections, taxonomy (copied into content-starter/schema)
scripts/                 build.js, validate.js, dev.js, fetch-content.js and lib/ (config, content, validate, model, …)
src/templates/           page templates (plain JS template functions)
src/styles/              tokens.css, base.css, components.css, pages.css, highlight.css, print.css
src/client/              browser modules (ES modules, no bundler)
src/shared/              code used by both the build and the browser (variables, cards, icons, install commands)
src/static/              favicon and logo
content-starter/         the content repository starter: push it to a new GitLab project
tests/                   unit/, build/ and e2e/ (Playwright)
docs/                    setup guide, AI gateway requirements, design tokens
.gitlab-ci.yml           production pipeline (GitLab Pages)
.github/workflows/ci.yml development CI (GitHub)
```

## Browser support and accessibility

Current Edge and Chrome; Firefox works. Layouts are responsive down to 360 px. WCAG 2.2 AA is the target: full keyboard operation (`?` shows the shortcuts), visible focus, `prefers-reduced-motion` and `prefers-color-scheme` respected, landmarks and live regions throughout.

## Licence

The app is released under the MIT licence (see [LICENSE](LICENSE)). Starter content is CC0-1.0 unless an artefact's `license` field says otherwise. Vendored libraries and their licences are listed in `public/assets/vendor/LICENSES.txt` after a build.
