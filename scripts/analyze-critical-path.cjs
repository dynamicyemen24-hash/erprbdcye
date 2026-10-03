/**
 * Critical-path bundle analyser.
 *
 * The `dist/assets` listing answers "how big is everything"; this answers the
 * question that actually determines perceived speed: "how many bytes block the
 * first paint?". Those are very different numbers, because most of a 7 MB build
 * can be lazily reachable while still being statically reachable.
 *
 * Reads Vite's own manifest, so it reflects the real import graph rather than a
 * filename heuristic. Run `vite build --manifest` first.
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(process.cwd(), 'dist');
const manifestPath = path.join(DIST, '.vite', 'manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('No manifest. Run: npx vite build --manifest');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entries = Object.entries(manifest);

const sizeOf = (file) => {
  const p = path.join(DIST, file);
  return fs.existsSync(p) ? fs.statSync(p).size : 0;
};

const kb = (n) => (n / 1024).toFixed(0).padStart(8) + ' KB';

// The entry is the chunk that index.html points at; in this manifest it is the
// only entry without a leading "_" (dynamic chunks are all "_"-prefixed).
const root = entries.find(([, v]) => v.isEntry) || entries.find(([k]) => !k.startsWith('_'));

if (!root) {
  console.error('Could not identify the entry chunk.');
  process.exit(1);
}

const [rootKey, rootVal] = root;
console.log('CRITICAL PATH (everything the browser must fetch before first paint)');
console.log('-'.repeat(64));
console.log(`${kb(sizeOf(rootVal.file))}  ${rootVal.file}   (entry: ${rootKey})`);

// The manifest's `imports` arrays reference other *manifest keys*, not files
// (keys carry a leading "_" for shared chunks, which the `file` field does not).
const fileFor = (key) => manifest[key]?.file;
const sizeOfKey = (key) => {
  const file = fileFor(key);
  return file ? sizeOf(file) : 0;
};

let total = sizeOf(rootVal.file);
const heavy = [];
for (const depKey of rootVal.imports ?? []) {
  const file = fileFor(depKey);
  if (!file) continue;
  const size = sizeOf(file);
  total += size;
  console.log(`${kb(size)}  ${file}`);
  heavy.push([file, size]);
}

console.log('-'.repeat(64));
console.log(`${kb(total)}  TOTAL BLOCKING (uncompressed)`);
console.log(`~${(total / 1024 / 1.35).toFixed(0)} KB estimated over gzip\n`);

const all = entries.map(([, v]) => sizeOf(v.file));
console.log(`WHOLE BUILD: ${(all.reduce((a, b) => a + b, 0) / 1024).toFixed(0)} KB in ${entries.length} chunks`);

// A vendor chunk above this on the blocking path is a red flag: it is paid for
// by every user, on every device, whether or not they ever open the feature.
const BUDGET = 300 * 1024;
const offenders = heavy.filter(([, s]) => s > BUDGET);
if (offenders.length) {
  console.log(`\nWARNING — vendor chunks on the critical path above ${BUDGET / 1024} KB:`);
  for (const [file, size] of offenders) {
    console.log(`  ${kb(size)}  ${file}`);
  }
  console.log('  These are fetched and parsed by every user before first paint.');
} else {
  console.log(`\nOK — no vendor chunk on the critical path exceeds ${BUDGET / 1024} KB.`);
}
