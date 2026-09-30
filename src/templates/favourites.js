import { html, raw } from '../../scripts/lib/html.js';
import { page } from './layout.js';
import { icon } from '../shared/icons.js';

export function favouritesPage(model, assets) {
  const body = html`<div class="container" id="favourites">
  <div class="page-intro"><h1>Favourites</h1><p>Starred artefacts and the things you copied recently. Stored only in this browser.</p>
    <div class="io-actions">
      <button type="button" class="btn" id="export-favs">${raw(icon('download'))} Export JSON</button>
      <label class="btn" for="import-favs">${raw(icon('upload'))} Import JSON<input type="file" id="import-favs" accept="application/json,.json" class="visually-hidden"></label>
      <button type="button" class="btn btn--ghost btn--danger" id="clear-favs">${raw(icon('trash'))} Clear</button>
    </div>
  </div>
  <section class="section" aria-labelledby="favs-title">
    <div class="section__head"><h2 class="section__title" id="favs-title">Starred <span class="badge" id="favs-count">0</span></h2></div>
    <ul class="cards" id="favourites-list" data-view="grid"></ul>
    <div class="empty-state" id="favourites-empty"><h3>Nothing starred yet</h3><p>Press the star on any card or artefact page, or <kbd>f</kbd> while a result is focused. Your favourites stay in this browser and can be exported as JSON.</p><div class="btn-row"><a class="btn btn--primary" href="${model.u('browse/')}">Browse the library</a>${model.startHere ? html`<a class="btn" href="${model.startHere.url}">${model.startHere.title}</a>` : ''}</div></div>
  </section>
  <section class="section" aria-labelledby="recent-title">
    <div class="section__head"><h2 class="section__title" id="recent-title">Recently copied</h2></div>
    <ul class="cards cards--compact" id="recent-list" data-view="grid"></ul>
    <p class="section__sub" id="recent-empty">Nothing copied yet.</p>
  </section>
  <noscript><div class="notice notice--info">Favourites need JavaScript, which is turned off. Everything else on the site works without it.</div></noscript>
</div>`;
  return { path: '/favourites/', noindex: true, html: page({ model, assets, title: 'Favourites', description: 'Your starred and recently copied artefacts.', body, bodyClass: 'page-favourites', current: 'favourites', scripts: ['favourites'], noindex: true, path: model.u('favourites/') }) };
}
