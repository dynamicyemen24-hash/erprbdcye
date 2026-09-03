const fs = require('fs');
const pat = /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\uFE0F){1,}/gu;
const files = [
  'd:/Projects26/NexoraOS/src/features/finance/EndowmentInvestmentGovernanceSuite.tsx',
  'd:/Projects26/NexoraOS/src/features/finance/ConsolidatedStatementsTab.tsx',
  'd:/Projects26/NexoraOS/src/features/finance/CFOExecutiveAuditSuite.tsx',
  'd:/Projects26/NexoraOS/src/features/finance/BatchLedgerAutomationEngine.tsx',
  'd:/Projects26/NexoraOS/src/features/finance/FinanceOperationsControlBar.tsx',
  'd:/Projects26/NexoraOS/src/features/finance/ReverseEntryModal.tsx',
  'd:/Projects26/NexoraOS/src/components/finance/FinancialBIAnalyticsTab.tsx',
  'd:/Projects26/NexoraOS/src/components/finance/FinancialStatementsTab.tsx',
  'd:/Projects26/NexoraOS/src/components/finance/ManagementAccountingTab.tsx',
  'd:/Projects26/NexoraOS/src/components/finance/FinancialClosingsTab.tsx',
  'd:/Projects26/NexoraOS/src/components/finance/BudgetVarianceTab.tsx',
  'd:/Projects26/NexoraOS/src/components/finance/AccountStatementTab.tsx',
  'd:/Projects26/NexoraOS/src/components/finance/VoucherEntryTab.tsx',
  'd:/Projects26/NexoraOS/src/components/finance/HighValueDisbursementModal.tsx',
  'd:/Projects26/NexoraOS/src/components/finance/PrintableOfficialVoucherModal.tsx',
];
let total = 0;
files.forEach((f) => {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    const m = l.match(pat);
    if (m && m.some((s) => /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{FE0F}]/u.test(s))) {
      total++;
      console.log(`${f}:${i + 1} >>> ${l.trim().slice(0, 140)}`);
    }
  });
});
console.log(`TOTAL=${total}`);