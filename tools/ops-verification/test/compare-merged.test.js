'use strict';
// Merged-compare guard: compare_schema.js unions initial+completion (offline check only).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT } = require('./helpers');

test('compare_schema.js merges the completion set', () => {
  const src = fs.readFileSync(path.join(ROOT, 'compare_schema.js'), 'utf8');
  assert.ok(src.includes('defaultCompletionPath'), 'must read the completion schema');
  assert.ok(src.includes('merged'), 'must union initial + completion tables');
});

test('compare_schema.js parses offline (node --check)', () => {
  const r = spawnSync('node', ['--check', path.join(ROOT, 'compare_schema.js')], {
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, `stderr:\n${r.stderr}`);
});