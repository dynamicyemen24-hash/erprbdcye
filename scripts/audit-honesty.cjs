// Diagnostic: report exactly which files trip the honesty guards and why.
// Run: node scripts/audit-honesty.cjs
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');

const SRC = join(process.cwd(), 'src');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(full) && !full.includes('__tests__')) out.push(full);
  }
  return out;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const files = walk(SRC)
  .map((f) => ({ file: f.replace(SRC, 'src').replace(/\\/g, '/'), raw: readFileSync(f, 'utf8') }))
  .filter(({ file }) => !file.startsWith('src/server'))
  .map(({ file, raw }) => ({ file, code: stripComments(raw) }));

const VERSION_LITERAL = /['"`]\s*v?\d+\.\d+\.\d+(-Enterprise)?\s*['"`]/;

// Two files legitimately hold a dotted number that is NOT the app version:
//   core/version.ts        — the fallback constant itself.
//   core/services/persistence.ts — a CACHE-SCHEMA version, bumped when the
//     IndexedDB entry shape changes so old caches are invalidated. Conflating
//     it with the product version is the very ambiguity this audit removes.
const VERSION_ALLOWLIST = new Set([
  'src/core/version.ts',
  'src/core/services/persistence.ts',
]);

const euro = files.filter(({ file, code }) => !file.includes('CurrenciesView') && code.includes('€'));
const version = files.filter(
  ({ file, code }) => !VERSION_ALLOWLIST.has(file) && VERSION_LITERAL.test(code)
);

console.log('--- euro sign offenders ---');
euro.forEach(({ file }) => console.log(' ', file));
if (!euro.length) console.log('  (none)');

console.log('--- version literal offenders ---');
version.forEach(({ file }) => console.log(' ', file));
if (!version.length) console.log('  (none)');