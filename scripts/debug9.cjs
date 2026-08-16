// debug9: tokenize an isolated snippet identical to line 92
const { tokenize } = require('./restore_match_core.cjs');
const snippet = `title={isRtl ? '??????? ?????????' : 'Operational Menu'}`;
const toks = tokenize(snippet);
toks.forEach(t => console.log('type=' + t.type, 'len=' + t.len, JSON.stringify(t.content)));
console.log('---now from real file---');
const fs = require('fs');
const src = fs.readFileSync('src/components/GlobalEnterpriseHeader.tsx', 'utf8');
const toks2 = tokenize(src).filter(t => t.start >= 3950 && t.start < 4020);
toks2.forEach(t => console.log('start=' + t.start, 'len=' + t.len, JSON.stringify(t.content.slice(0, 40))));
console.log('char at 3992 in src:', src.charCodeAt(3992));