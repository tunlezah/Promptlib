// Reads the content repo from disk into plain objects. Collects problems instead of throwing so the
// validator can report everything at once.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { parseFrontmatter, ContentError } from './frontmatter.js';

export const ENTRY_CANDIDATES = ['SKILL.md', 'README.md', 'index.md'];
const RESERVED_DIRS = new Set(['collections', 'learn']);
const IGNORED_NAMES = new Set(['.git', 'node_modules', '.DS_Store', 'Thumbs.db']);

export const FORMAT_EXT = { markdown: '.md', xml: '.xml', json: '.json', yaml: '.yml', text: '.txt' };

const posix = (p) => p.split(path.sep).join('/');

function readYaml(abs, rel, errors) {
  try {
    return yaml.load(fs.readFileSync(abs, 'utf8'), { schema: yaml.CORE_SCHEMA, filename: rel }) ?? {};
  } catch (e) {
    errors.push({ file: rel, message: `Not valid YAML: ${e.reason || e.message}${e.mark ? ` (line ${e.mark.line + 1})` : ''}` });
    return null;
  }
}

// All files under dir (recursive), relative posix paths. Dotfiles included, .git excluded.
export function listFiles(absDir, relBase = '') {
  const out = [];
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (IGNORED_NAMES.has(ent.name)) continue;
    const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) out.push(...listFiles(abs, rel));
    else if (ent.isFile()) out.push({ path: rel, abs, size: fs.statSync(abs).size });
  }
  return out;
}

function findEntryFile(absDir) {
  const names = fs.readdirSync(absDir);
  const candidates = [...ENTRY_CANDIDATES, `${path.basename(absDir)}.md`];
  for (const c of candidates) {
    if (!names.includes(c)) continue;
    const text = fs.readFileSync(path.join(absDir, c), 'utf8');
    if (/^(﻿)?---[ \t]*\r?\n/.test(text)) return c;
  }
  return null;
}

function makeArtifact({ root, entryRel, folderRel, errors }) {
  const abs = path.join(root, entryRel);
  const text = fs.readFileSync(abs, 'utf8');
  let fm;
  try {
    fm = parseFrontmatter(text, entryRel);
  } catch (e) {
    errors.push({ file: entryRel, message: e.message });
    return null;
  }
  if (!fm.hasFrontmatter) return null;
  const dir = path.posix.dirname(entryRel);
  const art = {
    ...fm.data,
    body: fm.body.replace(/^\r?\n/, '').replace(/\s+$/, ''),
    path: entryRel,
    dir,
    entryFile: path.posix.basename(entryRel),
    isFolder: Boolean(folderRel),
    folder: folderRel || null,
    files: [],
    bodyBytes: Buffer.byteLength(fm.body, 'utf8'),
    frontmatterRaw: fm.raw
  };
  if (folderRel) {
    art.files = listFiles(path.join(root, folderRel)).map((f) => ({ ...f, abs: undefined, absPath: f.abs }));
  }
  // Resolve support files relative to the entry file's folder.
  const resolveRel = (rel, field) => {
    if (typeof rel !== 'string' || !rel) return null;
    const target = path.posix.normalize(path.posix.join(dir, rel));
    if (target.startsWith('..')) { errors.push({ file: entryRel, field, message: `${field} must stay inside the content root (got ${rel})` }); return null; }
    const targetAbs = path.join(root, target);
    if (!fs.existsSync(targetAbs) || !fs.statSync(targetAbs).isFile()) {
      errors.push({ file: entryRel, field, message: `${field} points to ${rel}, which does not exist (looked for ${target})` });
      return null;
    }
    return { rel: target, text: fs.readFileSync(targetAbs, 'utf8') };
  };
  if (art.example_output) {
    const r = resolveRel(art.example_output, 'example_output');
    art.exampleOutput = r ? r.text.trim() : null;
    art.exampleOutputPath = r ? r.rel : null;
  }
  if (Array.isArray(art.variants)) {
    art.variants = art.variants.map((v, i) => {
      if (!v || typeof v !== 'object') return v;
      const r = resolveRel(v.file, `variants[${i}].file`);
      return { ...v, body: r ? r.text.replace(/\s+$/, '') : '', resolvedPath: r ? r.rel : null };
    });
  }
  return art;
}

// Walk the root. Top-level *.md files with frontmatter are artefacts; a folder with an entry file is a folder
// artefact (not descended further); any other folder is descended. collections/, learn/ and taxonomy.yml are reserved.
export function walkArtifacts(root, errors) {
  const artifacts = [];
  const visit = (relDir) => {
    const absDir = relDir ? path.join(root, relDir) : root;
    for (const ent of fs.readdirSync(absDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (IGNORED_NAMES.has(ent.name) || ent.name.startsWith('.')) continue;
      const rel = relDir ? `${relDir}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        if (!relDir && RESERVED_DIRS.has(ent.name)) continue;
        const entry = findEntryFile(path.join(root, rel));
        if (entry) {
          const art = makeArtifact({ root, entryRel: `${rel}/${entry}`, folderRel: rel, errors });
          if (art) artifacts.push(art);
        } else {
          visit(rel);
        }
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.md')) {
        if (!relDir) continue; // README.md at the root is documentation, not an artefact
        const art = makeArtifact({ root, entryRel: rel, folderRel: null, errors });
        if (art) artifacts.push(art);
      }
    }
  };
  visit('');
  return artifacts;
}

export function loadCollections(root, errors) {
  const dir = path.join(root, 'collections');
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (!/\.ya?ml$/i.test(name)) continue;
    const rel = `collections/${name}`;
    const data = readYaml(path.join(dir, name), rel, errors);
    if (data) out.push({ ...data, path: rel });
  }
  return out;
}

export function loadLearn(root, errors) {
  const dir = path.join(root, 'learn');
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.toLowerCase().endsWith('.md')) continue;
    const rel = `learn/${name}`;
    try {
      const fm = parseFrontmatter(fs.readFileSync(path.join(dir, name), 'utf8'), rel);
      const slug = name.replace(/\.md$/i, '');
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) errors.push({ file: rel, message: 'Learn page file names must be lowercase slugs (letters, digits, hyphens)' });
      const data = fm.data || {};
      if (!data.title) errors.push({ file: rel, field: 'title', message: 'Learn pages need a title in their frontmatter' });
      out.push({ slug, title: data.title || slug, summary: data.summary || '', order: Number(data.order ?? 999), body: fm.body, path: rel });
    } catch (e) {
      errors.push({ file: rel, message: e.message });
    }
  }
  return out.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function loadContent(cfg) {
  const root = cfg.paths.contentRoot;
  const errors = [];
  const warnings = [];
  const result = { root, contentDir: cfg.paths.content, rootRel: cfg.content.root, taxonomy: null, artifacts: [], collections: [], learn: [], errors, warnings };
  if (!fs.existsSync(root)) {
    errors.push({ file: root, message: `Content root not found. Set CONTENT_PATH (currently ${cfg.paths.content}) or content.root (currently ${cfg.content.root}).` });
    return result;
  }
  const taxPath = path.join(root, 'taxonomy.yml');
  if (fs.existsSync(taxPath)) result.taxonomy = readYaml(taxPath, 'taxonomy.yml', errors);
  else errors.push({ file: 'taxonomy.yml', message: 'taxonomy.yml is missing from the content root' });
  result.artifacts = walkArtifacts(root, errors);
  result.collections = loadCollections(root, errors);
  result.learn = loadLearn(root, errors);
  return result;
}

export class ContentLoadError extends ContentError {}
