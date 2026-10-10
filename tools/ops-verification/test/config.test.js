'use strict';
// Offline tests for config.js: API surface, env-override resolution, and
// fail-fast behaviour. Hermetic - no DATABASE_URL, no network, no reads of
// D:/projects26 (schema env vars are always pinned to temp/fixture paths).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ROOT, fixture, runSnippet, envWithout } = require('./helpers');

const CONFIG_PATH = path.join(ROOT, 'config.js');

// Pin schema env vars BEFORE anything requires config.js, so no code path can
// fall back to a machine-specific default while this file runs.
process.env.LOCAL_SCHEMA_PATH = fixture('schema_full.sql');
process.env.COMPLETION_SCHEMA_PATH = fixture('completion_full.sql');

test('config exports the documented API surface', () => {
  const cfg = require('../config');
  assert.strictEqual(typeof cfg.requireDatabaseUrl, 'function');
  assert.strictEqual(typeof cfg.resolveSchemaPath, 'function');
  assert.strictEqual(typeof cfg.defaultSchemaPath, 'string');
  assert.strictEqual(typeof cfg.defaultCompletionPath, 'string');
  assert.strictEqual(typeof cfg.liveBaseUrl, 'string');
  assert.ok(cfg.defaultSchemaPath.length > 0);
  assert.ok(cfg.defaultCompletionPath.length > 0);
  assert.ok(cfg.liveBaseUrl.length > 0);
});

test('resolveSchemaPath returns the env override when the file exists', () => {
  const cfg = require('../config');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexora-cfg-'));
  const override = path.join(dir, 'override_schema.sql');
  fs.writeFileSync(override, '-- temp override fixture\n');
  const fallback = path.join(dir, 'fallback_never_used.sql'); // does not exist

  const previous = process.env.LOCAL_SCHEMA_PATH;
  process.env.LOCAL_SCHEMA_PATH = override;
  try {
    // If the override did not win, resolveSchemaPath would hit `fallback`,
    // fail existsSync and process.exit(1) - so exit 0 + this equality prove it.
    assert.strictEqual(cfg.resolveSchemaPath('LOCAL_SCHEMA_PATH', fallback), override);
  } finally {
    if (previous === undefined) delete process.env.LOCAL_SCHEMA_PATH;
    else process.env.LOCAL_SCHEMA_PATH = previous;
  }
});

test('resolveSchemaPath exits 1 when neither env override nor fallback exists', () => {
  const missing = path.join(os.tmpdir(), `nexora-missing-${process.pid}.sql`);
  const snippet = `
    const { resolveSchemaPath } = require(${JSON.stringify(CONFIG_PATH)});
    resolveSchemaPath('NEXORA_MISSING_SCHEMA_PATH', ${JSON.stringify(missing)});
  `;
  const env = envWithout('NEXORA_MISSING_SCHEMA_PATH');
  const r = runSnippet(snippet, { cwd: os.tmpdir(), env });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 1, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stderr, /Schema file not found/);
});

test('requireDatabaseUrl exits 1 when DATABASE_URL is unset', () => {
  const snippet = `require(${JSON.stringify(CONFIG_PATH)}).requireDatabaseUrl();`;
  const env = envWithout('DATABASE_URL');
  const r = runSnippet(snippet, { cwd: os.tmpdir(), env });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 1, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stderr, /Missing DATABASE_URL/);
});

test('requireDatabaseUrl returns the value when DATABASE_URL is set', () => {
  const snippet = `
    const url = require(${JSON.stringify(CONFIG_PATH)}).requireDatabaseUrl();
    console.log('RESOLVED:' + url);
  `;
  const env = envWithout('DATABASE_URL');
  env.DATABASE_URL = 'TEST-DB-URL-SENTINEL'; // sentinel string, never dialed
  const r = runSnippet(snippet, { cwd: os.tmpdir(), env });
  assert.ifError(r.error);
  assert.strictEqual(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
  assert.match(r.stdout, /RESOLVED:TEST-DB-URL-SENTINEL/);
});

test('liveBaseUrl never has a trailing slash', () => {
  const cfg = require('../config');
  assert.ok(!cfg.liveBaseUrl.endsWith('/'), `default liveBaseUrl: ${cfg.liveBaseUrl}`);

  const previous = process.env.LIVE_BASE_URL;
  process.env.LIVE_BASE_URL = 'https://example.invalid/app/';
  const resolved = require.resolve('../config');
  try {
    delete require.cache[resolved];
    const fresh = require('../config');
    assert.strictEqual(fresh.liveBaseUrl, 'https://example.invalid/app');
    assert.ok(!fresh.liveBaseUrl.endsWith('/'));
  } finally {
    if (previous === undefined) delete process.env.LIVE_BASE_URL;
    else process.env.LIVE_BASE_URL = previous;
    delete require.cache[resolved];
    require('../config'); // re-cache under the restored env
  }
});
