'use strict';
// Offline test for verify.js (quick, 4-marker check): spawns the real script
// against hermetic fixtures with both schema env vars pinned.
const test = require('node:test');
const assert = require('node:assert');
const { fixture, runScript } = require('./helpers');

test('verify.js finds all 4 markers and exits 0', () => {
  const r = runScript('verify.js', {
    LOCAL_SCHEMA_PATH: fixture('schema_full.sql'),
    COMPLETION_SCHEMA_PATH: fixture('completion_full.sql'),
  });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /Total found: 4 \/4/);
  assert.match(r.stdout, /STATUS: OK/);
});

test('verify.js exits 1 when one marker is missing', () => {
  const r = runScript('verify.js', {
    LOCAL_SCHEMA_PATH: fixture('schema_missing_marker.sql'),
    COMPLETION_SCHEMA_PATH: fixture('completion_full.sql'),
  });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 1, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /Total found: 3 \/4/);
  assert.match(r.stdout, /STATUS: NEEDS ATTENTION/);
});
