// {{variable}} handling. Shared by the build (Node) and the browser; keep it dependency-free.
export const VAR_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

// Unique placeholder names in order of first appearance.
export function findPlaceholders(text) {
  const out = [];
  const seen = new Set();
  for (const m of String(text).matchAll(VAR_RE)) {
    if (!seen.has(m[1])) { seen.add(m[1]); out.push(m[1]); }
  }
  return out;
}

// [{ type: 'text', value }, { type: 'var', name, raw }]
export function tokenize(text) {
  const tokens = [];
  let last = 0;
  const s = String(text);
  for (const m of s.matchAll(VAR_RE)) {
    if (m.index > last) tokens.push({ type: 'text', value: s.slice(last, m.index) });
    tokens.push({ type: 'var', name: m[1], raw: m[0] });
    last = m.index + m[0].length;
  }
  if (last < s.length) tokens.push({ type: 'text', value: s.slice(last) });
  return tokens;
}

// Replace declared placeholders with values; undeclared ones are left as written.
export function substitute(text, values, declared) {
  const known = declared ? new Set(declared) : null;
  return String(text).replace(VAR_RE, (raw, name) => {
    if (known && !known.has(name)) return raw;
    const v = values && Object.prototype.hasOwnProperty.call(values, name) ? values[name] : undefined;
    return v === undefined || v === null ? raw : String(v);
  });
}

export function defaultValues(variables) {
  const out = {};
  for (const v of variables || []) out[v.name] = v.default === undefined || v.default === null ? '' : String(v.default);
  return out;
}

// Assemble the final text: defaults overlaid with user values. Empty user values fall back to the default.
export function assemble(body, variables, userValues) {
  const values = defaultValues(variables);
  for (const [k, v] of Object.entries(userValues || {})) {
    if (v !== undefined && v !== null && String(v) !== '') values[k] = String(v);
  }
  return substitute(body, values, (variables || []).map((v) => v.name));
}
