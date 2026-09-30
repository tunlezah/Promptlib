// Lazy access to index.json and the search index.
import { base } from './ui.js';
import { SEARCH_OPTIONS } from './shared/search-options.js';

let catalogPromise = null;
let searchPromise = null;

export function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch(`${base}index.json`, { credentials: 'same-origin' }).then((r) => {
      if (!r.ok) throw new Error(`index.json: HTTP ${r.status}`);
      return r.json();
    }).then((data) => {
      data.byId = new Map(data.artifacts.map((a) => [a.id, a]));
      data.labels = { models: {}, assistants: {}, categories: {} };
      for (const m of data.taxonomy.models) data.labels.models[m.id] = m.label;
      for (const m of data.taxonomy.assistants) data.labels.assistants[m.id] = m.label;
      for (const m of data.taxonomy.categories) data.labels.categories[m.id] = m.label;
      return data;
    }).catch((e) => { catalogPromise = null; throw e; });
  }
  return catalogPromise;
}

export function getSearch() {
  if (!searchPromise) {
    searchPromise = Promise.all([
      import(`${base}assets/vendor/minisearch.js`),
      fetch(`${base}search-index.json`, { credentials: 'same-origin' }).then((r) => { if (!r.ok) throw new Error(`search-index.json: HTTP ${r.status}`); return r.text(); })
    ]).then(([mod, json]) => {
      const MiniSearch = mod.default || mod.MiniSearch;
      return MiniSearch.loadJSON(json, SEARCH_OPTIONS);
    }).catch((e) => { searchPromise = null; throw e; });
  }
  return searchPromise;
}
