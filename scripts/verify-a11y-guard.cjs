/**
 * Negative control for the accessibility conformance guard.
 *
 * A guard test that has never been seen to fail is not evidence of anything.
 * This script deliberately breaks each invariant, asserts the guard catches it,
 * then restores the file byte-for-byte.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const CSS = path.join(ROOT, 'src/index.css');
const VIEW = path.join(ROOT, 'src/components/ThirdPartyNetworkCenterView.tsx');
const APP = path.join(ROOT, 'src/App.tsx');
const TEST = 'src/design-system/__tests__/accessibility-conformance.test.ts';

function runGuard() {
  try {
    execFileSync('npx.cmd', ['vitest', 'run', TEST, '--reporter=dot'], {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { failed: false, out: '' };
  } catch (e) {
    return { failed: true, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

const cases = [
  {
    name: 'remove the focus ring declaration',
    file: CSS,
    break: (t) => t.replace('box-shadow: var(--ux-focus-ring);', 'box-shadow: none;'),
  },
  {
    name: 'strip scope from a column header',
    file: VIEW,
    break: (t) => t.replace('<th scope="col"', '<th'),
  },
  {
    name: 'mount the legacy container alongside ToastProvider',
    file: APP,
    break: (t) => t.replace('      <ToastProvider>', '      <EnterpriseToastContainer lang={lang} />\n      <ToastProvider>'),
  },
];

let caught = 0;
for (const c of cases) {
  const original = fs.readFileSync(c.file, 'utf8');
  const broken = c.break(original);
  if (broken === original) {
    console.log(`SKIP  ${c.name} — the mutation did not apply; check the fixture`);
    continue;
  }
  fs.writeFileSync(c.file, broken, 'utf8');
  const { failed, out } = runGuard();
  fs.writeFileSync(c.file, original, 'utf8');
  if (failed) {
    caught += 1;
    console.log(`CAUGHT  ${c.name}`);
  } else {
    console.log(`MISSED  ${c.name}  <-- the guard does not protect this`);
  }
  void out;
}

console.log(`\n${caught}/${cases.length} deliberate regressions were caught.`);
process.exit(caught === cases.length ? 0 : 1);
