/**
 * Reports the sibling labels that are NOT inside a .map()/.forEach(), per file.
 *
 * The label codemod deliberately skips two shapes: labels inside a list row (a
 * constant id would repeat) and labels above a conditional control. This script
 * surfaces the third, much smaller, and genuinely safe category — labels that
 * are simply siblings of their control in a component that renders once — so
 * they can be finished by hand or by a narrower, opt-in codemod run.
 *
 * Those are exactly the fields SAP Fiori / Oracle Redwood / Fluent expect to be
 * composed through <FormField>: single-instance forms, where useId() is
 * available and the association should never have been hand-written at all.
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

const rows = [];

for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = file.replace(SRC, 'src').replace(/\\/g, '/');

  for (const m of text.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)) {
    const [, attrs] = m;
    if (/\bhtmlFor\s*=/.test(attrs)) continue;
    if (/<(input|select|textarea)\b/.test(m[2])) continue; // implicit, already valid

    const before = text.slice(Math.max(0, m.index - 700), m.index);
    const inLoop = /\.(map|forEach|flatMap)\s*\(/.test(before);

    // Is a control the very next sibling (only whitespace/comment between)?
    const after = text.slice(m.index + m[0].length);
    const gap = /^\s*(?:\{\s*\/\*[\s\S]*?\*\/\s*\})?\s*/.exec(after);
    const adjacent = gap && /^<(input|select|textarea)\b/.test(after.slice(gap[0].length));

    rows.push({ file: rel, line: text.slice(0, m.index).split('\n').length, inLoop, adjacent });
  }
}

const loop = rows.filter((r) => r.inLoop);
const adjacent = rows.filter((r) => !r.inLoop && r.adjacent);
const conditional = rows.filter((r) => !r.inLoop && !r.adjacent);

console.log('UNLINKED SIBLING LABELS — BY CATEGORY');
console.log('-'.repeat(64));
console.log(`  inside a .map()          : ${loop.length}   needs useId() per row`);
console.log(`  sibling of its control   : ${adjacent.length}   safe to link mechanically`);
console.log(`  above a conditional      : ${conditional.length}   the other branch may differ`);
console.log(`  --------------------------------------------`);
console.log(`  total                    : ${rows.length}`);

if (adjacent.length) {
  console.log('\nLINKABLE (sibling, not in a loop):');
  const byFile = new Map();
  for (const r of adjacent) byFile.set(r.file, (byFile.get(r.file) ?? 0) + 1);
  for (const [f, n] of [...byFile.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${f}`);
  }
}
