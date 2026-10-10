'use strict';
// DEBT-4 guard: production report on REAL schemas - Arabic, no undefined/Chinese.
// Code points via fromCharCode (21516=U+540C 27493=U+6B65) keep this file ASCII-only.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { ROOT, runScript } = require('./helpers');

const SYNC_TABLE = String.fromCharCode(1580, 1583, 1608, 1604, 32, 1575, 1604, 1605, 1586, 1575, 1605, 1606, 1577);
const COL_GUARDS = String.fromCharCode(1581, 1585, 1575, 1587, 32, 1575, 1604, 1571, 1593, 1605, 1583, 1577);
const CHINESE = new RegExp('[' + String.fromCharCode(21516, 27493) + ']');

test('production_report.js on real schemas is Arabic-clean', () => {
  const r = runScript('production_report.js', {
    LOCAL_SCHEMA_PATH: path.join(ROOT, 'schemas', 'initial_schema.ts'),
    COMPLETION_SCHEMA_PATH: path.join(ROOT, 'schemas', 'enterprise_schema_completion.ts'),
  });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.ok(!r.stdout.includes('undefined'), 'must not leak undefined');
  assert.doesNotMatch(r.stdout, CHINESE, 'must not leak Chinese');
  assert.ok(r.stdout.includes(SYNC_TABLE), 'must label sync table');
  assert.ok(r.stdout.includes(COL_GUARDS), 'must label column guards');
});