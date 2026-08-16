const m = require('./restore_match_core.cjs');
const snippet = 'X`????? ${s.step}` : `Stage ${s.step}`Y';
const src = 'A' + snippet + 'B';
const toks = m.tokenize(src);
toks.forEach(t => console.log(t.type, t.start, 'len=' + t.len, JSON.stringify(t.content)));