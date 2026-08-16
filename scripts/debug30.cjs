const m = require('./restore_match_core.cjs');
const fs = require('fs');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const allStrings = m.extractAllStrings(chunkTxt);
const strings = allStrings.map(x => x.s);
const bset = new Set(strings);
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const toks = m.tokenize(src);
const dam = toks.filter(t => {
  if (!/\?{2,}/.test(t.content)) return false;
  if (bset.has(t.content)) return false;
  if (t.type === 'tpl') {
    const reg = src.slice(t.start, t.start + t.len);
    const inner = m.tokenize(reg).filter(x => /\?{2,}/.test(x.content) && !bset.has(x.content));
    return inner.length > 0;
  }
  if (t.content.indexOf('?') > 24) return false;
  if (t.start > 0 && !(src[t.start - 1] === "'" || src[t.start - 1] === '"' || src[t.start - 1] === '`')) return false;
  return true;
});
console.log('all toks', toks.length, 'damaged', dam.length);
dam.forEach(t => console.log(t.type, t.start, 'len=' + t.len, JSON.stringify(t.content.slice(0, 50))));