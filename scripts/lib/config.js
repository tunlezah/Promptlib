// Loads site.config.yml, applies environment overrides and ${VAR} substitution, validates the result.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export const API_STYLES = ['openai-chat', 'openai-responses', 'anthropic-messages', 'ollama'];
export const AUTH_MODES = ['mtls', 'bearer', 'none'];

const DEFAULTS = {
  site: { name: 'Prompt Library', tagline: '', url: '', base_path: '/', logo: 'assets/logo.svg', default_license: 'CC0-1.0' },
  header: { text: '', background: '#7a1f1f', foreground: '#ffffff', link: '', sticky: true, repeat_at_bottom: false },
  content: {
    mode: 'build-time',
    host: 'https://gitlab.com',
    project: '',
    branch: 'main',
    root: 'library',
    path: 'content-starter',
    web_url_template: '{host}/{project}/-/{action}/{branch}/{path}',
    issue_url_template: '{host}/{project}/-/issues/new?issue[title]={title}&issue[description]={description}',
    api_url_template: '{host}/api/v4/projects/{project_encoded}/repository/files/{path_encoded}/raw?ref={branch}',
    limits: { max_body_bytes: 65536, max_folder_bytes: 2 * 1024 * 1024, max_file_count: 200 }
  },
  features: { favourites: true, open_in_links: true, send_to_ai: true, feedback_links: true, rss: true },
  ai: { endpoints: [] }
};

export class ConfigError extends Error {}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function merge(base, over) {
  if (!isPlainObject(over)) return over === undefined ? base : over;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = isPlainObject(base?.[k]) && isPlainObject(v) ? merge(base[k], v) : v;
  }
  return out;
}

// Replace ${VAR} in every string with the environment value. Missing variables become '' and are reported.
export function substituteEnv(value, env, missing = new Set(), keyPath = '') {
  if (typeof value === 'string') {
    return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, name) => {
      if (env[name] === undefined) { missing.add(`${name} (used at ${keyPath || 'config'})`); return ''; }
      return env[name];
    });
  }
  if (Array.isArray(value)) return value.map((v, i) => substituteEnv(v, env, missing, `${keyPath}[${i}]`));
  if (isPlainObject(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = substituteEnv(v, env, missing, keyPath ? `${keyPath}.${k}` : k);
    return out;
  }
  return value;
}

export function normaliseBasePath(p) {
  let s = String(p || '/').trim();
  if (!s.startsWith('/')) s = '/' + s;
  if (!s.endsWith('/')) s += '/';
  return s.replace(/\/{2,}/g, '/');
}

// Derive base path and URL from GitLab's CI_PAGES_URL (e.g. https://group.gitlab.io/project).
export function fromPagesUrl(pagesUrl) {
  try {
    const u = new URL(pagesUrl);
    return { url: u.origin + u.pathname.replace(/\/$/, ''), base_path: normaliseBasePath(u.pathname) };
  } catch {
    return null;
  }
}

function applyEnv(cfg, env) {
  const set = (obj, key, envName, parse = (v) => v) => {
    if (env[envName] !== undefined && env[envName] !== '') obj[key] = parse(env[envName]);
  };
  const bool = (v) => !['0', 'false', 'no', 'off'].includes(String(v).toLowerCase());

  if (env.CI_PAGES_URL && !env.SITE_URL && !env.SITE_BASE_PATH) {
    const derived = fromPagesUrl(env.CI_PAGES_URL);
    if (derived) { cfg.site.url = derived.url; cfg.site.base_path = derived.base_path; }
  }
  set(cfg.site, 'name', 'SITE_NAME');
  set(cfg.site, 'tagline', 'SITE_TAGLINE');
  set(cfg.site, 'url', 'SITE_URL');
  set(cfg.site, 'base_path', 'SITE_BASE_PATH');
  set(cfg.header, 'text', 'HEADER_TEXT');
  set(cfg.header, 'background', 'HEADER_BACKGROUND');
  set(cfg.header, 'foreground', 'HEADER_FOREGROUND');
  set(cfg.header, 'link', 'HEADER_LINK');
  set(cfg.header, 'sticky', 'HEADER_STICKY', bool);
  set(cfg.header, 'repeat_at_bottom', 'HEADER_REPEAT_AT_BOTTOM', bool);
  set(cfg.content, 'mode', 'CONTENT_MODE');
  set(cfg.content, 'host', 'CONTENT_HOST');
  set(cfg.content, 'project', 'CONTENT_PROJECT');
  set(cfg.content, 'branch', 'CONTENT_BRANCH');
  set(cfg.content, 'root', 'CONTENT_ROOT');
  set(cfg.content, 'path', 'CONTENT_PATH');
  for (const f of Object.keys(cfg.features)) set(cfg.features, f, `FEATURE_${f.toUpperCase()}`, bool);
}

export function validateConfig(cfg) {
  const errors = [];
  if (!['build-time', 'runtime'].includes(cfg.content.mode)) errors.push(`content.mode must be build-time or runtime, got "${cfg.content.mode}"`);
  const colour = /^#[0-9a-fA-F]{3,8}$|^[a-zA-Z]+$/;
  if (!colour.test(cfg.header.background)) errors.push('header.background must be a hex colour or a CSS colour name');
  if (!colour.test(cfg.header.foreground)) errors.push('header.foreground must be a hex colour or a CSS colour name');
  if (!Array.isArray(cfg.ai.endpoints)) { errors.push('ai.endpoints must be a list'); return errors; }
  const seen = new Set();
  for (const [i, ep] of cfg.ai.endpoints.entries()) {
    const where = `ai.endpoints[${i}]`;
    if (!ep || typeof ep !== 'object') { errors.push(`${where} must be a mapping`); continue; }
    if (!ep.id || !/^[a-z0-9][a-z0-9-]*$/.test(ep.id)) errors.push(`${where}.id must be a lowercase slug`);
    if (seen.has(ep.id)) errors.push(`${where}.id "${ep.id}" is used twice`);
    seen.add(ep.id);
    if (!ep.label) errors.push(`${where}.label is required`);
    try {
      const u = new URL(ep.base_url);
      if (!['https:', 'http:'].includes(u.protocol)) throw new Error();
    } catch { errors.push(`${where}.base_url must be an absolute http(s) URL`); }
    if (!API_STYLES.includes(ep.api_style)) errors.push(`${where}.api_style must be one of ${API_STYLES.join(', ')}`);
    if (!AUTH_MODES.includes(ep.auth || 'none')) errors.push(`${where}.auth must be one of ${AUTH_MODES.join(', ')}`);
    if (!Array.isArray(ep.models) || ep.models.length === 0) errors.push(`${where}.models must list at least one model`);
    else for (const [j, m] of ep.models.entries()) if (!m || !m.id) errors.push(`${where}.models[${j}].id is required`);
    if (ep.headers && !isPlainObject(ep.headers)) errors.push(`${where}.headers must be a mapping`);
  }
  return errors;
}

export function loadConfig({ configPath, env = process.env, cwd = process.cwd() } = {}) {
  const file = path.resolve(cwd, configPath || env.SITE_CONFIG || 'site.config.yml');
  let raw = {};
  if (fs.existsSync(file)) {
    try {
      raw = yaml.load(fs.readFileSync(file, 'utf8'), { schema: yaml.CORE_SCHEMA, filename: file }) || {};
    } catch (e) {
      throw new ConfigError(`Could not parse ${file}: ${e.message}`);
    }
  }
  const missing = new Set();
  let cfg = merge(DEFAULTS, raw);
  applyEnv(cfg, env);
  cfg = substituteEnv(cfg, env, missing);
  cfg.site.base_path = normaliseBasePath(cfg.site.base_path);
  cfg.site.url = String(cfg.site.url || '').replace(/\/$/, '');
  cfg.header.text = String(cfg.header.text || '').trim();
  cfg.header.enabled = Boolean(cfg.header.text);
  cfg.ai.endpoints = (cfg.ai.endpoints || []).map((ep) => ({
    auth: 'none', headers: {}, defaults: {}, stream: true, timeout_seconds: 120, ...ep,
    models: (ep.models || []).map((m) => ({ label: m.id, ...m }))
  }));
  cfg.ai.enabled = Boolean(cfg.features.send_to_ai && cfg.ai.endpoints.length > 0);
  const errors = validateConfig(cfg);
  if (errors.length) throw new ConfigError(`Invalid site configuration (${file}):\n  - ${errors.join('\n  - ')}`);
  cfg.paths = {
    configFile: file,
    appRoot: cwd,
    content: path.resolve(cwd, cfg.content.path),
    contentRoot: path.resolve(cwd, cfg.content.path, cfg.content.root)
  };
  cfg.missingEnv = [...missing];
  return cfg;
}

// Links back to the content repo. All return '' when no project is configured.
export function contentLinks(cfg) {
  const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? '' : vars[k]));
  const base = { host: String(cfg.content.host || '').replace(/\/$/, ''), project: cfg.content.project, branch: cfg.content.branch };
  const enabled = Boolean(cfg.content.project && base.host);
  const repoPath = (p) => `${cfg.content.root}/${p}`.replace(/\/{2,}/g, '/');
  const web = (action, p) => (enabled ? fill(cfg.content.web_url_template, { ...base, action, path: repoPath(p) }) : '');
  return {
    enabled,
    repo: enabled ? `${base.host}/${base.project}` : '',
    view: (p) => web('blob', p),
    edit: (p) => web('edit', p),
    raw: (p) => web('raw', p),
    newFile: (dir, fileName) => (enabled ? web('new', dir) + (fileName ? `?file_name=${encodeURIComponent(fileName)}` : '') : ''),
    issue: (title, description) => (enabled ? fill(cfg.content.issue_url_template, { ...base, title: encodeURIComponent(title), description: encodeURIComponent(description) }) : ''),
    api: (p) => (enabled ? fill(cfg.content.api_url_template, { ...base, project_encoded: encodeURIComponent(base.project), path_encoded: encodeURIComponent(repoPath(p)) }) : '')
  };
}
