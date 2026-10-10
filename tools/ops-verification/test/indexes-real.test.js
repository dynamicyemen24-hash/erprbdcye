'use strict';
// DEBT-1 guard: 7/7 indexes on REAL vendored schemas (not 2KB fixtures).
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { ROOT, runScript } = require('./helpers');

test('check_indexes.js finds 7/7 on real schemas', () => {
  const r = runScript('check_indexes.js', {
    LOCAL_SCHEMA_PATH: path.join(ROOT, 'schemas', 'initial_schema.ts'),
    COMPLETION_SCHEMA_PATH: path.join(ROOT, 'schemas', 'enterprise_schema_completion.ts'),
  });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /7\/7/);
  assert.match(r.stdout, /STATUS: OK/);
});