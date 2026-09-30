import { html, raw } from '../../scripts/lib/html.js';
import { page } from './layout.js';
import { cardList, sectionHead, axisTiles } from './partials.js';
import { icon } from '../shared/icons.js';

export function homePage(model, assets) {
  const u = model.u;
  const start = model.startHere;
  const learnLinks = model.learn.slice(0, 2);
  const body = html`<div class="container">
  <section class="hero">
    <h1 class="hero__title">${model.cfg.site.tagline || model.cfg.site.name}</h1>
    <p class="hero__tagline">${model.artifacts.length} prompts, system prompts, skills, rules and assistant configs, tested and ready to paste. Pick one, fill in the blanks, copy.</p>
    <form class="hero__search" role="search" action="${u('browse/')}" method="get">
      <div class="search-box search-box--large">
        ${raw(icon('search', 'search-box__icon'))}
        <input class="search-box__input" id="home-search" type="search" name="q" placeholder="What do you want to do? e.g. review code, explain an error…" aria-label="Search the library" autocomplete="off" spellcheck="false" autofocus>
        <span class="search-box__hint" aria-hidden="true"><kbd>/</kbd></span>
      </div>
    </form>
    <p class="hero__hints"><span>Try:</span>
      ${['security review', 'explain error', 'commit message', 'tutor', 'skill'].map((q) => html`<a href="${u(`browse/?q=${encodeURIComponent(q)}`)}">${q}</a>`)}
    </p>
  </section>

  ${start ? html`<section class="start-here" id="start-here" data-start-here aria-labelledby="start-here-title">
    <div class="start-here__head">
      <div><h2 id="start-here-title">${start.title}</h2><p>${start.description}</p></div>
      <button type="button" class="btn btn--sm btn--ghost" id="start-here-toggle" aria-expanded="true" aria-controls="start-here-body">Hide</button>
    </div>
    <div class="start-here__body" id="start-here-body">
      ${cardList(start.artifacts.slice(0, 8), model, { extraClass: 'cards--compact', label: start.title })}
      <p class="start-here__learn">New to this? ${learnLinks.map((l) => html`<a href="${l.url}">${l.title}</a>`)} <a href="${start.url}">See the whole collection →</a></p>
    </div>
  </section>` : ''}

  <section class="section" aria-labelledby="by-type">
    ${sectionHead('Browse by type', { level: 2, sub: 'What kind of thing you need.', moreHref: u('browse/'), moreLabel: 'Browse everything' })}
    ${axisTiles(model, 'type')}
  </section>
  <section class="section" aria-labelledby="by-assistant">
    ${sectionHead('By coding assistant', { sub: 'Skills, rules, commands and hooks written for a specific tool.' })}
    ${axisTiles(model, 'assistant')}
  </section>
  <section class="section" aria-labelledby="by-model">
    ${sectionHead('By model', { sub: '"Any model" artefacts work everywhere.' })}
    ${axisTiles(model, 'model')}
  </section>
  <section class="section" aria-labelledby="by-category">
    ${sectionHead('By category')}
    ${axisTiles(model, 'category')}
  </section>

  ${model.recentAdded.length ? html`<section class="section">
    ${sectionHead('Recently added', { moreHref: u('browse/?sort=newest'), moreLabel: 'All, newest first' })}
    ${cardList(model.recentAdded.slice(0, 6), model, { extraClass: 'cards--compact', label: 'Recently added' })}
  </section>` : ''}
  ${model.recentUpdated.length ? html`<section class="section">
    ${sectionHead('Recently updated', { moreHref: u('browse/?sort=updated'), moreLabel: 'All, by update' })}
    ${cardList(model.recentUpdated.slice(0, 6), model, { extraClass: 'cards--compact', label: 'Recently updated' })}
  </section>` : ''}
</div>`;
  return { path: '/', html: page({ model, assets, title: '', description: model.cfg.site.tagline, body, bodyClass: 'page-home', current: 'home', path: model.base }) };
}
