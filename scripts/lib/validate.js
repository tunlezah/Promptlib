// Schema, taxonomy, cross-reference, secret and size checks over loaded content.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import { findPlaceholders, substitute } from '../../src/shared/variables.js';
import { FORMAT_EXT } from './content.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMA_DIR = path.resolve(here, '../../schema');

export const TYPES = ['prompt', 'system-prompt', 'skill', 'rule', 'agent', 'command', 'hook', 'mcp', 'plugin', 'workflow'];

export function loadSchemas(dir = SCHEMA_DIR) {
  const read = (n) => JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8'));
  return { artifact: read('artifact.schema.json'), collection: read('collection.schema.json'), taxonomy: read('taxonomy.schema.json') };
}

export function createValidators(schemas = loadSchemas()) {
  const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true, useDefaults: false });
  addFormats(ajv);
  return {
    artifact: ajv.compile(schemas.artifact),
    collection: ajv.compile(schemas.collection),
    taxonomy: ajv.compile(schemas.taxonomy)
  };
}

// Turn an Ajv error into "field: message" a contributor can act on.
export function describeAjvError(err) {
  const field = (err.instancePath || '').replace(/^\//, '').replace(/\//g, '.').replace(/\.(\d+)(?=\.|$)/g, '[$1]') || '(top level)';
  switch (err.keyword) {
    case 'required':
      return { field: err.params.missingProperty, message: `required field "${err.params.missingProperty}" is missing` };
    case 'additionalProperties':
      return { field: err.params.additionalProperty, message: `unknown field "${err.params.additionalProperty}" (check the spelling against the schema)` };
    case 'enum':
      return { field, message: `must be one of: ${err.params.allowedValues.join(', ')}` };
    case 'pattern':
      return { field, message: `does not match the required pattern ${err.params.pattern}` };
    case 'format':
      return { field, message: `must be a valid ${err.params.format}` };
    case 'type':
      return { field, message: `must be of type ${err.params.type}` };
    case 'minLength':
      return { field, message: `must be at least ${err.params.limit} characters` };
    case 'maxLength':
      return { field, message: `must be at most ${err.params.limit} characters` };
    case 'minItems':
      return { field, message: `must list at least ${err.params.limit} item(s)` };
    case 'maxItems':
      return { field, message: `must list at most ${err.params.limit} item(s)` };
    case 'uniqueItems':
      return { field, message: 'must not contain duplicates' };
    default:
      return { field, message: err.message || err.keyword };
  }
}

// Patterns that look like real credentials. Regex *sources* inside hook bodies do not match these.
export const SECRET_PATTERNS = [
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: 'GitLab personal access token', re: /\bglpat-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'OpenAI-style key', re: /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{32,}\b/ },
  { name: 'Anthropic key', re: /\bsk-ant-api[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Private key block', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/ },
  { name: 'JSON web token', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'Password assignment', re: /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token)\b\s*[:=]\s*["'][^"'\s${}]{12,}["']/i },
  { name: 'Basic auth in URL', re: /https?:\/\/[^\s/:@]+:[^\s/@]{6,}@[^\s/]+/ }
];

export function scanForSecrets(text) {
  const hits = [];
  const lines = String(text).split('\n');
  lines.forEach((line, i) => {
    if (/secret-scan-ignore/.test(line)) return;
    for (const p of SECRET_PATTERNS) if (p.re.test(line)) hits.push({ line: i + 1, name: p.name });
  });
  return hits;
}

const idSet = (list) => new Set((list || []).map((x) => x && x.id).filter(Boolean));

export function validateContent(content, cfg, validators = createValidators()) {
  const errors = [...content.errors];
  const warnings = [...content.warnings];
  const err = (file, message, field = null) => errors.push({ file, field, message });
  const warn = (file, message, field = null) => warnings.push({ file, field, message });
  const limits = cfg?.content?.limits || {};

  // Taxonomy
  const tax = content.taxonomy || { models: [], assistants: [], categories: [], roles: [] };
  if (content.taxonomy) {
    if (!validators.taxonomy(content.taxonomy)) {
      for (const e of validators.taxonomy.errors) { const d = describeAjvError(e); err('taxonomy.yml', d.message, d.field); }
    }
    for (const list of ['models', 'assistants', 'categories', 'roles']) {
      const seen = new Set();
      for (const item of tax[list] || []) {
        if (seen.has(item.id)) err('taxonomy.yml', `${list}: id "${item.id}" appears twice`, list);
        seen.add(item.id);
      }
    }
  }
  const models = idSet(tax.models), assistants = idSet(tax.assistants), categories = idSet(tax.categories), roles = idSet(tax.roles);

  // Artefacts
  const ids = new Map();
  for (const a of content.artifacts) {
    const file = a.path;
    const { body, path: _p, dir, entryFile, isFolder, folder, files, bodyBytes, frontmatterRaw, exampleOutput, exampleOutputPath, ...data } = a;
    const fm = { ...data };
    if (Array.isArray(fm.variants)) fm.variants = fm.variants.map(({ body: _b, resolvedPath: _r, ...v }) => v);
    if (!validators.artifact(fm)) {
      for (const e of validators.artifact.errors) { const d = describeAjvError(e); err(file, d.message, d.field); }
    }
    if (a.id) {
      if (ids.has(a.id)) err(file, `id "${a.id}" is already used by ${ids.get(a.id)}`, 'id');
      else ids.set(a.id, file);
    }
    if (!body.trim()) err(file, 'the body (the artefact itself, after the frontmatter) is empty');
    if (bodyBytes > (limits.max_body_bytes || 65536)) err(file, `body is ${bodyBytes} bytes; the limit is ${limits.max_body_bytes} bytes`);
    if (isFolder) {
      const total = files.reduce((n, f) => n + f.size, 0);
      if (files.length > (limits.max_file_count || 200)) err(file, `folder has ${files.length} files; the limit is ${limits.max_file_count}`);
      if (total > (limits.max_folder_bytes || 2097152)) err(file, `folder totals ${total} bytes; the limit is ${limits.max_folder_bytes} bytes`);
    }
    const checkIds = (field, set, label) => {
      for (const v of a[field] || []) if (!set.has(v)) err(file, `unknown ${label} id "${v}" (add it to taxonomy.yml or fix the spelling)`, field);
    };
    checkIds('models', models, 'model');
    checkIds('assistants', assistants, 'assistant');
    checkIds('categories', categories, 'category');
    checkIds('roles', roles, 'role');
    // Variables vs placeholders
    const declared = (a.variables || []).map((v) => v?.name).filter(Boolean);
    const dup = declared.filter((n, i) => declared.indexOf(n) !== i);
    for (const d of new Set(dup)) err(file, `variable "${d}" is declared twice`, 'variables');
    for (const v of a.variables || []) {
      if (v?.options && v.default !== undefined && v.default !== '' && !v.options.map(String).includes(String(v.default))) {
        warn(file, `variable "${v.name}": default "${v.default}" is not one of its options`, 'variables');
      }
    }
    const bodies = [{ label: 'body', text: body }, ...(a.variants || []).map((v, i) => ({ label: `variants[${i}]`, text: v.body || '' }))];
    const used = new Set();
    for (const b of bodies) {
      for (const name of findPlaceholders(b.text)) {
        used.add(name);
        if (!declared.includes(name)) warn(file, `${b.label} uses {{${name}}} but it is not declared under variables; it will be shown as plain text`, 'variables');
      }
    }
    for (const name of declared) if (!used.has(name)) warn(file, `variable "${name}" is declared but never used in the body`, 'variables');
    // Variants
    for (const [i, v] of (a.variants || []).entries()) {
      if (v?.for && !models.has(v.for) && !assistants.has(v.for)) err(file, `variants[${i}].for "${v.for}" is not a model or assistant id`, `variants[${i}].for`);
      if (v?.resolvedPath && !v.body.trim()) err(file, `variants[${i}].file ${v.file} is empty`, `variants[${i}].file`);
    }
    // Format sanity
    const probe = (t) => substitute(t, Object.fromEntries(declared.map((n) => [n, 'x'])), declared);
    if (a.format === 'json') {
      try { JSON.parse(probe(body)); } catch (e) { err(file, `format is json but the body is not valid JSON: ${e.message}`, 'format'); }
    } else if (a.format === 'yaml') {
      try { yaml.load(probe(body), { schema: yaml.CORE_SCHEMA }); } catch (e) { err(file, `format is yaml but the body is not valid YAML: ${e.reason || e.message}`, 'format'); }
    }
    if (a.format && !FORMAT_EXT[a.format]) err(file, `unknown format "${a.format}"`, 'format');
    // Secrets
    for (const b of bodies) for (const h of scanForSecrets(b.text)) err(file, `${b.label} line ${h.line} looks like it contains a ${h.name}. Remove it; use a placeholder or an environment variable instead.`);
    if (isFolder) {
      for (const f of files) {
        if (f.size > 512 * 1024 || /\.(png|jpe?g|gif|zip|pdf|woff2?)$/i.test(f.path)) continue;
        const text = fs.readFileSync(f.absPath, 'utf8');
        for (const h of scanForSecrets(text)) err(`${folder}/${f.path}`, `line ${h.line} looks like it contains a ${h.name}`);
      }
    }
    // Dates and versions
    if (a.created && a.updated && a.updated < a.created) err(file, `updated (${a.updated}) is before created (${a.created})`, 'updated');
    if (a.changelog?.length && a.version && a.changelog[0].version !== a.version) warn(file, `changelog's first entry is ${a.changelog[0].version} but version is ${a.version}; keep the newest entry first and in step with version`, 'changelog');
    if (a.related?.includes(a.id)) warn(file, 'related lists the artefact itself', 'related');
    if (a.type === 'skill' && entryFile !== 'SKILL.md') warn(file, 'skills are normally folders with a SKILL.md entry file so they can be installed as-is', 'type');
  }
  // Cross references
  for (const a of content.artifacts) {
    for (const r of a.related || []) if (!ids.has(r)) err(a.path, `related id "${r}" does not exist`, 'related');
  }

  // Collections
  const colIds = new Set();
  let startHere = 0;
  for (const c of content.collections) {
    if (!validators.collection(c && typeof c === 'object' ? Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'path')) : c)) {
      for (const e of validators.collection.errors) { const d = describeAjvError(e); err(c.path, d.message, d.field); }
      continue;
    }
    if (colIds.has(c.id)) err(c.path, `collection id "${c.id}" is used twice`, 'id');
    colIds.add(c.id);
    if (c.start_here) startHere++;
    for (const item of c.items) if (!ids.has(item)) err(c.path, `item "${item}" is not an artefact id`, 'items');
  }
  if (content.collections.length && startHere !== 1) err('collections/', `exactly one collection must set start_here: true (found ${startHere})`);

  return { errors, warnings, counts: { artifacts: content.artifacts.length, collections: content.collections.length, learn: content.learn.length } };
}

// Optional network check for `source` links. Returns [{file, url, status}].
export async function checkExternalLinks(content, { timeoutMs = 8000, concurrency = 6 } = {}) {
  const jobs = [];
  for (const a of content.artifacts) if (a.source) jobs.push({ file: a.path, url: a.source, field: 'source' });
  for (const t of content.taxonomy?.assistants || []) if (t.docs_url) jobs.push({ file: 'taxonomy.yml', url: t.docs_url, field: `assistants.${t.id}.docs_url` });
  const failures = [];
  let i = 0;
  const worker = async () => {
    while (i < jobs.length) {
      const job = jobs[i++];
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), timeoutMs);
      try {
        let res = await fetch(job.url, { method: 'HEAD', redirect: 'follow', signal: ctl.signal });
        if (res.status === 405 || res.status === 403) res = await fetch(job.url, { method: 'GET', redirect: 'follow', signal: ctl.signal });
        if (!res.ok) failures.push({ ...job, status: res.status });
      } catch (e) {
        failures.push({ ...job, status: e.name === 'AbortError' ? 'timeout' : e.message });
      } finally {
        clearTimeout(timer);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  return { checked: jobs.length, failures };
}

export function formatIssue(issue) {
  return `${issue.file}${issue.field ? ` [${issue.field}]` : ''}: ${issue.message}`;
}
