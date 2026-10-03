/**
 * Label-association analyser.
 *
 * 770 of 773 <label> elements in the view layer carry no `htmlFor`. That is not
 * automatically a defect: a control *nested inside* its label is implicitly
 * associated, which satisfies WCAG 1.3.1 just as well. Only a label that is a
 * SIBLING of its control is genuinely unlabelled.
 *
 * This script tells the two cases apart so the fix targets the real defect and
 * does not churn correct markup.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(process.cwd(), 'src');
const SKIP = /(__tests__|\.test\.|\.spec\.)/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir)) {
    const full = path.join(dir, e);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(full) && !SKIP.test(full)) out.push(full);
  }
  return out;
}

let implicit = 0; // control nested inside the label — already correct
let sibling = 0; // label is a sibling — genuinely unlabelled
let siblingNoControl = 0; // label with no control we can find
const byFile = new Map();

for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = file.replace(SRC, 'src').replace(/\\/g, '/');

  for (const m of text.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)) {
    const [, attrs, body] = m;

    // Explicit association already in place.
    if (/\bhtmlFor\s*=/.test(attrs)) continue;

    // Implicit association: a form control inside the label body.
    if (/<(input|select|textarea)\b/.test(body)) {
      implicit += 1;
      continue;
    }

    sibling += 1;
    byFile.set(rel, (byFile.get(rel) ?? 0) + 1);
  }
}

console.log('LABEL ASSOCIATION BASELINE');
console.log('-'.repeat(58));
console.log(`  implicit (control nested) : ${implicit}   already valid`);
console.log(`  sibling (NO association) : ${sibling}   WCAG 1.3.1 / 4.1.2 failure`);
console.log(`  files affected           : ${byFile.size}`);
console.log('\ntop files by unassociated label count:');
for (const [file, n] of [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(`  ${String(n).padStart(4)}  ${file}`);
}
