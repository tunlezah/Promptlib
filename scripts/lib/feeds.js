// RSS 2.0, JSON Feed 1.1 and sitemap.
import { escapeHtml } from './html.js';

const abs = (model, p) => (model.cfg.site.url ? model.cfg.site.url.replace(/\/$/, '') + p.replace(new RegExp(`^${model.base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '/') : p);
const rfc822 = (iso) => new Date(`${iso}T00:00:00Z`).toUTCString();

function feedItems(model, limit = 50) {
  return [...model.artifacts]
    .sort((a, b) => (b.updated || '').localeCompare(a.updated || '') || (b.created || '').localeCompare(a.created || ''))
    .slice(0, limit)
    .map((a) => ({
      ...a,
      isNew: a.updated === a.created,
      feedTitle: `${a.updated === a.created ? 'New' : 'Updated'}: ${a.title} (${a.typeLabel})`
    }));
}

export function rssXml(model) {
  const site = model.cfg.site;
  const items = feedItems(model).map((a) => `    <item>
      <title>${escapeHtml(a.feedTitle)}</title>
      <link>${escapeHtml(abs(model, a.url))}</link>
      <guid isPermaLink="false">${escapeHtml(`${a.id}@${a.version}`)}</guid>
      <pubDate>${rfc822(a.updated)}</pubDate>
      <category>${escapeHtml(a.typeLabel)}</category>${a.categoryLabels.map((c) => `\n      <category>${escapeHtml(c)}</category>`).join('')}
      <description>${escapeHtml(a.summary)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(site.name)}</title>
    <link>${escapeHtml(abs(model, model.base))}</link>
    <description>${escapeHtml(`New and updated artefacts in ${site.name}`)}</description>
    <language>en</language>
    <lastBuildDate>${model.now.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeHtml(abs(model, `${model.base}feed.xml`))}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

export function jsonFeed(model) {
  const site = model.cfg.site;
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: site.name,
    home_page_url: abs(model, model.base),
    feed_url: abs(model, `${model.base}feed.json`),
    description: `New and updated artefacts in ${site.name}`,
    items: feedItems(model).map((a) => ({
      id: `${a.id}@${a.version}`,
      url: abs(model, a.url),
      title: a.feedTitle,
      content_text: a.summary,
      date_published: `${a.created}T00:00:00Z`,
      date_modified: `${a.updated}T00:00:00Z`,
      tags: [a.typeLabel, ...a.categoryLabels, ...a.tags],
      authors: a.author ? [{ name: a.author }] : undefined
    }))
  }, null, 2);
}

export function sitemapXml(model, pagePaths) {
  const urls = pagePaths.map((p) => {
    const a = model.artifacts.find((x) => x.url === p);
    const lastmod = a ? `\n    <lastmod>${a.updated}</lastmod>` : '';
    return `  <url>\n    <loc>${escapeHtml(abs(model, p))}</loc>${lastmod}\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(model) {
  return `User-agent: *\nAllow: /\nSitemap: ${abs(model, `${model.base}sitemap.xml`)}\n`;
}
