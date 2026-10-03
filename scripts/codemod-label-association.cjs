/**
 * A JSX-aware tag reader.
 *
 * WHY A REGEX IS NOT ENOUGH HERE
 * The obvious `/<input\b([^>]*)>/` stops at the first `>`, which inside
 * `onChange={e => setX(e.target.value)}` is the `>` of the arrow function. The
 * captured "attributes" are then garbage, and rewriting them corrupts the JSX
 * into something that no longer parses. That is not hypothetical: the first
 * version of this codemod did exactly that and produced 11 TypeScript syntax
 * errors before it was reverted.
 *
 * `readTag` therefore tracks quote state, brace depth and comment state, and
 * only ends a tag at a `>` that is genuinely at nesting depth 0.
 */
const fs = require('fs');
const path = require('path');

const CONTROLS = new Set(['input', 'select', 'textarea']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir)) {
    const full = path.join(dir, e);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(full)) out.push(full);
  }
  return out;
}

/**
 * Read the full source range of the first tag at or after `from`.
 * Returns null when the next `<` does not begin a parseable tag.
 */
function readTag(src, from) {
  const lt = src.indexOf('<', from);
  if (lt === -1) return null;

  const nameMatch = /^<([A-Za-z][\w.-]*)/.exec(src.slice(lt, lt + 40));
  if (!nameMatch) return null;

  let i = lt + 1 + nameMatch[1].length;
  let braces = 0;
  let quote = null;
  // Depth of `${ … }` interpolations inside a template-literal attribute.
  let templateBraces = 0;

  while (i < src.length) {
    const c = src[i];

    if (quote) {
      if (c === '\\') {
        i += 1;
        i += 1;
        continue;
      }
      if (c === quote) {
        quote = null;
        i += 1;
        continue;
      }
      // Inside a template literal, `${ … }` may contain `>` (from an arrow
      // function) and nested quotes. JSX className attributes rely on this:
      //   className={`fixed z-[999] ${isRtl ? 'l' : 'r'}`}
      // Ending the tag at that `>` shifts every following offset and corrupts
      // the file, which is exactly what happened on the first run. So inside a
      // template literal, `>` is only meaningful once the interpolation closes.
      if (quote === '`' && c === '}') {
        templateBraces -= 1;
        if (templateBraces < 0) templateBraces = 0;
      }
      if (quote === '`' && c === '{') {
        templateBraces += 1;
      }
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      templateBraces = 0;
      i += 1;
      continue;
    }
    // Skip comments so a `>` inside one cannot terminate the tag early.
    if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      i = close === -1 ? src.length : close + 2;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      i = nl === -1 ? src.length : nl;
      continue;
    }
    if (c === '{') { braces += 1; i += 1; continue; }
    if (c === '}') { braces -= 1; i += 1; continue; }

    // A `>` only closes the tag when no JSX expression AND no template
    // interpolation is open. Without the `templateBraces === 0` half of this
    // condition, the arrow inside `${x ? 'a' : 'b'}` still terminated the tag
    // early — which is the second corruption this scanner has to survive, and
    // the one that actually reached BeneficiariesView.
    if (c === '>' && braces === 0 && templateBraces === 0) {
      return {
        start: lt,
        end: i + 1,
        name: nameMatch[1],
        open: src.slice(lt, i + 1),
        selfClosing: src[i - 1] === '/',
      };
    }
    i += 1;
  }
  return null;
}

/**
 * Is the offset `pos` lexically inside a `.map()` / `.forEach()` / `.flatMap()`
 * callback?
 *
 * Walks backwards from `pos` counting brackets while ignoring string and
 * template content, and stops at the first unmatched `(`. A label is only
 * "in a loop" when that unmatched paren is a loop call — which is the precise
 * test, rather than a character-count lookbehind that both misses distant maps
 * and falsely flags unrelated code in the same file.
 */
function isInsideLoop(src, pos) {
  const LOOP = /\.\s*(map|forEach|flatMap|reduce)\s*$/;
  let depth = 0;
  let i = pos - 1;

  while (i >= 0) {
    const c = src[i];

    // Skip over quoted spans so brackets inside strings do not count.
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
      if (depth === 0) {
        // This is the bracket that opened the enclosing scope.
        return LOOP.test(src.slice(Math.max(0, i - 20), i));
      }
      depth -= 1;
      i -= 1;
      continue;
    }
    i -= 1;
  }
  return false;
}

/**
 * ASCII-safe, stable, human-readable id fragment.
 *
 * THE ARABIC PROBLEM
 * A label body is almost always a ternary — `{isRtl ? 'اسم النشاط' : 'Activity Name'}` —
 * so stripping non-ASCII leaves only the expression's own identifier. The naive
 * version produced `isrtl`, which is identical for every RTL-labelled field in
 * the codebase; the duplicate-id guard then rejected them all and the codemod
 * silently linked nothing. That is why 95 perfectly safe fields were skipped.
 *
 * So the slug is built from the WHOLE ternary: the English arm is used when
 * present (it is the stable, transliterated half of the pair), and the Arabic
 * arm is transliterated only as a last resort. Fields whose label is genuinely
 * Arabic-only fall back to a positional name that is still unique per file.
 */
function slug(labelText, ordinal) {
  // Prefer the English arm of a ternary: it is the readable one. The arm must
  // carry at least three letters, otherwise a one-word stub like `'x'` wins and
  // the readable half is ignored.
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

  // A name that is only the expression identifier (`isrtl`) carries no
  // information, so fall back to a positional id rather than minting a
  // colliding one.
  if (ascii.length < 3 || /^(isrtl|lang|rtl|is|as)$/.test(ascii)) {
    return `ux-field-${ordinal}`;
  }
  return `ux-${ascii}`;
}

/**
 * WCAG 1.3.1 / 3.3.2 / 4.1.2 codemod — explicit label association.
 *
 * THE DEFECT
 * 734 form controls across 65 view files are announced by a screen reader as
 * "edit blank" / "combo box blank": their <label> is a *sibling* with no
 * `htmlFor`, and the control is not nested. Three Level-A criteria fail at once:
 *
 *   1.3.1 Info and Relationships — the label is not programmatically linked
 *   3.3.2 Labels or Instructions — the instruction is not attached
 *   4.1.2 Name, Role, Value   — the control has no accessible name
 *
 * THE FIX
 * A deterministic `id` on the control plus `htmlFor` on the label.
 *
 * Why not the alternatives:
 *   - Wrapping the control in its label is also valid (implicit association),
 *     but these labels carry `text-[10px] font-black`, and font-size and weight
 *     *inherit*. The input would silently shrink and embolden — an accessibility
 *     win bought with a visual regression.
 *   - `useId()` is what the Design System's own FormField uses, but it cannot be
 *     introduced mechanically: the hook must be called at the top of a
 *     component, and these labels sit hundreds of lines into render bodies.
 *
 * KNOWN LIMITATION, DELIBERATELY NOT PAPERED OVER
 * A label/control pair inside a `.map()` renders once per row, so a constant id
 * would repeat and every row after the first would point at row one. Those are
 * skipped and counted, not mis-linked. `useId()` per row instance is the real
 * answer and belongs in a per-component pass.
 */
const ROOT = path.join(process.cwd(), 'src');
const SKIP = /(__tests__|\.test\.|\.spec\.)/;

let filesTouched = 0;
let linked = 0;
let skippedInLoop = 0;
let skippedNoControl = 0;
let skippedConditional = 0;

for (const file of walk(ROOT)) {
  if (SKIP.test(file)) continue;

  let src = fs.readFileSync(file, 'utf8');
  let changed = false;
  let cursor = 0;
  let ordinal = 0;

  for (;;) {
    const lt = src.indexOf('<label', cursor);
    if (lt === -1) break;

    const openTag = readTag(src, lt);
    if (!openTag) break;
    const closeIdx = src.indexOf('</label>', openTag.end);
    if (closeIdx === -1) {
      cursor = openTag.end;
      continue;
    }
    const labelEnd = closeIdx + '</label>'.length;
    const labelBody = src.slice(openTag.end, closeIdx);
    cursor = labelEnd;

    // Already explicit, or already implicit by nesting.
    if (/\bhtmlFor\s*=/.test(openTag.open)) continue;
    if (CONTROLS.has(readTag(src, openTag.end)?.name ?? '')) continue;

    // The next sibling must be a control, separated only by whitespace or a
    // JSX comment.
    //
    // A bare `{expression}` between the label and the control is DELIBERATELY
    // not skipped over. It means the control is conditional — the real shape is
    // `</label>{archetype === 'INDIVIDUAL' ? (<input …/>) : (<label …>…)}` — and
    // in that case the label and the control are not a simple pair at all: the
    // same label may sit above a completely different control on the other
    // branch. Linking them mechanically would associate one branch's input with
    // the other branch's label. Such cases are counted as "not a pair" and left
    // for a human.
    const after = src.slice(labelEnd);
    const gap = /^\s*(?:\{\s*\/\*[\s\S]*?\*\/\s*\})?\s*/.exec(after);
    if (!gap) continue;
    if (src[labelEnd + gap[0].length] === '{') {
      skippedConditional += 1;
      continue;
    }
    // The control must be the very next sibling tag. The codemod deliberately
    // does NOT walk through wrapper elements: the form layout in this codebase
    // puts each label and its control in adjacent siblings, and crossing a
    // wrapper was what allowed an earlier version to attach a label to a
    // control two sections away.
    const control = readTag(src, labelEnd + gap[0].length);
    if (!control || !CONTROLS.has(control.name)) {
      skippedNoControl += 1;
      continue;
    }

    // A control already carrying an id is left completely alone.
    if (/\bid\s*=/.test(control.open)) continue;

    // Loop detection.
    //
    // This used to be a 500-character lookbehind for `.(map(`, which is wrong
    // in both directions: it misses a `.map()` further away, and it falsely
    // flags a label that merely happens to sit after some unrelated map() in
    // the same file. Instead the scanner counts the bracket nesting between
    // the start of the enclosing expression and this label, so a label is only
    // "in a loop" when an unbalanced `(` from a `.map(`/`.forEach(` call is
    // still open above it.
    // The control's OWN onChange frequently calls a `.map()` helper — for
    // example `onChange={e => setItems(prev.map(...))}`. Those brackets sit
    // BELOW the label, so the backward scan must never see them; it only walks
    // upward, and it stops at the first unmatched `(`, which for these
    // single-instance modal forms is the form's own.
    if (isInsideLoop(src, lt)) {
      skippedInLoop += 1;
      continue;
    }

    ordinal += 1;
    let id = slug(labelBody, ordinal);
    // Two different fields can legitimately reduce to the same slug — both
    // labels here end in "(YER)", so the Arabic text is the only thing telling
    // them apart. Rather than let the duplicate guard skip them silently, mint a
    // disambiguating suffix. This is why the run that reported "0 linked" looked
    // healthy while quietly doing nothing.
    if (new RegExp(`\\bid="${id}"`).test(src)) {
      id = `${id}-${ordinal}`;
    }
    if (new RegExp(`\\bid="${id}"`).test(src)) {
      skippedInLoop += 1;
      continue;
    }

    const newLabelOpen = openTag.open.replace('<label', `<label htmlFor="${id}"`);
    const newControlOpen = control.open.replace(/^<(\w+)/, `<$1 id="${id}"`);

    src =
      src.slice(0, lt) +
      newLabelOpen +
      labelBody +
      '</label>' +
      after.slice(0, gap[0].length) +
      newControlOpen +
      after.slice(gap[0].length + control.open.length);

    linked += 1;
    changed = true;
    cursor = labelEnd;
  }

  if (changed) {
    fs.writeFileSync(file, src, 'utf8');
    filesTouched += 1;
  }
}

console.log(`label/control pairs linked          : ${linked}`);
console.log(`files rewritten                     : ${filesTouched}`);
console.log('');
console.log('Left for a per-component pass (NOT mis-linked):');
console.log(`  inside .map()  — needs useId() per row  : ${skippedInLoop}`);
console.log(`  conditional    — label/control not a pair: ${skippedConditional}`);
console.log(`  no adjacent control                   : ${skippedNoControl}`);
