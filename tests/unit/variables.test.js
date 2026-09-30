import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPlaceholders, tokenize, substitute, assemble, defaultValues } from '../../src/shared/variables.js';
import { parseFrontmatter } from '../../scripts/lib/frontmatter.js';

test('placeholders are found once each, whitespace tolerant', () => {
  assert.deepEqual(findPlaceholders('a {{x}} b {{ y }} c {{x}} {{not-valid}} {{9no}}'), ['x', 'y']);
});

test('tokenize splits text and variables', () => {
  assert.deepEqual(tokenize('Hi {{name}}!'), [
    { type: 'text', value: 'Hi ' }, { type: 'var', name: 'name', raw: '{{name}}' }, { type: 'text', value: '!' }
  ]);
});

test('substitute leaves undeclared placeholders alone', () => {
  assert.equal(substitute('{{a}} {{b}}', { a: '1', b: '2' }, ['a']), '1 {{b}}');
  assert.equal(substitute('{{a}}', {}, ['a']), '{{a}}');
});

test('assemble uses defaults and prefers non-empty user values', () => {
  const vars = [{ name: 'lang', description: '', default: 'Python' }, { name: 'focus', description: '', default: 'auth' }];
  assert.deepEqual(defaultValues(vars), { lang: 'Python', focus: 'auth' });
  assert.equal(assemble('Review {{lang}} for {{focus}}', vars, { lang: 'Go', focus: '' }), 'Review Go for auth');
});

test('frontmatter parsing handles BOM, CRLF and a missing close', () => {
  const a = parseFrontmatter('﻿---\r\nid: x\r\ntitle: T\r\n---\r\nBody\r\n');
  assert.deepEqual(a.data, { id: 'x', title: 'T' });
  assert.equal(a.body, 'Body\r\n');
  const b = parseFrontmatter('no frontmatter');
  assert.equal(b.hasFrontmatter, false);
  assert.throws(() => parseFrontmatter('---\nid: x\n'), /closing --- line is missing/);
  const c = parseFrontmatter('---\ncreated: 2026-09-30\n---\n');
  assert.equal(typeof c.data.created, 'string', 'dates stay strings');
});
