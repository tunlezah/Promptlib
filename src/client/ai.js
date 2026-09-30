// Send to AI: adapters for four API styles, streaming, and the panel UI. Requests go only to configured endpoints.
import { base, toast, copyText, flashDone, el } from './ui.js';
import { storage, KEYS } from './store.js';
import { getCatalog } from './catalog.js';
import { assemble } from './shared/variables.js';

const CONFIG = (() => { try { return JSON.parse(document.getElementById('ai-config')?.textContent || 'null'); } catch { return null; } })();

/* ---------------- Adapters ---------------- */
function joinUrl(baseUrl, path) { return `${baseUrl.replace(/\/+$/, '')}${path}`; }

export const ADAPTERS = {
  'openai-chat': {
    url: (ep) => joinUrl(ep.base_url, '/chat/completions'),
    body: ({ model, system, user, temperature, maxTokens, stream }) => ({
      model, messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: user }],
      temperature, max_tokens: maxTokens, stream, ...(stream ? { stream_options: { include_usage: true } } : {})
    }),
    parseJson: (j) => ({ text: j.choices?.[0]?.message?.content ?? '', usage: usageFrom(j.usage) }),
    parseEvent: (data) => {
      if (data === '[DONE]') return { done: true };
      const j = JSON.parse(data);
      return { delta: j.choices?.[0]?.delta?.content || '', usage: j.usage ? usageFrom(j.usage) : null };
    },
    framing: 'sse'
  },
  'openai-responses': {
    url: (ep) => joinUrl(ep.base_url, '/responses'),
    body: ({ model, system, user, temperature, maxTokens, stream }) => ({ model, ...(system ? { instructions: system } : {}), input: user, temperature, max_output_tokens: maxTokens, stream }),
    parseJson: (j) => ({ text: j.output_text ?? (j.output || []).flatMap((o) => o.content || []).filter((c) => c.type === 'output_text').map((c) => c.text).join('') , usage: usageFrom(j.usage, 'input_tokens', 'output_tokens') }),
    parseEvent: (data, event) => {
      const j = JSON.parse(data);
      const type = event || j.type;
      if (type === 'response.output_text.delta') return { delta: j.delta || '' };
      if (type === 'response.completed') return { done: true, usage: usageFrom(j.response?.usage, 'input_tokens', 'output_tokens') };
      if (type === 'error' || type === 'response.failed') throw new Error(j.error?.message || j.response?.error?.message || 'The endpoint reported an error');
      return {};
    },
    framing: 'sse'
  },
  'anthropic-messages': {
    url: (ep) => joinUrl(ep.base_url, '/messages'),
    headers: { 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: ({ model, system, user, temperature, maxTokens, stream }) => ({ model, ...(system ? { system } : {}), messages: [{ role: 'user', content: user }], max_tokens: maxTokens, temperature, stream }),
    parseJson: (j) => ({ text: (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join(''), usage: usageFrom(j.usage, 'input_tokens', 'output_tokens') }),
    parseEvent: (data, event) => {
      const j = JSON.parse(data);
      const type = event || j.type;
      if (type === 'content_block_delta') return { delta: j.delta?.text || '' };
      if (type === 'message_start') return { usage: usageFrom(j.message?.usage, 'input_tokens', 'output_tokens') };
      if (type === 'message_delta') return { usage: usageFrom(j.usage, 'input_tokens', 'output_tokens') };
      if (type === 'message_stop') return { done: true };
      if (type === 'error') throw new Error(j.error?.message || 'The endpoint reported an error');
      return {};
    },
    framing: 'sse'
  },
  ollama: {
    url: (ep) => joinUrl(ep.base_url.replace(/\/v1\/?$/, ''), '/api/chat'),
    body: ({ model, system, user, temperature, maxTokens, stream }) => ({ model, messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: user }], stream, options: { temperature, num_predict: maxTokens } }),
    parseJson: (j) => ({ text: j.message?.content ?? '', usage: usageFrom({ prompt_tokens: j.prompt_eval_count, completion_tokens: j.eval_count }) }),
    parseEvent: (line) => { const j = JSON.parse(line); return { delta: j.message?.content || '', done: Boolean(j.done), usage: j.done ? usageFrom({ prompt_tokens: j.prompt_eval_count, completion_tokens: j.eval_count }) : null }; },
    framing: 'ndjson'
  }
};

function usageFrom(u, inKey = 'prompt_tokens', outKey = 'completion_tokens') {
  if (!u) return null;
  const input = u[inKey] ?? u.input_tokens ?? u.prompt_tokens;
  const output = u[outKey] ?? u.output_tokens ?? u.completion_tokens;
  if (input === undefined && output === undefined) return null;
  return { input, output };
}

function headersFor(ep, adapter) {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(adapter.headers || {}), ...(ep.headers || {}) };
  if (ep.auth === 'bearer') {
    const token = storage.get(KEYS.aiToken(ep.id), '');
    if (token) h.Authorization = `Bearer ${token}`;
  }
  return h;
}

// Plain-words explanation of a failure.
export function explainError(err, res, ep) {
  if (err?.name === 'AbortError') return err.byUser ? 'Stopped.' : `No reply within ${ep.timeout_seconds} seconds. The model may be busy; try again or lower max tokens.`;
  if (res) {
    if (res.status === 401 || res.status === 403) return ep.auth === 'mtls'
      ? `The gateway refused the request (HTTP ${res.status}). Your client certificate may be missing, expired or not trusted by the gateway. Check that the browser presented a certificate (it asks once per session) and that your certificate is allowed.`
      : ep.auth === 'bearer' ? `The endpoint refused the token (HTTP ${res.status}). Set or renew it under Settings.` : `The endpoint refused the request (HTTP ${res.status}).`;
    if (res.status === 404) return `Nothing at ${ADAPTERS[ep.api_style].url(ep)} (HTTP 404). Check base_url and api_style in site.config.yml.`;
    if (res.status === 429) return 'Rate limited (HTTP 429). Wait a moment and try again.';
    if (res.status >= 500) return `The endpoint failed (HTTP ${res.status}). This is on the server side.`;
    return `HTTP ${res.status}: ${err?.message || res.statusText || 'request failed'}`;
  }
  if (err instanceof TypeError) {
    return `The browser could not reach ${ep.base_url}. This usually means one of: (1) no network route from this machine, (2) the gateway does not allow this site's origin (CORS: it must send Access-Control-Allow-Origin: ${location.origin} and Access-Control-Allow-Credentials: true, and answer OPTIONS preflights), or (3) a certificate problem, for example the browser did not present a client certificate or the server certificate is not trusted. Open ${ep.base_url} in a new tab to see which.`;
  }
  return err?.message || 'Unknown error';
}

// Send a request. onDelta(text) is called with streamed pieces; resolves { text, usage, ms, firstTokenMs, status }.
export async function send(ep, modelId, { system = '', user, temperature, maxTokens, signal, onDelta }) {
  const adapter = ADAPTERS[ep.api_style];
  if (!adapter) throw new Error(`Unsupported api_style ${ep.api_style}`);
  const stream = Boolean(ep.stream) && typeof onDelta === 'function';
  const body = adapter.body({ model: modelId, system, user, temperature, maxTokens, stream });
  const t0 = performance.now();
  let firstTokenMs = null;
  const res = await fetch(adapter.url(ep), {
    method: 'POST', headers: headersFor(ep, adapter), body: JSON.stringify(body), signal,
    credentials: ep.auth === 'mtls' ? 'include' : 'omit', mode: 'cors', cache: 'no-store', referrerPolicy: 'no-referrer'
  });
  if (!res.ok) {
    let msg = '';
    try { const j = await res.json(); msg = j.error?.message || j.message || j.error || ''; } catch { /* ignore */ }
    const e = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)); e.response = res; throw e;
  }
  const ct = res.headers.get('content-type') || '';
  if (!stream || !res.body || (!ct.includes('event-stream') && !ct.includes('ndjson') && !ct.includes('json-seq') && adapter.framing === 'sse' && ct.includes('application/json'))) {
    const j = await res.json();
    const out = adapter.parseJson(j);
    onDelta?.(out.text);
    return { ...out, ms: Math.round(performance.now() - t0), firstTokenMs: Math.round(performance.now() - t0), status: res.status };
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', text = '', usage = null, done = false, event = '';
  const handle = (piece) => {
    if (!piece) return;
    const r = piece.framing === 'ndjson' ? adapter.parseEvent(piece.line) : adapter.parseEvent(piece.data, piece.event);
    if (r.delta) { if (firstTokenMs === null) firstTokenMs = Math.round(performance.now() - t0); text += r.delta; onDelta(r.delta); }
    if (r.usage) usage = { ...(usage || {}), ...r.usage };
    if (r.done) done = true;
  };
  while (!done) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).replace(/\r$/, '');
      buf = buf.slice(idx + 1);
      if (adapter.framing === 'ndjson') { if (line.trim()) handle({ framing: 'ndjson', line }); continue; }
      if (line.startsWith('event:')) { event = line.slice(6).trim(); continue; }
      if (line.startsWith('data:')) { const data = line.slice(5).trim(); if (data) handle({ data, event }); continue; }
      if (line === '') event = '';
    }
  }
  return { text, usage, ms: Math.round(performance.now() - t0), firstTokenMs, status: res.status };
}

/* ---------------- Markdown rendering (lazy, sanitised) ---------------- */
let mdPromise = null;
function getMarkdown() {
  if (!mdPromise) {
    mdPromise = Promise.all([
      new Promise((resolve, reject) => {
        if (window.markdownit) return resolve(window.markdownit);
        const s = document.createElement('script'); s.src = `${base}assets/vendor/markdown-it.min.js`; s.onload = () => resolve(window.markdownit); s.onerror = reject; document.head.append(s);
      }),
      import(`${base}assets/vendor/purify.es.mjs`)
    ]).then(([markdownit, purify]) => {
      const md = markdownit({ html: false, linkify: true, breaks: false });
      const DOMPurify = purify.default || purify;
      DOMPurify.addHook('afterSanitizeAttributes', (node) => { if (node.tagName === 'A') { node.setAttribute('rel', 'noopener noreferrer'); node.setAttribute('target', '_blank'); } });
      return (src) => DOMPurify.sanitize(md.render(src), { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'form', 'input'], FORBID_ATTR: ['style', 'onerror', 'onload'] });
    }).catch((e) => { mdPromise = null; throw e; });
  }
  return mdPromise;
}

/* ---------------- Panel UI ---------------- */
export function mountPanel(root, opts) {
  if (!CONFIG || !CONFIG.endpoints?.length) { root.hidden = true; return null; }
  const endpoints = CONFIG.endpoints;
  const prefs = storage.get(KEYS.aiPrefs, {});
  let ep = endpoints.find((e) => e.id === prefs.endpoint) || endpoints[0];
  let controller = null;
  let render = null; // markdown renderer once loaded
  let raw = '';
  const historyKey = KEYS.aiHistory(opts.artifactId || 'try');
  const isSystem = opts.artifactType === 'system-prompt';

  root.innerHTML = '';
  const title = el('h2', { id: 'ai-title', text: opts.mode === 'try' ? 'Send to AI' : `Send “${opts.artifactTitle}” to AI` });
  const epSel = el('select', { class: 'select', id: 'ai-endpoint', 'aria-label': 'Endpoint' });
  for (const e of endpoints) epSel.append(el('option', { value: e.id, text: e.label }));
  epSel.value = ep.id;
  const modelSel = el('select', { class: 'select', id: 'ai-model', 'aria-label': 'Model' });
  const settingsBtn = el('button', { type: 'button', class: 'btn btn--sm', id: 'ai-settings', text: 'Settings' });
  const checkBtn = el('button', { type: 'button', class: 'btn btn--sm', id: 'ai-check', text: 'Check connection' });
  const head = el('div', { class: 'ai-panel__head' }, [title, endpoints.length > 1 ? el('label', { class: 'field' }, [el('span', { class: 'visually-hidden', text: 'Endpoint' }), epSel]) : null, el('label', { class: 'field' }, [el('span', { class: 'visually-hidden', text: 'Model' }), modelSel]), checkBtn, settingsBtn]);

  const userBox = el('textarea', { class: 'textarea', id: 'ai-user', rows: 4, placeholder: isSystem ? 'Your message to the assistant (the artefact is sent as the system prompt)…' : 'Optional: anything to add after the prompt, for example the code or text it should work on…' });
  const sysSel = el('select', { class: 'select', id: 'ai-system' }, [el('option', { value: '', text: 'None' })]);
  for (const s of CONFIG.systemPrompts || []) if (s.id !== opts.artifactId) sysSel.append(el('option', { value: s.id, text: s.title }));
  const sendBtn = el('button', { type: 'button', class: 'btn btn--primary', id: 'ai-send', text: 'Send' });
  const stopBtn = el('button', { type: 'button', class: 'btn', id: 'ai-stop', text: 'Stop', disabled: true });
  const clearBtn = el('button', { type: 'button', class: 'btn btn--ghost', id: 'ai-clear', text: 'Clear' });
  const copyBtn = el('button', { type: 'button', class: 'btn btn--sm', id: 'ai-copy', text: 'Copy response', disabled: true });
  const status = el('p', { class: 'ai-panel__status', id: 'ai-status', role: 'status', 'aria-live': 'polite' });
  const reply = el('div', { class: 'ai-reply', id: 'ai-reply', 'aria-live': 'polite', 'aria-label': 'Reply' });
  const usageEl = el('div', { class: 'ai-usage', id: 'ai-usage' });
  const temp = el('input', { class: 'input', id: 'ai-temp', type: 'number', min: 0, max: 2, step: 0.1, value: String(prefs.temperature ?? ep.defaults?.temperature ?? 0.2) });
  const maxTok = el('input', { class: 'input', id: 'ai-max', type: 'number', min: 1, max: 128000, step: 1, value: String(prefs.maxTokens ?? ep.defaults?.max_tokens ?? 2048) });
  const histToggle = el('input', { type: 'checkbox', id: 'ai-history-toggle' });
  histToggle.checked = Boolean(storage.get(KEYS.aiHistoryOn, false));
  const histList = el('ul', { class: 'ai-history', id: 'ai-history' });
  const advanced = el('details', { class: 'ai-advanced' }, [
    el('summary', { text: 'Advanced' }),
    el('div', { class: 'form-row' }, [
      el('label', { class: 'field' }, [el('span', { class: 'field__label', text: 'Temperature' }), temp]),
      el('label', { class: 'field' }, [el('span', { class: 'field__label', text: 'Max tokens' }), maxTok]),
      el('label', { class: 'switch' }, [histToggle, el('span', { text: 'Keep the last few exchanges in this browser' })])
    ]),
    histList
  ]);
  const bodyEl = el('div', { class: 'ai-panel__body' }, [
    isSystem ? null : el('label', { class: 'field' }, [el('span', { class: 'field__label', text: 'System prompt (optional, from the library)' }), sysSel]),
    el('label', { class: 'field' }, [el('span', { class: 'field__label', text: isSystem ? 'Your message' : 'Add to the prompt (optional)' }), userBox]),
    el('div', { class: 'btn-row' }, [sendBtn, stopBtn, clearBtn, copyBtn]),
    status, reply, usageEl, advanced
  ]);
  root.append(head, bodyEl);

  function fillModels() {
    modelSel.innerHTML = '';
    for (const m of ep.models) modelSel.append(el('option', { value: m.id, text: m.label || m.id }));
    const def = prefs.models?.[ep.id] || ep.models.find((m) => m.default)?.id || ep.models[0].id;
    modelSel.value = def;
    settingsBtn.hidden = ep.auth !== 'bearer';
  }
  fillModels();
  epSel.addEventListener('change', () => { ep = endpoints.find((e) => e.id === epSel.value); prefs.endpoint = ep.id; storage.set(KEYS.aiPrefs, prefs); fillModels(); });
  modelSel.addEventListener('change', () => { prefs.models = { ...(prefs.models || {}), [ep.id]: modelSel.value }; storage.set(KEYS.aiPrefs, prefs); });
  temp.addEventListener('change', () => { prefs.temperature = Number(temp.value); storage.set(KEYS.aiPrefs, prefs); });
  maxTok.addEventListener('change', () => { prefs.maxTokens = Number(maxTok.value); storage.set(KEYS.aiPrefs, prefs); });
  histToggle.addEventListener('change', () => { storage.set(KEYS.aiHistoryOn, histToggle.checked); if (!histToggle.checked) { storage.remove(historyKey); renderHistory(); } });

  function renderHistory() {
    const items = histToggle.checked ? storage.get(historyKey, []) : [];
    histList.innerHTML = '';
    for (const h of items) histList.append(el('li', {}, [el('strong', { text: `${new Date(h.at).toLocaleString()} · ${h.model}` }), el('div', { text: h.reply.slice(0, 300) + (h.reply.length > 300 ? '…' : '') })]));
  }
  renderHistory();

  async function paint() {
    if (!render) { try { render = await getMarkdown(); } catch { render = null; } }
    if (render) reply.innerHTML = render(raw); else reply.textContent = raw;
  }
  let paintTimer = null;
  const schedulePaint = () => { if (paintTimer) return; paintTimer = setTimeout(() => { paintTimer = null; paint(); }, 120); };

  async function buildMessages() {
    let system = '', user = '';
    const prompt = opts.getPrompt();
    if (isSystem) { system = prompt; user = userBox.value.trim(); if (!user) { userBox.focus(); throw Object.assign(new Error('Type a message to send with this system prompt.'), { soft: true }); } }
    else {
      user = prompt + (userBox.value.trim() ? `\n\n${userBox.value.trim()}` : '');
      if (sysSel.value) {
        const cat = await getCatalog();
        const s = cat.byId.get(sysSel.value);
        if (s) system = assemble(s.body, s.variables, storage.get(KEYS.vars(s.id), {}));
      }
    }
    if (!user.trim()) throw Object.assign(new Error('There is nothing to send.'), { soft: true });
    return { system, user };
  }

  async function run(isCheck = false) {
    if (controller) return;
    controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), (ep.timeout_seconds || 120) * 1000);
    sendBtn.disabled = true; stopBtn.disabled = false; checkBtn.disabled = true;
    reply.classList.add('is-streaming'); reply.innerHTML = ''; raw = ''; usageEl.textContent = '';
    status.textContent = isCheck ? `Checking ${ep.label}…` : `Sending to ${ep.label} · ${modelSel.value}… (the browser may ask for a certificate the first time)`;
    let res;
    try {
      const msgs = isCheck ? { system: '', user: 'Reply with the single word: pong' } : await buildMessages();
      res = await send(ep, modelSel.value, { ...msgs, temperature: Number(temp.value), maxTokens: isCheck ? 8 : Number(maxTok.value), signal: controller.signal, onDelta: (d) => { raw += d; schedulePaint(); } });
      if (paintTimer) { clearTimeout(paintTimer); paintTimer = null; }
      raw = res.text || raw;
      await paint();
      const parts = [`${(res.ms / 1000).toFixed(1)} s total`];
      if (res.firstTokenMs !== null && res.firstTokenMs !== undefined) parts.push(`${(res.firstTokenMs / 1000).toFixed(1)} s to first token`);
      if (res.usage?.input !== undefined) parts.push(`${res.usage.input} input tokens`);
      if (res.usage?.output !== undefined) parts.push(`${res.usage.output} output tokens`);
      usageEl.textContent = parts.join(' · ');
      status.textContent = isCheck ? `Connected to ${ep.label}. The model answered in ${(res.ms / 1000).toFixed(1)} s.` : 'Done.';
      copyBtn.disabled = !raw;
      if (!isCheck && histToggle.checked) {
        const items = storage.get(historyKey, []);
        items.unshift({ at: new Date().toISOString(), model: modelSel.value, endpoint: ep.id, prompt: msgs.user.slice(0, 2000), reply: raw });
        storage.set(historyKey, items.slice(0, 5));
        renderHistory();
      }
    } catch (e) {
      if (e.soft) { status.textContent = e.message; }
      else { status.textContent = explainError(e, e.response, ep); if (!raw) reply.textContent = ''; }
    } finally {
      clearTimeout(timer);
      controller = null;
      reply.classList.remove('is-streaming');
      sendBtn.disabled = false; stopBtn.disabled = true; checkBtn.disabled = false;
    }
  }
  sendBtn.addEventListener('click', () => run(false));
  checkBtn.addEventListener('click', () => run(true));
  stopBtn.addEventListener('click', () => { if (controller) { const c = controller; c.byUser = true; const err = new DOMException('Stopped', 'AbortError'); err.byUser = true; c.abort(err); } });
  clearBtn.addEventListener('click', () => { raw = ''; reply.innerHTML = ''; status.textContent = ''; usageEl.textContent = ''; copyBtn.disabled = true; userBox.value = ''; });
  copyBtn.addEventListener('click', async () => { if (await copyText(raw)) { flashDone(copyBtn); toast('Response copied'); } });
  settingsBtn.addEventListener('click', () => openSettings(ep));

  function openSettings(endpoint) {
    let dlg = document.getElementById('ai-settings-dialog');
    if (dlg) dlg.remove();
    const input = el('input', { class: 'input', type: 'password', id: 'ai-token', autocomplete: 'off', placeholder: 'Paste the token' });
    input.value = storage.get(KEYS.aiToken(endpoint.id), '');
    const save = el('button', { type: 'button', class: 'btn btn--primary', text: 'Save' });
    const forget = el('button', { type: 'button', class: 'btn btn--ghost btn--danger', text: 'Forget' });
    dlg = el('dialog', { class: 'dialog', id: 'ai-settings-dialog', 'aria-labelledby': 'ai-settings-title' }, [
      el('div', { class: 'dialog__header' }, [el('h2', { id: 'ai-settings-title', text: `Token for ${endpoint.label}` }), el('button', { type: 'button', class: 'icon-btn', 'data-close-dialog': '', 'aria-label': 'Close', text: '✕' })]),
      el('div', { class: 'dialog__body' }, [
        el('p', { class: 'section__sub', text: 'Stored only in this browser (localStorage) and sent as a Bearer token to this endpoint. It is never written to the site or the repository.' }),
        el('label', { class: 'field' }, [el('span', { class: 'field__label', text: 'Bearer token' }), input]),
        el('div', { class: 'btn-row' }, [save, forget])
      ])
    ]);
    save.addEventListener('click', () => { storage.set(KEYS.aiToken(endpoint.id), input.value.trim()); dlg.close(); toast('Token saved in this browser'); });
    forget.addEventListener('click', () => { storage.remove(KEYS.aiToken(endpoint.id)); dlg.close(); toast('Token removed'); });
    document.body.append(dlg);
    dlg.showModal();
  }

  return { focus: () => (isSystem ? userBox : sendBtn).focus(), run, element: root };
}
