// Browse page: live search + combinable filters, state in the URL, cards rendered from index.json.
import { base, toast, debounce, syncFavButtons } from './ui.js';
import { storage, favourites, KEYS } from './store.js';
import { getCatalog, getSearch } from './catalog.js';
import { renderCards } from './shared/card.js';
import { snippet as makeSnippet } from './shared/text.js';
import { ICONS } from './shared/icons.js';

const root = document.getElementById('browse');

const AXES = ['type', 'assistant', 'model', 'category', 'difficulty', 'role', 'status'];
const AXIS_FIELD = { type: (a) => [a.type], assistant: (a) => a.assistants || [], model: (a) => a.models || [], category: (a) => a.categories || [], difficulty: (a) => [a.difficulty], role: (a) => a.roles || [], status: (a) => [a.status] };

function readState() {
  const url = new URL(location.href);
  const st = { q: url.searchParams.get('q') || '', sort: url.searchParams.get('sort') || '', view: url.searchParams.get('view') || storage.get(KEYS.view, 'grid'), group: url.searchParams.has('group') ? url.searchParams.get('group') !== '0' : storage.get(KEYS.group, false), filters: {} };
  for (const ax of AXES) {
    const v = url.searchParams.get(ax);
    st.filters[ax] = v ? v.split(',').filter(Boolean) : [];
  }
  // Landing page preset (/browse/type/skill/) applies when the query string has no filters at all.
  const preset = root.dataset.axis;
  if (preset && root.dataset.value && !AXES.some((ax) => url.searchParams.has(ax))) st.filters[preset] = [root.dataset.value];
  if (!st.sort) st.sort = st.q ? 'relevance' : 'updated';
  return st;
}

function writeState(st, { push = true } = {}) {
  // Filtered views always live at /browse/ so that back/forward and sharing work uniformly.
  // Built by hand so that commas stay readable (URLSearchParams would encode them as %2C).
  const parts = [];
  if (st.q) parts.push(`q=${encodeURIComponent(st.q).replace(/%20/g, '+')}`);
  for (const ax of AXES) if (st.filters[ax].length) parts.push(`${ax}=${st.filters[ax].map(encodeURIComponent).join(',')}`);
  if (st.sort && st.sort !== (st.q ? 'relevance' : 'updated')) parts.push(`sort=${st.sort}`);
  if (st.view !== 'grid') parts.push(`view=${st.view}`);
  if (st.group) parts.push('group=1');
  const next = `${base}browse/${parts.length ? `?${parts.join('&')}` : ''}`;
  const cur = location.pathname + location.search;
  if (next === cur) return;
  if (push) history.pushState(st, '', next); else history.replaceState(st, '', next);
}

async function init() {
  const input = document.getElementById('site-search');
  const form = document.querySelector('.header-search');
  const results = document.getElementById('results');
  const region = document.getElementById('results-region');
  const count = document.getElementById('result-count');
  const active = document.getElementById('active-filters');
  const clearBtn = document.getElementById('clear-filters');
  const sortSel = document.getElementById('sort');
  const viewGrid = document.getElementById('view-grid');
  const viewList = document.getElementById('view-list');
  const groupToggle = document.getElementById('group-toggle');
  const note = document.getElementById('results-note');
  const emptyTpl = document.getElementById('empty-template');
  let emptyEl = region.querySelector('.empty-state');
  let state = readState();
  let cat = null;
  let search = null;
  let searchFailed = false;

  const labelFor = (ax, id) => {
    if (!cat) return id;
    const list = { type: cat.taxonomy.types, assistant: cat.taxonomy.assistants, model: cat.taxonomy.models, category: cat.taxonomy.categories, difficulty: cat.taxonomy.difficulties, role: cat.taxonomy.roles, status: cat.taxonomy.statuses }[ax] || [];
    const x = list.find((i) => i.id === id);
    return x ? (ax === 'type' ? x.plural : x.label) : id;
  };

  function applyFilters(list) {
    return list.filter((a) => AXES.every((ax) => { const sel = state.filters[ax]; if (!sel.length) return true; const vals = AXIS_FIELD[ax](a); return sel.some((v) => vals.includes(v)); }));
  }

  function sortList(list, scores) {
    const by = state.sort;
    const cmp = {
      relevance: (a, b) => (scores?.get(b.id) || 0) - (scores?.get(a.id) || 0) || b.updated.localeCompare(a.updated),
      updated: (a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title),
      newest: (a, b) => b.created.localeCompare(a.created) || a.title.localeCompare(b.title),
      title: (a, b) => a.title.localeCompare(b.title)
    }[by] || ((a, b) => b.updated.localeCompare(a.updated));
    return [...list].sort(cmp);
  }

  async function render({ fromPop = false } = {}) {
    if (!cat) return;
    region.setAttribute('aria-busy', 'true');
    let list = cat.artifacts;
    let scores = null;
    let terms = [];
    const q = state.q.trim();
    if (q) {
      if (!search && !searchFailed) { try { search = await getSearch(); } catch { searchFailed = true; } }
      if (search) {
        const hits = search.search(q);
        scores = new Map(hits.map((h) => [h.id, h.score]));
        terms = [...new Set(hits.flatMap((h) => h.terms))];
        list = hits.map((h) => cat.byId.get(h.id)).filter(Boolean);
      } else {
        const lq = q.toLowerCase();
        list = list.filter((a) => `${a.title} ${a.summary} ${a.tags.join(' ')} ${a.body}`.toLowerCase().includes(lq));
        terms = [lq];
      }
    }
    list = sortList(applyFilters(list), scores);
    const favs = favourites.all();
    const ctx = { base, labels: cat.labels, favourites: favs };
    if (q) {
      ctx.snippets = new Map(list.map((a) => [a.id, makeSnippet(a.body, terms.length ? terms : [q])]));
    }
    // Group by category when there is no query and grouping is on.
    results.hidden = list.length === 0;
    if (!q && state.group && list.length) {
      const groups = new Map();
      for (const c of cat.taxonomy.categories) groups.set(c.id, []);
      for (const a of list) groups.get(a.categories[0])?.push(a) ?? groups.set(a.categories[0], [a]);
      let out = '';
      let i = 0;
      for (const [cid, items] of groups) {
        if (!items.length) continue;
        out += `<li class="group-heading" role="presentation">${cat.labels.categories[cid] || cid} <span class="chip__count">${items.length}</span></li>` + renderCards(items, { ...ctx, index: i });
        i += items.length;
      }
      results.innerHTML = out;
    } else {
      results.innerHTML = renderCards(list, ctx);
    }
    results.dataset.view = state.view;
    if (!list.length) {
      if (!emptyEl) { emptyEl = emptyTpl.content.firstElementChild.cloneNode(true); region.insertBefore(emptyEl, note); }
      emptyEl.hidden = false;
    } else if (emptyEl) emptyEl.hidden = true;
    count.innerHTML = `<strong>${list.length}</strong> ${list.length === 1 ? 'result' : 'results'}${q ? ` for “${escape(q)}”` : ''}`;
    note.textContent = searchFailed && q ? 'Search index unavailable; showing simple text matches.' : '';
    renderActive();
    syncChips();
    syncFavButtons(favs);
    region.setAttribute('aria-busy', 'false');
    if (!fromPop) writeState(state, { push: false });
  }

  const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function renderActive() {
    let out = '';
    for (const ax of AXES) for (const v of state.filters[ax]) {
      out += `<button type="button" class="chip is-active" data-remove-axis="${ax}" data-remove-value="${escape(v)}" aria-label="Remove filter ${escape(labelFor(ax, v))}">${escape(labelFor(ax, v))} <span class="chip__remove">${ICONS.close}</span></button>`;
    }
    active.innerHTML = out;
    const any = AXES.some((ax) => state.filters[ax].length) || state.q;
    clearBtn.hidden = !any;
    if (clearBtn.tagName === 'A') { clearBtn.setAttribute('href', `${base}browse/`); }
  }

  function syncChips() {
    for (const g of document.querySelectorAll('.filter-group')) {
      const ax = g.dataset.axis;
      const n = state.filters[ax].length;
      g.dataset.active = String(n > 0);
      const badge = g.querySelector('[data-count]');
      if (badge) { badge.textContent = n; badge.hidden = n === 0; }
      for (const chip of g.querySelectorAll('.chip[data-value]')) chip.setAttribute('aria-pressed', String(state.filters[ax].includes(chip.dataset.value)));
    }
    sortSel.value = state.sort;
    viewGrid.setAttribute('aria-pressed', String(state.view === 'grid'));
    viewList.setAttribute('aria-pressed', String(state.view === 'list'));
    groupToggle.checked = Boolean(state.group);
    groupToggle.disabled = Boolean(state.q);
    if (input && input.value !== state.q) input.value = state.q;
  }

  function toggle(ax, value) {
    const sel = state.filters[ax];
    const i = sel.indexOf(value);
    if (i >= 0) sel.splice(i, 1); else sel.push(value);
    writeState(state);
    render();
  }

  // Wire up
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-group .chip[data-axis]');
    if (chip) { e.preventDefault(); toggle(chip.dataset.axis, chip.dataset.value); return; }
    const rm = e.target.closest('[data-remove-axis]');
    if (rm) { e.preventDefault(); toggle(rm.dataset.removeAxis, rm.dataset.removeValue); return; }
    if (e.target.closest('#clear-filters')) {
      e.preventDefault();
      for (const ax of AXES) state.filters[ax] = [];
      state.q = ''; state.sort = 'updated';
      writeState(state); render();
    }
  });
  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); state.q = input.value; state.sort = state.q ? 'relevance' : 'updated'; writeState(state); render(); });
  if (input) input.addEventListener('input', debounce(() => { const q = input.value; if (q === state.q) return; state.q = q; state.sort = q ? 'relevance' : 'updated'; writeState(state, { push: false }); render(); }, 120));
  sortSel.addEventListener('change', () => { state.sort = sortSel.value; writeState(state); render(); });
  viewGrid.addEventListener('click', () => { state.view = 'grid'; storage.set(KEYS.view, 'grid'); writeState(state, { push: false }); render(); });
  viewList.addEventListener('click', () => { state.view = 'list'; storage.set(KEYS.view, 'list'); writeState(state, { push: false }); render(); });
  groupToggle.addEventListener('change', () => { state.group = groupToggle.checked; storage.set(KEYS.group, state.group); writeState(state, { push: false }); render(); });
  window.addEventListener('popstate', () => { state = readState(); render({ fromPop: true }); });
  document.addEventListener('pl:favourites', (e) => syncFavButtons(e.detail.all));

  if (input && state.q) input.value = state.q;
  try {
    cat = await getCatalog();
  } catch (e) {
    note.textContent = 'Live filtering is unavailable (index.json could not be loaded). The links still work.';
    return;
  }
  if (state.q) getSearch().then((s) => { search = s; }).catch(() => { searchFailed = true; });
  await render({ fromPop: true });
  if (state.q && input && document.activeElement === document.body) input.focus();
}

if (root) init();
