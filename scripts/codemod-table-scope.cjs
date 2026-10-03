/**
 * WCAG 1.3.1 (Info and Relationships, Level A) codemod.
 *
 * Adds scope="col" to every <th> that lives inside a <thead> block. Those are
 * exactly the cells a screen reader needs in order to announce
 * "Budget, 120,000" instead of a bare "120,000".
 *
 * <th> outside <thead> is deliberately left alone: in this codebase those are
 * often decorative spacers, and mislabelling them as row headers is worse than
 * leaving them unscoped.
 *
 * Idempotent - a second run reports zero changes.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(process.cwd(), 'src');
const SKIP = /(__tests__|\.test\.|\.spec\.)/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(full) && !SKIP.test(full)) out.push(full);
  }
  return out;
}

let filesTouched = 0;
let cellsTagged = 0;

for (const file of walk(SRC)) {
  const src = fs.readFileSync(file, 'utf8');
  let changed = false;

  // `headAttrs` keeps every original attribute on the <thead> element.
  const next = src.replace(/<thead\b([^>]*)>([\s\S]*?)<\/thead>/gi, (_tag, headAttrs, inner) => {
    const patched = inner.replace(/<th\b([^>]*?)>([\s\S]*?)<\/th>/g, (match, attrs, body) => {
      // Read the element through its `</th>`, not through the first `>` it
      // encounters. A sortable header carries `onClick={c.sortable ? () => ...}`
      // and that `>` truncates `attrs` right before the existing `scope="col"`
      // on the next line — so this guard would not see it, and the codemod
      // would insert a second one (TS17001, duplicate attribute). Reading to
      // the closing tag makes the guard check the whole attribute list.
      if (/\bscope\s*=/.test(attrs)) return match;
      cellsTagged += 1;
      changed = true;
      return `<th scope="col"${attrs}>${body}</th>`;
    });
    return `<thead${headAttrs}>${patched}</thead>`;
  });

  if (changed) {
    fs.writeFileSync(file, next, 'utf8');
    filesTouched += 1;
  }
}

console.log(`scope="col" applied to ${cellsTagged} <th> across ${filesTouched} files.`);
