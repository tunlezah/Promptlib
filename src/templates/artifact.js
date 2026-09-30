import { html, raw, jsonForScript, escapeHtml } from '../../scripts/lib/html.js';
import { page } from './layout.js';
import { notice, codeBlock, cardList } from './partials.js';
import { highlightBody } from '../../scripts/lib/highlight.js';
import { renderMarkdown, renderInline } from '../../scripts/lib/markdown.js';
import { icon } from '../shared/icons.js';
import { assemble } from '../shared/variables.js';
import { installCommands } from '../shared/install.js';
import { formatDate, DIFFICULTY_LABELS, STATUS_LABELS, TYPE_PLURALS } from '../shared/text.js';

function badges(model, a) {
  const u = model.u;
  return html`<div class="artifact__badges">
    <a class="badge badge--type" href="${u(`browse/type/${a.type}/`)}">${a.typeLabel}</a>
    <a class="badge badge--difficulty-${a.difficulty}" href="${u(`browse/?difficulty=${a.difficulty}`)}">${DIFFICULTY_LABELS[a.difficulty]}</a>
    <span class="badge badge--status-${a.status}" title="Status">${STATUS_LABELS[a.status]}</span>
    ${a.assistants.map((id) => html`<a class="badge badge--outline" href="${u(`browse/assistant/${id}/`)}" title="Assistant">${model.label('assistants', id)}</a>`)}
    ${a.models.map((id) => html`<a class="badge badge--outline" href="${u(`browse/model/${id}/`)}" title="Model">${model.label('models', id)}</a>`)}
    ${a.categories.map((id) => html`<a class="badge" href="${u(`browse/category/${id}/`)}" title="Category">${model.label('categories', id)}</a>`)}
  </div>`;
}

function variantBlock(a, key, body, hidden) {
  const { html: code, highlighted } = highlightBody(body, a.format, a.variables);
  return html`<div class="prompt__variant" data-variant="${key}"${hidden ? raw(' hidden') : ''}><pre><code class="hljs language-${a.format}${highlighted ? '' : ' hljs--plain'}">${raw(code)}</code></pre></div>`;
}

function installSection(model, a) {
  if (!a.installTargets.length) return '';
  const origin = model.cfg.site.url || '';
  const first = a.installTargets[0];
  const cmd = installCommands({ id: a.id, isFolder: a.isFolder, downloadName: a.downloadName, downloadUrl: a.downloadUrl, zipUrl: a.zipUrl }, first, origin);
  const isPasteType = ['prompt', 'system-prompt'].includes(a.type);
  return html`<details class="section-card" id="install" data-install>
  <summary><h2>${isPasteType ? 'Where to put it' : 'Install'}</h2></summary>
  <p class="section__sub">Destination for each supported assistant. ${a.isFolder ? 'This artefact is a folder; the zip contains every file.' : `The installed file is <code>${a.downloadName}</code>.`}</p>
  <ul class="install-list">
    ${a.installTargets.map((t) => html`<li><span class="badge ${t.primary ? 'badge--type' : ''}" title="${t.primary ? 'Written for this assistant' : 'Also works here'}">${t.label}</span> <code>${t.path}</code></li>`)}
  </ul>
  <div class="install-oneliner" data-install-cmd>
    <div class="form-row">
      <label class="field"><span class="field__label">Assistant</span>
        <select class="select" id="install-target">${a.installTargets.map((t, i) => html`<option value="${i}">${t.label} — ${t.path}</option>`)}</select>
      </label>
      <div class="segmented install-tabs" role="radiogroup" aria-label="Shell">
        <button type="button" class="segmented__btn" role="radio" aria-checked="true" data-shell="bash">Bash / zsh</button>
        <button type="button" class="segmented__btn" role="radio" aria-checked="false" data-shell="powershell">PowerShell</button>
      </div>
    </div>
    <div id="install-cmd">${cmd.bash ? codeBlock(cmd.bash, { label: 'one-liner' }) : ''}</div>
    <p class="install-note" id="install-note">${cmd.note}${first.note ? ` ${first.note}` : ''}${origin ? '' : ' Commands use this site\'s address once the page has loaded.'}</p>
  </div>
</details>`;
}

export function artifactPage(model, assets, a) {
  const u = model.u;
  const links = model.links;
  const defaultText = assemble(a.body, a.variables, {});
  const openIn = model.cfg.features.open_in_links ? model.openInAssistants : [];
  const data = {
    id: a.id, title: a.title, type: a.type, format: a.format, body: a.body, variables: a.variables, path: a.path,
    variants: a.variants.map((v) => ({ for: v.for, label: v.label, body: v.body })),
    isFolder: a.isFolder, downloadName: a.downloadName, downloadUrl: a.downloadUrl, zipUrl: a.zipUrl,
    installTargets: a.installTargets.map(({ assistant, label, path, isFolder, note }) => ({ assistant, label, path, isFolder, note })),
    openIn: openIn.map((o) => ({ id: o.id, label: o.label, template: o.template, maxLength: o.maxLength })),
    siteUrl: model.cfg.site.url || ''
  };
  const body = html`<div class="container">
  <nav aria-label="Breadcrumb"><ol class="breadcrumbs"><li><a href="${u()}">Home</a></li><li><a href="${u(`browse/type/${a.type}/`)}">${TYPE_PLURALS[a.type]}</a></li><li aria-current="page">${a.title}</li></ol></nav>
  <div class="artifact-layout">
  <article class="artifact" id="artifact" data-id="${a.id}" data-type="${a.type}">
    <header class="artifact__header">
      <div class="artifact__title-row">
        <h1 class="artifact__title">${a.title}</h1>
        ${model.cfg.features.favourites ? html`<button type="button" class="icon-btn btn-fav" id="fav-btn" data-fav-id="${a.id}" aria-pressed="false" aria-label="Add to favourites" title="Favourite (f)">${raw(icon('star'))}</button>` : ''}
      </div>
      <p class="artifact__summary">${a.summary}</p>
      ${badges(model, a)}
      <dl class="meta-list">
        ${a.author ? html`<dt>Author</dt><dd>${a.author}</dd>` : ''}
        <dt>Version</dt><dd>${a.version} · updated <time datetime="${a.updated}">${formatDate(a.updated)}</time></dd>
        <dt>Licence</dt><dd>${a.license}</dd>
        ${a.source ? html`<dt>Source</dt><dd><a href="${a.source}" rel="noopener noreferrer">${a.source.replace(/^https?:\/\//, '')} ${raw(icon('external', 'badge-icon'))}</a></dd>` : ''}
        ${a.tested_on.length ? html`<dt>Tested on</dt><dd>${a.tested_on.join(', ')}</dd>` : ''}
      </dl>
    </header>

    ${a.requires.length ? html`<aside class="needs" aria-labelledby="needs-title">${raw(icon('alert'))}<div><h2 id="needs-title">Needs</h2><ul>${a.requires.map((r) => html`<li>${r}</li>`)}</ul></div></aside>` : ''}
    ${a.status === 'deprecated' ? notice('warn', html`<strong>Deprecated.</strong> This artefact is kept for reference and may no longer work well.${a.relatedArtifacts.length ? html` See ${a.relatedArtifacts.slice(0, 2).map((r, i) => html`${i ? ' or ' : ''}<a href="${r.url}">${r.title}</a>`)} instead.` : ''}`) : ''}

    <section class="prompt" aria-labelledby="prompt-heading">
      <div class="prompt__toolbar">
        <h2 id="prompt-heading" class="visually-hidden">${a.type === 'system-prompt' ? 'System prompt' : 'The artefact'}</h2>
        <span class="prompt__format" title="Format">${a.format}</span>
        ${a.variants.length ? html`<div class="segmented" role="radiogroup" aria-label="Variant" id="variant-switch">
          <button type="button" class="segmented__btn" role="radio" aria-checked="true" data-variant="">Default</button>
          ${a.variants.map((v) => html`<button type="button" class="segmented__btn" role="radio" aria-checked="false" data-variant="${v.for}">${v.label}</button>`)}
        </div>` : ''}
        <div class="actions">
          <button type="button" class="btn btn--primary" id="copy-btn" data-copy-artifact title="Copy (c)">${raw(icon('copy'))} <span>Copy</span></button>
          <details class="menu menu--right" id="download-menu">
            <summary class="btn">${raw(icon('download'))} Download</summary>
            <ul class="menu__list">
              <li><a class="menu__item" href="${a.downloadUrl}" download="${a.downloadName}">${raw(icon('download'))} ${a.downloadName} <span class="menu__hint">${a.isFolder ? 'entry file only' : 'install-ready file'}</span></a></li>
              ${a.zipUrl ? html`<li><a class="menu__item" href="${a.zipUrl}" download="${a.id}.zip">${raw(icon('download'))} ${a.id}.zip <span class="menu__hint">${a.files.length} files</span></a></li>` : ''}
            </ul>
          </details>
          ${openIn.length ? html`<details class="menu menu--right" id="open-in-menu">
            <summary class="btn">${raw(icon('external'))} Open in</summary>
            <ul class="menu__list">
              <li class="menu__label">Opens with the filled-in prompt</li>
              ${openIn.map((o) => html`<li><a class="menu__item" href="#" data-open-in="${o.id}" target="_blank" rel="noopener noreferrer">${raw(icon('external'))} ${o.label}</a></li>`)}
              <li class="menu__hint">Long prompts may exceed what the app accepts in a link; copy instead.</li>
            </ul>
          </details>` : ''}
          ${a.installTargets.length ? html`<a class="btn" href="#install" data-open-install>${raw(icon('download'))} ${['prompt', 'system-prompt'].includes(a.type) ? 'Where to put it' : 'Install'}</a>` : ''}
          ${model.cfg.ai.enabled ? html`<button type="button" class="btn" id="send-to-ai-btn" data-open-ai>${raw(icon('send'))} Send to AI</button>` : ''}
        </div>
      </div>
      <div class="prompt__body" id="prompt-body" data-wrap="true">
        ${variantBlock(a, '', a.body, false)}
        ${a.variants.map((v) => variantBlock(a, v.for, v.body, true))}
      </div>
      ${a.variables.length ? html`<div class="var-legend" id="var-legend"><span class="visually-hidden">Fill-in fields:</span><ul>${a.variables.map((v) => html`<li><button type="button" class="btn-link" data-focus-var="${v.name}"><code>${v.name}</code></button> — ${v.description}${v.default !== undefined && v.default !== '' ? html` <span class="field__hint">(default: ${String(v.default)})</span>` : ''}</li>`)}</ul></div>` : ''}
      <details class="prompt__fallback" id="prompt-fallback">
        <summary>Plain text (select all and copy)</summary>
        <textarea class="textarea" readonly rows="12" aria-label="Plain text of the artefact with default values">${defaultText}</textarea>
      </details>
    </section>

    ${a.why_it_works ? html`<section class="section-card why" aria-labelledby="why-title"><h2 id="why-title">Why this works</h2><div class="prose">${raw(renderMarkdown(a.why_it_works))}</div></section>` : ''}
    ${a.exampleOutput ? html`<details class="section-card" id="example-output"><summary><h2>Example output</h2></summary><div class="prose">${raw(renderMarkdown(a.exampleOutput))}</div></details>` : ''}
    ${installSection(model, a)}
    ${a.isFolder ? html`<details class="section-card"><summary><h2>Files in this folder (${a.files.length})</h2></summary><ul class="file-list">${a.files.map((f) => html`<li>${f.path}</li>`)}</ul></details>` : ''}
    ${model.cfg.ai.enabled ? html`<section class="ai-panel" id="ai-panel" data-artifact-type="${a.type}" aria-labelledby="ai-title" hidden></section>` : ''}
    ${a.history?.length ? html`<details class="section-card"><summary><h2>History</h2></summary><ul class="changelog">${a.history.slice(0, 20).map((h) => html`<li><time datetime="${h.date}">${formatDate(h.date)}</time><span>${h.version ? html`<strong>${h.version}</strong> — ` : ''}${h.note}${h.author ? html` <span class="field__hint">(${h.author})</span>` : ''}</span></li>`)}</ul></details>` : ''}

    <footer class="artifact__footer-links">
      ${links.enabled ? html`<a href="${a.sourceUrl}" rel="noopener">${raw(icon('gitlab'))} View source</a>` : ''}
      ${links.enabled && model.cfg.features.feedback_links ? html`<a href="${a.editUrl}" rel="noopener" title="Opens the GitLab web editor. Choose “Create a new branch” when you commit.">${raw(icon('edit'))} Suggest an edit</a>` : ''}
      ${links.enabled && model.cfg.features.feedback_links ? html`<a href="${a.issueUrl}" rel="noopener">${raw(icon('flag'))} Report a problem</a>` : ''}
      <a href="${a.downloadUrl}" download>${raw(icon('download'))} Download</a>
      <button type="button" class="btn-link" data-copy-text="${model.cfg.site.url ? `${model.cfg.site.url}${a.url.replace(new RegExp(`^${model.base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '/')}` : a.url}" data-copy-label="Link copied">${raw(icon('link'))} Copy link</button>
    </footer>
  </article>

  <aside class="artifact-aside" aria-label="About this artefact">
    <div class="aside-card"><h2>Details</h2>
      <dl class="meta-list">
        <dt>Type</dt><dd>${a.typeLabel}</dd>
        <dt>Difficulty</dt><dd>${DIFFICULTY_LABELS[a.difficulty]}</dd>
        ${a.roles.length ? html`<dt>For</dt><dd>${a.roles.map((r) => model.label('roles', r)).join(', ')}</dd>` : ''}
        <dt>Models</dt><dd>${a.modelLabels.join(', ')}</dd>
        ${a.assistants.length ? html`<dt>Assistants</dt><dd>${a.assistantLabels.join(', ')}</dd>` : ''}
        ${a.tags.length ? html`<dt>Tags</dt><dd>${a.tags.map((t) => html`<a href="${u(`browse/?q=${encodeURIComponent(t)}`)}">${t}</a>`).reduce((acc, x, i) => (i ? [...acc, ', ', x] : [x]), [])}</dd>` : ''}
        <dt>Created</dt><dd><time datetime="${a.created}">${formatDate(a.created)}</time></dd>
        <dt>Length</dt><dd>${a.wordCount} words</dd>
        <dt>Id</dt><dd><code>${a.id}</code></dd>
      </dl>
    </div>
    ${a.relatedArtifacts.length ? html`<div class="aside-card"><h2>Related</h2><ul>${a.relatedArtifacts.map((r) => html`<li><a href="${r.url}">${r.title}</a> <span class="badge badge--type">${r.type}</span></li>`)}</ul></div>` : ''}
    ${a.collections.length ? html`<div class="aside-card"><h2>In collections</h2><ul>${a.collections.map((c) => html`<li><a href="${c.url}">${c.title}</a></li>`)}</ul></div>` : ''}
  </aside>
  </div>
</div>
<script type="application/json" id="artifact-data">${raw(jsonForScript(data))}</script>`;
  return {
    path: `/library/${a.id}/`,
    html: page({ model, assets, title: a.title, description: a.summary, body, bodyClass: 'page-artifact', current: 'browse', scripts: ['artifact'], path: a.url })
  };
}

export function artifactPages(model, assets) {
  return model.artifacts.map((a) => artifactPage(model, assets, a));
}
