import { html, raw } from '../../scripts/lib/html.js';
import { page } from './layout.js';
import { cardList, emptyState } from './partials.js';
import { icon } from '../shared/icons.js';
import { TYPE_PLURALS } from '../shared/text.js';

const AXES = [
  ['type', 'Type'], ['assistant', 'Assistant'], ['model', 'Model'], ['category', 'Category'], ['difficulty', 'Difficulty'], ['role', 'Role'], ['status', 'Status']
];

function filterGroup(model, axis, label, active) {
  const items = model.axes[axis];
  return html`<details class="filter-group" data-axis="${axis}" data-active="${active ? 'true' : 'false'}">
  <summary>${label}${active ? html`<span class="filter-group__badge" data-count>1</span>` : html`<span class="filter-group__badge" data-count hidden>0</span>`}</summary>
  <div class="filter-group__menu" role="group" aria-label="${label} filters">
    ${items.map((x) => html`<a class="chip" href="${model.u(`browse/${axis}/${x.id}/`)}" data-axis="${axis}" data-value="${x.id}" aria-pressed="${active === x.id}" role="button">${axis === 'type' ? x.plural : x.label} <span class="chip__count">${x.count}</span></a>`)}
  </div>
</details>`;
}

export function browsePage(model, assets, { axis = '', value = '' } = {}) {
  const u = model.u;
  const axisItem = axis ? model.axes[axis].find((x) => x.id === value) : null;
  const list = axis
    ? model.artifacts.filter((a) => ({ type: [a.type], assistant: a.assistants, model: a.models, category: a.categories, difficulty: [a.difficulty], role: a.roles, status: [a.status] })[axis].includes(value))
    : model.artifacts;
  const sorted = [...list].sort((a, b) => (b.updated || '').localeCompare(a.updated || '') || a.title.localeCompare(b.title));
  const heading = axis === 'type' ? axisItem.plural : axisItem ? axisItem.label : 'Browse';
  const intro = axisItem?.description || (axis === 'type' ? `Every ${axisItem.label.toLowerCase()} in the library.` : axis ? `Everything written for ${axisItem.label}.` : 'Filter by type, assistant, model, category, difficulty, role or status. Filters combine.');
  const body = html`<div class="container browse" id="browse" data-axis="${axis}" data-value="${value}">
  <div class="axis-intro"><h1>${heading}</h1><p>${intro}</p></div>
  <div class="filter-bar" id="filter-bar" role="region" aria-label="Filters">
    <div class="filter-bar__row">
      <div class="filter-bar__groups">${AXES.map(([a, l]) => filterGroup(model, a, l, axis === a ? value : ''))}</div>
      <div class="filter-bar__tools">
        <span class="result-count" id="result-count" aria-live="polite"><strong>${sorted.length}</strong> ${sorted.length === 1 ? 'result' : 'results'}</span>
        <label class="visually-hidden" for="sort">Sort by</label>
        <select class="sort-select" id="sort"><option value="relevance">Relevance</option><option value="updated" selected>Recently updated</option><option value="newest">Newest</option><option value="title">Title A–Z</option></select>
        <div class="view-toggle" role="group" aria-label="View">
          <button type="button" class="icon-btn" id="view-grid" aria-pressed="true" aria-label="Grid view">${raw(icon('grid'))}</button>
          <button type="button" class="icon-btn" id="view-list" aria-pressed="false" aria-label="List view">${raw(icon('list'))}</button>
        </div>
        <label class="switch" title="Only when no search query"><input type="checkbox" id="group-toggle"> Group</label>
      </div>
    </div>
    <div class="filter-bar__row">
      <div class="active-filters" id="active-filters" aria-label="Active filters">${axisItem ? html`<a class="chip is-active" href="${u('browse/')}" data-remove-axis="${axis}" data-remove-value="${value}">${axis === 'type' ? axisItem.plural : axisItem.label} <span class="chip__remove">${raw(icon('close'))}</span></a>` : ''}</div>
      ${axisItem ? html`<a class="btn-link" id="clear-filters" href="${u('browse/')}">Clear all</a>` : html`<button type="button" class="btn-link" id="clear-filters" hidden>Clear all</button>`}
    </div>
  </div>
  <div id="results-region" aria-live="polite" aria-busy="false">
    ${sorted.length ? cardList(sorted, model, { id: 'results', label: 'Results' }) : html`<ul class="cards" id="results" data-view="grid" hidden></ul>${emptyState({ title: 'Nothing here yet', text: `No artefacts are tagged ${heading.toLowerCase()} yet. Browse everything, or contribute the first one.`, actions: [{ href: u('browse/'), label: 'Browse everything', primary: true }, { href: u('contribute/'), label: 'Contribute' }] })}`}
    <p class="results-note" id="results-note"></p>
  </div>
  <template id="empty-template">${emptyState({ title: 'No matches', text: 'Try fewer filters, a different word, or browse a collection.', actions: [{ href: u('collections/'), label: 'Collections', primary: true }, { href: u('contribute/'), label: 'Suggest an artefact' }] })}</template>
</div>`;
  const path = axis ? `/browse/${axis}/${value}/` : '/browse/';
  return { path, html: page({ model, assets, title: axis ? `${heading}` : 'Browse', description: intro, body, bodyClass: 'page-browse', current: 'browse', scripts: ['browse'], path: `${model.base}${path.slice(1)}` }) };
}

export function browsePages(model, assets) {
  const pages = [browsePage(model, assets)];
  for (const axis of ['type', 'model', 'assistant', 'category']) {
    for (const x of model.axes[axis]) pages.push(browsePage(model, assets, { axis, value: x.id }));
  }
  return pages;
}

export { TYPE_PLURALS };
