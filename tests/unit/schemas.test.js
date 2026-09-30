import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createValidators, loadSchemas } from '../../scripts/lib/validate.js';
import { parseFrontmatter } from '../../scripts/lib/frontmatter.js';

test('the schemas shipped in content-starter are identical to the app schemas', () => {
  for (const name of fs.readdirSync('schema')) {
    const app = fs.readFileSync(path.join('schema', name), 'utf8');
    const starter = fs.readFileSync(path.join('content-starter', 'schema', name), 'utf8');
    assert.equal(starter, app, `${name} differs; run: cp schema/*.json content-starter/schema/`);
  }
});

test('schemas compile under strict Ajv and the templates validate against them', () => {
  const v = createValidators(loadSchemas());
  assert.ok(v.artifact && v.collection && v.taxonomy);
  // Every starter template must itself be a valid artefact (ids and taxonomy aside).
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk('content-starter/templates').filter((f) => f.endsWith('.md'))) {
    const { data } = parseFrontmatter(fs.readFileSync(f, 'utf8'), f);
    assert.ok(v.artifact(data), `${f}: ${JSON.stringify(v.artifact.errors)}`);
  }
});
