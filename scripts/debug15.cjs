// debug15: candidate counts + end chain info for AboutSystemModal
const fs = require('fs');
const { tokenize, extractChunkStrings, ALLOW_AT_QMARK } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const strings = extractChunkStrings(chunkTxt);
const tokens = tokenize(src).filter(t => /\?{2,}/.test(t.content));
console.log('tokens:', tokens.length, 'strings:', strings.length);

function matchOk(tok, s) {
  if (s.length !== tok.len) return false;
  const content = tok.content;
  let runStart = -1;
  for (let p = 0; p <= content.length; p++) {
    const isQ = content[p] === '?';
    if (isQ && runStart === -1) runStart = p;
    if ((!isQ || p === content.length) && runStart !== -1) {
      if (p - runStart >= 2) {
        for (let k = runStart; k < p; k++) if (!ALLOW_AT_QMARK.test(s[k])) return false;
      }
      runStart = -1;
    }
    if (!isQ && p < content.length && content[p] !== s[p]) return false;
  }
  return true;
}

const byLen = new Map();
strings.forEach((s, c) => {
  const b = byLen.get(s.length) || [];
  b.push(c);
  byLen.set(s.length, b);
});

tokens.forEach((t, i) => {
  const b = byLen.get(t.len) || [];
  const hits = b.filter(c => matchOk(t, strings[c]));
  console.log(i, 'len=' + t.len, 'cand=' + hits.length, JSON.stringify(t.content.slice(0, 40)),
    hits.slice(0, 3).map(c => JSON.stringify(strings[c].slice(0, 30))).join(' | '));
});