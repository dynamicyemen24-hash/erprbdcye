// debug7: dump every '?'-containing token with exact source offset, and raw surroundings
const fs = require('fs');
const { tokenize } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/GlobalEnterpriseHeader.tsx', 'utf8');
const lines = src.split('\n');
function lineOf(pos) {
  let off = 0;
  for (let k = 0; k < lines.length; k++) {
    off += lines[k].length + 1;
    if (pos < off) return k + 1;
  }
  return -1;
}
const toks = tokenize(src).filter(t => t.content.includes('?'));
toks.forEach((t, i) => {
  console.log(i, 'type=' + t.type, 'len=' + t.len, 'line=' + lineOf(t.start), 'raw=' + JSON.stringify(src.slice(t.start, t.start + t.len)));
});