import yaml from 'js-yaml';

export class ContentError extends Error {
  constructor(file, message, field = null) {
    super(message);
    this.file = file;
    this.field = field;
  }
}

const FM_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

// Splits "---\nyaml\n---\nbody" into { data, body }. Dates stay strings (CORE_SCHEMA).
export function parseFrontmatter(text, file = '<memory>') {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  if (!/^---[ \t]*\r?\n/.test(src)) return { data: null, body: src, hasFrontmatter: false };
  const m = FM_RE.exec(src);
  if (!m) throw new ContentError(file, 'Frontmatter starts with --- but the closing --- line is missing');
  let data;
  try {
    data = yaml.load(m[1], { schema: yaml.CORE_SCHEMA, filename: file });
  } catch (e) {
    throw new ContentError(file, `Frontmatter is not valid YAML: ${e.reason || e.message}${e.mark ? ` (line ${e.mark.line + 1})` : ''}`);
  }
  if (data === null || data === undefined) data = {};
  if (typeof data !== 'object' || Array.isArray(data)) throw new ContentError(file, 'Frontmatter must be a YAML mapping');
  return { data, body: src.slice(m[0].length), hasFrontmatter: true, raw: m[1] };
}

export function stringifyFrontmatter(data, body) {
  const y = yaml.dump(data, { lineWidth: 100, noRefs: true, quotingType: '"' }).trimEnd();
  return `---\n${y}\n---\n${body.replace(/^\n+/, '')}`;
}
