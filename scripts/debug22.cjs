// debug22: raw region of ChartContainer's damaged token
const fs = require('fs');
const { tokenize } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/enterprise/charts/ChartContainer.tsx', 'utf8');
const toks = tokenize(src).filter(t => /\?{2,}/.test(t.content));
toks.forEach((t, i) => {
  console.log('token' + i, t.type, 'len=' + t.len);
  console.log(src.slice(t.start, t.start + Math.min(t.len, 500)));
  console.log('-----');
});