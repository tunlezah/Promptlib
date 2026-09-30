import { html, raw } from '../../scripts/lib/html.js';
import { page } from './layout.js';
import { cardCtx } from './partials.js';
import { renderCard } from '../shared/card.js';
import { icon } from '../shared/icons.js';

export function collectionsIndex(model, assets) {
  const body = html`<div class="container">
  <div class="page-intro"><h1>Collections</h1><p>Curated, ordered sets of artefacts for a job or a setup. Start at the top of each list.</p></div>
  <ul class="collection-list">
    ${model.collections.map((c) => html`<li><a class="collection-card" href="${c.url}"><h2>${c.title}${c.start_here ? html` <span class="badge badge--type">Start here</span>` : ''}</h2><p>${c.description}</p><span class="collection-card__meta">${c.artifacts.length} artefacts${c.audience ? html` · ${c.audience}` : ''}</span></a></li>`)}
  </ul>
</div>`;
  return { path: '/collections/', html: page({ model, assets, title: 'Collections', description: 'Curated sets of prompts, skills and rules.', body, bodyClass: 'page-collections', current: 'collections', path: model.u('collections/') }) };
}

export function collectionPage(model, assets, c) {
  const ctx = cardCtx(model);
  const copyable = c.artifacts.filter((a) => ['prompt', 'system-prompt'].includes(a.type));
  const body = html`<div class="container container--narrow">
  <nav aria-label="Breadcrumb"><ol class="breadcrumbs"><li><a href="${model.u()}">Home</a></li><li><a href="${model.u('collections/')}">Collections</a></li><li aria-current="page">${c.title}</li></ol></nav>
  <div class="page-intro"><h1>${c.title}</h1><p>${c.description}</p>${c.audience ? html`<p class="audience">For: ${c.audience}</p>` : ''}
    <div class="btn-row">
      ${copyable.length ? html`<button type="button" class="btn btn--primary" data-copy-collection="${c.id}" title="Copies the ${copyable.length} prompt-type artefacts as one Markdown document">${raw(icon('copy'))} Copy all ${copyable.length} prompts as one document</button>` : ''}
      <span class="section__sub">${c.artifacts.length} artefacts, in order.</span>
    </div>
  </div>
  <h2 class="visually-hidden">Artefacts, in order</h2>
  <ol class="ordered-cards" aria-label="Artefacts in ${c.title}">
    ${c.artifacts.map((a, i) => html`<li><ul class="cards" data-view="list">${raw(renderCard(a, { ...ctx, index: i }))}</ul></li>`)}
  </ol>
</div>`;
  return { path: `/collections/${c.id}/`, html: page({ model, assets, title: c.title, description: c.description, body, bodyClass: 'page-collection', current: 'collections', path: c.url }) };
}

export function collectionPages(model, assets) {
  return [collectionsIndex(model, assets), ...model.collections.map((c) => collectionPage(model, assets, c))];
}
