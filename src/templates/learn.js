import { html, raw } from '../../scripts/lib/html.js';
import { page } from './layout.js';
import { renderMarkdown } from '../../scripts/lib/markdown.js';

function learnNav(model, current) {
  return html`<nav class="learn-nav" aria-label="Lessons"><ol>${model.learn.map((l) => html`<li><a href="${l.url}"${current === l.slug ? raw(' aria-current="page"') : ''}>${l.title}</a></li>`)}</ol></nav>`;
}

export function learnIndex(model, assets) {
  const body = html`<div class="container container--narrow">
  <div class="page-intro"><h1>Learn</h1><p>Short guides for people who have never written a prompt, and for engineers who want to know which artefact type to reach for.</p></div>
  <ol class="ordered-cards">
    ${model.learn.map((l) => html`<li><a class="collection-card" href="${l.url}"><h2>${l.title}</h2><p>${l.summary}</p></a></li>`)}
  </ol>
</div>`;
  return { path: '/learn/', html: page({ model, assets, title: 'Learn', description: 'Guides to prompts, system prompts, variables, skills and rules.', body, bodyClass: 'page-learn', current: 'learn', path: model.u('learn/') }) };
}

export function learnPage(model, assets, l, i) {
  const prev = model.learn[i - 1], next = model.learn[i + 1];
  const body = html`<div class="container">
  <div class="learn-layout">
    ${learnNav(model, l.slug)}
    <article class="prose" aria-labelledby="learn-title">
      <h1 id="learn-title">${l.title}</h1>
      ${raw(renderMarkdown(l.body))}
      <nav class="learn-pager" aria-label="Lesson navigation">
        <span>${prev ? html`<a href="${prev.url}">← ${prev.title}</a>` : ''}</span>
        <span>${next ? html`<a href="${next.url}">${next.title} →</a>` : html`<a href="${model.u('browse/')}">Browse the library →</a>`}</span>
      </nav>
    </article>
  </div>
</div>`;
  return { path: `/learn/${l.slug}/`, html: page({ model, assets, title: l.title, description: l.summary, body, bodyClass: 'page-learn', current: 'learn', path: l.url }) };
}

export function learnPages(model, assets) {
  return [learnIndex(model, assets), ...model.learn.map((l, i) => learnPage(model, assets, l, i))];
}
