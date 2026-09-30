// Turns validated content into the site model every page and output file is rendered from.
import yaml from 'js-yaml';
import { FORMAT_EXT } from './content.js';
import { contentLinks } from './config.js';
import { TYPE_ORDER, TYPE_LABELS, TYPE_PLURALS } from '../../src/shared/text.js';
import { findPlaceholders } from '../../src/shared/variables.js';

const byId = (list) => new Map((list || []).map((x) => [x.id, x]));

function derivedInstallFrontmatter(a) {
  if (a.install_frontmatter) return a.install_frontmatter;
  if (['skill', 'agent'].includes(a.type)) return { name: a.id, description: a.summary };
  if (a.type === 'command') return { description: a.summary };
  return null;
}

export function installText(a) {
  const fm = derivedInstallFrontmatter(a);
  if (!fm || a.format !== 'markdown') return `${a.body}\n`;
  const y = yaml.dump(fm, { lineWidth: -1, noRefs: true }).trimEnd();
  return `---\n${y}\n---\n${a.body}\n`;
}

function fillPath(tpl, id) {
  return String(tpl).replace(/\{id\}/g, id);
}

export function buildModel(content, cfg, { histories = null, now = new Date() } = {}) {
  const base = cfg.site.base_path;
  const u = (p = '') => `${base}${String(p).replace(/^\//, '')}`;
  const links = contentLinks(cfg);
  const tax = content.taxonomy;
  const maps = { models: byId(tax.models), assistants: byId(tax.assistants), categories: byId(tax.categories), roles: byId(tax.roles) };
  const label = (axis, id) => maps[axis].get(id)?.label || id;
  const artifactsById = byId(content.artifacts);

  const collections = content.collections
    .map((c) => ({ ...c, url: u(`collections/${c.id}/`), artifacts: c.items.map((id) => artifactsById.get(id)).filter(Boolean) }))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title));
  const collectionsByArtifact = new Map();
  for (const c of collections) for (const id of c.items) {
    if (!collectionsByArtifact.has(id)) collectionsByArtifact.set(id, []);
    collectionsByArtifact.get(id).push(c);
  }

  const artifacts = content.artifacts.map((a) => {
    const ext = FORMAT_EXT[a.format || 'markdown'] || '.md';
    const format = a.format || 'markdown';
    const entryPath = a.path;
    const historyKey = `${content.rootRel}/${entryPath}`.replace(/\/{2,}/g, '/');
    let history = null;
    if (histories) {
      const h = histories.get(historyKey) || histories.get(entryPath);
      if (h && h.length) history = h.map((c) => ({ date: c.date, note: c.subject, hash: c.hash, author: c.author }));
    }
    if (!history && Array.isArray(a.changelog) && a.changelog.length) history = a.changelog.map((c) => ({ date: c.date, note: c.note, version: c.version }));
    const installTargets = [];
    for (const asst of tax.assistants) {
      const tpl = asst.install?.[a.type];
      if (!tpl) continue;
      installTargets.push({
        assistant: asst.id, label: asst.label, path: fillPath(tpl, a.id), isFolder: /\/$/.test(tpl),
        note: asst.install_note || '', primary: (a.assistants || []).includes(asst.id)
      });
    }
    installTargets.sort((x, y) => Number(y.primary) - Number(x.primary) || x.label.localeCompare(y.label));
    const variants = (a.variants || []).map((v) => ({
      for: v.for, label: v.label || label(maps.models.has(v.for) ? 'models' : 'assistants', v.for), body: v.body, file: v.file
    }));
    return {
      ...a,
      format,
      license: a.license || cfg.site.default_license,
      tags: a.tags || [], assistants: a.assistants || [], roles: a.roles || [], requires: a.requires || [], tested_on: a.tested_on || [],
      related: a.related || [], variables: a.variables || [],
      variants,
      url: u(`library/${a.id}/`),
      downloadName: `${a.id}${ext}`,
      downloadUrl: u(`downloads/${a.id}${ext}`),
      zipUrl: a.isFolder ? u(`downloads/${a.id}.zip`) : null,
      installText: installText({ ...a, format }),
      sourceUrl: links.view(entryPath),
      editUrl: links.edit(entryPath),
      issueUrl: links.issue(`Problem with "${a.title}" (${a.id})`, `Artefact: ${a.id}\nFile: ${content.rootRel}/${entryPath}\n\nWhat is wrong:\n\n\nWhat you expected:\n`),
      history,
      installTargets,
      collections: (collectionsByArtifact.get(a.id) || []).map((c) => ({ id: c.id, title: c.title, url: c.url })),
      placeholders: findPlaceholders(a.body),
      wordCount: a.body.split(/\s+/).filter(Boolean).length,
      typeLabel: TYPE_LABELS[a.type] || a.type,
      modelLabels: a.models.map((m) => label('models', m)),
      assistantLabels: (a.assistants || []).map((m) => label('assistants', m)),
      categoryLabels: a.categories.map((m) => label('categories', m))
    };
  });
  const enrichedById = byId(artifacts);
  for (const a of artifacts) a.relatedArtifacts = a.related.map((id) => enrichedById.get(id)).filter(Boolean).map((r) => ({ id: r.id, title: r.title, type: r.type, url: r.url, summary: r.summary, difficulty: r.difficulty }));
  for (const c of collections) c.artifacts = c.items.map((id) => enrichedById.get(id)).filter(Boolean);

  const count = (axis) => {
    const m = new Map();
    for (const a of artifacts) for (const v of axis(a)) m.set(v, (m.get(v) || 0) + 1);
    return m;
  };
  const counts = {
    type: count((a) => [a.type]),
    model: count((a) => a.models),
    assistant: count((a) => a.assistants),
    category: count((a) => a.categories),
    difficulty: count((a) => [a.difficulty]),
    role: count((a) => a.roles),
    status: count((a) => [a.status])
  };
  const axes = {
    type: TYPE_ORDER.map((t) => ({ id: t, label: TYPE_LABELS[t], plural: TYPE_PLURALS[t], count: counts.type.get(t) || 0 })),
    model: tax.models.map((m) => ({ id: m.id, label: m.label, vendor: m.vendor || '', icon: m.icon || '', description: m.description || '', count: counts.model.get(m.id) || 0 })),
    assistant: tax.assistants.map((m) => ({ id: m.id, label: m.label, vendor: m.vendor || '', icon: m.icon || '', description: m.description || '', count: counts.assistant.get(m.id) || 0, open_url_template: m.open_url_template || '', open_url_max_length: m.open_url_max_length || 8000, docs_url: m.docs_url || '' })),
    category: [...tax.categories].sort((a, b) => (a.order ?? 99) - (b.order ?? 99)).map((m) => ({ id: m.id, label: m.label, description: m.description || '', count: counts.category.get(m.id) || 0 })),
    difficulty: ['beginner', 'intermediate', 'advanced'].map((d) => ({ id: d, label: d[0].toUpperCase() + d.slice(1), count: counts.difficulty.get(d) || 0 })),
    role: tax.roles.map((r) => ({ id: r.id, label: r.label, description: r.description || '', count: counts.role.get(r.id) || 0 })),
    status: ['reviewed', 'draft', 'deprecated'].map((s) => ({ id: s, label: s[0].toUpperCase() + s.slice(1), count: counts.status.get(s) || 0 }))
  };

  const sorted = (key, filter = () => true) => artifacts.filter(filter).sort((a, b) => (b[key] || '').localeCompare(a[key] || '') || a.title.localeCompare(b.title));
  const learn = content.learn.map((l) => ({ ...l, url: u(`learn/${l.slug}/`) }));
  return {
    cfg, base, u, links, now,
    taxonomy: tax, maps, label, axes, counts,
    artifacts, artifactsById: enrichedById, collections, learn,
    startHere: collections.find((c) => c.start_here) || null,
    recentAdded: sorted('created').slice(0, 8),
    recentUpdated: sorted('updated', (a) => a.updated && a.updated !== a.created).slice(0, 8),
    openInAssistants: tax.assistants.filter((a) => a.open_url_template).map((a) => ({ id: a.id, label: a.label, template: a.open_url_template, maxLength: a.open_url_max_length || 8000 }))
  };
}

// The machine-readable catalogue.
export function toIndexJson(model, { buildId }) {
  const strip = (a) => ({
    id: a.id, title: a.title, summary: a.summary, type: a.type, format: a.format, models: a.models, assistants: a.assistants,
    categories: a.categories, tags: a.tags, roles: a.roles, difficulty: a.difficulty, variables: a.variables, requires: a.requires,
    why_it_works: a.why_it_works || '', author: a.author || '', source: a.source || '', license: a.license, version: a.version,
    created: a.created, updated: a.updated, status: a.status, tested_on: a.tested_on, related: a.related,
    variants: a.variants.map((v) => ({ for: v.for, label: v.label, body: v.body })),
    body: a.body, path: a.path, is_folder: a.isFolder, files: a.isFolder ? a.files.map((f) => f.path) : [],
    url: a.url, download_url: a.downloadUrl, zip_url: a.zipUrl, source_url: a.sourceUrl, edit_url: a.editUrl,
    collections: a.collections.map((c) => c.id), word_count: a.wordCount, install_targets: a.installTargets.map(({ assistant, path, isFolder }) => ({ assistant, path, is_folder: isFolder }))
  });
  return {
    generated: model.now.toISOString(),
    build_id: buildId,
    site: { name: model.cfg.site.name, url: model.cfg.site.url, base_path: model.base },
    content: { mode: model.cfg.content.mode, host: model.cfg.content.host, project: model.cfg.content.project, branch: model.cfg.content.branch, root: model.cfg.content.root },
    taxonomy: {
      models: model.axes.model, assistants: model.axes.assistant.map(({ open_url_template, open_url_max_length, ...a }) => a),
      categories: model.axes.category, roles: model.axes.role, types: model.axes.type, difficulties: model.axes.difficulty, statuses: model.axes.status
    },
    open_in: model.openInAssistants,
    collections: model.collections.map((c) => ({ id: c.id, title: c.title, description: c.description, audience: c.audience || '', start_here: Boolean(c.start_here), items: c.items, url: c.url })),
    learn: model.learn.map((l) => ({ slug: l.slug, title: l.title, summary: l.summary, url: l.url })),
    artifacts: model.artifacts.map(strip)
  };
}
