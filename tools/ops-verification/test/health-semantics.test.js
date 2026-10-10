'use strict';
// Health semantics guard: only 2xx is OK (404 -> FAIL); refused host exits 1.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, runScript } = require('./helpers');

test('health-live.js treats only 2xx as OK', () => {
  const src = fs.readFileSync(path.join(ROOT, 'health-live.js'), 'utf8');
  assert.ok(src.includes('>= 200'), 'must check status >= 200');
  assert.ok(src.includes('< 300'), 'must check status < 300');
  assert.ok(!src.includes('status < 500'), '404 must not count as OK');
});

test('health-live.js exits 1 when refused (hermetic)', () => {
  const r = runScript('health-live.js', { LIVE_BASE_URL: 'http://127.0.0.1:9' });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 1, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /FAIL/);
});