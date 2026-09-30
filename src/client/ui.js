// Side-effect-free UI helpers shared by the client modules.
import { favourites } from './store.js';
import { ICONS } from './shared/icons.js';
export const base = document.documentElement.getAttribute('data-base') || '/';

let toastTimer = null;
export function toast(message, { duration = 1800 } = {}) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), duration);
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.className = 'visually-hidden';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

// Flash a button into its "done" state for a moment.
export function flashDone(btn, label = 'Copied') {
  if (!btn) return;
  const span = btn.querySelector('span') || btn;
  const prev = span.textContent;
  const prevLabel = btn.getAttribute('aria-label');
  span.textContent = label;
  btn.classList.add('is-done');
  btn.setAttribute('aria-label', label);
  setTimeout(() => { span.textContent = prev; btn.classList.remove('is-done'); if (prevLabel) btn.setAttribute('aria-label', prevLabel); else btn.removeAttribute('aria-label'); }, 1500);
}

export function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c !== null && c !== undefined && c !== false) node.append(c);
  return node;
}

export function closeAllMenus(except = null) {
  for (const d of document.querySelectorAll('details.menu[open], details.filter-group[open]')) if (d !== except) d.removeAttribute('open');
}

// Reflect the favourites set on every star button on the page.
export function syncFavButtons(set = favourites.all()) {
  for (const b of document.querySelectorAll('.btn-fav[data-fav-id]')) {
    const on = set.has(b.dataset.favId);
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = on ? ICONS.starFilled : ICONS.star;
    const label = b.getAttribute('aria-label') || '';
    b.setAttribute('aria-label', label.replace(/^(Add to|Remove from) favourites/, on ? 'Remove from favourites' : 'Add to favourites'));
  }
}
