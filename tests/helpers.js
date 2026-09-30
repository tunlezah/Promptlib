// Builds throwaway content repos for tests.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from '../scripts/lib/config.js';
import { loadContent } from '../scripts/lib/content.js';
import { validateContent } from '../scripts/lib/validate.js';

export const MIN_TAXONOMY = `
models:
  - { id: any, label: Any }
  - { id: claude, label: Claude }
assistants:
  - { id: chat-app, label: Chat app }
  - id: claude-code
    label: Claude Code
    install:
      skill: ".claude/skills/{id}/"
      rule: CLAUDE.md
      command: ".claude/commands/{id}.md"
categories:
  - { id: coding, label: Coding, order: 1 }
  - { id: security, label: Security, order: 2 }
roles:
  - { id: developer, label: Developer }
`;

export function artifact(over = {}, body = 'Hello {{name}}.') {
  const fm = {
    id: 'sample', title: 'Sample prompt', summary: 'A sample prompt used in tests that says hello to someone.',
    type: 'prompt', models: ['any'], assistants: ['chat-app'], categories: ['coding'], roles: ['developer'],
    difficulty: 'beginner', variables: [{ name: 'name', description: 'Who to greet', default: 'world' }],
    version: '1.0.0', created: '2026-01-01', updated: '2026-01-02', status: 'reviewed', ...over
  };
  const yaml = Object.entries(fm).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n');
  return `---\n${yaml}\n---\n${body}\n`;
}

export function makeRepo(files, { taxonomy = MIN_TAXONOMY, collections = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pl-test-'));
  const lib = path.join(dir, 'library');
  fs.mkdirSync(lib, { recursive: true });
  fs.writeFileSync(path.join(lib, 'taxonomy.yml'), taxonomy);
  if (collections) {
    fs.mkdirSync(path.join(lib, 'collections'));
    const ids = Object.keys(files).filter((f) => f.endsWith('.md')).map((f) => {
      const m = /^id: "?([a-z0-9-]+)"?/m.exec(files[f]);
      return m ? m[1] : null;
    }).filter(Boolean);
    fs.writeFileSync(path.join(lib, 'collections', 'start.yml'), `id: start\ntitle: Start here\ndescription: The first things to try in this test library.\nstart_here: true\nitems:\n${ids.map((i) => `  - ${i}`).join('\n')}\n`);
  }
  for (const [rel, text] of Object.entries(files)) {
    const abs = path.join(lib, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  }
  return dir;
}

export function validateRepo(dir, envOver = {}) {
  const cfg = loadConfig({ env: { CONTENT_PATH: dir, ...envOver }, cwd: process.cwd() });
  const content = loadContent(cfg);
  const result = validateContent(content, cfg);
  return { cfg, content, ...result };
}

export function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}
