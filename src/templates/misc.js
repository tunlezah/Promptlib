import { html, raw } from '../../scripts/lib/html.js';
import { page } from './layout.js';
import { icon } from '../shared/icons.js';

export function notFoundPage(model, assets) {
  const body = html`<div class="container container--narrow">
  <div class="empty-state"><h1>Page not found</h1><p>The link may be old, or the artefact may have been renamed. Search for it, or start from the home page.</p>
    <form role="search" action="${model.u('browse/')}" method="get" class="hero__search"><div class="search-box search-box--large">${raw(icon('search', 'search-box__icon'))}<input class="search-box__input" type="search" name="q" placeholder="Search the library" aria-label="Search the library"></div></form>
    <div class="btn-row"><a class="btn btn--primary" href="${model.u()}">Home</a><a class="btn" href="${model.u('browse/')}">Browse</a></div>
  </div>
</div>`;
  return { path: '/404/', file: '404.html', noindex: true, html: page({ model, assets, title: 'Not found', body, bodyClass: 'page-404', noindex: true }) };
}

export function offlinePage(model, assets) {
  const body = html`<div class="container container--narrow"><div class="empty-state"><h1>You are offline</h1><p>This page has not been saved for offline use yet. Pages you have visited before are still available from your browser's cache.</p><div class="btn-row"><a class="btn btn--primary" href="${model.u()}">Home</a></div></div></div>`;
  return { path: '/offline/', noindex: true, html: page({ model, assets, title: 'Offline', body, bodyClass: 'page-offline', noindex: true }) };
}
