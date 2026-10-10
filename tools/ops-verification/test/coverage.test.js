'use strict';
// DEBT-10 guard: offline coverage on REAL vendored schemas (not fixtures).
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { ROOT, runScript } = require('./helpers');

test('verify-coverage.js passes on real schemas with honest sync report', () => {
  const r = runScript('verify-coverage.js', {
    LOCAL_SCHEMA_PATH: path.join(ROOT, 'schemas', 'initial_schema.ts'),
    COMPLETION_SCHEMA_PATH: path.join(ROOT, 'schemas', 'enterprise_schema_completion.ts'),
  });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /sync/i);
  assert.match(r.stdout, /sync tables \(7\)/);
  assert.match(r.stdout, /sync_queue: present/);
  assert.match(r.stdout, /STATUS: OK/);
});
