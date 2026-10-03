/**
 * Reports which chunks statically import a given shared chunk.
 *
 * Why: a `vendor-*` chunk appearing in `dist/assets` is harmless if nothing
 * blocks on it. It becomes a load-time defect the moment a chunk on the
 * critical path imports it *statically* — the browser then must download and
 * parse it before first paint, even if no user ever opens the feature.
 */
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(process.cwd(), 'dist', '.vite', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const target = process.argv[2];
if (!target) {
  console.error('usage: node scripts/who-imports.cjs <manifest-key-substring>');
  process.exit(1);
}

const key = Object.keys(manifest).find((k) => k.includes(target));
if (!key) {
  console.error(`no manifest key matching "${target}"`);
  process.exit(1);
}

const file = manifest[key].file;
const size = fs.existsSync(path.join('dist', file))
  ? (fs.statSync(path.join('dist', file)).size / 1024).toFixed(0)
  : '?';

console.log(`TARGET  ${key}`);
console.log(`FILE    ${file}  (${size} KB)`);
console.log(`\nSTATIC IMPORTERS (must load it before they can run):`);

const importers = Object.keys(manifest).filter((k) => (manifest[k].imports ?? []).includes(key));

if (importers.length === 0) {
  console.log('  (none — this chunk is lazily reachable, which is what we want)');
} else {
  for (const i of importers) {
    const isEntry = manifest[i].isEntry ? '  <-- ENTRY (blocks first paint)' : '';
    const dynamic = manifest[i].isDynamicEntry ? ' [dynamic entry]' : '';
    console.log(`  ${i}${dynamic}${isEntry}`);
  }
  console.log(`\n  ${importers.length} chunk(s) depend on it statically.`);
}
