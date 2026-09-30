import MiniSearch from 'minisearch';
import { SEARCH_OPTIONS, toSearchDoc } from '../../src/shared/search-options.js';

export function buildSearchIndex(artifacts) {
  const ms = new MiniSearch(SEARCH_OPTIONS);
  ms.addAll(artifacts.map(toSearchDoc));
  return JSON.stringify(ms.toJSON());
}
