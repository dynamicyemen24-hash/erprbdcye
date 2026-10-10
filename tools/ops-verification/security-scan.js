// Regression guard: fail if any hardcoded secret appears in the ops toolkit.
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const SKIP_DIRS = new Set(['node_modules', '.git', '.gsee']);
const SKIP_BASENAMES = new Set(['security-scan.js', '.env', '.env.example']);

function walk(target, exts, out) {
  let entries = [];
  try {
    entries = fs.readdirSync(target, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(path.join(target, e.name), exts, out);
    } else if (e.isFile()) {
      if (SKIP_BASENAMES.has(e.name)) continue;
      if (!exts || exts.some((ext) => e.name.endsWith(ext))) {
        out.push(path.join(target, e.name));
      }
    }
  }
  return out;
}

// Root *.js (legacy, non-recursive) + recursive coverage for
// reports/*.js, schemas/*.ts, test/**/*.js, design-system/*.* .
function collectFiles() {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(dir, f));
  const specs = [
    ['reports', ['.js']],
    ['schemas', ['.ts']],
    ['test', ['.js']],
    ['design-system', null], // all files (*.*)
  ];
  for (const [sub, exts] of specs) {
    walk(path.join(dir, sub), exts, files);
  }
  // De-dupe (walk could re-add a root file only if subdir == root, which it isn't,
  // but keep it robust) and drop the guard itself.
  const seen = new Set();
  return files.filter((f) => {
    if (SKIP_BASENAMES.has(path.basename(f))) return false;
    if (seen.has(f)) return false;
    seen.add(f);
    return true;
  });
}

const files = collectFiles();

const patterns = [
  /npg_[A-Za-z0-9]+/,
  /postgres(?:ql)?:\/\/[^'"\s]*:[^'"\s]*@/i,
  /AKIA[0-9A-Z]{16}/,
  /xox[bap]-[A-Za-z0-9-]+/,
];

let hits = 0;
files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  patterns.forEach((re) => {
    const m = content.match(re);
    if (m) {
      hits++;
      console.log(`❌ HIT ${path.relative(dir, file)}: matched ${re} -> "${String(m[0]).slice(0, 24)}..."`);
    }
  });
});

if (hits > 0) {
  console.log(`\n❌ security:scan FAILED with ${hits} hardcoded-secret hit(s). Move them to .env.`);
  process.exit(1);
} else {
  console.log('✅ security:scan passed - no hardcoded secrets in ops toolkit');
}
