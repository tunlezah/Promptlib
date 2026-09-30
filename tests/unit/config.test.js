import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadConfig, contentLinks, normaliseBasePath, fromPagesUrl, substituteEnv, ConfigError } from '../../scripts/lib/config.js';

const tmpConfig = (yaml) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-cfg-'));
  const file = path.join(dir, 'site.config.yml');
  fs.writeFileSync(file, yaml);
  return file;
};

test('defaults apply when the config file is minimal', () => {
  const cfg = loadConfig({ configPath: tmpConfig('site:\n  name: X\n'), env: {} });
  assert.equal(cfg.site.name, 'X');
  assert.equal(cfg.site.base_path, '/');
  assert.equal(cfg.content.root, 'library');
  assert.equal(cfg.ai.enabled, false);
  assert.equal(cfg.header.enabled, false);
});

test('environment variables override config values and ${VAR} is substituted', () => {
  const file = tmpConfig('ai:\n  endpoints:\n    - id: gw\n      label: GW\n      base_url: https://llm.example/v1\n      api_style: openai-chat\n      auth: mtls\n      headers: { X-Team: "${TEAM}" }\n      models: [{ id: m1 }]\n');
  const cfg = loadConfig({ configPath: file, env: { SITE_BASE_PATH: 'prompts', HEADER_TEXT: 'INTERNAL', TEAM: 'blue', CONTENT_PROJECT: 'g/p' } });
  assert.equal(cfg.site.base_path, '/prompts/');
  assert.equal(cfg.header.text, 'INTERNAL');
  assert.equal(cfg.header.enabled, true);
  assert.equal(cfg.ai.endpoints[0].headers['X-Team'], 'blue');
  assert.equal(cfg.ai.enabled, true);
  assert.equal(cfg.content.project, 'g/p');
});

test('missing ${VAR} becomes empty and is reported', () => {
  const missing = new Set();
  const out = substituteEnv({ a: 'x-${NOPE}-y' }, {}, missing);
  assert.equal(out.a, 'x--y');
  assert.equal(missing.size, 1);
});

test('CI_PAGES_URL derives url and base path', () => {
  assert.deepEqual(fromPagesUrl('https://group.gitlab.io/prompt-library/'), { url: 'https://group.gitlab.io/prompt-library', base_path: '/prompt-library/' });
  const cfg = loadConfig({ configPath: tmpConfig(''), env: { CI_PAGES_URL: 'https://group.gitlab.io/prompt-library' } });
  assert.equal(cfg.site.base_path, '/prompt-library/');
  assert.equal(cfg.site.url, 'https://group.gitlab.io/prompt-library');
});

test('base paths are normalised', () => {
  assert.equal(normaliseBasePath(''), '/');
  assert.equal(normaliseBasePath('foo'), '/foo/');
  assert.equal(normaliseBasePath('/foo//bar'), '/foo/bar/');
});

test('an invalid AI endpoint fails loudly', () => {
  const file = tmpConfig('ai:\n  endpoints:\n    - id: gw\n      label: GW\n      base_url: not-a-url\n      api_style: magic\n      models: []\n');
  assert.throws(() => loadConfig({ configPath: file, env: {} }), (e) => e instanceof ConfigError && /base_url/.test(e.message) && /api_style/.test(e.message) && /models/.test(e.message));
});

test('content links follow the GitLab URL template', () => {
  const cfg = loadConfig({ configPath: tmpConfig('content:\n  host: https://git.example.com\n  project: team/content\n  branch: main\n  root: library\n'), env: {} });
  const links = contentLinks(cfg);
  assert.equal(links.enabled, true);
  assert.equal(links.view('prompts/a.md'), 'https://git.example.com/team/content/-/blob/main/library/prompts/a.md');
  assert.equal(links.edit('prompts/a.md'), 'https://git.example.com/team/content/-/edit/main/library/prompts/a.md');
  assert.equal(links.newFile('prompts', 'new.md'), 'https://git.example.com/team/content/-/new/main/library/prompts?file_name=new.md');
  assert.match(links.issue('Problem: a', 'body text'), /issues\/new\?issue\[title\]=Problem%3A%20a/);
  assert.match(links.api('prompts/a.md'), /projects\/team%2Fcontent\/repository\/files\/library%2Fprompts%2Fa\.md\/raw\?ref=main/);
  const none = contentLinks(loadConfig({ configPath: tmpConfig('content:\n  project: ""\n'), env: {} }));
  assert.equal(none.enabled, false);
  assert.equal(none.view('x'), '');
});
