// debug10: prove what the snippet bytes are
const { tokenize } = require('./restore_match_core.cjs');
const snippet = `title={isRtl ? '??????? ?????????' : 'Operational Menu'}`;
console.log('snapshot charcodes:');
console.log(Array.from(snippet, c => c.charCodeAt(0)).join(','));
console.log('len:', snippet.length);
const toks = tokenize(snippet);
console.log('tokens:', toks.map(t => t.start + ':' + t.len).join(' '));
console.log('token0 content charcodes:');
if (toks[0]) console.log(Array.from(toks[0].content, c => c.charCodeAt(0)).join(','));