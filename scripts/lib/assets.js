// Copies and generates everything under /assets plus the manifest, icons and service worker.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { drawIcon } from './png.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = path.resolve(here, '../..');
const SRC = path.join(APP_ROOT, 'src');

export const THEME_SCRIPT = `(function(){try{var h=document.documentElement,g=function(k){var v=localStorage.getItem(k);if(v===null)return null;try{return JSON.parse(v)}catch(e){return v}};var t=g('pl.theme');if(t==='light'||t==='dark')h.setAttribute('data-theme',t);var a=g('pl.accent');if(typeof a==='string'&&/^[a-z]+$/.test(a))h.setAttribute('data-accent',a);}catch(e){}})();`;
export const THEME_SCRIPT_HASH = `sha256-${crypto.createHash('sha256').update(THEME_SCRIPT).digest('base64')}`;

const CSS_ORDER = ['tokens.css', 'base.css', 'components.css', 'pages.css', 'highlight.css', 'print.css'];

function copyDir(from, to, filter = () => true) {
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const f = path.join(from, ent.name), t = path.join(to, ent.name);
    if (ent.isDirectory()) copyDir(f, t, filter);
    else if (filter(ent.name)) fs.copyFileSync(f, t);
  }
}

function hashOf(...parts) {
  const h = crypto.createHash('sha256');
  for (const p of parts) h.update(p);
  return h.digest('hex').slice(0, 10);
}

function bannerCss(cfg) {
  return `:root{--banner-bg:${cfg.header.background};--banner-fg:${cfg.header.foreground};}\n`;
}

export function serviceWorker(model, buildId) {
  const base = model.base;
  return `// Prompt Library service worker — cache-first for the app shell, network-first for content.
const VERSION = ${JSON.stringify(buildId)};
const SHELL = 'pl-shell-' + VERSION;
const CONTENT = 'pl-content-' + VERSION;
const BASE = ${JSON.stringify(base)};
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== CONTENT).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  const isShell = url.pathname.startsWith(BASE + 'assets/');
  if (isShell) {
    e.respondWith(caches.open(SHELL).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  e.respondWith(caches.open(CONTENT).then(async (c) => {
    try {
      const res = await fetch(req);
      if (res.ok && (req.mode === 'navigate' || url.pathname.endsWith('.json'))) c.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(req);
      if (hit) return hit;
      if (req.mode === 'navigate') { const off = await c.match(BASE + 'offline/'); if (off) return off; }
      throw err;
    }
  }));
});
`;
}

export function writeAssets(model, outDir) {
  const cfg = model.cfg;
  const base = model.base;
  const assetsDir = path.join(outDir, 'assets');
  fs.mkdirSync(path.join(assetsDir, 'js'), { recursive: true });
  fs.mkdirSync(path.join(assetsDir, 'vendor'), { recursive: true });

  // CSS
  const css = CSS_ORDER.map((f) => fs.readFileSync(path.join(SRC, 'styles', f), 'utf8')).join('\n') + bannerCss(cfg);
  fs.writeFileSync(path.join(assetsDir, 'app.css'), css);

  // Client JS and shared modules
  copyDir(path.join(SRC, 'client'), path.join(assetsDir, 'js'), (n) => n.endsWith('.js'));
  copyDir(path.join(SRC, 'shared'), path.join(assetsDir, 'js', 'shared'), (n) => n.endsWith('.js'));

  // Vendored libraries (from node_modules, never a CDN)
  const nm = path.join(APP_ROOT, 'node_modules');
  fs.copyFileSync(path.join(nm, 'minisearch/dist/es/index.js'), path.join(assetsDir, 'vendor', 'minisearch.js'));
  fs.copyFileSync(path.join(nm, 'markdown-it/dist/markdown-it.min.js'), path.join(assetsDir, 'vendor', 'markdown-it.min.js'));
  fs.copyFileSync(path.join(nm, 'dompurify/dist/purify.es.mjs'), path.join(assetsDir, 'vendor', 'purify.es.mjs'));
  fs.writeFileSync(path.join(assetsDir, 'vendor', 'LICENSES.txt'), [
    'minisearch — MIT — https://github.com/lucaong/minisearch',
    'markdown-it — MIT — https://github.com/markdown-it/markdown-it',
    'DOMPurify — Apache-2.0 OR MPL-2.0 — https://github.com/cure53/DOMPurify',
    'highlight.js (used at build time only) — BSD-3-Clause — https://github.com/highlightjs/highlight.js'
  ].join('\n') + '\n');

  // Static files
  copyDir(path.join(SRC, 'static'), assetsDir);

  // Icons
  const accent = '#2f6fed';
  fs.writeFileSync(path.join(assetsDir, 'icon-192.png'), drawIcon(192, { bg: accent }));
  fs.writeFileSync(path.join(assetsDir, 'icon-512.png'), drawIcon(512, { bg: accent }));
  fs.writeFileSync(path.join(assetsDir, 'icon-maskable-512.png'), drawIcon(512, { bg: accent, pad: 64 }));

  // Build id from everything that affects the shell
  const jsFiles = fs.readdirSync(path.join(assetsDir, 'js')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(assetsDir, 'js', f)));
  const buildId = hashOf(css, ...jsFiles, JSON.stringify(cfg.ai.endpoints), base);
  const v = `?v=${buildId}`;

  // Manifest
  const manifest = {
    name: cfg.site.name, short_name: cfg.site.name.length > 12 ? 'Prompts' : cfg.site.name, description: cfg.site.tagline,
    start_url: base, scope: base, display: 'standalone', background_color: '#ffffff', theme_color: accent,
    icons: [
      { src: `${base}assets/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}assets/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}assets/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: `${base}assets/favicon.svg`, sizes: 'any', type: 'image/svg+xml' }
    ]
  };
  fs.writeFileSync(path.join(outDir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(outDir, 'sw.js'), serviceWorker(model, buildId));

  return {
    buildId,
    css: `${base}assets/app.css${v}`,
    js: (name) => `${base}assets/js/${name}.js${v}`,
    vendor: (name) => `${base}assets/vendor/${name}${v}`,
    icon: `${base}assets/favicon.svg`,
    logo: `${base}assets/logo.svg`,
    manifest: `${base}manifest.webmanifest`,
    themeScript: THEME_SCRIPT,
    themeScriptHash: THEME_SCRIPT_HASH
  };
}

// Content-Security-Policy for every page. connect-src is exactly the configured AI origins (+ GitLab in runtime mode).
export function cspFor(model, assets) {
  const origins = new Set();
  for (const ep of model.cfg.ai.endpoints) { try { origins.add(new URL(ep.base_url).origin); } catch { /* validated earlier */ } }
  if (model.cfg.content.mode === 'runtime') { try { origins.add(new URL(model.cfg.content.host).origin); } catch { /* ignore */ } }
  return [
    "default-src 'self'",
    `script-src 'self' '${assets.themeScriptHash}'`,
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${[...origins].map((o) => ` ${o}`).join('')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self'"
  ].join('; ');
}
