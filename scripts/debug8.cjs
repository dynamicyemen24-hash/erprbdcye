// debug8: charcodes around token 0 and 7 termination points
const fs = require('fs');
const { tokenize } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/GlobalEnterpriseHeader.tsx', 'utf8');
const toks = tokenize(src).filter(t => t.content.includes('?'));
for (const idx of [0, 7]) {
  const t = toks[idx];
  const seg = Array.from(src.slice(t.start, t.start + t.len + 8), c => c.charCodeAt(0));
  console.log('token' + idx, 'len=' + t.len, 'chars@[' + t.start + '..' + (t.start + t.len + 7) + ']:');
  console.log(seg.join(','));
  const tail = src.slice(t.start + t.len - 5, t.start + t.len + 8);
  console.log('tail repr:', JSON.stringify(tail));
}