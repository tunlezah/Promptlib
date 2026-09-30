#!/usr/bin/env node
// Builds the static site into public/ (or --out <dir>).
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadConfig, ConfigError } from './lib/config.js';
import { loadContent } from './lib/content.js';
import { validateContent, formatIssue } from './lib/validate.js';
import { fileHistories } from './lib/git.js';
import { buildModel, toIndexJson } from './lib/model.js';
import { buildSearchIndex } from './lib/search.js';
import { rssXml, jsonFeed, sitemapXml, robotsTxt } from './lib/feeds.js';
import { writeDownloads } from './lib/downloads.js';
import { writeAssets } from './lib/assets.js';
import { renderSite } from '../src/templates/index.js';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const quiet = args.includes('--quiet');
const log = (...a) => { if (!quiet) console.log(...a); };

export async function build({ outDir = 'public', env = process.env, cwd = process.cwd(), now = new Date() } = {}) {
  const t0 = performance.now();
  const cfg = loadConfig({ env, cwd });
  const content = loadContent(cfg);
  const result = validateContent(content, cfg);
  for (const w of result.warnings) log(`⚠ ${formatIssue(w)}`);
  if (result.errors.length) {
    for (const e of result.errors) console.error(`✖ ${formatIssue(e)}`);
    throw new Error(`Content validation failed with ${result.errors.length} error(s). Fix the files above and rebuild.`);
  }
  for (const m of cfg.missingEnv) log(`⚠ environment variable ${m} is not set; substituted an empty string`);

  const histories = fileHistories(content.contentDir);
  const model = buildModel(content, cfg, { histories, now });

  const out = path.resolve(cwd, outDir);
  if (out === path.resolve(cwd) || out === path.parse(out).root || !out.startsWith(path.resolve(cwd))) {
    throw new Error(`Refusing to write to ${out}: the output directory must be inside the project`);
  }
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const assets = writeAssets(model, out);
  const pages = renderSite(model, assets);
  const written = [];
  for (const p of pages) {
    const rel = p.path.replace(/^\//, '');
    const file = p.file ? path.join(out, p.file) : path.join(out, rel, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, p.html);
    if (!p.file && !p.noindex) written.push(`${model.base}${rel}`);
  }
  fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(toIndexJson(model, { buildId: assets.buildId })));
  fs.writeFileSync(path.join(out, 'search-index.json'), buildSearchIndex(model.artifacts));
  if (cfg.features.rss) {
    fs.writeFileSync(path.join(out, 'feed.xml'), rssXml(model));
    fs.writeFileSync(path.join(out, 'feed.json'), jsonFeed(model));
  }
  fs.writeFileSync(path.join(out, 'sitemap.xml'), sitemapXml(model, written));
  fs.writeFileSync(path.join(out, 'robots.txt'), robotsTxt(model));
  const downloads = writeDownloads(model, out);
  const ms = Math.round(performance.now() - t0);
  const summary = { pages: pages.length, artifacts: model.artifacts.length, collections: model.collections.length, learn: model.learn.length, downloads, out, ms, buildId: assets.buildId, warnings: result.warnings.length };
  log(`✔ Built ${summary.pages} pages (${summary.artifacts} artefacts, ${summary.collections} collections, ${summary.learn} learn pages), ${downloads} downloads → ${path.relative(cwd, out) || '.'} in ${ms} ms${cfg.ai.enabled ? ` · Send to AI: ${cfg.ai.endpoints.length} endpoint(s)` : ''}${cfg.header.enabled ? ' · banner on' : ''}`);
  return { model, assets, summary };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname;
if (isMain) {
  build({ outDir: opt('--out', 'public') }).catch((e) => {
    console.error(e instanceof ConfigError ? `✖ ${e.message}` : (e.stack || e.message));
    process.exit(1);
  });
}
