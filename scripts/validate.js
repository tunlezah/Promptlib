#!/usr/bin/env node
// Validates the content repo. Exit code 1 on any error.
//   node scripts/validate.js [--check-links] [--strict-links] [--json] [--content <path>]
import path from 'node:path';
import { loadConfig, ConfigError } from './lib/config.js';
import { loadContent } from './lib/content.js';
import { validateContent, checkExternalLinks, formatIssue } from './lib/validate.js';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };

const useColour = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColour ? `\x1b[${code}m${s}\x1b[0m` : s);

async function main() {
  const env = { ...process.env };
  if (opt('--content')) env.CONTENT_PATH = opt('--content');
  let cfg;
  try {
    cfg = loadConfig({ env });
  } catch (e) {
    if (e instanceof ConfigError) { console.error(c(31, '✖ ') + e.message); process.exit(1); }
    throw e;
  }
  const content = loadContent(cfg);
  const result = validateContent(content, cfg);
  let links = null;
  if (flag('--check-links')) {
    links = await checkExternalLinks(content);
    for (const f of links.failures) {
      const issue = { file: f.file, field: f.field, message: `link ${f.url} could not be reached (${f.status})` };
      (flag('--strict-links') ? result.errors : result.warnings).push(issue);
    }
  }
  if (flag('--json')) {
    console.log(JSON.stringify({ ok: result.errors.length === 0, ...result, links }, null, 2));
  } else {
    const rel = path.relative(process.cwd(), content.root) || '.';
    for (const w of result.warnings) console.log(c(33, '⚠ ') + formatIssue(w));
    for (const e of result.errors) console.log(c(31, '✖ ') + formatIssue(e));
    const summary = `${result.counts.artifacts} artefacts, ${result.counts.collections} collections, ${result.counts.learn} learn pages in ${rel}` + (links ? `; ${links.checked} links checked` : '');
    if (result.errors.length) console.log(c(31, `\n✖ ${result.errors.length} error(s), ${result.warnings.length} warning(s) — ${summary}`));
    else console.log(c(32, `\n✔ Valid — ${summary}${result.warnings.length ? `, ${result.warnings.length} warning(s)` : ''}`));
  }
  process.exit(result.errors.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
