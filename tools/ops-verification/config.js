// Shared ops config - env-based, no hardcoded secrets.
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const VENDORED_SCHEMA_DIR = path.join(__dirname, 'schemas');

// Candidate paths per schema, in resolution order (after the env override):
// vendored copy in-repo first, then the legacy absolute path.
const SCHEMA_CANDIDATES = {
  LOCAL_SCHEMA_PATH: [
    path.join(VENDORED_SCHEMA_DIR, 'initial_schema.ts'),
    'D:/projects26/NexoraOS/src/server/database/initial_schema.ts',
  ],
  COMPLETION_SCHEMA_PATH: [
    path.join(VENDORED_SCHEMA_DIR, 'enterprise_schema_completion.ts'),
    'D:/projects26/NexoraOS/src/server/database/enterprise_schema_completion.ts',
  ],
};

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ Missing DATABASE_URL. Copy .env.example to .env and set DATABASE_URL.');
    process.exit(1);
  }
  return url;
}

function resolveSchemaPath(envName, fallback) {
  const p = process.env[envName];
  if (p) {
    if (!fs.existsSync(p)) {
      console.error(`❌ Schema file not found: ${p} (checked ${envName})`);
      process.exit(1);
    }
    return p;
  }
  const candidates = [fallback, ...(SCHEMA_CANDIDATES[envName] || [])];
  const found = candidates.find((c) => c && fs.existsSync(c));
  if (found) return found;
  console.error(`❌ Schema file not found: ${fallback} (checked ${envName})`);
  process.exit(1);
}

// Resolve defaults in order: (a) env var if set, (b) vendored copy in-repo,
// (c) legacy absolute path.
function resolveDefaultPath(envName, vendoredFile, legacyPath) {
  if (process.env[envName]) return process.env[envName];
  const vendored = path.join(VENDORED_SCHEMA_DIR, vendoredFile);
  return fs.existsSync(vendored) ? vendored : legacyPath;
}

const defaultSchemaPath = resolveDefaultPath(
  'LOCAL_SCHEMA_PATH',
  'initial_schema.ts',
  'D:/projects26/NexoraOS/src/server/database/initial_schema.ts'
);
const defaultCompletionPath = resolveDefaultPath(
  'COMPLETION_SCHEMA_PATH',
  'enterprise_schema_completion.ts',
  'D:/projects26/NexoraOS/src/server/database/enterprise_schema_completion.ts'
);

module.exports = {
  requireDatabaseUrl,
  resolveSchemaPath,
  defaultSchemaPath,
  defaultCompletionPath,
  liveBaseUrl: (process.env.LIVE_BASE_URL || 'https://erprbdcye.org').replace(/\/$/, ''),
};