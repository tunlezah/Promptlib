# Architecture

## Stack and why

**A small custom static generator in Node (ESM), emitting plain HTML, one stylesheet and a handful of ES modules. No framework, no bundler.**

The spec asked for few dependencies, a small bundle, plain HTML with progressive enhancement, and an isolated-network deployment. Off-the-shelf generators (Eleventy, Astro, Hugo) would each have met most of that, but every one adds a plugin ecosystem, a templating dialect and a build toolchain that content contributors and future maintainers would have to learn, and the parts this site needs are small: read Markdown with frontmatter, validate it, compute a catalogue, render pages from it. The generator here is about 1,500 lines of ordinary JavaScript in `scripts/lib/` and `src/templates/`, with eight runtime dependencies:

| Dependency | Used for | Where |
|---|---|---|
| `js-yaml` | frontmatter, taxonomy, collections, config | build |
| `ajv` + `ajv-formats` | JSON Schema validation with readable errors | build |
| `markdown-it` | Learn pages, `why_it_works`, example output (build); AI replies (browser, lazy) | both |
| `highlight.js` | syntax highlighting of artefact bodies at build time | build |
| `minisearch` | search index built at CI time, loaded lazily in the browser | both |
| `fflate` | zips for folder artefacts | build |
| `dompurify` | sanitising Markdown rendered from AI replies | browser, lazy |

`@playwright/test` is the only dev dependency. Node's built-in test runner covers unit and build tests.

Browser code is shipped as native ES modules (`<script type="module">`), which every target browser supports, so there is no bundler or transpiler. Code shared between the build and the browser (`src/shared/`: variable substitution, card markup, icons, install commands, search options) is plain dependency-free JavaScript imported by both sides, which keeps server-rendered and client-rendered markup identical.

## Build flow

```
site.config.yml + env  ─▶ loadConfig()            scripts/lib/config.js
content repo on disk   ─▶ loadContent()           scripts/lib/content.js     (walk, frontmatter, support files)
                       ─▶ validateContent()       scripts/lib/validate.js    (schema, ids, taxonomy, placeholders, secrets, sizes)
                       ─▶ fileHistories()         scripts/lib/git.js         (per-file git log, if a checkout)
                       ─▶ buildModel()            scripts/lib/model.js       (urls, install text, counts, related, collections)
                       ─▶ writeAssets()           scripts/lib/assets.js      (css, js, vendor, icons, manifest, sw.js, build id)
                       ─▶ renderSite()            src/templates/index.js     (every page as { path, html })
                       ─▶ index.json, search-index.json, feed.xml/json, sitemap.xml, robots.txt, downloads/
```

`npm run build` does all of this in well under a second for the starter content. A validation error stops the build with the file and field named; warnings (undeclared placeholders, unused variables, unreachable links with `--check-links`) do not.

### Content repo layout and rules

The walker (`content.js`) treats the content root (default `library/`) as follows: `taxonomy.yml`, `collections/` and `learn/` are reserved; every other `*.md` file with frontmatter is an artefact; a folder that contains an entry file (`SKILL.md`, `README.md`, `index.md` or `<folder>.md` with frontmatter) is a folder artefact and is not descended further; any other folder is descended, so `prompts/variants/` and `prompts/examples/` hold support files. The `type` frontmatter field, not the folder, decides what an artefact is.

Support files (`variants[].file`, `example_output`) resolve relative to the entry file's folder and must exist. Per-artefact history comes from `git log --name-only` over the content checkout when there is one, otherwise from the optional `changelog` list.

### Outputs and URL scheme

| URL | Content |
|---|---|
| `/` | home |
| `/browse/`, `/browse/{type\|model\|assistant\|category}/{id}/` | browse page and pre-filtered landing pages (pre-rendered lists, chips are links without JS) |
| `/library/{id}/` | artefact |
| `/collections/`, `/collections/{id}/` | collections |
| `/learn/`, `/learn/{slug}/` | learn pages |
| `/contribute/`, `/favourites/`, `/try/`, `/offline/`, `/404.html` | utility pages |
| `/index.json` | full catalogue with bodies and computed fields (for CLIs, agents, scripts) |
| `/search-index.json` | serialised MiniSearch index |
| `/feed.xml`, `/feed.json` | new and updated artefacts |
| `/downloads/{id}.{md,json,yml,xml,txt}`, `/downloads/{id}.zip` | install-ready files; zips for folder artefacts |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/sw.js` | |

Every link is prefixed with `site.base_path`, so a project Pages site under `/prompt-library/` works unchanged; the dev server and the e2e tests exercise a `/lib/` base.

### Install-ready downloads

The library's frontmatter (id, summary, difficulty, …) is not what an assistant expects at the top of a `SKILL.md` or a Cursor `.mdc` rule. Downloads and zips therefore rewrite the entry file's frontmatter to `install_frontmatter` from the artefact (or, for skills, agents and commands, a derived `name`/`description`), and keep the body verbatim. Every other file in a folder artefact is copied as-is. The one-liners shown under **Install** fetch these downloads from the site itself, so an isolated network needs nothing else.

## Client architecture

Pages are complete without JavaScript: lists are pre-rendered, filter chips are links to landing pages, and every artefact page has a plain `<textarea>` with the body and default values. JavaScript then upgrades in place:

| Module | Role |
|---|---|
| `app.js` | theme and accent, mobile nav, shortcuts dialog and keys (`/ ? j k Enter c f Esc`), copy and favourite buttons (event delegation), start-here rail state, menu closing, service worker registration |
| `ui.js`, `store.js`, `catalog.js` | side-effect-free helpers; localStorage access in one place (`pl.*` keys); lazy loading of `index.json` and the search index |
| `browse.js` | filters (AND across axes, OR within), live search with snippets, sort, grid/list, grouping; state serialised to the URL with `pushState` so back/forward and sharing work |
| `artifact.js` | replaces `{{variable}}` slots in the highlighted body with inputs/pickers/textareas (all slots of one variable stay in sync), live copy, variant switch, open-in links, install one-liners per assistant and shell, runtime refresh |
| `ai.js` | Send to AI panel, adapters, streaming, error explanations, bearer-token settings; loaded only when the panel is opened |
| `favourites.js`, `try.js` | favourites view with export/import; the playground |

Each entry module is loaded with `?v=<build id>`; modules import each other without the query so the module graph is shared. `syncFavButtons` and friends live in `ui.js` precisely so that `app.js` (the only module with side effects) is never imported twice.

### Highlighting with editable variables

Bodies are highlighted at build time. Each `{{name}}` is replaced by an identifier-like sentinel before tokenising, highlight.js runs, and each sentinel is swapped back for a `<span class="var">` slot. If a sentinel is split or lost by the grammar the body falls back to plain escaped text with the same slots, so a variable can never be rendered incorrectly.

### Search

MiniSearch indexes title, summary, tags, body, variable names, id, categories and type, with title boosted highest, prefix matching and light fuzziness. The index is serialised at build time (`search-index.json`, roughly 56 KB for the starter) and loaded on the first query. Snippets are computed client-side from the body around the first matched term. Filters and sorting apply after search; relevance is the default sort with a query, updated date without.

## Security model

- **Content is data.** Markdown from the content repo is rendered with `markdown-it` with raw HTML disabled and unsafe link protocols rejected; artefact bodies are escaped and never parsed as HTML. Nothing from the content repo is executed or evaluated. AI replies are rendered with `markdown-it` (raw HTML off) and then passed through DOMPurify.
- **Content-Security-Policy on every page.** `default-src 'self'`; scripts from `'self'` plus one hash for the theme-preload snippet; no `unsafe-inline` for styles or scripts (banner colours are compiled into the stylesheet; the client never sets `style` attributes); `connect-src 'self'` plus exactly the configured AI origins (and the GitLab host in runtime mode); `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- **No third parties.** No CDNs, fonts, analytics or telemetry. Vendored libraries are copied from `node_modules` at build time.
- **Secrets never reach the site.** `${VAR}` substitution happens at build time for headers such as a team identifier; the validator refuses content that looks like a credential; bearer tokens live only in the visitor's localStorage.
- **Send to AI** uses `credentials: "include"` only for `auth: mtls` so the browser presents the client certificate itself; the page never touches certificates. See `docs/AI-GATEWAY.md` for the gateway side.

## Offline and performance

The service worker caches `/assets/` cache-first (immutable per build id) and everything else network-first with a cache fallback, so visited pages keep working offline and a new deploy is picked up on the next load. Pages weigh roughly 20–40 KB of HTML plus a 47 KB stylesheet and 10–25 KB of JavaScript per page; the search index and vendor libraries load only when used. No web fonts. Lighthouse results at the time of writing are recorded in DECISIONS.md.

## Runtime content mode (optional)

With `content.mode: runtime` the built site additionally embeds the GitLab API location and, in the browser, tries to fetch the latest catalogue from `<root>/index.json` in the content repo (produced by `npm run validate -- --write-index library/index.json` in the content repo's pipeline and committed there) and, on artefact pages, the latest body of the entry file through the repository files API. When either fetch fails the built content is used, so a private instance or a CORS refusal degrades to the default behaviour. The GitLab host is added to `connect-src`. This mode suits public projects that want edits visible without a rebuild; build-time mode remains the default because it needs no CORS and no tokens.

## Accessibility

Landmarks (`header`, `nav`, `main`, `aside`, `footer`), a skip link, one `h1` per page, labelled controls, `aria-pressed` on toggles, `aria-live` for result counts, toasts and AI status, native `<dialog>` and `<details>` for menus and disclosures (so they work without JavaScript and manage focus natively), visible focus rings, and colour pairs chosen for 4.5:1 contrast in both themes. Motion is limited to short transitions and disabled under `prefers-reduced-motion`.

## Testing

- `tests/unit/`: validator behaviour on synthetic content repos (schema errors, taxonomy ids, duplicates, placeholders, secrets, sizes, JSON bodies, collections), config loading and env overrides, variable substitution, frontmatter parsing.
- `tests/build/`: a full build into a temp folder with the e2e config (sub-path base, banner, AI endpoint) asserting every artefact has a page and download and appears in `index.json`, that filter, collection and learn pages exist, that feeds, sitemap, manifest and CSP are correct, that the search index loads with the shared options, and that no template leaked `undefined`.
- `tests/e2e/`: Playwright on desktop and a 390 px viewport: search, filters and URL state, keyboard shortcuts, variables and copy (clipboard), variants, install one-liners, favourites, no-JS reading, theme persistence, and Send to AI against a mocked streaming endpoint including the error path.

## Extending

- A new artefact type: add it to the `type` enum in `schema/artifact.schema.json`, `TYPE_LABELS`/`TYPE_PLURALS`/`TYPE_ORDER` in `src/shared/text.js`, an icon in `TYPE_ICONS`, a folder in the contribute page map, and `install` paths in the taxonomy.
- A new filter axis: add it to `AXES` in `src/templates/browse.js` and `src/client/browse.js`, and a count in `buildModel`.
- A new AI API style: add an adapter object to `ADAPTERS` in `src/client/ai.js` and the name to `API_STYLES` in `scripts/lib/config.js`.
