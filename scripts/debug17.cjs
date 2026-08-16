// debug17: verify chunk adjacency of the English/ARAB pairs around the AboutSystemModal anchors
const fs = require('fs');
const { extractChunkStrings } = require('./restore_match_core.cjs');
const chunkTxt = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
const strings = extractChunkStrings(chunkTxt);

const probes = [
  'Planning & Setting Goals',
  'Budget Allocation & Expenditure Tracking',
  'Field Execution & Team Follow-Up',
  'Serving Beneficiaries & Delivering Support',
  'Reviewing Results & Generating Reports',
  'Introductory Video',
  'Service Health & Telemetry',
  'Support & Shortcuts',
  'System Overview',
  'Universal Enterprise OS',
  'Current User',
  'System User',
];
for (const p of probes) {
  const idx = strings.findIndex(s => s === p);
  console.log(p, '=>', idx, idx >= 0 ? 'prev=' + JSON.stringify(strings[idx - 1]) : '');
}