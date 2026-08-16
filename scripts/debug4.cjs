// debug4: exact diff between damaged tokens and chunk window near known anchors
const fs = require('fs');
const { tokenize, extractChunkStrings, AR } = require('./restore_match_core.cjs');
const src = fs.readFileSync('src/components/GlobalEnterpriseHeader.tsx', 'utf8');
const js = fs.readFileSync('dist/assets/index-CwBPT2vl.js', 'utf8');
const strings = extractChunkStrings(js);

const lines = src.split('\n');
const tokens = tokenize(src).filter(t => /\?{2,}/.test(t.content));
console.log('--- tokens with source lines ---');
tokens.forEach((t, i) => {
  let li = 0, off = 0;
  for (let k = 0; k < lines.length; k++) { off += lines[k].length + 1; if (t.start < off) { li = k; break; } }
  console.log('\n[token ' + i + '] len=' + t.len + ' line=' + (li + 1));
  console.log('  raw   :', JSON.stringify(t.content));
  console.log('  line  :', JSON.stringify(lines[li].trim()));
});
console.log('\n--- chunk window around 905..925 ---');
for (let k = 900; k < 926 && k < strings.length; k++) {
  console.log(k, JSON.stringify(strings[k]));
}