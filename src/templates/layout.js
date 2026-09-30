import { html, raw } from '../../scripts/lib/html.js';
import { cspFor } from '../../scripts/lib/assets.js';
import { banner, siteHeader, siteFooter, shortcutsDialog } from './partials.js';
import { jsonForScript } from '../../scripts/lib/html.js';

export function page({ model, assets, title, description = '', body, bodyClass = '', current = '', scripts = [], head = '', noindex = false, path = '' }) {
  const cfg = model.cfg;
  const fullTitle = title ? `${title} · ${cfg.site.name}` : cfg.site.name;
  const canonical = cfg.site.url && path ? `${cfg.site.url}${path.replace(new RegExp(`^${model.base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '/')}` : '';
  const hasBanner = cfg.header.enabled ? (cfg.header.sticky ? 'sticky' : 'static') : '';
  const aiConfig = cfg.ai.enabled ? {
    endpoints: cfg.ai.endpoints.map((e) => ({ id: e.id, label: e.label, base_url: e.base_url, api_style: e.api_style, auth: e.auth, headers: e.headers, models: e.models, defaults: e.defaults, stream: e.stream, timeout_seconds: e.timeout_seconds })),
    systemPrompts: model.artifacts.filter((a) => a.type === 'system-prompt').map((a) => ({ id: a.id, title: a.title }))
  } : null;
  return `<!doctype html>
<html lang="en" data-base="${model.base}"${hasBanner ? ` data-has-banner="${hasBanner}"` : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${cspFor(model, assets)}">
<title>${html`${fullTitle}`}</title>
<meta name="description" content="${html`${(description || cfg.site.tagline).slice(0, 300)}`}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
${canonical ? `<link rel="canonical" href="${html`${canonical}`}">` : ''}
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f1218" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${assets.icon}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${model.base}assets/icon-192.png">
<link rel="manifest" href="${assets.manifest}">
${cfg.features.rss ? `<link rel="alternate" type="application/rss+xml" title="${html`${cfg.site.name}`} — new and updated" href="${model.base}feed.xml">` : ''}
<link rel="stylesheet" href="${assets.css}">
<script>${assets.themeScript}</script>
<script type="module" src="${assets.js('app')}"></script>
${scripts.map((s) => `<script type="module" src="${assets.js(s)}"></script>`).join('\n')}
${head}
</head>
<body class="${html`${bodyClass}`}">
<a class="skip-link" href="#main">Skip to content</a>
${banner(model)}
${siteHeader(model, assets, { current })}
<main class="site-main" id="main" tabindex="-1">
${body}
</main>
${siteFooter(model, assets)}
${cfg.header.repeat_at_bottom ? banner(model, { bottom: true }) : ''}
${shortcutsDialog()}
<div class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>
${aiConfig ? `<script type="application/json" id="ai-config">${jsonForScript(aiConfig)}</script>` : ''}
</body>
</html>
`;
}

export { raw };
