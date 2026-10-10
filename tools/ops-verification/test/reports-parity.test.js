'use strict';
// DEBT-7 drift guard: root scripts and reports/ modules must stay in parity.
// - reports/final_verification.js must load under type:commonjs (no ESM).
// - reports/production.js must use the tolerant grants regex (no stale
//   NUMERIC(\d+,\d+) DEFAULT pattern that fails on real `NUMERIC NOT NULL`).
// - `node production_report.js` and generateProductionReport() must agree on
//   neb 13/13 + table counts. Real vendored schemas are pinned explicitly via
//   LOCAL_SCHEMA_PATH / COMPLETION_SCHEMA_PATH (never fixtures, never DB).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { runScript, ROOT } = require('./helpers');

const LOCAL = path.join(ROOT, 'schemas', 'initial_schema.ts');
const COMPLETION = path.join(ROOT, 'schemas', 'enterprise_schema_completion.ts');

test('reports/final_verification.js loads under CJS and exports generator', () => {
  const src = fs.readFileSync(path.join(ROOT, 'reports', 'final_verification.js'), 'utf8');
  assert.doesNotMatch(src, /^import\s/m, 'stale ESM import still present');
  assert.doesNotMatch(src, /^export\s/m, 'stale ESM export still present');
  assert.match(src, /module\.exports/, 'missing CJS module.exports');
  assert.doesNotMatch(src, /同步/, 'stale 同步 label still present');
  const mod = require('../reports/final_verification.js');
  assert.strictEqual(typeof mod.generateFinalVerification, 'function');
});

test('reports/production.js uses tolerant grants regex (no stale pattern)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'reports', 'production.js'), 'utf8');
  assert.doesNotMatch(src, /NUMERIC\\\(\d\+,\\d\+\\\) DEFAULT/, 'stale grants regex still present');
  assert.match(src, /total_amount NUMERIC\(\?:/, 'tolerant total_amount regex missing');
  assert.match(src, /spent_amount NUMERIC\(\?:/, 'tolerant spent_amount regex missing');
});

test('production parity: root script and reports module agree (13/13 + tables)', () => {
  const r = runScript('production_report.js', {
    LOCAL_SCHEMA_PATH: LOCAL,
    COMPLETION_SCHEMA_PATH: COMPLETION,
  });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /13\/13/, 'root script did not report 13/13');
  assert.match(r.stdout, /domains complete/, 'root script missing domains summary');

  // Call the reports module in-process with explicit real schema paths.
  // Silence its console report; assert on the returned structure instead.
  const { generateProductionReport } = require('../reports/production.js');
  const origLog = console.log;
  let report;
  console.log = () => {};
  try {
    report = generateProductionReport('schemas/initial_schema.ts', 'schemas/enterprise_schema_completion.ts');
  } finally {
    console.log = origLog;
  }
  assert.strictEqual(report.summary.passed, 13, 'reports module neb passed != 13');
  assert.strictEqual(report.summary.total, 13, 'reports module neb total != 13');
  assert.match(r.stdout, new RegExp(String(report.tables.local)), 'local table count differs');
  assert.match(r.stdout, new RegExp(String(report.tables.enterprise)), 'completion table count differs');
  assert.strictEqual(
    report.financial.totalBudget,
    0,
    'expected totalBudget 0 on real NUMERIC NOT NULL grants schema'
  );
});
