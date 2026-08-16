// debug16: raw region around English-merged tokens
const fs = require('fs');
const { tokenize } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const toks = tokenize(src).filter(t => /\?{2,}/.test(t.content));
const t2 = toks.find(t => t.content.startsWith('?? Planning'));
console.log('t2 start:', t2.start);
const region = src.slice(t2.start - 40, t2.start + t2.len + 40);
console.log(JSON.stringify(region));
console.log('---');
const t33 = toks.find(t => t.content.includes('Introductory'));
if (t33) console.log(JSON.stringify(src.slice(t33.start - 60, t33.start + 120)));