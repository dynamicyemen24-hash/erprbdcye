const fs = require('fs');
const content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');
const lines = content.split('\n');

const kpiStart = lines.findIndex(l => l.includes('{/* Executive KPIs & Financial Dashboard Metrics */}'));
const kpiEnd = lines.findIndex((l, i) => i > kpiStart && l.includes('{/* Real-time Interactive Analytical Insights */}')) - 1; 

const kpis = lines.slice(kpiStart, kpiEnd + 1);
const opsStart = lines.findIndex(l => l.includes('{/* RE-ENGINEERED EXPERT OPERATIONS & SYSTEM ANALYTICS CENTER */}'));

const remainingLines = [
  ...lines.slice(0, opsStart),
  ...kpis,
  '\n',
  ...lines.slice(opsStart, kpiStart),
  ...lines.slice(kpiEnd + 1)
];

fs.writeFileSync('src/components/DashboardView.tsx', remainingLines.join('\n'));
