const test = require('node:test');
const assert = require('node:assert');
const dashboard = require('../ops-dashboard');

test('dashboard exports runDashboard function and scripts metadata', () => {
  assert.strictEqual(typeof dashboard.runDashboard, 'function');
  assert.ok(Array.isArray(dashboard.scripts), 'scripts must be an array');
  assert.ok(dashboard.scripts.length >= 5, 'must have at least 5 enterprise workflows');
  for (const s of dashboard.scripts) {
    assert.ok(s.id, 'script must have id');
    assert.ok(s.name, 'script must have name');
    assert.ok(s.cmd, 'script must have cmd');
    assert.ok(s.category, 'script must have category');
  }
});
