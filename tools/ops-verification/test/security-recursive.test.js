'use strict';
// DEBT-5 guard: security-scan stays green and walks reports/schemas/test/design-system.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, runScript } = require('./helpers');

test('security-scan.js exits 0 (no hardcoded secrets)', () => {
  const r = runScript('security-scan.js');
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /security:scan passed/);
});

test('security-scan.js covers reports/schemas/test/design-system', () => {
  const src = fs.readFileSync(path.join(ROOT, 'security-scan.js'), 'utf8');
  for (const dir of ['reports', 'schemas', 'test', 'design-system']) {
    assert.ok(src.includes(dir), `must walk ${dir}`);
  }
});