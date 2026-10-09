'use strict';
// Shared helpers for the offline test suite. This module only exports
// functions - it never runs side effects - so it is safe even under test
// discovery modes that treat every file under test/ as a runnable file.
//
// Every spawn explicitly sets LOCAL_SCHEMA_PATH / COMPLETION_SCHEMA_PATH to
// repo fixtures, so tests never depend on DATABASE_URL, on the network, on
// D:/projects26, or on any vendored-schema fallback in config.js.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURES = path.join(__dirname, 'fixtures');

function fixture(name) {
  return path.join(FIXTURES, name);
}

// Schema env defaults applied to every spawn (caller overrides win).
function schemaEnvOverrides() {
  return {
    LOCAL_SCHEMA_PATH: fixture('schema_full.sql'),
    COMPLETION_SCHEMA_PATH: fixture('completion_full.sql'),
  };
}

// Spawn a repo script: `spawnSync('node', [script], {env, encoding})` with
// env overrides applied last so they always beat ambient machine state.
function runScript(script, overrides = {}) {
  const env = { ...process.env, ...schemaEnvOverrides(), ...overrides };
  return spawnSync('node', [script], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    timeout: 60000,
  });
}

// Spawn an inline snippet (`node -e`) with an explicit env and working dir.
// The caller passes a fully built env (e.g. envWithout('DATABASE_URL')).
function runSnippet(snippet, { cwd = ROOT, env = process.env } = {}) {
  return spawnSync('node', ['-e', snippet], {
    cwd,
    env,
    encoding: 'utf8',
    timeout: 60000,
  });
}

// A clean env copy with the given keys removed (for "missing variable" cases).
function envWithout(...keys) {
  const env = { ...process.env, ...schemaEnvOverrides() };
  keys.forEach((k) => delete env[k]);
  return env;
}

module.exports = { ROOT, FIXTURES, fixture, runScript, runSnippet, envWithout };
