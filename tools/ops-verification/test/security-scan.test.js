'use strict';
// The security guard itself must stay green: spawn security-scan.js and
// require exit 0 (no hardcoded secrets in the root-level ops scripts).
const test = require('node:test');
const assert = require('node:assert');
const { runScript } = require('./helpers');

test('security-scan.js exits 0 (no hardcoded secrets)', () => {
  const r = runScript('security-scan.js');
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /security:scan passed/);
});
