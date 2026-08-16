// debug20: ordered bundle strings around the AboutSystemModal emoji anchors, and the emoji-run tokens' true candidates
const fs = require('fs');
const { tokenize, extractAllStrings } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const all = extractAllStrings(chunkTxt);
const strings = all.map(x => x.s);
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
        for (let k = runStart; k < p; k++) if (!ALLOW2(s[k])) return false;
      }
      runStart = -1;
    }
    if (!isQ && p < content.length && content[p] !== s[p]) return false;
  }
  return true;
}
function ALLOW2(c) { return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u2190-\u2BFF\u2000-\u206F\uFE0F\u200D\u00A0\uD800-\uDFFF\u1F000-\u1FAFF]/.test(c); }

tokens.forEach((t, i) => {
  if (!/\?{2,}/.test(t.content)) return;
  const hits = [];
  const byLen = new Map();
  strings.forEach((s, c) => {
    if (s.length !== t.len) return;
    (byLen.get(s.length) || (byLen.set(s.length, []), byLen.get(s.length))).push(c);
  });
  for (const c of (byLen.get(t.len) || [])) if (matchOk(t, strings[c])) hits.push(c);
  console.log('t' + i, 'len=' + t.len, 'cand=' + hits.length, JSON.stringify(t.content.slice(0, 40)));
  hits.slice(0, 3).forEach(c => console.log('    idx=' + c, JSON.stringify(strings[c].slice(0, 45))));
});