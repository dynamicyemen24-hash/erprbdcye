// debug6: instrument tokenizer on the exact first string of line 92
const fs = require('fs');
const src = fs.readFileSync('src/components/GlobalEnterpriseHeader.tsx', 'utf8');

// find `isRtl ? '` on line 92 region and walk the string manually
const lineStart = src.indexOf("title={isRtl ? '");
const q = lineStart + src.slice(lineStart).indexOf("'");
console.log('string starts at', q);
let segment = '';
for (let i = q + 1; i < q + 80; i++) {
  const c = src[i];
  if (c === "'") break;
  segment += c;
}
console.log('manual segment length:', Array.from(segment).length);
console.log('manual segment:', JSON.stringify(segment));
console.log('chars:', Array.from(segment, c => c.charCodeAt(0)).join(','));
console.log('question count:', (segment.match(/\?/g) || []).length);

// now run the real tokenizer and print the token that starts at q
const { tokenize } = require('./restore_match_core.cjs');
const toks = tokenize(src);
const t = toks.find(x => x.start === q || (x.start < q && x.start + x.len > q));
console.log('found token start=' + (t && t.start), 'len=' + (t && t.len));
if (t) {
  console.log('raw slice:', JSON.stringify(src.slice(t.start, t.start + t.len)));
  console.log('content:', JSON.stringify(t.content));
  console.log('runs:', JSON.stringify((t.content.match(/\?+/g) || []).map(r => r.length)));
}