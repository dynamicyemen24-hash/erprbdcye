// debug26: trace tpl pass
const fs = require('fs');
const { tokenize, extractAllStrings } = require('./restore_match_core.cjs');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const strings = extractAllStrings(chunkTxt).map(x => x.s);
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const allTokens = tokenize(src);

// replicate main() filters (from restore_arabic.cjs)
const bset = new Set(strings);
function isDamagedInSrc(tok, src) {
  if (!/\?{2,}/.test(tok.content)) return false;
  if (bset.has(tok.content)) return false;
  if (tok.content.indexOf('?') > 24) return false;
  if (tok.start > 0 && !(src[tok.start - 1] === "'" || src[tok.start - 1] === '"' || src[tok.start - 1] === '`')) return false;
  return true;
}
const tokens = allTokens.filter(t => isDamagedInSrc(t, src));
console.log('damaged tokens:', tokens.length);
tokens.forEach((t, i) => {
  const region = src.slice(t.start, t.start + t.len);
  const inner = tokenize(region).filter(x => /\?{2,}/.test(x.content) && x.content.indexOf('?') <= 24 && (x.start === 0 || region[x.start - 1] === "'" || region[x.start - 1] === '"' || region[x.start - 1] === '`'));
  console.log('t' + i, t.type, 'len=' + t.len, 'inner=' + inner.length);
});