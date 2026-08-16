const m = require('./restore_match_core.cjs');
const fs = require('fs');
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const toks = m.tokenize(src);
console.log('total tokens', toks.length);
toks.forEach(t => {
  if (/\?{2,}/.test(t.content)) console.log(t.type, t.start, 'len=' + t.len, JSON.stringify(t.content.slice(0, 45)));
});