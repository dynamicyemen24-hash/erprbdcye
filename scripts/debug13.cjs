// debug13: dump unmatched tokens of AboutSystemModal + close candidates
const fs = require('fs');
const { tokenize, extractChunkStrings, AR } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const dir = 'dist/assets';
const chunkTxt = fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(dir + '/' + f, 'utf8')).join('\n');
const strings = extractChunkStrings(chunkTxt);
const tokens = tokenize(src).filter(t => /\?{2,}/.test(t.content));
console.log('tokens:', tokens.length, 'strings:', strings.length);

function matchScore(tok, s) {
  if (s.length !== tok.len) return 0;
  const content = tok.content;
  let runStart = -1;
  let arabicOk = true;
  for (let p = 0; p <= content.length && arabicOk; p++) {
    const isQ = content[p] === '?';
    if (isQ && runStart === -1) runStart = p;
    if ((!isQ || p === content.length) && runStart !== -1) {
      if (p - runStart >= 2) {
        for (let k = runStart; k < p; k++) if (!AR.test(s[k])) { arabicOk = false; break; }
      }
      runStart = -1;
    }
    if (!isQ && p < content.length && content[p] !== s[p]) arabicOk = false;
  }
  return arabicOk ? 1 : 0;
}

tokens.forEach((t, i) => {
  let hits = 0, first = -1;
  for (let c = 0; c < strings.length; c++) if (matchScore(t, strings[c])) { hits++; if (first < 0) first = c; }
  if (hits > 0) return;
  // show close candidates: same length
  const close = [];
  for (let c = 0; c < strings.length && close.length < 4; c++) {
    if (strings[c].length === t.len && AR.test(strings[c][0])) close.push(strings[c]);
  }
  console.log('UNMATCHED t' + i, 'len=' + t.len, JSON.stringify(t.content));
  console.log('   same-len arabic samples:', JSON.stringify(close));
});