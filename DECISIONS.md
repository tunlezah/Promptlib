# Decisions

Choices the specification left open, the default taken for each, and ideas deliberately not built. Change a default by
editing the file named; none is hidden in code.

## Questions I would have asked first (and the assumption taken)

1. **Which GitLab host and project paths?** Assumed placeholders in `site.config.yml` (`gitlab.com`, `your-group/prompt-library-content`). All GitLab links are disabled until `content.project` is set, and the pipelines read the same values.
2. **Is there an AI gateway today?** Assumed not yet: `ai.endpoints` is empty, so the feature is hidden. The e2e tests run against a mock so the panel is exercised anyway.
3. **Should the banner be on?** Assumed off (`header.text: ""`). The test config turns it on to prove it renders top and bottom and in print.
4. **Is the content licence CC0?** Assumed `CC0-1.0` as the site-wide default (`site.default_license`) and in every seeded artefact.
5. **Who are the reviewers?** `content-starter/CODEOWNERS` uses placeholder handles.

## Defaults taken

| Area | Decision | Where to change |
|---|---|---|
| Stack | Custom Node generator, plain HTML/CSS/ES modules, no bundler (see ARCHITECTURE.md). | — |
| Content sync | `build-time` clone via `CI_JOB_TOKEN`. Runtime mode implemented as an option: fetches `<root>/index.json` and entry-file bodies from the files API when `content.mode: runtime`, falling back to the built content. | `site.config.yml` → `content.mode` |
| Pre-rendered vs SPA | Every page pre-rendered; filter landing pages pre-render their lists; JS upgrades in place. Filtered views navigate to `/browse/?…` so state is a plain query string. | — |
| Search engine | MiniSearch (56 KB index for 28 artefacts, built at CI time, lazy-loaded). Pagefind would suit a library past a few thousand artefacts. | `src/shared/search-options.js`, `scripts/lib/search.js` |
| Bundled sample content | The spec names a `content-sample/` folder. To avoid maintaining two copies of 28 artefacts, the default `CONTENT_PATH` is `content-starter/`, which is also the folder pushed to a new content project. | `site.config.yml` → `content.path` |
| Artefact URLs | `/library/<id>/`, independent of type and folder, so a re-classified artefact keeps its link. | `scripts/lib/model.js` |
| Folder artefact entry file | `SKILL.md`, then `README.md`, `index.md`, `<folder>.md`; a folder without one is a support folder (`variants/`, `examples/`). | `scripts/lib/content.js` |
| Installed frontmatter | New optional field `install_frontmatter` (free-form object) written to downloads and zips in place of the library frontmatter; skills/agents default to `name` + `description`, commands to `description`. Prompts and JSON bodies download bare. | `schema/artifact.schema.json`, `scripts/lib/model.js` |
| Downloads | "Raw file" means the install-ready file above (`downloads/<id>.<ext>`), plus the zip for folders. The original source is one click away via *View source*. | `scripts/lib/downloads.js` |
| Install one-liners | Bash and PowerShell, generated in the browser with the site's origin. Shared files (`CLAUDE.md`, `AGENTS.md`, …) are appended to; JSON targets (`settings.json`, `.mcp.json`) are deep-merged with `jq`; folders unpack a zip. | `src/shared/install.js` |
| Open in | Assistants with `open_url_template` in the taxonomy: Cursor (deep link), plus two chat-app entries (Claude web, ChatGPT web) added to the seeded taxonomy for that purpose. Links longer than `open_url_max_length` are refused with a hint to copy. | `content-starter/library/taxonomy.yml` |
| Filter UI | One popover per axis (native `<details>`) with toggle chips inside, active filters shown as removable chips, so seven axes with ~55 values stay in one sticky row. | `src/templates/browse.js` |
| Default sort | Relevance with a query, recently updated without. | `src/client/browse.js` |
| Grouping | "Group by category" is an opt-in toggle, disabled while a query is active. | — |
| Start here rail | Open until the first copy (tracked via the recently-copied list), then collapsed; the visitor's own toggle wins after that. | `src/client/app.js` |
| Variables UI | Fields are inline in the highlighted body (input, `<select>` for `options`, `<textarea>` for `multiline`); a legend below lists them. New optional `multiline` flag on variables. | `schema/artifact.schema.json`, `src/client/artifact.js` |
| Undeclared `{{x}}` | Warning, rendered as plain text; declared-but-unused is also a warning. Errors would have blocked prompts that legitimately contain braces. | `scripts/lib/validate.js` |
| Ids | Lowercase slugs, 2–80 characters. | schema |
| Secret scanning | Pattern-based (AWS, GitHub, GitLab, Slack, OpenAI/Anthropic, Google, private keys, JWTs, password literals, basic-auth URLs). Regex *sources* in hook bodies do not match. `secret-scan-ignore` on a line opts it out. | `scripts/lib/validate.js` |
| Dead-link check | `--check-links` is a warning by default (`--strict-links` for errors) so a flaky external site cannot block a merge; the content pipeline runs it on MRs. | `content-starter/.gitlab-ci.yml` |
| Changelog | From `git log` on the content checkout when available, else the `changelog` frontmatter list. The `.gitlab-ci.yml` clones with full history for this reason (`CONTENT_CLONE_DEPTH` to shorten). | `scripts/lib/git.js` |
| Feeds | RSS 2.0 and JSON Feed 1.1, 50 newest by `updated`, item ids `id@version`. | `scripts/lib/feeds.js` |
| CSP | Strict, hash-allowed theme snippet, no inline styles anywhere, `connect-src` = configured AI origins. | `scripts/lib/assets.js` |
| Service worker | Cache-first for `/assets/`, network-first for pages and JSON, versioned by build id, offline page. Blocked in tests. | `scripts/lib/assets.js` |
| Themes | System/light/dark plus five accents (blue, teal, violet, amber, rose), remembered in localStorage and applied before first paint. | `src/styles/tokens.css` |
| Anthropic adapter | Sends `anthropic-dangerous-direct-browser-access: true`, needed for direct browser calls to Anthropic's API and harmless for gateways. | `src/client/ai.js` |
| History of AI exchanges | Off by default, up to five per artefact, localStorage only. | — |
| Learn pages | Plain Markdown with `title`, `summary`, `order` frontmatter; internal links are relative. | `content-starter/library/learn/` |
| Taxonomy additions | Assistants carry `install` (path per type), `install_note`, `docs_url`, `open_url_template`, `open_url_max_length`; models carry `vendor`, `icon`, `description`. | `schema/taxonomy.schema.json` |
| Playwright browser | The config honours `PW_CHROMIUM_PATH` so a pre-installed Chromium can be used offline; CI installs Chromium with `npx playwright install --with-deps chromium`. | `playwright.config.js` |

## Measured

Lighthouse 12, desktop preset, headless Chromium, local static server, starter content (28 artefacts), build of 30 Sep 2026:

| Page | Performance | Accessibility | Best practices | SEO | FCP / LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Home | 100 | 100 | 100 | 100 | 0.4 s / 0.4 s | 0 ms | 0 |
| Browse | 100 | 100 | 100 | 100 | 0.4 s / 0.6 s | 0 ms | 0 |
| Artefact (security-code-review) | 100 | 100 | 100 | 100 | 0.4 s / 0.4 s | 0 ms | 0.003 |
| Collection (start-here) | 100 | 100 | 100 | 100 | — | 0 ms | 0 |

Two accessibility findings were fixed along the way: accent text on accent-tinted backgrounds (3.9:1) now uses a darker `--accent-ink` token (≥ 4.6:1 in light mode, the accent itself in dark mode), and card headings sit under a visually hidden `h2` so heading order is valid. Remaining non-scored notes are inherent to a static site without a minifier (unminified CSS/JS, one render-blocking stylesheet) and to the local server (no compression, `no-store`).

Payload per page: 20–40 KB HTML, 47 KB CSS (one file, cached per build), 10–25 KB JS; the 56 KB search index and the vendored Markdown/sanitiser libraries load only on first use. No fonts, no third-party requests.

## Not done (ideas noted, deliberately outside the spec)

- **Prompt diff between versions** from Git history on the artefact page.
- **"Copy as JSON" / "Copy for API"** producing a ready `messages` array for the selected api_style.
- **Per-assistant install via deep link** (`cursor://…/mcp/install`) for MCP configs, in addition to the one-liner.
- **Related-by-similarity** using the search index when `related` is empty.
- **Content-repo bot** that bumps `version`/`updated` automatically on body changes in an MR.
- **Pagefind** as a drop-in replacement for MiniSearch once the library grows past a few thousand artefacts.
- **Runtime mode for browse without a committed index.json**, by listing the repository tree through the API and parsing frontmatter in the browser (needs a browser YAML parser, ~40 KB).
- **Usage counters** (copies per artefact) would need a server or analytics, both excluded by the constraints.
- **Localisation** of UI strings.
