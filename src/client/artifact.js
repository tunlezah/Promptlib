// Artefact page: inline variables, copy, variants, open-in, install one-liners, send-to-AI.
import { base, toast, copyText, flashDone, el } from './ui.js';
import { storage, recents, KEYS } from './store.js';
import { assemble } from './shared/variables.js';
import { installCommands } from './shared/install.js';
import { ICONS } from './shared/icons.js';
import { isRuntime, fetchText, bodyOf } from './runtime.js';
import { tokenize } from './shared/variables.js';

const dataEl = document.getElementById('artifact-data');
if (dataEl) init(JSON.parse(dataEl.textContent));

function init(data) {
  const varsByName = new Map(data.variables.map((v) => [v.name, v]));
  const saved = storage.get(KEYS.vars(data.id), {});
  const values = {};
  for (const v of data.variables) if (typeof saved[v.name] === 'string') values[v.name] = saved[v.name];
  let currentVariant = '';

  const bodyFor = (key) => (key ? data.variants.find((v) => v.for === key)?.body : data.body) ?? data.body;
  const assembled = () => assemble(bodyFor(currentVariant), data.variables, values);

  /* ---- Inline variable fields ---- */
  const fields = new Map(); // name -> [elements]
  function sizeField(f) {
    if (f.tagName !== 'INPUT') return;
    const len = Math.max((f.value || f.placeholder || '').length, 3);
    f.size = Math.min(len + 1, 60);
  }
  function makeField(v, slot) {
    const def = v.default === undefined || v.default === null ? '' : String(v.default);
    const label = `${v.name}: ${v.description || ''}`.trim();
    let f;
    if (Array.isArray(v.options) && v.options.length) {
      f = el('select', { class: 'var-field', 'data-var': v.name, 'aria-label': label, title: v.description || v.name });
      const opts = v.options.map(String);
      if (def && !opts.includes(def)) opts.unshift(def);
      for (const o of opts) f.append(el('option', { value: o, text: o }));
      if (values[v.name] && !opts.includes(values[v.name])) f.append(el('option', { value: values[v.name], text: values[v.name] }));
      f.value = values[v.name] || def || opts[0];
    } else if (v.multiline) {
      f = el('textarea', { class: 'var-field', 'data-var': v.name, 'aria-label': label, placeholder: def || `{{${v.name}}}`, rows: 2, spellcheck: 'false' });
      f.value = values[v.name] || '';
    } else {
      f = el('input', { class: 'var-field', type: 'text', 'data-var': v.name, 'aria-label': label, placeholder: def || `{{${v.name}}}`, autocomplete: 'off', spellcheck: 'false', title: v.description || v.name });
      f.value = values[v.name] || '';
      sizeField(f);
    }
    f.addEventListener('input', () => onChange(v.name, f.value, f));
    f.addEventListener('change', () => onChange(v.name, f.value, f));
    slot.replaceWith(f);
    if (!fields.has(v.name)) fields.set(v.name, []);
    fields.get(v.name).push(f);
  }
  function onChange(name, value, source) {
    const v = varsByName.get(name);
    const def = v?.default === undefined || v?.default === null ? '' : String(v.default);
    if (value === '' || (v?.options && value === def)) delete values[name]; else values[name] = value;
    for (const f of fields.get(name) || []) { if (f !== source) f.value = value; sizeField(f); }
    if (source) sizeField(source);
    storage.set(KEYS.vars(data.id), values);
    syncFallback();
  }
  for (const slot of document.querySelectorAll('#prompt-body .var[data-var]')) {
    const v = varsByName.get(slot.dataset.var);
    if (v) makeField(v, slot);
  }
  const fallback = document.querySelector('#prompt-fallback textarea');
  function syncFallback() { if (fallback) fallback.value = assembled(); }
  syncFallback();
  for (const b of document.querySelectorAll('[data-focus-var]')) b.addEventListener('click', () => { const f = fields.get(b.dataset.focusVar)?.find((x) => x.offsetParent !== null); f?.focus(); f?.select?.(); });

  /* ---- Copy ---- */
  const copyBtn = document.getElementById('copy-btn');
  copyBtn?.addEventListener('click', async () => {
    const text = assembled();
    if (await copyText(text)) { flashDone(copyBtn); toast(`Copied${currentVariant ? ` (${data.variants.find((v) => v.for === currentVariant)?.label} variant)` : ''} · ${text.length} characters`); recents.add(data.id); document.dispatchEvent(new CustomEvent('pl:copied', { detail: { id: data.id } })); }
    else toast('Could not copy. Use the plain text box below the prompt.');
  });

  /* ---- Variants ---- */
  const sw = document.getElementById('variant-switch');
  if (sw) {
    sw.addEventListener('click', (e) => {
      const b = e.target.closest('[data-variant]');
      if (!b) return;
      currentVariant = b.dataset.variant;
      for (const x of sw.querySelectorAll('[data-variant]')) x.setAttribute('aria-checked', String(x === b));
      for (const block of document.querySelectorAll('#prompt-body .prompt__variant')) block.hidden = block.dataset.variant !== currentVariant;
      for (const [name, list] of fields) for (const f of list) { f.value = values[name] ?? (f.tagName === 'SELECT' ? f.value : ''); sizeField(f); }
      syncFallback();
    });
    sw.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const btns = [...sw.querySelectorAll('[data-variant]')];
      const i = btns.findIndex((b) => b.getAttribute('aria-checked') === 'true');
      const next = btns[(i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length];
      next.focus(); next.click(); e.preventDefault();
    });
  }

  /* ---- Open in ---- */
  for (const a of document.querySelectorAll('[data-open-in]')) {
    a.addEventListener('click', (e) => {
      const target = data.openIn.find((o) => o.id === a.dataset.openIn);
      if (!target) return;
      const text = assembled();
      const url = target.template.replace('{prompt}', encodeURIComponent(text));
      if (url.length > target.maxLength) { e.preventDefault(); toast(`Too long for a link (${url.length} characters; ${target.label} accepts about ${target.maxLength}). Copy it instead.`); return; }
      a.href = url;
      recents.add(data.id);
    });
  }

  /* ---- Install one-liners ---- */
  const sel = document.getElementById('install-target');
  const cmdEl = document.getElementById('install-cmd');
  const noteEl = document.getElementById('install-note');
  let shell = 'bash';
  function renderInstall() {
    if (!sel || !cmdEl) return;
    const t = data.installTargets[Number(sel.value)];
    const cmd = installCommands(data, t, location.origin);
    const text = cmd[shell];
    cmdEl.innerHTML = '';
    if (text) {
      const block = el('div', { class: 'code-block code-block--labelled' }, [
        el('span', { class: 'code-block__label', text: shell === 'bash' ? 'bash / zsh' : 'PowerShell' }),
        el('button', { type: 'button', class: 'btn btn--sm btn-copy-block', 'data-copy-text': text, 'aria-label': 'Copy command', html: `${ICONS.copy} Copy` }),
        el('pre', {}, [el('code', { text })])
      ]);
      cmdEl.append(block);
    } else {
      cmdEl.append(el('p', { class: 'section__sub', text: 'No command for this destination.' }));
    }
    if (noteEl) noteEl.textContent = [cmd.note, t.note].filter(Boolean).join(' ');
  }
  sel?.addEventListener('change', renderInstall);
  for (const b of document.querySelectorAll('[data-shell]')) b.addEventListener('click', () => { shell = b.dataset.shell; for (const x of document.querySelectorAll('[data-shell]')) x.setAttribute('aria-checked', String(x === b)); renderInstall(); });
  renderInstall();
  for (const b of document.querySelectorAll('[data-open-install]')) b.addEventListener('click', () => { const d = document.getElementById('install'); if (d) d.open = true; });

  /* ---- Runtime mode: show the latest body from the repository ---- */
  if (isRuntime && data.path) {
    fetchText(data.path).then((text) => {
      const latest = bodyOf(text);
      if (latest === data.body) return;
      data.body = latest;
      const block = document.querySelector('#prompt-body .prompt__variant[data-variant=""] pre code');
      if (!block) return;
      block.className = `hljs language-${data.format} hljs--plain`;
      block.textContent = '';
      for (const t of tokenize(latest)) {
        if (t.type === 'text') block.append(t.value);
        else { const span = el('span', { class: 'var', 'data-var': t.name, text: t.raw }); block.append(span); const v = varsByName.get(t.name); if (v) makeField(v, span); }
      }
      syncFallback();
      const note = el('p', { class: 'notice notice--info', text: 'Showing the latest version from the content repository; the built page was older.' });
      document.getElementById('prompt-body').before(note);
    }).catch(() => { /* the built body stays */ });
  }

  /* ---- Send to AI ---- */
  const panel = document.getElementById('ai-panel');
  const aiBtn = document.getElementById('send-to-ai-btn');
  if (panel && aiBtn) {
    let mounted = null;
    aiBtn.addEventListener('click', async () => {
      panel.hidden = false;
      if (!mounted) {
        const mod = await import(`${base}assets/js/ai.js`);
        mounted = mod.mountPanel(panel, { mode: 'artifact', artifactId: data.id, artifactTitle: data.title, artifactType: data.type, getPrompt: assembled });
      }
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      mounted?.focus?.();
    });
  }
}
