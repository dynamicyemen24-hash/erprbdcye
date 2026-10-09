'use strict';
// package.json integrity: npm test must run the offline test runner FIRST and
// keep the security guard as the second step; sibling scripts/fields intact.
const test = require('node:test');
const assert = require('node:assert');
const pkg = require('../package.json');

test('test script runs node --test before the security guard', () => {
  const script = pkg.scripts && pkg.scripts.test;
  assert.strictEqual(typeof script, 'string', 'package.json must define scripts.test');
  assert.ok(script.includes('node --test'), `expected "node --test" in: ${script}`);
  assert.ok(script.includes('security:scan'), `expected "security:scan" in: ${script}`);
  assert.ok(
    script.indexOf('node --test') < script.indexOf('security:scan'),
    `runner must run before guard: ${script}`
  );
  assert.ok(script.includes('&&'), `runner must gate the guard: ${script}`);
});

test('security guard and sibling scripts are preserved', () => {
  assert.strictEqual(pkg.scripts['security:scan'], 'node security-scan.js');
  assert.strictEqual(pkg.scripts['verify:quick'], 'node verify.js');
  assert.strictEqual(pkg.scripts['verify:final'], 'node final_verification.js');
  assert.strictEqual(pkg.scripts.ci, 'npm run security:scan && npm run security:audit && npm run verify:final');
});

test('package fields are preserved', () => {
  assert.strictEqual(pkg.name, 'nexoraops');
  assert.strictEqual(pkg.type, 'commonjs');
  assert.strictEqual(pkg.engines.node, '>=18');
  assert.ok(pkg.dependencies.dotenv, 'dotenv dependency must stay');
  assert.ok(pkg.dependencies.pg, 'pg dependency must stay');
});
