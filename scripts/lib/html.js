// Tiny HTML templating: an `html` tagged template that escapes interpolations unless marked raw().
export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function escapeAttr(s) {
  return escapeHtml(s);
}

class Raw {
  constructor(s) { this.s = String(s ?? ''); }
  toString() { return this.s; }
}

export const raw = (s) => new Raw(s);
export const isRaw = (v) => v instanceof Raw;

function render(v) {
  if (v === null || v === undefined || v === false) return '';
  if (isRaw(v)) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  return escapeHtml(v);
}

export function html(strings, ...values) {
  let out = '';
  for (let i = 0; i < strings.length; i++) {
    out += strings[i];
    if (i < values.length) out += render(values[i]);
  }
  return new Raw(out);
}

// Serialise data for a <script type="application/json"> block safely.
export function jsonForScript(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function attrs(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${escapeAttr(v)}"`))
    .join('');
}

export function classNames(...xs) {
  return xs.flat().filter(Boolean).join(' ');
}
