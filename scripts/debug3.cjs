// debug3: show tokens and search chunk for known strings
const fs = require('fs');
const { tokenize, extractChunkStrings } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/GlobalEnterpriseHeader.tsx', 'utf8');
const js = fs.readFileSync('dist/assets/index-CwBPT2vl.js', 'utf8');
const strings = extractChunkStrings(js);

const tokens = tokenize(src).filter(t => /\?{2,}/.test(t.content));
console.log('--- damaged tokens ---');
tokens.forEach((t, i) => {
  console.log(i, 'len=' + t.len, JSON.stringify(t.content.slice(0, 80)));
});
console.log('--- chunk strings containing تصغير or تكبير ---');
strings.forEach((s, i) => {
  if (s.includes('تصغير') || s.includes('تكبير')) console.log(i, 'len=' + s.length, JSON.stringify(s));
});
console.log('total chunk strings:', strings.length);
console.log('--- a sample of chunk strings ---');
for (let i = 0; i < 15; i++) console.log(i, JSON.stringify(strings[i].slice(0, 60)));