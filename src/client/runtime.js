// Runtime content mode: read the latest catalogue and artefact bodies straight from the GitLab repository files
// API, so edits show up without a rebuild. Only active when site.config.yml sets content.mode: runtime.
export const runtimeConfig = (() => {
  if (document.documentElement.dataset.contentMode !== 'runtime') return null;
  try { return JSON.parse(document.getElementById('content-config')?.textContent || 'null'); } catch { return null; }
})();

export const isRuntime = Boolean(runtimeConfig);

// URL of a file inside the content root, e.g. apiUrl('prompts/x.md').
export function apiUrl(relPath) {
  const c = runtimeConfig;
  const path = `${c.root}/${relPath}`.replace(/\/{2,}/g, '/');
  return c.api_url_template
    .replace('{host}', c.host.replace(/\/$/, ''))
    .replace('{project}', c.project)
    .replace('{project_encoded}', encodeURIComponent(c.project))
    .replace('{branch}', encodeURIComponent(c.branch))
    .replace('{path}', path)
    .replace('{path_encoded}', encodeURIComponent(path));
}

export async function fetchText(relPath, { timeoutMs = 6000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(apiUrl(relPath), { signal: ctl.signal, cache: 'no-store', credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally { clearTimeout(t); }
}

// Split "---\nyaml\n---\nbody" and return the body only (frontmatter is already known from the build).
export function bodyOf(text) {
  const src = text.replace(/^﻿/, '');
  const m = /^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/.exec(src);
  return (m ? src.slice(m[0].length) : src).replace(/^\r?\n/, '').replace(/\s+$/, '');
}
