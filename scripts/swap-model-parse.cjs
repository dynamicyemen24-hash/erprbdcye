// One-shot: route all Gemini JSON.parse sites through parseModelJson.
const fs = require('fs');
const p = 'src/server/routes/v2/gemini.routes.ts';
const raw = fs.readFileSync(p, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
const L = (n) => lines[n - 1];
function expectContains(n, frag) {
  if (!L(n).includes(frag)) throw new Error(`line ${n} mismatch: ${L(n).trim().slice(0, 80)}`);
}
function swap(n, from, to) {
  expectContains(n, from);
  lines[n - 1] = L(n).replace(from, to);
  console.log('swapped line', n);
}
// parse-receipt
swap(128, 'JSON.parse(parsedText)', "parseModelJson(parsedText, 'parse-receipt')");
// copilot
swap(290, 'JSON.parse(responseText)', "parseModelJson(responseText, 'copilot')");
// predictive-budgeting
swap(350, 'const forecast = JSON.parse(cleanText);', "const forecast = parseModelJson(cleanText, 'predictive-budgeting');");
// forensic-audit
swap(391, 'const findings = JSON.parse(cleanText);', "const findings = parseModelJson(cleanText, 'forensic-audit');");
// strategic-risk-simulator
swap(413, 'const data = JSON.parse(cleanText);', "const data = parseModelJson(cleanText, 'strategic-risk-simulator');");
// resource-optimizer
swap(435, 'const data = JSON.parse(cleanText);', "const data = parseModelJson(cleanText, 'resource-optimizer');");
// vendor-recommendation
swap(457, 'const data = JSON.parse(cleanText);', "const data = parseModelJson(cleanText, 'vendor-recommendation');");
// hr-performance-matrix
swap(479, 'const data = JSON.parse(cleanText);', "const data = parseModelJson(cleanText, 'hr-performance-matrix');");
// anomaly-detection
swap(629, `JSON.parse(response.text || '{"anomalies":[]}')`, "parseModelJson(response.text || '{\"anomalies\":[]}', 'anomaly-detection')");
// financial-audit
swap(731, `JSON.parse(response.text || '{"audits":[]}')`, "parseModelJson(response.text || '{\"audits\":[]}', 'financial-audit')");
// predictive-impact
swap(830, `JSON.parse(response.text || '{}')`, "parseModelJson(response.text || '{}', 'predictive-impact')");
// smart-rebalance
swap(930, `JSON.parse(response.text || '{}')`, "parseModelJson(response.text || '{}', 'smart-rebalance')");
// stakeholder-pulse
swap(1007, `JSON.parse(response.text || '{}')`, "parseModelJson(response.text || '{}', 'stakeholder-pulse')");
fs.writeFileSync(p, lines.join(eol), { encoding: 'utf8' });
console.log('all swaps applied');
