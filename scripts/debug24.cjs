// debug24: exact probe for the 3 failing files' unmatched tokens
const fs = require('fs');
const { tokenize, extractAllStrings, allowAtQmark } = require('./restore_match_core.cjs');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const all = extractAllStrings(chunkTxt);
const strings = all.map(x => x.s);

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

for (const file of ['src/components/NexoraPerspectiveWrapper.tsx', 'src/components/ApprovalWorkflowView.tsx', 'src/components/FloatingMobileFAB.tsx']) {
  const src = fs.readFileSync(file, 'utf8');
  const tokens = tokenize(src).filter(t => /\?{2,}/.test(t.content));
  console.log('=== ' + file + ' (' + tokens.length + ' damaged-ish) ===');
  tokens.forEach((t, i) => {
    let hits = 0, first = -1;
    for (let c = 0; c < strings.length; c++) {
      if (matchOk(t, strings[c])) { hits++; if (first < 0) first = c; }
    }
    console.log('t' + i, 'len=' + t.len, 'hits=' + hits, JSON.stringify(t.content.slice(0, 50)));
    if (hits > 0 && hits < 4) {
      for (let c = 0, n = 0; c < strings.length && n < 3; c++) {
        if (matchOk(t, strings[c])) { console.log('   ->', c, JSON.stringify(strings[c].slice(0, 60))); n++; }
      }
    }
  });
}