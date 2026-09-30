#!/usr/bin/env node
// Static file server for local development and tests. Mounts the build at the configured base path.
//   node scripts/dev.js [--dir public] [--port 4173] [--host 127.0.0.1] [--watch] [--no-build]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { loadConfig } from './lib/config.js';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const dir = path.resolve(opt('--dir', 'public'));
const port = Number(opt('--port', process.env.PORT || 4173));
const host = opt('--host', '127.0.0.1');
const watch = args.includes('--watch');
const noBuild = args.includes('--no-build');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.zip': 'application/zip', '.yml': 'text/yaml; charset=utf-8', '.woff2': 'font/woff2', '.map': 'application/json'
};

let cfg;
try { cfg = loadConfig(); } catch (e) { console.error(e.message); process.exit(1); }
const base = cfg.site.base_path;

function runBuild() {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(path.dirname(new URL(import.meta.url).pathname), 'build.js'), '--out', dir], { stdio: 'inherit', env: process.env });
    p.on('exit', (code) => resolve(code === 0));
  });
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let url;
  try { url = new URL(req.url, `http://${req.headers.host}`); } catch { return send(res, 400, 'Bad request'); }
  let p = decodeURIComponent(url.pathname);
  if (base !== '/') {
    if (p === base.slice(0, -1)) { res.writeHead(302, { Location: base }); return res.end(); }
    if (!p.startsWith(base)) return send(res, 404, `Not found. The site is served under ${base}`);
    p = p.slice(base.length - 1);
  }
  let file = path.normalize(path.join(dir, p));
  if (!file.startsWith(dir)) return send(res, 403, 'Forbidden');
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: url.pathname + '/' + url.search }); return res.end(); }
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    const nf = path.join(dir, '404.html');
    if (fs.existsSync(nf)) return send(res, 404, fs.readFileSync(nf), MIME['.html']);
    return send(res, 404, 'Not found');
  }
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  if (!noBuild) { const ok = await runBuild(); if (!ok && !watch) process.exit(1); }
  server.listen(port, host, () => console.log(`Serving ${path.relative(process.cwd(), dir) || '.'} at http://${host}:${port}${base}${watch ? ' (watching for changes)' : ''}`));
  if (watch) {
    let timer = null, building = false, pending = false;
    const trigger = (what) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (building) { pending = true; return; }
        building = true;
        console.log(`\n↻ ${what} changed, rebuilding…`);
        await runBuild();
        building = false;
        if (pending) { pending = false; trigger('more files'); }
      }, 300);
    };
    const roots = ['src', 'scripts', 'schema', 'site.config.yml', cfg.paths.content].filter((r) => fs.existsSync(r));
    for (const r of roots) {
      try { fs.watch(r, { recursive: true }, (_, f) => trigger(f || r)); } catch (e) { console.warn(`Could not watch ${r}: ${e.message}`); }
    }
  }
})();
