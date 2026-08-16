// debug25: (a) C-Suite presence in bundle, (b) trailing-space 13-char strings, (c) mtimes
const fs = require('fs');
const { extractAllStrings } = require('./restore_match_core.cjs');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const all = extractAllStrings(chunkTxt);
const strings = all.map(x => x.s);

console.log('--- C-Suite ---');
let n = 0;
strings.forEach((s, i) => { if (s.includes('C-Suite')) { n++; if (n <= 6) console.log(i, JSON.stringify(s)); } });
console.log('count:', n);
console.log('--- len-13 ending with space, spaces at 3,8 ---');
n = 0;
strings.forEach((s, i) => {
  if (s.length === 13 && s.endsWith(' ') && s[3] === ' ' && s[8] === ' ' && /\s/.test(s)) {
    n++;
    if (n <= 8) console.log(i, JSON.stringify(s));
  }
});
console.log('count:', n);
console.log("--- len-5 ':' at 3 ending space ---");
n = 0;
strings.forEach((s, i) => {
  if (s.length === 5 && s[3] === ':' && s[4] === ' ') { n++; if (n <= 8) console.log(i, JSON.stringify(s)); }
});
console.log('count:', n);
console.log('--- mtimes ---');
const files = ['src/components/NexoraPerspectiveWrapper.tsx', 'src/components/ApprovalWorkflowView.tsx', 'src/components/FloatingMobileFAB.tsx', 'dist/assets/index-CwBPT2vl.js'];
for (const f of files) console.log(f, fs.existsSync(f) ? fs.statSync(f).mtime.toISOString() : 'MISSING');