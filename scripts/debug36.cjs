const fs = require('fs');
const t = fs.readFileSync('dist/assets/index-CwBPT2vl.js', 'utf8');
// find "Offline" and "Online" occurrences inside minified literals and show the preceding \u-escaped string
function unescapeJs(s) {
  return s.replace(/\\(u([0-9a-fA-F]{4}))/g, (m, a, h4) => String.fromCharCode(parseInt(h4, 16)));
}
for (const key of ['Offline', 'Online']) {
  let from = 0;
  while (true) {
    const i = t.indexOf('"' + key + '"', from);
    if (i < 0) break;
    const before = t.slice(Math.max(0, i - 320), i);
    const m = before.match(/(?:^|[,{:;)])"((?:\\.|[^"])*)",?$/);
    console.log(key, 'at', i, '->', m ? JSON.stringify(unescapeJs(m[1])) : '???');
    from = i + 1;
  }
}