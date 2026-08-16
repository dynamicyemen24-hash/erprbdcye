// debug28: verify tpl pass writes replace correctly
const fs = require('fs');
const { tokenize, extractAllStrings } = require('./restore_match_core.cjs');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const strings = extractAllStrings(chunkTxt).map(x => x.s);
const bset = new Set(strings);
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');

const tokens = tokenize(src).filter(t => t.type === 'tpl' && /\?{2,}/.test(t.content));
let out = src;
let count = 0;
tokens.forEach(t => {
  const region = out.slice(t.start, t.start + t.len);
  const inner = tokenize(region).filter(x => /\?{2,}/.test(x.content) && !bset.has(x.content));
  if (!inner.length) { console.log('no inner damaged for tpl len=' + t.len); return; }
  let ro = region;
  inner.forEach(x => {
    const windowSet = new Set(strings.filter(s => s.length === x.len));
    const candidates = [...windowSet].filter(s => _matchOk(x, s));
    if (candidates.length === 1) {
      ro = ro.slice(0, x.start) + candidates[0] + ro.slice(x.start + x.len);
      count++;
    }
  });
  out = out.replace(region, ro);
});
console.log('replaced inner:', count);
const check = out.split('\n').find(l => l.includes('System Overview'));
console.log('line:', check ? check.trim() : 'NOT FOUND');

function _matchOk(tok, s) {
  if (s.length !== tok.len) return false;
  const content = tok.content;
  let runStart = -1;
  for (let p = 0; p <= content.length; p++) {
    const isQ = content[p] === '?';
    if (isQ && runStart === -1) runStart = p;
    if ((!isQ || p === content.length) && runStart !== -1) {
      if (p - runStart >= 2) { /* allowAtQmark check skipped */ }
      runStart = -1;
    }
    if (!isQ && p < content.length && content[p] !== s[p]) return false;
  }
  return true;
}