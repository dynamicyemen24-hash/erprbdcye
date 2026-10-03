/**
 * Negative control for the bundle budget guard.
 *
 * Restores the exact `manualChunks` rule that produced the 2.4 MB critical path,
 * rebuilds, and asserts the guard fails. Then restores the fixed config and
 * rebuilds again, asserting it passes. A budget test that has never been seen
 * red is not evidence of anything.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const CONFIG = path.join(ROOT, 'vite.config.ts');
const TEST = 'src/design-system/__tests__/bundle-budget.test.ts';

const original = fs.readFileSync(CONFIG, 'utf8');

const sh = (args) =>
  execFileSync('npx.cmd', args, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8', shell: true });

const measureCriticalPath = () => {
  sh(['vite', 'build', '--manifest', '--logLevel', 'error']);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'dist/.vite/manifest.json'), 'utf8')
  );
  const key =
    Object.keys(manifest).find((k) => manifest[k].isEntry) ??
    Object.keys(manifest).find((k) => !k.startsWith('_'));
  const size = (f) => {
    const p = path.join(ROOT, 'dist', f);
    return fs.existsSync(p) ? fs.statSync(p).size : 0;
  };
  return (
    (size(manifest[key].file) +
      (manifest[key].imports ?? []).reduce((s, k) => s + size(manifest[k]?.file ?? ''), 0)) /
    1024
  );
};

const runGuard = () => {
  try {
    sh(['vitest', 'run', TEST, '--reporter=dot']);
    return { failed: false };
  } catch {
    return { failed: true };
  }
};

let caught = 0;

// ── Control 1: reintroduce the defect ──────────────────────���──────────────────
const DEFECT = `              if (normalizedId.includes('jspdf') || normalizedId.includes('html2canvas') || normalizedId.includes('xlsx')) {
                return 'vendor-pdf-excel';
              }
              if (normalizedId.includes('recharts') || normalizedId.includes('/d3')) {
                return 'vendor-charts';
              }
              if (normalizedId.includes('leaflet')) {
                return 'vendor-maps';
              }
`;

const reverted = original.replace('              return undefined;', DEFECT);
if (reverted === original) {
  console.log('SKIP  could not re-inject the defect; the anchor comment moved');
} else {
  fs.writeFileSync(CONFIG, reverted, 'utf8');
  try {
    const kb = measureCriticalPath();
    const { failed } = runGuard();
    console.log(
      `re-injected defect -> critical path ${Math.round(kb)} KB; guard ${
        failed ? 'CAUGHT it' : 'MISSED it'
      }`
    );
    if (failed) caught += 1;
  } finally {
    fs.writeFileSync(CONFIG, original, 'utf8');
  }
}

// ── Control 2: the fixed config must pass ─────────────────────────────────────
try {
  const kb = measureCriticalPath();
  const { failed } = runGuard();
  console.log(
    `fixed config       -> critical path ${Math.round(kb)} KB; guard ${
      failed ? 'WRONGLY FAILED' : 'passed'
    }`
  );
  if (!failed) caught += 1;
} finally {
  fs.writeFileSync(CONFIG, original, 'utf8');
}

console.log(`\n${caught}/2 controls behaved correctly.`);
process.exit(caught === 2 ? 0 : 1);
