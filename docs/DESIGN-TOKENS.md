# Design tokens

All visual decisions are CSS custom properties defined in `src/styles/tokens.css`. Components use tokens only; no
component file contains a raw colour, size or font. Light values live on `:root`; dark values are applied both by
`[data-theme="dark"]` (explicit choice) and by `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`
(system preference). Five accent colours are selectable with `[data-accent]`.

## Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#ffffff` | `#0f1218` | page background |
| `--bg-2` | `#f6f7f9` | `#161a22` | toolbars, hover, subtle panels |
| `--bg-3` | `#eceef2` | `#1f242e` | badges, segmented controls |
| `--bg-elev` | `#ffffff` | `#161a22` | cards, menus, dialogs |
| `--fg` | `#171b24` | `#e8ebf1` | text |
| `--fg-2` | `#47505f` | `#b4bccb` | secondary text (≥ 4.5:1 on `--bg`) |
| `--fg-3` | `#6b7487` | `#8a94a8` | tertiary text, labels (≥ 4.5:1 on `--bg`) |
| `--border`, `--border-2` | `#e1e5eb`, `#c8cfd9` | `#2a303c`, `#3a4252` | hairlines, controls |
| `--accent`, `--accent-hover`, `--accent-fg` | per accent, e.g. blue `#2f6fed` / `#245fd2` / `#fff` | lighter accents with dark `--accent-fg` | primary actions, active chips, links |
| `--accent-soft`, `--accent-soft-2` | `color-mix(accent 12% / 22%, bg)` | same formula | tinted backgrounds, variable fields |
| `--ok`, `--warn`, `--danger`, `--info` (+ `-soft`) | `#1a7f4b`, `#9a5b00`, `#b42318`, `#175cd3` | brighter variants | status badges, notices, difficulty |
| `--mark` | `#fff0a8` | `#5a4a00` | search highlights |
| `--code-bg` | `#f4f5f8` | `#12161d` | code and prompt bodies |
| `--banner-bg`, `--banner-fg` | from `site.config.yml` | same | the marking banner (compiled into the stylesheet) |

Accents: `blue` (default) `#2f6fed`, `teal` `#0f8b8d`, `violet` `#6d4be8`, `amber` `#b8600b`, `rose` `#c4325f`; each has a lighter dark-mode value so text on accent buttons stays ≥ 4.5:1 (`--accent-fg` flips to near-black in dark mode).

Difficulty: beginner = ok, intermediate = info, advanced = warn. Status: reviewed = ok, draft = warn, deprecated = danger.

## Type

System font stacks only (no web fonts): `--font-sans` (system-ui, Segoe UI, Roboto, …) and `--font-mono` (ui-monospace, Cascadia, Consolas, Menlo, …).

| Token | Value |
|---|---|
| `--fs-xs` … `--fs-2xl` | 0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.75 rem |
| `--fs-3xl` | `clamp(2rem, 1.4rem + 2vw, 2.75rem)` (hero) |
| `--lh-tight`, `--lh-body` | 1.25, 1.55 |

Headings weigh 650 with `-0.01em` tracking; body 400; labels and badges 600.

## Space and shape

`--sp-1` … `--sp-8`: 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4.5 rem. Radii: `--radius-sm` 4px (inputs, code), `--radius-md` 8px (buttons, menus), `--radius-lg` 14px (cards, panels), `--radius-pill`. Shadows `--shadow-1/2/3` for cards on hover, menus and dialogs. Layout widths `--maxw` 74rem (browse, artefact) and `--maxw-narrow` 46rem (reading pages). `--header-h` 3.5rem drives sticky offsets.

## Motion and focus

`--dur` 160ms with `--ease` for hover and toggle transitions; everything collapses to 0.01ms under `prefers-reduced-motion`. Focus is a two-ring outline `--focus-ring` (bg gap + accent) on every interactive element via `:focus-visible`.

## Density rules

The home page is airy (`--sp-7` hero padding, `--sp-6` between sections). Lists are dense: cards use `--sp-4` padding, `--sp-3` gaps, three-line clamped summaries, and a one-line list view. Filter bars, toolbars and menus use `--fs-sm`.

## Using tokens

- New colours go in `tokens.css` in both themes, and must pass 4.5:1 against the surface they sit on.
- Never write `style=""` in templates or set `style` attributes from JavaScript: the CSP forbids inline styles. Toggle classes or `data-` attributes instead.
- Prefer `color-mix()` from `--accent` for tints so every accent keeps working.
