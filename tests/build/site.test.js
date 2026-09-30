// Builds the site into a temp folder and checks that every artefact produces a page and every output exists.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import MiniSearch from 'minisearch';
import { build } from '../../scripts/build.js';
import { SEARCH_OPTIONS } from '../../src/shared/search-options.js';

let out, model, index;
const read = (...p) => fs.readFileSync(path.join(out, ...p), 'utf8');
const exists = (...p) => fs.existsSync(path.join(out, ...p));
const walkHtml = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkHtml(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []));

before(async () => {
  out = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-build-'));
  // Build inside the project (the build refuses to write outside it) then move.
  const inside = path.join(process.cwd(), `public-test-${process.pid}`);
  const r = await build({ outDir: inside, env: { ...process.env, SITE_CONFIG: 'tests/e2e/site.config.test.yml' } });
  fs.rmSync(out, { recursive: true, force: true });
  fs.renameSync(inside, out);
  model = r.model;
  index = JSON.parse(read('index.json'));
});
after(() => fs.rmSync(out, { recursive: true, force: true }));

test('every artefact gets a page, a download and an index.json entry', () => {
  assert.ok(model.artifacts.length >= 20, 'starter content has at least 20 artefacts');
  for (const a of model.artifacts) {
    assert.ok(exists('library', a.id, 'index.html'), `page for ${a.id}`);
    assert.ok(exists('downloads', a.downloadName), `download for ${a.id}`);
    if (a.isFolder) assert.ok(exists('downloads', `${a.id}.zip`), `zip for ${a.id}`);
    const entry = index.artifacts.find((x) => x.id === a.id);
    assert.ok(entry, `${a.id} in index.json`);
    assert.equal(entry.body, a.body);
    assert.equal(entry.url, `/lib/library/${a.id}/`);
    const html = read('library', a.id, 'index.html');
    assert.ok(html.includes(`<h1 class="artifact__title">`), 'has title');
    assert.ok(html.includes('id="artifact-data"'), 'embeds data for the client');
    assert.ok(html.includes('<textarea class="textarea" readonly'), 'no-JS plain text fallback present');
  }
});

test('collections, learn, contribute, browse landing pages and filter pages exist', () => {
  assert.ok(exists('collections', 'index.html'));
  for (const c of model.collections) assert.ok(exists('collections', c.id, 'index.html'), `collection ${c.id}`);
  for (const l of model.learn) assert.ok(exists('learn', l.slug, 'index.html'), `learn ${l.slug}`);
  assert.ok(exists('contribute', 'index.html'));
  assert.ok(exists('browse', 'index.html'));
  for (const axis of ['type', 'model', 'assistant', 'category']) for (const x of model.axes[axis]) assert.ok(exists('browse', axis, x.id, 'index.html'), `${axis}/${x.id}`);
  assert.ok(exists('favourites', 'index.html'));
  assert.ok(exists('try', 'index.html'), 'try page exists when an AI endpoint is configured');
  assert.ok(exists('404.html'));
});

test('machine outputs are present and well-formed', () => {
  assert.equal(index.site.base_path, '/lib/');
  assert.ok(index.taxonomy.models.length && index.taxonomy.assistants.length);
  assert.ok(index.collections.some((c) => c.start_here));
  const feed = JSON.parse(read('feed.json'));
  assert.equal(feed.version, 'https://jsonfeed.org/version/1.1');
  assert.ok(feed.items.length > 0 && feed.items[0].url.startsWith('http://127.0.0.1:4180/lib/library/'));
  const rss = read('feed.xml');
  assert.ok(rss.startsWith('<?xml') && rss.includes('<rss') && rss.includes('<item>'));
  const sitemap = read('sitemap.xml');
  assert.ok(sitemap.includes('<loc>http://127.0.0.1:4180/lib/library/security-code-review/</loc>'));
  assert.ok(!sitemap.includes('/favourites/'), 'noindex pages stay out of the sitemap');
  assert.ok(read('robots.txt').includes('Sitemap: http://127.0.0.1:4180/lib/sitemap.xml'));
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url, '/lib/');
  assert.ok(exists('assets', 'icon-192.png') && exists('assets', 'icon-512.png'));
  assert.ok(read('sw.js').includes('const BASE = "/lib/"'));
  for (const v of ['minisearch.js', 'markdown-it.min.js', 'purify.es.mjs']) assert.ok(exists('assets', 'vendor', v), v);
});

test('the search index loads with the shared options and finds body text', () => {
  const ms = MiniSearch.loadJSON(read('search-index.json'), SEARCH_OPTIONS);
  const hits = ms.search('owasp');
  assert.ok(hits.some((h) => h.id === 'security-code-review'), 'owasp finds the security review prompt');
  const byTitle = ms.search('patient tutor');
  assert.equal(byTitle[0].id, 'patient-tutor', 'title matches rank first');
});

test('pages carry a strict CSP with exactly the configured AI origins, the banner and base-path links', () => {
  const home = read('index.html');
  const csp = /Content-Security-Policy" content="([^"]+)"/.exec(home)[1];
  assert.match(csp, /connect-src 'self' http:\/\/127\.0\.0\.1:4180;/);
  assert.match(csp, /script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);
  assert.ok(!csp.includes('unsafe-inline'));
  assert.ok(home.includes('class="banner banner--sticky"') && home.includes('TEST ENVIRONMENT'));
  assert.ok(home.includes('class="banner banner--bottom"'), 'repeat_at_bottom renders a second banner');
  assert.ok(home.includes('href="/lib/browse/"'));
  assert.ok(home.includes('href="/lib/assets/app.css?v='));
  assert.ok(home.includes('id="start-here"'));
});

test('no template leaked undefined, NaN or object placeholders into HTML', () => {
  for (const file of walkHtml(out)) {
    const html = fs.readFileSync(file, 'utf8');
    for (const bad of ['>undefined<', '[object Object]', '>NaN<', 'undefined"', 'null"']) {
      assert.ok(!html.includes(bad), `${path.relative(out, file)} contains ${bad}`);
    }
  }
});

test('downloads are install-ready: skills get name/description frontmatter, zips contain every file', async () => {
  const skill = read('downloads', 'threat-model.md');
  assert.ok(skill.startsWith('---\nname: threat-model\ndescription:'), skill.slice(0, 80));
  assert.ok(!skill.includes('difficulty:'), 'library-only frontmatter is stripped');
  const rule = read('downloads', 'python-style.md');
  assert.ok(rule.includes('globs:') && rule.includes('alwaysApply'));
  const hook = read('downloads', 'block-secrets-commit.json');
  assert.ok(JSON.parse(hook).hooks, 'json downloads are the bare body');
  const { unzipSync } = await import('fflate');
  const zip = unzipSync(new Uint8Array(fs.readFileSync(path.join(out, 'downloads', 'threat-model.zip'))));
  assert.deepEqual(Object.keys(zip).sort(), ['SKILL.md', 'checklist.md', 'templates/threat-model.md']);
});
