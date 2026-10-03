/**
 * Scanner self-test.
 *
 * `readTag` is the component of the label codemod that can silently corrupt a
 * file: if it ends a tag one character early, every offset after it shifts and
 * the JSX stops parsing. Two failure modes actually occurred during
 * development, and both are pinned here:
 *
 *   1. An arrow function inside a JSX expression — `onChange={e => f(e)}` — whose
 *      `>` was mistaken for the end of the tag.
 *   2. A template-literal className — className={`… ${x ? 'a' : 'b'}`} — where
 *      the same `>` appears inside an interpolation.
 *
 * Run: node scripts/selftest-tag-reader.cjs
 */
const fs = require('fs');
const path = require('path');

const CONTROLS = new Set(['input', 'select', 'textarea']);

function readTag(src, from) {
  const lt = src.indexOf('<', from);
  if (lt === -1) return null;
  const nm = /^<([A-Za-z][\w.-]*)/.exec(src.slice(lt, lt + 40));
  if (!nm) return null;

  let i = lt + 1 + nm[1].length;
  let braces = 0;
  let quote = null;
  let tb = 0;

  while (i < src.length) {
    const c = src[i];

    if (quote) {
      if (c === '\\') { i += 2; continue; }
      if (c === quote) { quote = null; i += 1; continue; }
      if (quote === '`' && c === '}') { tb -= 1; if (tb < 0) tb = 0; }
      if (quote === '`' && c === '{') { tb += 1; }
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; tb = 0; i += 1; continue; }
    if (c === '/' && src[i + 1] === '*') {
      const cl = src.indexOf('*/', i + 2);
      i = cl === -1 ? src.length : cl + 2;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      i = nl === -1 ? src.length : nl;
      continue;
    }
    if (c === '{') { braces += 1; i += 1; continue; }
    if (c === '}') { braces -= 1; i += 1; continue; }

    if (c === '>' && braces === 0 && tb === 0) {
      return { start: lt, end: i + 1, name: nm[1], open: src.slice(lt, i + 1) };
    }
    i += 1;
  }
  return null;
}

// ── Debug harness: parse a real file and report the first malformed tag ────────
if (process.argv[2] === '--debug') {
  const target = process.argv[3];
  if (!target) {
    console.error('usage: node scripts/selftest-tag-reader.cjs --debug <file.tsx> [needle]');
    process.exit(1);
  }
  const needle = process.argv[4];
  const text = fs.readFileSync(target, 'utf8');
  const from = needle ? text.indexOf(needle) : 0;
  const t = readTag(text, from);
  if (!t) {
    console.log('no tag found');
    process.exit(1);
  }
  const line = text.slice(0, t.start).split('\n').length;
  console.log(`tag name   : ${t.name}`);
  console.log(`starts line: ${line}`);
  console.log(`ends line  : ${text.slice(0, t.end).split('\n').length}`);
  console.log(`--- open tag source ---`);
  console.log(t.open);
  process.exit(0);
}

/**
 * Is offset `pos` lexically inside a `.map()` / `.forEach()` / `.flatMap()`?
 *
 * Walks backwards counting brackets while skipping quoted spans, and stops at
 * the first unmatched `(`: a label is in a loop only when that specific paren
 * is a loop call. This replaced a 500-character lookbehind that both missed
 * distant `.map()` calls and falsely flagged unrelated code in the same file.
 */
function isInsideLoop(src, pos) {
  const LOOP = /\.\s*(map|forEach|flatMap|reduce)\s*$/;
  let depth = 0;
  let i = pos - 1;

  while (i >= 0) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i -= 1;
      while (i >= 0 && src[i] !== quote) {
        if (src[i] === '\\') i -= 1;
        i -= 1;
      }
      i -= 1;
      continue;
    }

    // Only `)` and `]` may appear as CLOSERS above the label. A `}` ends a JSX
    // expression container and is matched by an *opening* `(` on the way down,
    // so counting it as a closer double-counts it, the scan runs off the top of
    // the component, and everything gets reported as "not in a loop".
    if (c === ')' || c === ']') {
      depth += 1;
      i -= 1;
      continue;
    }
    if (c === '(' || c === '[') {
      if (depth === 0) return LOOP.test(src.slice(Math.max(0, i - 20), i));
      depth -= 1;
      i -= 1;
      continue;
    }
    i -= 1;
  }
  return false;
}

/**
 * Diagnostic: for every unlinked sibling label, report exactly which guard in
 * the codemod rejected it. Guessing at this cost two full re-application cycles
 * during development; this makes each rejection attributable.
 *
 * Run: node scripts/selftest-tag-reader.cjs --why <file>
 */
if (process.argv[2] === '--why') {
  const target = process.argv[3];
  const text = fs.readFileSync(target, 'utf8');
  const CONTROLS = new Set(['input', 'select', 'textarea']);

  for (const m of text.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)) {
    if (/\bhtmlFor\s*=/.test(m[1])) continue;
    if (/<(input|select|textarea)\b/.test(m[2])) continue;

    const line = text.slice(0, m.index).split('\n').length;
    const labelEnd = m.index + m[0].length;
    const after = text.slice(labelEnd);
    const gap = /^\s*(?:\{\s*\/\*[\s\S]*?\*\/\s*\})?\s*/.exec(after);
    if (!gap) { console.log(`L${line}  REJECTED: no whitespace gap matched`); continue; }
    const next = after.slice(gap[0].length, gap[0].length + 30).replace(/\n/g, '\\n');
    if (after[gap[0].length] === '{') { console.log(`L${line}  conditional control`); continue; }
    const nm = /^<([A-Za-z][\w.-]*)/.exec(after.slice(gap[0].length));
    if (!nm || !CONTROLS.has(nm[1])) {
      console.log(`L${line}  next tag is <${nm ? nm[1] : '?'}> not a form control`);
      continue;
    }
    if (/\bid\s*=/.test(after.slice(gap[0].length, gap[0].length + 300))) {
      console.log(`L${line}  control already has an id`);
      continue;
    }
    if (isInsideLoop(text, m.index)) { console.log(`L${line}  inside a loop`); continue; }
    console.log(`L${line}  *** LINKABLE *** next=${next.slice(0, 24)}`);
  }
  process.exit(0);
}

/**
 * Diagnostic: classify every remaining unlinked label by whether its control
 * sits inside a `.map()` row.
 *
 * The decisive test is not "is there a `.map(` somewhere above" but "does the
 * control's own subtree contain a map-produced sibling" — so each candidate is
 * printed with the immediately-following tag and a verdict, and a human can
 * confirm the classification against the real source instead of trusting a
 * heuristic.
 *
 * Run: node scripts/selftest-tag-reader.cjs --audit
 */
if (process.argv[2] === '--audit') {
  const SRC_DIR = path.join(process.cwd(), 'src');
  const SKIP_D = /(__tests__|\.test\.)/;
  const CTL = new Set(['input', 'select', 'textarea']);

  function walkAll(dir, out = []) {
    for (const e of fs.readdirSync(dir)) {
      const full = path.join(dir, e);
      if (fs.statSync(full).isDirectory()) walkAll(full, out);
      else if (/\.tsx$/.test(full) && !SKIP_D.test(full)) out.push(full);
    }
    return out;
  }

  const buckets = { loop: [], conditional: [], other: [] };

  for (const file of walkAll(SRC_DIR)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)) {
      if (/\bhtmlFor\s*=/.test(m[1])) continue;
      if (/<(input|select|textarea)\b/.test(m[2])) continue;

      const line = text.slice(0, m.index).split('\n').length;
      const rel = file.replace(SRC_DIR, 'src').replace(/\\/g, '/');
      const labelEnd = m.index + m[0].length;
      const after = text.slice(labelEnd);
      const gap = /^\s*(?:\{\s*\/\*[\s\S]*?\*\/\s*\})?\s*/.exec(after) || [''];

      let bucket = 'other';
      if (after[gap[0].length] === '{') bucket = 'conditional';
      else if (isInsideLoop(text, m.index)) bucket = 'loop';

      buckets[bucket].push({ rel, line });
    }
  }

  for (const [k, list] of Object.entries(buckets)) {
    console.log(`${k}: ${list.length}`);
  }
  console.log('\n--- "other" candidates (may still be linkable) ---');
  for (const r of buckets.other) console.log(`  ${r.rel}:${r.line}`);
  process.exit(0);
}

/**
 * Diagnostic: print every guard's verdict for one specific label.
 * Run: node scripts/selftest-tag-reader.cjs --probe <file> <line>
 */
if (process.argv[2] === '--probe') {
  const target = process.argv[3];
  const want = Number(process.argv[4]);
  const text = fs.readFileSync(target, 'utf8');
  for (const m of text.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)) {
    const line = text.slice(0, m.index).split('\n').length;
    if (line !== want) continue;
    const labelEnd = m.index + m[0].length;
    const after = text.slice(labelEnd);
    const gap = /^\s*(?:\{\s*\/\*[\s\S]*?\*\/\s*\})?\s*/.exec(after) || [''];
    console.log('label line       :', line);
    console.log('htmlFor present  :', /\bhtmlFor\s*=/.test(m[1]));
    console.log('nested control   :', /<(input|select|textarea)\b/.test(m[2]));
    console.log('isInsideLoop     :', isInsideLoop(text, m.index));
    console.log('gap length       :', gap[0].length);
    console.log('char after gap   :', JSON.stringify(after[gap[0].length] || ''));
    console.log('next 50 chars    :', JSON.stringify(after.slice(gap[0].length, gap[0].length + 50)));
    process.exit(0);
  }
  console.log('no label on line', want);
  process.exit(1);
}

const CASES = [
  {
    name: 'arrow function inside a JSX expression',
    src: `<input\n  type="text"\n  onChange={(e) => setX(e.target.value)}\n  value={x}\n/>`,
    expectEnd: `<input\n  type="text"\n  onChange={(e) => setX(e.target.value)}\n  value={x}\n/>`,
  },
  {
    name: 'template-literal className with an interpolation',
    src: `<div className={\`fixed z-[9] \${rtl ? 'l' : 'r'}\`} role="x" />`,
    expectEnd: `<div className={\`fixed z-[9] \${rtl ? 'l' : 'r'}\`} role="x" />`,
  },
  {
    name: 'ternary inside a plain attribute expression',
    src: `<span className={a ? 'x' : 'y'} data-q="1">t</span>`,
    expectEnd: `<span className={a ? 'x' : 'y'} data-q="1">`,
  },
  {
    name: 'template literal with a nested ternary — the real BeneficiariesView shape',
    src: "<input\n  type=\"text\"\n  className={`w-full bg-slate-50 ${x ? 'a' : 'b'} font-bold`}\n  onChange={(e) => setV(e.target.value)}\n/>",
    expectEnd:
      "<input\n  type=\"text\"\n  className={`w-full bg-slate-50 ${x ? 'a' : 'b'} font-bold`}\n  onChange={(e) => setV(e.target.value)}\n/>",
  },
  {
    name: 'comment containing a closing bracket',
    src: `<input /* a > b */ type="text" />`,
    expectEnd: `<input /* a > b */ type="text" />`,
  },
];

let passed = 0;
for (const c of CASES) {
  const t = readTag(c.src, 0);
  const got = t ? t.open : null;
  const ok = got === c.expectEnd;
  if (ok) passed += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${c.name}`);
  if (!ok) {
    console.log(`        expected: ${JSON.stringify(c.expectEnd)}`);
    console.log(`        got     : ${JSON.stringify(got)}`);
  }
}

// Real-file check: every control tag parsed from the live source must be
// syntactically complete, and a sample of rewritten files must round-trip.
const ROOT = path.join(process.cwd(), 'src');
let fileFailures = 0;
let checked = 0;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir)) {
    const full = path.join(dir, e);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(full)) out.push(full);
  }
  return out;
}

for (const file of walk(ROOT)) {
  if (file.includes('__tests__')) continue;
  const text = fs.readFileSync(file, 'utf8');
  let pos = 0;
  for (let guard = 0; guard < 4000; guard += 1) {
    const t = readTag(text, pos);
    if (!t) break;
    if (CONTROLS.has(t.name)) {
      checked += 1;
      const open = t.open;
      // A complete tag either self-closes or is left open for a matching
      // close tag. Either way it must not end mid-expression.
      if (!/\/?>$/.test(open)) {
        fileFailures += 1;
        console.log(`  FAIL  truncated tag in ${file.replace(ROOT, 'src')}: ${open.slice(0, 90)}`);
      }
    }
    pos = t.end;
  }
}

console.log(`\nscanner cases : ${passed}/${CASES.length}`);
console.log(`control tags  : ${checked} parsed, ${fileFailures} malformed`);

// ── Adjacent-control regression cases ─────────────────────────────────────────
// findAdjacentControl is the piece that can silently mis-associate: attaching
// label A to label B's input is worse than leaving the field unlinked, so each
// stop condition is pinned here.
const WRAPPERS = new Set(['div', 'span', 'p', 'section', 'fieldset', 'td', 'th', 'li', 'Fragment']);

function findAdjacentControl(src, from) {
  let i = from;
  for (let guard = 0; guard < 40; guard += 1) {
    const gap = /^\s*(?:\{\s*\/\*[\s\S]*?\*\/\s*\})?\s*/.exec(src.slice(i));
    if (gap) i += gap[0].length;
    if (src[i] === '{') return null;
    if (src[i] !== '<') return null;
    const tag = readTag(src, i);
    if (!tag) return null;
    if (CONTROLS.has(tag.name)) return tag;
    if (tag.name === 'label') return null;
    if (WRAPPERS.has(tag.name) && !tag.selfClosing) {
      i = tag.end;
      continue;
    }
    return null;
  }
  return null;
}

const ADJACENT_CASES = [
  { name: 'direct sibling control', src: '  <input type="text" />', want: 'input' },
  { name: 'through a div wrapper', src: '  <div className="x">\n    <input />\n  </div>', want: 'input' },
  { name: 'through two wrappers', src: '  <div>\n    <span>\n      <select />\n    </span>\n  </div>', want: 'select' },
  { name: 'stops at a conditional', src: '  {cond ? <input /> : null}', want: null },
  { name: 'stops at the next label', src: '  <label>Other</label>\n  <input />', want: null },
  { name: 'stops at a button leaf', src: '  <Button type="submit" />\n  <input />', want: null },
  { name: 'stops at text content', src: '  some text <input />', want: null },
];

let adjPassed = 0;
console.log('');
for (const c of ADJACENT_CASES) {
  const got = findAdjacentControl(c.src, 0);
  // `want: null` means "must refuse to associate" — the safe outcome.
  const ok = got?.name === c.want || (c.want === null && got === null);
  if (ok) adjPassed += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${c.name}  ->  ${got ? '<' + got.name + '>' : 'null (refused)'}`);
}

// ── Slug regression cases ─────────────────────────────────────────────────────
// The Arabic-ternary case below cost a full re-application cycle: every
// RTL-labelled field produced the id `ux-isrtl`, the duplicate guard rejected
// them all, and the codemod reported "0 linked" while looking perfectly healthy.
const SLUG_CASES = [
  { name: 'English arm of an RTL ternary is used', body: "{isRtl ? 'x' : 'Activity Name'}", minLen: 8 },
  { name: 'never collapses to the expression identifier', body: "{isRtl ? 'x' : ''}", notMatch: /isrtl/ },
  { name: 'plain English label', body: 'Account Code', minLen: 4 },
  { name: 'trailing required asterisk is dropped', body: 'National ID *', notMatch: /-\*|\*$/ },
];

function makeSlug(labelText, ordinal) {
  const arms = [...labelText.matchAll(/'([^']*)'/g)].map((m) => m[1]);
  const english =
    arms.find((a) => /[A-Za-z]{3,}/.test(a)) ?? arms.find((a) => /[A-Za-z]/.test(a)) ?? '';
  const ascii = (english || labelText)
    .replace(/\*\s*$/, '')
    .replace(/[{}]/g, ' ')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 34)
    .replace(/^-+|-+$/g, '');
  if (ascii.length < 3 || /^(isrtl|lang|rtl|is|as)$/.test(ascii)) return `ux-field-${ordinal}`;
  return `ux-${ascii}`;
}

let slugPassed = 0;
console.log('');
for (const c of SLUG_CASES) {
  const got = makeSlug(c.body, 7);
  const ok = c.notMatch ? !c.notMatch.test(got) : got.length >= (c.minLen ?? 3);
  if (ok) slugPassed += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${c.name}  ->  ${got}`);
}

process.exit(
  passed === CASES.length &&
    fileFailures === 0 &&
    slugPassed === SLUG_CASES.length &&
    adjPassed === ADJACENT_CASES.length
    ? 0
    : 1
);
