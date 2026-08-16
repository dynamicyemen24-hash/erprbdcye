const fs = require('fs');
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
let out = '';
for (let p = 18050; p < 18110 && p < src.length; p++) {
  const c = src[p];
  out += (p === 18050 ? '' : ' ') + p + ':' + JSON.stringify(c);
}
console.log(out);
console.log('---line356---');
const lines = src.split('\n');
let acc = 0;
for (let i = 354; i < 358; i++) { console.log('line' + (i + 1), 'at', acc, JSON.stringify(lines[i].slice(0, 60))); acc += lines[i].length + 1; }