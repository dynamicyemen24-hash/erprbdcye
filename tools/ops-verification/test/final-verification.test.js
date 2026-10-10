'use strict';
// Offline test for final_verification.js: spawns the real script against
// hermetic SQL fixtures (both schema env vars pinned - never the fallback).
const test = require('node:test');
const assert = require('node:assert');
const { fixture, runScript } = require('./helpers');

test('final_verification reports 19/19 and exits 0 with full fixtures', () => {
  const r = runScript('final_verification.js', {
    LOCAL_SCHEMA_PATH: fixture('schema_full.sql'),
    COMPLETION_SCHEMA_PATH: fixture('completion_full.sql'),
  });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /19\/19/);
});

test('final_verification exits 1 when one required substring is missing', () => {
  const r = runScript('final_verification.js', {
    LOCAL_SCHEMA_PATH: fixture('schema_missing_neb02.sql'),
    COMPLETION_SCHEMA_PATH: fixture('completion_full.sql'),
  });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 1, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.doesNotMatch(r.stdout, /Results: 19\/19/);
  assert.match(r.stdout, /STATUS: NEEDS ATTENTION/);
});
