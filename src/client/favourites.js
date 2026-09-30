// Favourites page: starred and recently copied artefacts, with JSON export/import.
import { base, toast, syncFavButtons } from './ui.js';
import { favourites, recents } from './store.js';
import { getCatalog } from './catalog.js';
import { renderCards } from './shared/card.js';

const root = document.getElementById('favourites');
if (root) init();

async function init() {
  const list = document.getElementById('favourites-list');
  const empty = document.getElementById('favourites-empty');
  const countEl = document.getElementById('favs-count');
  const recentList = document.getElementById('recent-list');
  const recentEmpty = document.getElementById('recent-empty');
  let cat;
  try { cat = await getCatalog(); } catch { toast('Could not load the catalogue.'); return; }

  function render() {
    const favs = favourites.all();
    const items = [...favs].map((id) => cat.byId.get(id)).filter(Boolean).sort((a, b) => a.title.localeCompare(b.title));
    list.innerHTML = renderCards(items, { base, labels: cat.labels, favourites: favs });
    list.hidden = items.length === 0;
    empty.hidden = items.length > 0;
    countEl.textContent = items.length;
    const rec = recents.all().map((r) => cat.byId.get(r.id)).filter(Boolean).slice(0, 12);
    recentList.innerHTML = renderCards(rec, { base, labels: cat.labels, favourites: favs });
    recentList.hidden = rec.length === 0;
    recentEmpty.hidden = rec.length > 0;
    syncFavButtons(favs);
  }
  render();
  document.addEventListener('pl:favourites', render);
  document.addEventListener('pl:recents', render);

  document.getElementById('export-favs').addEventListener('click', () => {
    const data = { version: 1, exported: new Date().toISOString(), site: cat.site?.name, favourites: [...favourites.all()], recent: recents.all() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'prompt-library-favourites.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Exported');
  });
  document.getElementById('import-favs').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const ids = Array.isArray(data) ? data : Array.isArray(data.favourites) ? data.favourites : null;
      if (!ids) throw new Error('no favourites array');
      const known = ids.filter((id) => typeof id === 'string' && cat.byId.has(id));
      favourites.replace([...new Set([...favourites.all(), ...known])]);
      toast(`Imported ${known.length} favourite${known.length === 1 ? '' : 's'}${ids.length !== known.length ? ` (${ids.length - known.length} unknown skipped)` : ''}`);
    } catch { toast('That file is not a favourites export.'); }
    e.target.value = '';
  });
  document.getElementById('clear-favs').addEventListener('click', () => {
    if (!favourites.all().size && !recents.all().length) return;
    if (confirm('Remove all favourites and the recently copied list from this browser?')) { favourites.clear(); recents.clear(); render(); toast('Cleared'); }
  });
}
