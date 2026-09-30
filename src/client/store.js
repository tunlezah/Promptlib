// localStorage wrappers. Everything the site remembers about a visitor lives here and nowhere else.
export const KEYS = {
  favourites: 'pl.favourites', recent: 'pl.recent', theme: 'pl.theme', accent: 'pl.accent', startHere: 'pl.startHere',
  view: 'pl.view', group: 'pl.group', vars: (id) => `pl.vars.${id}`, aiToken: (ep) => `pl.ai.token.${ep}`,
  aiHistory: (id) => `pl.ai.history.${id}`, aiHistoryOn: 'pl.ai.historyOn', aiPrefs: 'pl.ai.prefs'
};

export const storage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota or disabled */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
};

export const favourites = {
  all() { const v = storage.get(KEYS.favourites, []); return new Set(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []); },
  has(id) { return this.all().has(id); },
  toggle(id) {
    const set = this.all();
    const on = !set.has(id);
    if (on) set.add(id); else set.delete(id);
    storage.set(KEYS.favourites, [...set]);
    document.dispatchEvent(new CustomEvent('pl:favourites', { detail: { id, on, all: set } }));
    return on;
  },
  replace(ids) { storage.set(KEYS.favourites, [...new Set(ids)]); document.dispatchEvent(new CustomEvent('pl:favourites', { detail: { all: new Set(ids) } })); },
  clear() { this.replace([]); }
};

export const recents = {
  all() { const v = storage.get(KEYS.recent, []); return Array.isArray(v) ? v.filter((x) => x && typeof x.id === 'string') : []; },
  add(id) {
    const list = this.all().filter((x) => x.id !== id);
    list.unshift({ id, at: new Date().toISOString() });
    storage.set(KEYS.recent, list.slice(0, 24));
    document.dispatchEvent(new CustomEvent('pl:recents', { detail: { id } }));
  },
  clear() { storage.remove(KEYS.recent); }
};
