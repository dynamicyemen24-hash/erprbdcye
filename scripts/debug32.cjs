const fs = require('fs');
const src = fs.readFileSync('src/components/AboutSystemModal.tsx', 'utf8');
const backticks = (src.match(/`/g) || []).length;
console.log('backticks', backticks, 'odd?', backticks % 2);
// find unbalanced quote presence by scanning states
let state = 'code';
let i = 0;
let minI = -1;
while (i < src.length) {
  const ch = src[i];
  if (state === 'code') {
    if (ch === "'") state = 'sq';
    else if (ch === '"') state = 'dq';
    else if (ch === '`') state = 'tpl';
  } else if (ch === (state === 'sq' ? "'" : state === 'dq' ? '"' : '`')) {
    state = 'code';
  }
  i++;
  if (minI < 0 && i > 18000 && state === 'tpl') minI = i;
}
console.log('final state', state, 'tpl-start after 18000 at', minI);