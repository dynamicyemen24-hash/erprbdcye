const fs = require('fs');
const content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');
const lines = content.split('\n');

const kpiStart = lines.findIndex(l => l.includes('{/* Executive KPIs & Financial Dashboard Metrics */}'));
const kpiEnd = lines.findIndex((l, i) => i > kpiStart && l.includes('{/* Dynamic Management Performance Cockpit */}')) + 104; // it's around 100 lines more

// Let's just find the exact lines
const startLine = 1622;
const endLine = 1812;

const kpis = lines.slice(startLine - 1, endLine);
const remainingLines = [
  ...lines.slice(0, 1012), // Before RE-ENGINEERED EXPERT OPERATIONS
  ...kpis,
  ...lines.slice(1012, startLine - 1),
  ...lines.slice(endLine)
];

fs.writeFileSync('src/components/DashboardView.tsx', remainingLines.join('\n'));
