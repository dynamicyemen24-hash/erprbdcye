// UAMEX ERP - smart platform check (quick, dependency-free).
// Verifies: unified version, subscriber-neutral identity, extensible
// domain registry, removal of stale scratch, and wiring of isolated tools.
// Usage: npm run smart:check   (exits non-zero on any failure)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXPECTED_VERSION = '4.0.0';
let failures = 0;

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}
function check(name, ok, detail) {
  console.log((ok ? '[OK] ' : '[FAIL] ') + name + (detail ? ' — ' + detail : ''));
  if (!ok) failures++;
}

// 1. Unified version (single source of truth: root package.json)
const pkg = JSON.parse(read('package.json'));
check('package.json version is ' + EXPECTED_VERSION, pkg.version === EXPECTED_VERSION, pkg.version);
const meta = JSON.parse(read('metadata.json'));
check('metadata.json version unified', meta.version === EXPECTED_VERSION, meta.version);
const configSrc = read('src/core/config/index.ts');
check('platform config version unified', configSrc.includes(`version: 'v${EXPECTED_VERSION}-Enterprise'`));
const loginSrc = read('src/components/LoginView.tsx');
check('login footer version unified', loginSrc.includes(`UAMEX ERP™ v${EXPECTED_VERSION}-Enterprise`));

// 2. Subscriber-neutral identity (Rohamaa is one subscriber, not the system)
check('platform identity is UAMEX ERP', configSrc.includes("systemName: 'UAMEX ERP™'"));
check('metadata identity is UAMEX ERP', meta.displayName === 'UAMEX ERP™', meta.displayName);
const readme = read('README.md');
check('README frames Rohamaa as subscriber', readme.includes('مشترك'));
check('README not confined to a fixed domain count', !readme.includes('15 منظومة'));

// 3. Extensible domain registry (base 15 frozen + subscriber extensions)
const registry = read('src/server/governance/neb-registry.ts');
const baseCount = (registry.match(/\{ code: 'NEB-/g) || []).length;
check('base catalog intact (15)', baseCount === 15, String(baseCount));
check('extension API present', registry.includes('registerNebDomain') && registry.includes('getAllNebDomains'));
check('extension tests present', exists('src/server/governance/__tests__/neb-registry-extensions.test.ts'));

// 4. Stale scratch removed
const denylist = [
  '%LOCALAPPDATA%',
  'firebase-applet-config.json',
  'build_out.txt',
  'tc3.txt',
  'test-final.txt',
  'typecheck_out.txt',
  'batch16.sql',
  'load-test.js',
  'bun.lock',
  'packages/brand-tokens',
];
const lingering = denylist.filter(exists);
check('no stale scratch artifacts', lingering.length === 0, lingering.join(', ') || 'clean');

// 5. Isolated tools wired
const scripts = pkg.scripts || {};
check(
  'diagnostics + toolkit wired as npm scripts',
  ['db:diagnostics', 'db:inspect-coa', 'toolkit:verify', 'smart:check'].every((k) => scripts[k]),
);
check(
  'wired script targets exist',
  ['scripts/neon-diagnostics.cjs', 'scripts/inspect_coa_cols.cjs', 'ops/nexora-toolkit/final_verification.js'].every(exists),
);

console.log(failures === 0 ? '\nSMART CHECK: PASS' : `\nSMART CHECK: FAIL (${failures})`);
process.exitCode = failures === 0 ? 0 : 1;
