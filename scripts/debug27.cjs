// debug27: exact tpl-pass replication
const fs = require('fs');
const { tokenize, extractAllStrings, allowAtQmark } = require('./restore_match_core.cjs');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const strings = extractAllStrings(chunkTxt).map(x => x.s);
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');

const bset = new Set(strings);
function isDamagedInSrc(tok, src) {
  if (!/\?{2,}/.test(tok.content)) return false;
  if (bset.has(tok.content)) return false;
  if (tok.content.indexOf('?') > 24) return false;
  return true;
}
const tokens = tokenize(src).filter(t => isDamagedInSrc(t, src));
console.log('tokens:', tokens.length);

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

// all tokens as "damaged" (file already restored except giants...) — force by scanning ALL tokens with ?-runs
const all = tokenize(src).filter(t => /\?{2,}/.test(t.content));
console.log('all ?-tokens:', all.length);
all.forEach((t, i) => {
  if (t.type !== 'tpl') return;
  const region = src.slice(t.start, t.start + t.len);
  const inner = tokenize(region).filter(x => /\?{2,}/.test(x.content));
  console.log('TPL t' + i, 'len=' + t.len, 'inner=' + inner.length);
  inner.forEach(x => console.log('   inner', x.start, 'len=' + x.len, JSON.stringify(x.content.slice(0, 40))));
});