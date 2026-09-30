import { html, raw } from '../../scripts/lib/html.js';
import { page } from './layout.js';
import { codeBlock, notice } from './partials.js';
import { TYPE_LABELS, TYPE_ORDER } from '../shared/text.js';

const FOLDER_FOR_TYPE = { prompt: 'prompts', 'system-prompt': 'system-prompts', skill: 'skills', rule: 'rules', agent: 'agents', command: 'commands', hook: 'hooks', mcp: 'mcp', plugin: 'plugins', workflow: 'workflows' };

export const TEMPLATE = `---
id: my-prompt                      # unique slug: lowercase letters, digits, hyphens
title: My prompt                   # what it does, in plain words
summary: >                         # one paragraph; the first thing people read
  What this does and when to use it.
type: prompt                       # prompt | system-prompt | skill | rule | agent | command | hook | mcp | plugin | workflow
format: markdown                   # markdown | xml | json | yaml | text
models: [any]                      # ids from taxonomy.yml; 'any' = model-agnostic
assistants: [chat-app]             # ids from taxonomy.yml; omit for chat-only
categories: [getting-started]      # 1-5 ids from taxonomy.yml
tags: []
roles: [everyone]                  # ids from taxonomy.yml
difficulty: beginner               # beginner | intermediate | advanced
variables:                         # optional; each appears in the body as {{name}}
  - name: topic
    description: What the prompt should work on
    default: ""
# requires: ["Something the reader needs first"]
# example_output: examples/my-prompt.md
# why_it_works: One to three sentences for learners.
author: Your Name
license: CC0-1.0
version: 1.0.0
created: 2026-01-01
updated: 2026-01-01
status: draft                      # draft | reviewed | deprecated
tested_on: []
related: []
---
Write the prompt here. Use {{topic}} where the reader should fill something in.
`;

export function contributePage(model, assets) {
  const links = model.links;
  const root = model.cfg.content.root;
  const body = html`<div class="container container--narrow">
  <div class="page-intro"><h1>Contribute</h1><p>Artefacts are plain files in the content repository. Add one with a merge request; the site rebuilds itself a few minutes after it is merged.</p></div>

  ${links.enabled ? '' : notice('info', html`This site was built without a content repository address, so the deep links below are disabled. Set <code>content.project</code> in <code>site.config.yml</code>.`)}

  <section class="prose">
    <h2>1. Pick a type and a folder</h2>
    <p>One artefact per file (or per folder for skills and plugins) under <code>${root}/</code>:</p>
    <table class="table">
      <thead><tr><th>Type</th><th>Folder</th><th></th></tr></thead>
      <tbody>${TYPE_ORDER.map((t) => html`<tr><td>${TYPE_LABELS[t]}</td><td><code>${root}/${FOLDER_FOR_TYPE[t]}/</code></td><td>${links.enabled ? html`<a href="${links.newFile(FOLDER_FOR_TYPE[t], ['skill', 'plugin'].includes(t) ? `my-${t}/${t === 'skill' ? 'SKILL' : 'README'}.md` : `my-${t}.md`)}" rel="noopener">New file in GitLab ↗</a>` : ''}</td></tr>`)}</tbody>
    </table>
    <h2>2. Copy the template</h2>
    <p>Every entry file starts with YAML frontmatter, then the artefact itself. Ids for <code>models</code>, <code>assistants</code>, <code>categories</code> and <code>roles</code> must exist in <code>${root}/taxonomy.yml</code>. The build checks all of this and tells you exactly what to fix.</p>
  </section>
  ${codeBlock(TEMPLATE, { label: 'my-prompt.md' })}
  <section class="prose">
    <p>Templates for every type live in <code>templates/</code> in the content repository${links.enabled ? html` (<a href="${links.repo}/-/tree/${model.cfg.content.branch}/templates" rel="noopener">open ↗</a>)` : ''}. Fill-in fields are explained in <a href="${model.u('learn/variables/')}">Learn: variables</a>.</p>
    <h2>3. Test it, then open a merge request</h2>
    <ul>
      <li>Try the artefact on at least one real model and record it under <code>tested_on</code>.</li>
      <li>Save a good reply under <code>examples/</code> and point <code>example_output</code> at it, if you can.</li>
      <li>Keep <code>status: draft</code>; a maintainer sets <code>reviewed</code> after trying it.</li>
      <li>Never include secrets, internal hostnames or personal data. The pipeline scans for them.</li>
    </ul>
    <p>The merge request pipeline validates the schema, ids, taxonomy, links and size, and fails with a readable message if anything is off.</p>
    ${links.enabled ? html`<p class="btn-row"><a class="btn btn--primary" href="${links.repo}" rel="noopener">Open the content repository ↗</a> <a class="btn" href="${links.repo}/-/blob/${model.cfg.content.branch}/CONTRIBUTING.md" rel="noopener">CONTRIBUTING.md ↗</a> <a class="btn" href="${links.repo}/-/issues/new" rel="noopener">Suggest an idea ↗</a></p>` : ''}
    <h2>Changing an existing artefact</h2>
    <p>Use <strong>Suggest an edit</strong> at the bottom of any artefact page. Bump <code>version</code> (patch for wording, minor for behaviour, major for a rewrite) and set <code>updated</code> to today.</p>
    <h2>Machine access</h2>
    <p>Everything is also available as <a href="${model.u('index.json')}"><code>index.json</code></a> (the full catalogue with bodies), an <a href="${model.u('feed.xml')}">RSS feed</a> and per-artefact downloads under <code>downloads/</code>.</p>
  </section>
</div>`;
  return { path: '/contribute/', html: page({ model, assets, title: 'Contribute', description: 'How to add or improve an artefact.', body, bodyClass: 'page-contribute', current: 'contribute', path: model.u('contribute/') }) };
}
