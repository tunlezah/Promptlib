// Site-wide behaviour: theme, shortcuts, copy/favourite buttons, menus, start-here rail, service worker.
import { base, toast, copyText, flashDone, isEditable, closeAllMenus, syncFavButtons } from './ui.js';
import { storage, favourites, recents, KEYS } from './store.js';
import { getCatalog } from './catalog.js';
import { assemble } from './shared/variables.js';

const html = document.documentElement;

/* ---- Theme and accent ---- */
function initTheme() {
  const theme = storage.get(KEYS.theme, 'system');
  const accent = storage.get(KEYS.accent, 'blue');
  for (const r of document.querySelectorAll('#theme-menu input[name="theme"]')) {
    r.checked = r.value === theme;
    r.addEventListener('change', () => {
      storage.set(KEYS.theme, r.value);
      if (r.value === 'system') html.removeAttribute('data-theme'); else html.setAttribute('data-theme', r.value);
      toast(`Theme: ${r.value}`);
    });
  }
  for (const b of document.querySelectorAll('#theme-menu .swatch')) {
    b.setAttribute('aria-pressed', String(b.dataset.accent === accent));
    b.addEventListener('click', () => {
      storage.set(KEYS.accent, b.dataset.accent);
      html.setAttribute('data-accent', b.dataset.accent);
      for (const o of document.querySelectorAll('#theme-menu .swatch')) o.setAttribute('aria-pressed', String(o === b));
    });
  }
}

/* ---- Nav toggle (mobile) ---- */
function initNav() {
  const btn = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
}

/* ---- Dialogs ---- */
function initDialogs() {
  const dlg = document.getElementById('shortcuts-dialog');
  const open = () => dlg && !dlg.open && dlg.showModal();
  document.getElementById('shortcuts-btn')?.addEventListener('click', open);
  for (const b of document.querySelectorAll('[data-open-shortcuts]')) b.addEventListener('click', open);
  document.addEventListener('click', (e) => {
    const close = e.target.closest('[data-close-dialog]');
    if (close) close.closest('dialog')?.close();
    const d = e.target.closest('dialog');
    if (d && e.target === d) d.close(); // backdrop click
  });
  return open;
}

/* ---- Menus close on outside click / Esc ---- */
function initMenus() {
  document.addEventListener('click', (e) => {
    const inside = e.target.closest('details.menu, details.filter-group');
    closeAllMenus(inside);
  });
}

/* ---- Copy + favourite delegation ---- */
async function copyArtifactById(id, btn) {
  try {
    const cat = await getCatalog();
    const a = cat.byId.get(id);
    if (!a) throw new Error('not in catalogue');
    const saved = storage.get(KEYS.vars(id), {});
    const text = assemble(a.body, a.variables, saved);
    if (await copyText(text)) { flashDone(btn); toast(`Copied “${a.title}”`); recents.add(id); document.dispatchEvent(new CustomEvent('pl:copied', { detail: { id } })); }
    else toast('Could not copy. Open the artefact and use the plain text box.');
  } catch (e) {
    toast('Could not load the artefact to copy it.');
  }
}


function initActions() {
  document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('.btn-copy[data-copy-id]');
    if (copyBtn) { e.preventDefault(); copyArtifactById(copyBtn.dataset.copyId, copyBtn); return; }
    const favBtn = e.target.closest('.btn-fav[data-fav-id]');
    if (favBtn) {
      e.preventDefault();
      const on = favourites.toggle(favBtn.dataset.favId);
      toast(on ? 'Added to favourites' : 'Removed from favourites');
      return;
    }
    const textBtn = e.target.closest('[data-copy-text]');
    if (textBtn) {
      e.preventDefault();
      let text = textBtn.getAttribute('data-copy-text');
      if (!text) { const code = textBtn.closest('.code-block')?.querySelector('pre'); text = code ? code.textContent : ''; }
      if (await copyText(text)) { flashDone(textBtn, textBtn.dataset.copyLabel || 'Copied'); toast(textBtn.dataset.copyLabel || 'Copied'); }
      return;
    }
    const colBtn = e.target.closest('[data-copy-collection]');
    if (colBtn) {
      e.preventDefault();
      try {
        const cat = await getCatalog();
        const col = cat.collections.find((c) => c.id === colBtn.dataset.copyCollection);
        const parts = (col?.items || []).map((id) => cat.byId.get(id)).filter((a) => a && ['prompt', 'system-prompt'].includes(a.type))
          .map((a) => `## ${a.title}\n\n${a.summary}\n\n${assemble(a.body, a.variables, storage.get(KEYS.vars(a.id), {}))}`);
        const doc = `# ${col.title}\n\n${col.description}\n\n${parts.join('\n\n---\n\n')}\n`;
        if (await copyText(doc)) { flashDone(colBtn, 'Copied'); toast(`Copied ${parts.length} prompts as one document`); }
      } catch { toast('Could not load the collection.'); }
    }
  });
  document.addEventListener('pl:favourites', (e) => syncFavButtons(e.detail.all));
  syncFavButtons();
}

/* ---- Start here rail ---- */
function initStartHere() {
  const rail = document.getElementById('start-here');
  const btn = document.getElementById('start-here-toggle');
  if (!rail || !btn) return;
  const hasCopied = recents.all().length > 0;
  const pref = storage.get(KEYS.startHere, null); // true = open, false = collapsed, null = no preference
  const open = pref === null ? !hasCopied : pref;
  const apply = (isOpen) => {
    rail.setAttribute('data-collapsed', String(!isOpen));
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.textContent = isOpen ? 'Hide' : 'Show';
  };
  apply(open);
  btn.addEventListener('click', () => { const next = rail.getAttribute('data-collapsed') === 'true'; storage.set(KEYS.startHere, next); apply(next); });
  document.addEventListener('pl:copied', () => { if (storage.get(KEYS.startHere, null) === null) apply(false); }, { once: true });
}

/* ---- Keyboard shortcuts ---- */
function results() { return [...document.querySelectorAll('[data-result]')].filter((el) => el.offsetParent !== null); }
let focusIndex = -1;
function focusResult(i) {
  const list = results();
  if (!list.length) return;
  focusIndex = Math.max(0, Math.min(list.length - 1, i));
  list.forEach((el, n) => el.classList.toggle('is-focused', n === focusIndex));
  const link = list[focusIndex].querySelector('.card__title a');
  link?.focus({ preventScroll: true });
  list[focusIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function focusedResult() {
  const list = results();
  const active = document.activeElement?.closest?.('[data-result]');
  if (active) { focusIndex = list.indexOf(active); return active; }
  return focusIndex >= 0 ? list[focusIndex] : null;
}
function initShortcuts(openHelp) {
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target;
    if (e.key === 'Escape') {
      if (isEditable(target) && target.type === 'search') { if (target.value) { target.value = ''; target.dispatchEvent(new Event('input', { bubbles: true })); } else target.blur(); return; }
      closeAllMenus();
      document.querySelectorAll('[data-result].is-focused').forEach((el) => el.classList.remove('is-focused'));
      return;
    }
    if (isEditable(target)) return;
    switch (e.key) {
      case '/': {
        const s = document.getElementById('home-search') || document.getElementById('site-search');
        if (s) { e.preventDefault(); s.focus(); s.select(); }
        break;
      }
      case '?': e.preventDefault(); openHelp(); break;
      case 'j': e.preventDefault(); focusResult(focusIndex + 1); break;
      case 'k': e.preventDefault(); focusResult(focusIndex - 1); break;
      case 'c': {
        const r = focusedResult();
        const btn = r ? r.querySelector('.btn-copy') : document.getElementById('copy-btn');
        if (btn) { e.preventDefault(); btn.click(); }
        break;
      }
      case 'f': {
        const r = focusedResult();
        const btn = r ? r.querySelector('.btn-fav') : document.getElementById('fav-btn');
        if (btn) { e.preventDefault(); btn.click(); }
        break;
      }
      default:
    }
  });
}

/* ---- Header search: on browse it filters live; elsewhere it navigates ---- */
function initHeaderSearch() {
  const form = document.querySelector('.header-search');
  const input = document.getElementById('site-search');
  if (!form || !input) return;
  const q = new URL(location.href).searchParams.get('q');
  if (q && !document.getElementById('browse')) input.value = q;
}

/* ---- Service worker ---- */
function initServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  if (html.hasAttribute('data-no-sw')) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => { /* offline support is optional */ }); });
}

initTheme();
initNav();
const openHelp = initDialogs();
initMenus();
initActions();
initStartHere();
initShortcuts(openHelp);
initHeaderSearch();
initServiceWorker();
