// Syntax highlighting of artefact bodies at build time, keeping {{variables}} as editable slots.
import hljs from 'highlight.js/lib/core';
import markdown from 'highlight.js/lib/languages/markdown';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import plaintext from 'highlight.js/lib/languages/plaintext';
import { tokenize } from '../../src/shared/variables.js';
import { escapeHtml } from './html.js';

hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('plaintext', plaintext);

const LANG = { markdown: 'markdown', xml: 'xml', json: 'json', yaml: 'yaml', text: 'plaintext' };

// A sentinel that survives tokenisation as one identifier-like word.
const sentinel = (i) => `PLVARSLOT${i}X`;

export function slotHtml(v, declared, index) {
  const decl = declared.get(v.name);
  if (!decl) return `<span class="var var--undeclared">${escapeHtml(v.raw)}</span>`;
  const def = decl.default === undefined || decl.default === null ? '' : String(decl.default);
  return `<span class="var" data-var="${escapeHtml(v.name)}" data-slot="${index}" data-default="${escapeHtml(def)}" title="${escapeHtml(decl.description || v.name)}">${escapeHtml(def || `{{${v.name}}}`)}</span>`;
}

// Returns { html, highlighted } where html is safe to inject inside <pre><code>.
export function highlightBody(body, format, variables = []) {
  const declared = new Map((variables || []).map((v) => [v.name, v]));
  const tokens = tokenize(body);
  const vars = tokens.filter((t) => t.type === 'var');
  const lang = LANG[format] || 'plaintext';
  const plain = () => ({
    html: tokens.map((t, i) => (t.type === 'text' ? escapeHtml(t.value) : slotHtml(t, declared, vars.indexOf(t)))).join(''),
    highlighted: false
  });
  if (lang === 'plaintext') return plain();
  let idx = 0;
  const withSentinels = tokens.map((t) => (t.type === 'text' ? t.value : sentinel(idx++))).join('');
  let out;
  try {
    out = hljs.highlight(withSentinels, { language: lang, ignoreIllegals: true }).value;
  } catch {
    return plain();
  }
  // Every sentinel must survive intact and exactly once, otherwise fall back to plain rendering.
  for (let i = 0; i < vars.length; i++) {
    const s = sentinel(i);
    if (out.split(s).length !== 2) return plain();
  }
  const html = out.replace(/PLVARSLOT(\d+)X/g, (_, n) => slotHtml(vars[Number(n)], declared, Number(n)));
  return { html, highlighted: true };
}

export function highlightCode(code, lang) {
  const l = LANG[lang] || lang;
  if (!hljs.getLanguage(l)) return escapeHtml(code);
  try { return hljs.highlight(code, { language: l, ignoreIllegals: true }).value; } catch { return escapeHtml(code); }
}
