// debug11: pairwise check against known window [908..921]
const fs = require('fs');
const { tokenize, extractChunkStrings, AR } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/GlobalEnterpriseHeader.tsx', 'utf8');
const js = fs.readFileSync('dist/assets/index-CwBPT2vl.js', 'utf8');
const strings = extractChunkStrings(js);
const tokens = tokenize(src).filter(t => /\?{2,}/.test(t.content));

function matchesAt(tok, s) {
  if (s.length !== tok.len) return false;
  const content = tok.content;
  let runStart = -1;
  for (let p = 0; p <= content.length; p++) {
    const isQ = content[p] === '?';
    if (isQ && runStart === -1) runStart = p;
    if ((!isQ || p === content.length) && runStart !== -1) {
      if (p - runStart >= 2) {
        for (let k = runStart; k < p; k++) if (!AR.test(s[k])) return false;
      }
      runStart = -1;
    }
    if (!isQ && p < content.length) {
      if (content[p] !== s[p]) return false;
    }
  }
  return true;
}

const window = [908, 909, 910, 911, 912, 913, 914, 915, 916, 917, 918, 919, 920, 921];
let ok = 0;
tokens.forEach((t, i) => {
  const ch = strings[window[i]];
  const m = matchesAt(t, ch);
  if (m) ok++;
  console.log((m ? 'MATCH' : 'FAIL '), 't' + i, 'tokLen=' + t.len, 'chLen=' + (ch ? ch.length : '?'),
    'tok=' + JSON.stringify(t.content), 'ch=' + JSON.stringify(ch));
});
console.log('matched', ok, '/', tokens.length);