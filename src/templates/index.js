// Every page of the site. Returns [{ path, html, file?, noindex? }].
import { homePage } from './home.js';
import { browsePages } from './browse.js';
import { artifactPages } from './artifact.js';
import { collectionPages } from './collections.js';
import { learnPages } from './learn.js';
import { contributePage } from './contribute.js';
import { favouritesPage } from './favourites.js';
import { tryPage } from './try.js';
import { notFoundPage, offlinePage } from './misc.js';

export function renderSite(model, assets) {
  const pages = [
    homePage(model, assets),
    ...browsePages(model, assets),
    ...artifactPages(model, assets),
    ...collectionPages(model, assets),
    ...learnPages(model, assets),
    contributePage(model, assets),
    notFoundPage(model, assets),
    offlinePage(model, assets)
  ];
  if (model.cfg.features.favourites) pages.push(favouritesPage(model, assets));
  if (model.cfg.ai.enabled) pages.push(tryPage(model, assets));
  return pages;
}
