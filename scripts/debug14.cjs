// debug14: for pure-Arabic unmatched tokens, list ALL chunk candidates under rigid matcher + relaxed probes
const fs = require('fs');
const { tokenize, extractChunkStrings, AR } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const strings = extractChunkStrings(chunkTxt);
const tokens = tokenize(src).filter(t => /\?{2,}/.test(t.content));

function candidatesOf(tok, mode) {
  const out = [];
  for (const s of strings) {
    let pass = s.length === tok.len;
    if (!pass) continue;
    if (mode === 'relaxed') {
      for (let p = 0; p < tok.len; p++) {
        const c = tok.content[p];
        if (c === ' ' && s[p] !== ' ') { pass = false; break; }
        if (c !== ' ' && c !== '?' && c !== s[p]) { pass = false; break; }
      }
      if (pass && !/\s{2,}/.test(s)) { /* allow */ }
    }
    if (pass) out.push(s);
  }
  return out;
}

[1, 7, 13, 25].forEach(i => {
  const t = tokens[i];
  const rigid = candidatesOf(t, 'rigid');
  const relaxed = candidatesOf(t, 'relaxed');
  console.log('t' + i, JSON.stringify(t.content), 'len=' + t.len);
  console.log('  rigid:', rigid.length);
  rigid.slice(0, 6).forEach(s => console.log('    ' + JSON.stringify(s)));
  console.log('  relaxed:', relaxed.length);
  relaxed.slice(0, 6).forEach(s => console.log('    ' + JSON.stringify(s)));
});