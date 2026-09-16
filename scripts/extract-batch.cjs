const fs = require('fs');
const src = fs.readFileSync('src/server/database/enterprise_schema_completion.ts', 'utf8');
const lines = src.split('\n');
// 16th `await client.query(` call (1-indexed among matches)
const callLines = [];
lines.forEach((x, i) => {
  if (/await client\.query\(`/.test(x)) callLines.push(i);
});
console.log('total calls:', callLines.length);
// Find enclosing template: from target line to the closing backtick + );
const wanted = 14; // 0-indexed among template calls -> the revenue_batches batch
const target = callLines[wanted];
console.log('wanted batch call at line:', target + 1);
let end = target;
// Template literals here contain no backticks, so the next backtick ends it
for (let i = target + 1; i < lines.length; i++) {
  if (lines[i].includes('`')) {
    end = i;
    break;
  }
}
console.log('block lines:', target + 1, 'to', end + 1);
const block = lines.slice(target, end + 1).join('\n');
fs.writeFileSync('batch16.sql', block);
const idx = [];
let p = -1;
while ((p = block.indexOf('//', p + 1)) !== -1) idx.push(p);
console.log('// occurrences in block:', idx.length);
idx.slice(0, 8).forEach((pos) => {
  console.log('--- at', pos, JSON.stringify(block.slice(Math.max(0, pos - 100), pos + 60)));
});
