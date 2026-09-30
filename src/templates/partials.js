// Shared page fragments.
import { html, raw, escapeHtml } from '../../scripts/lib/html.js';
import { icon, TYPE_ICONS } from '../shared/icons.js';
import { renderCards } from '../shared/card.js';
import { TYPE_PLURALS } from '../shared/text.js';

export function banner(model, { bottom = false } = {}) {
  const h = model.cfg.header;
  if (!h.enabled) return '';
  const cls = `banner ${bottom ? 'banner--bottom' : h.sticky ? 'banner--sticky' : ''}`;
  const inner = h.link ? html`<a href="${h.link}">${h.text}</a>` : html`${h.text}`;
  return html`<div class="${cls}" role="${bottom ? 'presentation' : 'note'}" aria-label="${bottom ? '' : 'Site marking'}">${inner}</div>`;
}

export function themeMenu() {
  return raw(`<details class="menu menu--right theme-menu" id="theme-menu">
  <summary class="icon-btn" aria-label="Theme and colour" title="Theme">${icon('contrast')}</summary>
  <div class="menu__list" role="group" aria-label="Appearance">
    <div class="menu__label">Theme</div>
    <label class="menu__item theme-option"><input type="radio" name="theme" value="system" checked> System</label>
    <label class="menu__item theme-option"><input type="radio" name="theme" value="light"> Light</label>
    <label class="menu__item theme-option"><input type="radio" name="theme" value="dark"> Dark</label>
    <div class="menu__label">Accent</div>
    <div class="accent-swatches" role="group" aria-label="Accent colour">
      ${['blue', 'teal', 'violet', 'amber', 'rose'].map((a) => `<button type="button" class="swatch swatch--${a}" data-accent="${a}" aria-pressed="${a === 'blue'}" aria-label="${a[0].toUpperCase() + a.slice(1)} accent"></button>`).join('')}
    </div>
  </div>
</details>`);
}

export function siteHeader(model, assets, { current = '' } = {}) {
  const u = model.u;
  const f = model.cfg.features;
  const links = [
    ['browse', 'Browse', u('browse/')],
    ['collections', 'Collections', u('collections/')],
    ['learn', 'Learn', u('learn/')],
    ['contribute', 'Contribute', u('contribute/')],
    f.favourites ? ['favourites', 'Favourites', u('favourites/')] : null,
    model.cfg.ai.enabled ? ['try', 'Try', u('try/')] : null
  ].filter(Boolean);
  return html`<header class="site-header">
  <div class="container site-header__inner">
    <a class="brand" href="${u()}" aria-label="${model.cfg.site.name} home">
      <img class="brand__logo" src="${assets.logo}" alt="" width="26" height="26">
      <span class="brand__name">${model.cfg.site.name}</span>
    </a>
    <button type="button" class="icon-btn nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">${raw(icon('menu'))}</button>
    <form class="header-search" role="search" action="${u('browse/')}" method="get">
      <div class="search-box">
        ${raw(icon('search', 'search-box__icon'))}
        <input class="search-box__input" id="site-search" type="search" name="q" placeholder="Search prompts, skills, rules…" aria-label="Search the library" autocomplete="off" spellcheck="false">
        <span class="search-box__hint" aria-hidden="true"><kbd>/</kbd></span>
      </div>
    </form>
    <nav class="nav" id="site-nav" aria-label="Main">
      <ul class="nav__list">
        ${links.map(([key, label, href]) => html`<li><a class="nav__link" href="${href}"${current === key ? raw(' aria-current="page"') : ''}>${label}</a></li>`)}
      </ul>
    </nav>
    <div class="header-actions">
      <button type="button" class="icon-btn" id="shortcuts-btn" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">${raw(icon('keyboard'))}</button>
      ${themeMenu()}
    </div>
  </div>
</header>`;
}

export function siteFooter(model, assets) {
  const u = model.u;
  const links = model.links;
  return html`<footer class="site-footer">
  <div class="container site-footer__inner">
    <ul class="footer-links">
      ${links.enabled ? html`<li><a href="${links.repo}" rel="noopener">Content repository</a></li>` : ''}
      <li><a href="${u('contribute/')}">Contribute</a></li>
      <li><a href="${u('index.json')}">index.json</a></li>
      ${model.cfg.features.rss ? html`<li><a href="${u('feed.xml')}">RSS</a></li>` : ''}
      <li><button type="button" class="btn-link" data-open-shortcuts>Keyboard shortcuts</button></li>
    </ul>
    <span>${model.cfg.site.name} · ${model.artifacts.length} artefacts · built ${model.now.toISOString().slice(0, 10)}</span>
  </div>
</footer>`;
}

export function shortcutsDialog() {
  const rows = [
    ['/', 'Focus search'], ['Esc', 'Clear search or close dialog'], ['j / k', 'Next / previous result'], ['Enter', 'Open focused result'],
    ['c', 'Copy focused result (or this prompt)'], ['f', 'Favourite focused result (or this prompt)'], ['?', 'This help']
  ];
  return raw(`<dialog class="dialog" id="shortcuts-dialog" aria-labelledby="shortcuts-title">
  <div class="dialog__header"><h2 id="shortcuts-title">Keyboard shortcuts</h2><button type="button" class="icon-btn" data-close-dialog aria-label="Close">${icon('close')}</button></div>
  <div class="dialog__body"><table class="shortcuts-table">${rows.map(([k, d]) => `<tr><td>${k.split(' / ').map((x) => `<kbd>${escapeHtml(x)}</kbd>`).join(' / ')}</td><td>${escapeHtml(d)}</td></tr>`).join('')}</table></div>
</dialog>`);
}

export function cardCtx(model) {
  const labels = { models: {}, assistants: {}, categories: {} };
  for (const m of model.axes.model) labels.models[m.id] = m.label;
  for (const m of model.axes.assistant) labels.assistants[m.id] = m.label;
  for (const m of model.axes.category) labels.categories[m.id] = m.label;
  return { base: model.base, labels };
}

export function cardList(artifacts, model, { view = 'grid', extraClass = '', id = '', label = '' } = {}) {
  return raw(`<ul class="cards ${extraClass}" data-view="${view}"${id ? ` id="${id}"` : ''}${label ? ` aria-label="${escapeHtml(label)}"` : ''}>\n${renderCards(artifacts, cardCtx(model))}\n</ul>`);
}

export function sectionHead(title, { sub = '', moreHref = '', moreLabel = 'See all', level = 2 } = {}) {
  const tag = `h${level}`;
  return html`<div class="section__head"><div><${raw(tag)} class="section__title">${title}</${raw(tag)}>${sub ? html`<p class="section__sub">${sub}</p>` : ''}</div>${moreHref ? html`<a class="section__more" href="${moreHref}">${moreLabel} →</a>` : ''}</div>`;
}

export function emptyState({ title, text, actions = [] }) {
  return html`<div class="empty-state"><h2>${title}</h2><p>${text}</p>${actions.length ? html`<div class="btn-row">${actions.map((a) => html`<a class="btn ${a.primary ? 'btn--primary' : ''}" href="${a.href}">${a.label}</a>`)}</div>` : ''}</div>`;
}

export function codeBlock(code, { label = '', id = '' } = {}) {
  return html`<div class="code-block ${label ? 'code-block--labelled' : ''}"${id ? raw(` id="${escapeHtml(id)}"`) : ''}>${label ? html`<span class="code-block__label">${label}</span>` : ''}<button type="button" class="btn btn--sm btn-copy-block" data-copy-text aria-label="Copy ${label || 'code'}">${raw(icon('copy'))} Copy</button><pre><code>${code}</code></pre></div>`;
}

export function typeIcon(type, cls = 'tile__icon') {
  return raw(icon(TYPE_ICONS[type] || 'chat', cls));
}

export function axisTiles(model, axis, { max = 0, showZero = false } = {}) {
  const items = model.axes[axis].filter((x) => showZero || x.count > 0);
  const list = max ? items.slice(0, max) : items;
  const iconFor = (x) => (axis === 'type' ? typeIcon(x.id) : axis === 'assistant' ? raw(icon(x.icon === 'terminal' ? 'terminal' : 'cpu', 'tile__icon')) : axis === 'model' ? raw(icon('sparkle', 'tile__icon')) : raw(icon('layers', 'tile__icon')));
  return html`<ul class="tiles">${list.map((x) => html`<li><a class="tile" href="${model.u(`browse/${axis}/${x.id}/`)}">${iconFor(x)}<span class="tile__label">${axis === 'type' ? x.plural : x.label}${x.vendor ? html`<span class="tile__sub">${x.vendor}</span>` : ''}</span><span class="tile__count" aria-label="${x.count} artefacts">${x.count}</span></a></li>`)}</ul>`;
}

export function notice(kind, body, { iconName } = {}) {
  const names = { info: 'info', warn: 'alert', danger: 'alert', ok: 'check' };
  return html`<div class="notice notice--${kind}">${raw(icon(iconName || names[kind] || 'info'))}<div>${body}</div></div>`;
}

export { TYPE_PLURALS };
