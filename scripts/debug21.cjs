// debug21: why tpl pass fails
const fs = require('fs');
const { tokenize, extractAllStrings, allowAtQmark } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const strings = extractAllStrings(chunkTxt).map(x => x.s);
const tokens = tokenize(src).filter(t => /\?{2,}/.test(t.content));

function matchOk(tok, s) {
  if (s.length !== tok.len) return false;
  const content = tok.content;
  let runStart = -1;
  for (let p = 0; p <= content.length; p++) {
    const isQ = content[p] === '?';
    if (isQ && runStart === -1) runStart = p;
    if ((!isQ || p === content.length) && runStart !== -1) {
      if (p - runStart >= 2) {
        for (let k = runStart; k < p; k++) if (!allowAtQmark(s[k])) return false;
      }
      runStart = -1;
    }
    if (!isQ && p < content.length && content[p] !== s[p]) return false;
  }
  return true;
}
// compact align for probe
function alignProbe(inner, lo, hi) {
  const byLen = new Map();
  strings.forEach((s, c) => {
    if (c <= lo || c >= hi) return;
    const b = byLen.get(s.length) || [];
    b.push(c);
    byLen.set(s.length, b);
  });
  const cands = inner.map(t => (byLen.get(t.len) || []).filter(c => matchOk(t, strings[c])).sort((a, b) => a - b));
  console.log('  inner cand counts:', cands.map(c => c.length).join(','));
  cands.forEach((cl, i) => {
    console.log('   inner t' + i, 'len=' + inner[i].len, JSON.stringify(inner[i].content.slice(0, 40)), 'cands=' + cl.slice(0, 5).map(c => c + ':' + JSON.stringify(strings[c].slice(0, 25))).join(' | '));
  });
}

// main alignment indices for neighbors
function mainAlign() {
  // reuse quick: hardcode known: t31 -> 33948 (from debug20), others
  const known = new Map([[31, 33948]]);
  tokens.forEach((t, i) => {
    if (i < 32 || t.type !== 'tpl') return;
    const region = src.slice(t.start, t.start + t.len);
    const inner = tokenize(region).filter(x => /\?{2,}/.test(x.content));
    if (!inner.length) { console.log('t' + i, 'NO inner'); return; }
    console.log('t' + i, 'type=' + t.type, 'len=' + t.len, 'inner=' + inner.length);
    alignProbe(inner, 33948, Infinity);
  });
}
mainAlign();