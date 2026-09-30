// Result card markup, identical on the server (pre-render) and in the browser (live filtering).
import { escapeHtml, formatDate, TYPE_LABELS, DIFFICULTY_LABELS, STATUS_LABELS } from './text.js';
import { icon } from './icons.js';

const MAX_TARGETS = 3;

function targetBadges(ids, labels, base, axis) {
  const shown = ids.slice(0, MAX_TARGETS);
  const rest = ids.length - shown.length;
  return shown.map((id) => `<a class="badge badge--outline" href="${base}browse/${axis}/${escapeHtml(id)}/" title="${escapeHtml(axis === 'assistant' ? 'Assistant' : 'Model')}: ${escapeHtml(labels[id] || id)}">${escapeHtml(labels[id] || id)}</a>`).join('')
    + (rest > 0 ? `<span class="badge badge--outline" title="${escapeHtml(ids.slice(MAX_TARGETS).map((i) => labels[i] || i).join(', '))}">+${rest}</span>` : '');
}

export function renderCard(a, ctx = {}) {
  const base = ctx.base || '/';
  const labels = ctx.labels || { models: {}, assistants: {}, categories: {} };
  const url = a.url || `${base}library/${a.id}/`;
  const fav = Boolean(ctx.favourite);
  const showActions = ctx.showActions !== false;
  const assistants = a.assistants || [];
  const models = (a.models || []).filter((m) => m !== 'any');
  const hasVars = (a.variables || []).length > 0;
  return `<li class="card" data-result data-id="${escapeHtml(a.id)}" data-url="${escapeHtml(url)}"${ctx.index !== undefined ? ` data-index="${ctx.index}"` : ''}>
  <div class="card__head">
    <h3 class="card__title"><a href="${escapeHtml(url)}">${escapeHtml(a.title)}</a></h3>
    ${showActions ? `<div class="card__actions">
      ${ctx.showFav !== false ? `<button type="button" class="icon-btn btn-fav" data-fav-id="${escapeHtml(a.id)}" aria-pressed="${fav}" aria-label="${fav ? 'Remove from favourites' : 'Add to favourites'}: ${escapeHtml(a.title)}" title="Favourite (f)">${icon(fav ? 'starFilled' : 'star')}</button>` : ''}
      <button type="button" class="icon-btn btn-copy" data-copy-id="${escapeHtml(a.id)}" aria-label="Copy ${escapeHtml(a.title)} with default values" title="Copy with defaults (c)">${icon('copy')}</button>
    </div>` : ''}
  </div>
  <p class="card__summary">${escapeHtml(a.summary)}</p>
  ${ctx.snippet ? `<p class="card__snippet">${ctx.snippet}</p>` : ''}
  <div class="card__badges">
    <a class="badge badge--type" href="${base}browse/type/${escapeHtml(a.type)}/">${escapeHtml(TYPE_LABELS[a.type] || a.type)}</a>
    <span class="badge badge--difficulty-${escapeHtml(a.difficulty)}">${escapeHtml(DIFFICULTY_LABELS[a.difficulty] || a.difficulty)}</span>
    ${a.status && a.status !== 'reviewed' ? `<span class="badge badge--status-${escapeHtml(a.status)}">${escapeHtml(STATUS_LABELS[a.status] || a.status)}</span>` : ''}
    ${assistants.length ? `<span class="card__targets">${targetBadges(assistants, labels.assistants, base, 'assistant')}</span>` : ''}
    ${models.length ? `<span class="card__targets">${targetBadges(models, labels.models, base, 'model')}</span>` : ''}
  </div>
  <div class="card__meta">
    <span>Updated <time datetime="${escapeHtml(a.updated)}">${escapeHtml(formatDate(a.updated))}</time></span>
    ${hasVars ? `<span title="Has fill-in fields">${a.variables.length} fill-in ${a.variables.length === 1 ? 'field' : 'fields'}</span>` : ''}
    ${a.is_folder || a.isFolder ? '<span>Folder (zip)</span>' : ''}
  </div>
</li>`;
}

export function renderCards(list, ctx = {}) {
  return list.map((a, i) => renderCard(a, { ...ctx, index: i, favourite: ctx.favourites ? ctx.favourites.has(a.id) : false, snippet: ctx.snippets ? ctx.snippets.get(a.id) : null })).join('\n');
}
