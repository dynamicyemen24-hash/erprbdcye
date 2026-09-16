const fs = require('fs');
const f = 'src/server/database/enterprise_schema_completion.ts';
const lines = fs.readFileSync(f, 'utf8').split('\n');
// Find template blocks: `await client.query(` ... closing backtick line
const blocks = [];
let cur = null;
lines.forEach((x, i) => {
  if (/await client\.query\(`/.test(x)) cur = { start: i + 1, lines: [] };
  else if (cur && x.includes('`')) {
    cur.end = i + 1;
    blocks.push(cur);
    cur = null;
  }
});
console.log('template blocks:', blocks.length);
blocks.forEach((b, bi) => {
  for (let i = b.start; i < b.end - 1; i++) {
    if (/^\s*\/\//.test(lines[i])) {
      console.log(`block#${bi + 1} line ${i + 1}: ${lines[i].trim().slice(0, 70)}`);
    }
  }
});
