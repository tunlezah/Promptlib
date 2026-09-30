// MiniSearch options. The build serialises an index with these; the browser must load it with the same ones.
export const SEARCH_FIELDS = ['title', 'summary', 'tags', 'body', 'variableNames', 'id', 'categories', 'type'];

export const SEARCH_OPTIONS = {
  idField: 'id',
  fields: SEARCH_FIELDS,
  storeFields: [],
  searchOptions: {
    boost: { title: 6, id: 4, summary: 2.5, tags: 2, variableNames: 1.5, categories: 1.2, type: 1.2 },
    prefix: true,
    fuzzy: 0.15,
    combineWith: 'AND'
  }
};

// Shape an artefact for indexing.
export function toSearchDoc(a) {
  return {
    id: a.id,
    title: a.title,
    summary: a.summary,
    tags: (a.tags || []).join(' '),
    body: a.body,
    variableNames: (a.variables || []).map((v) => `${v.name} ${v.description || ''}`).join(' '),
    categories: (a.categories || []).join(' '),
    type: a.type
  };
}
