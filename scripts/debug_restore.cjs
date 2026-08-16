// debug header: dump tokens + candidate strings
const fs = require('fs');
const src = fs.readFileSync('src/components/GlobalEnterpriseHeader.tsx', 'utf8');

function tokenizeSimple(source) {
  const runs = [];
  let i = 0, n = source.length, state = 'code';
  while (i < n) {
    const c = source[i];
    if (state === 'code') {
      if (c === "'") { state = 'sq'; i++; continue; }
      if (c === '"') { state = 'dq'; i++; continue; }
      if (c === '`') { state = 'tpl'; i++; continue; }
      if (c === '/' && source[i + 1] === '/') { while (i < n && source[i] !== '\n') i++; continue; }
      if (c === '/' && source[i + 1] === '*') { i += 2; while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i++; i += 2; continue; }
      i++; continue;
    }
    const q = state === 'sq' ? "'" : (state === 'dq' ? '"' : '`');
    let seg = '', st = i;
    while (i < n) {
      const c2 = source[i];
      if (c2 === '\\') { seg += source.slice(st, i) + c2 + (source[i + 1] || ''); i += 2; st = i; continue; }
      if (c2 === q) { seg += source.slice(st, i); i++; break; }
      if (state === 'tpl' && c2 === '$' && source[i + 1] === '{') {
        seg += source.slice(st, i);
        if (seg.includes('?')) runs.push(seg);
        let d = 1; i += 2;
        while (i < n && d > 0) { if (source[i] === '{') d++; if (source[i] === '}') d--; i++; }
        seg = ''; st = i; continue;
      }
      i++;
    }
    if (seg.includes('?')) runs.push(seg);
    state = 'code';
  }
  return runs;
}

const tokens = tokenizeSimple(src);
console.log('tokens with ?:', tokens.length);
tokens.slice(0, 60).forEach((r, x) => console.log(x, JSON.stringify(r), 'len=' + r.length));

const js = fs.readFileSync('dist/assets/index-CwBPT2vl.js', 'utf8');
const AR = /[\u0600-\u06FF]/;
const strs = [];
const re = /"((?:[^"\\]|\\.)*)"/g;
let m;
while ((m = re.exec(js))) {
  let s = m[1];
  s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  if (AR.test(s)) strs.push(s);
}
console.log('chunk arabic strings:', strs.length);
console.log('sample of chunk strings:', JSON.stringify(strs.slice(0, 15)));
console.log('contains تصغير الشاشة:', strs.indexOf('تصغير الشاشة'));
console.log('contains تكبير الشاشة:', strs.indexOf('تكبير الشاشة'));