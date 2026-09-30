import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { artifact, makeRepo, validateRepo, rmrf } from '../helpers.js';

const dirs = [];
const repo = (files, opts) => { const d = makeRepo(files, opts); dirs.push(d); return d; };
after(() => dirs.forEach(rmrf));

const messages = (r) => r.errors.map((e) => `${e.file}|${e.field}|${e.message}`).join('\n');

test('a valid artefact passes with no errors or warnings', () => {
  const r = validateRepo(repo({ 'prompts/sample.md': artifact() }));
  assert.equal(r.errors.length, 0, messages(r));
  assert.equal(r.warnings.length, 0);
  assert.equal(r.counts.artifacts, 1);
});

test('a missing required field names the file and the field', () => {
  const r = validateRepo(repo({ 'prompts/sample.md': artifact({ difficulty: undefined }) }));
  const e = r.errors.find((x) => x.field === 'difficulty');
  assert.ok(e, messages(r));
  assert.equal(e.file, 'prompts/sample.md');
  assert.match(e.message, /required field "difficulty" is missing/);
});

test('an unknown field is rejected', () => {
  const r = validateRepo(repo({ 'prompts/sample.md': artifact({ dificulty: 'beginner' }) }));
  assert.ok(r.errors.some((e) => e.field === 'dificulty' && /unknown field/.test(e.message)), messages(r));
});

test('enum violations list the allowed values', () => {
  const r = validateRepo(repo({ 'prompts/sample.md': artifact({ difficulty: 'expert' }) }));
  const e = r.errors.find((x) => x.field === 'difficulty');
  assert.match(e.message, /beginner, intermediate, advanced/);
});

test('unknown taxonomy ids are build errors', () => {
  const r = validateRepo(repo({ 'prompts/sample.md': artifact({ models: ['gpt'], categories: ['nope'], assistants: ['vim'], roles: ['ceo'] }) }));
  for (const field of ['models', 'categories', 'assistants', 'roles']) {
    assert.ok(r.errors.some((e) => e.field === field && /unknown/.test(e.message)), `expected error for ${field}\n${messages(r)}`);
  }
});

test('duplicate ids across files are rejected', () => {
  const r = validateRepo(repo({ 'prompts/a.md': artifact({ id: 'same' }), 'prompts/b.md': artifact({ id: 'same' }) }));
  assert.ok(r.errors.some((e) => e.field === 'id' && /already used/.test(e.message)), messages(r));
});

test('related must point at existing artefacts', () => {
  const r = validateRepo(repo({ 'prompts/sample.md': artifact({ related: ['ghost'] }) }));
  assert.ok(r.errors.some((e) => e.field === 'related' && /ghost/.test(e.message)), messages(r));
});

test('undeclared placeholders and unused variables are warnings, not errors', () => {
  const r = validateRepo(repo({ 'prompts/sample.md': artifact({}, 'Hello {{name}} and {{other}}.') }));
  assert.equal(r.errors.length, 0, messages(r));
  assert.ok(r.warnings.some((w) => /\{\{other\}\}/.test(w.message)));
  const r2 = validateRepo(repo({ 'prompts/sample.md': artifact({}, 'No placeholders here.') }));
  assert.ok(r2.warnings.some((w) => /declared but never used/.test(w.message)));
});

test('secrets in the body fail the build', () => {
  const r = validateRepo(repo({ 'prompts/sample.md': artifact({ variables: undefined }, 'Use AKIAIOSFODNN7EXAMPLE to log in.') }));
  assert.ok(r.errors.some((e) => /AWS access key/.test(e.message)), messages(r));
  const r2 = validateRepo(repo({ 'prompts/sample.md': artifact({ variables: undefined }, 'token: ghp_' + 'a'.repeat(40)) }));
  assert.ok(r2.errors.some((e) => /GitHub token/.test(e.message)), messages(r2));
});

test('regex sources for secrets in a hook body are not flagged', () => {
  const body = '{ "hooks": { "PreToolUse": [ { "matcher": "Bash", "hooks": [ { "type": "command", "command": "grep -E \'(AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,})\'" } ] } ] } }';
  const r = validateRepo(repo({ 'hooks/hook-demo.md': artifact({ id: 'hook-demo', type: 'hook', format: 'json', variables: undefined }, body) }));
  assert.equal(r.errors.length, 0, messages(r));
});

test('oversized bodies are rejected with the limit named', () => {
  const r = validateRepo(repo({ 'prompts/sample.md': artifact({ variables: undefined }, 'x'.repeat(70000)) }));
  assert.ok(r.errors.some((e) => /limit is 65536/.test(e.message)), messages(r));
});

test('json format must parse once placeholders are filled', () => {
  const bad = validateRepo(repo({ 'mcp/mcp-demo.md': artifact({ id: 'mcp-demo', type: 'mcp', format: 'json', variables: undefined }, '{ "a": ') }));
  assert.ok(bad.errors.some((e) => e.field === 'format'), messages(bad));
  const good = validateRepo(repo({ 'mcp/mcp-demo.md': artifact({ id: 'mcp-demo', type: 'mcp', format: 'json', variables: [{ name: 'p', description: 'Path', default: '/tmp' }] }, '{ "path": "{{p}}" }') }));
  assert.equal(good.errors.length, 0, messages(good));
});

test('exactly one collection must be start_here', () => {
  const dir = repo({ 'prompts/sample.md': artifact() }, { collections: false });
  fs.mkdirSync(`${dir}/library/collections`);
  fs.writeFileSync(`${dir}/library/collections/a.yml`, 'id: col-a\ntitle: Collection A\ndescription: A collection used in tests.\nitems: [sample]\n');
  const r = validateRepo(dir);
  assert.ok(r.errors.some((e) => /exactly one collection must set start_here/.test(e.message)), messages(r));
  fs.writeFileSync(`${dir}/library/collections/a.yml`, 'id: col-a\ntitle: Collection A\ndescription: A collection used in tests.\nstart_here: true\nitems: [sample, missing-one]\n');
  const r2 = validateRepo(dir);
  assert.ok(r2.errors.some((e) => e.field === 'items' && /missing-one/.test(e.message)), messages(r2));
});

test('folder artefacts pick up their entry file and support files', () => {
  const r = validateRepo(repo({
    'skills/demo/SKILL.md': artifact({ id: 'demo', type: 'skill', variables: undefined, install_frontmatter: { name: 'demo', description: 'A demo' } }, '# Demo skill\nDo the steps in checklist.md.'),
    'skills/demo/checklist.md': '- one\n- two\n',
    'skills/demo/scripts/run.sh': '#!/bin/sh\necho hi\n'
  }));
  assert.equal(r.errors.length, 0, messages(r));
  const a = r.content.artifacts.find((x) => x.id === 'demo');
  assert.ok(a.isFolder);
  assert.deepEqual(a.files.map((f) => f.path).sort(), ['SKILL.md', 'checklist.md', 'scripts/run.sh']);
});

test('variant and example files are resolved relative to the entry file and must exist', () => {
  const r = validateRepo(repo({
    'prompts/sample.md': artifact({ variants: [{ for: 'claude', file: 'variants/sample.claude.md' }], example_output: 'examples/nope.md' }),
    'prompts/variants/sample.claude.md': 'Claude flavour {{name}}'
  }));
  assert.ok(r.errors.some((e) => e.field === 'example_output' && /does not exist/.test(e.message)), messages(r));
  const a = r.content.artifacts[0];
  assert.equal(a.variants[0].body, 'Claude flavour {{name}}');
  assert.equal(r.content.artifacts.length, 1, 'support files are not artefacts');
});

test('broken frontmatter reports the file and a YAML message', () => {
  const r = validateRepo(repo({ 'prompts/bad.md': '---\nid: bad\ntitle: [unclosed\n---\nbody\n' }));
  assert.ok(r.errors.some((e) => e.file === 'prompts/bad.md' && /YAML/.test(e.message)), messages(r));
});
