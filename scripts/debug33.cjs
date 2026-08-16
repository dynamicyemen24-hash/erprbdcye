const m = require('./restore_match_core.cjs');
const fs = require('fs');
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const toks = m.tokenize(src);
console.log('total', toks.length);
toks.filter(t => t.start > 17500).forEach(t => console.log(t.type, t.start, 'len=' + t.len, JSON.stringify(t.content.slice(0, 40))));