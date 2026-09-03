/**
 * UAMEX ERP™ — NEB-10 Finance & Compliance OS
 * المحرك التحليلي المالي المعياري (Standard Financial Analytics Engine)
 *
 * المنهجية المعيارية المعتمدة (Standardized Methodology):
 *  - IPSAS: إطار إعداد التقارير المالية للقطاع العام.
 *  - Sphere / CHS: معايير العمل الإنساني لكفاءة الإنفاق الميداني المباشر (≥ 85% أفضل ممارسة، ≥ 70% حد أدنى).
 *  - Charity Governance Code: هامش النفقات الإدارية (≤ 15% أفضل ممارسة، ≤ 30% حد أعلى مقبول).
 *  - Reserve Best Practice: احتياطي تشغيلي يعادل 3–6 أشهر من المصروفات.
 *
 * مبدأ نزاهة البيانات (Data Integrity Principle):
 *  - يُمنع منعاً باتاً تلفيق أو محاكاة أرقام مالية. عند نقص البيانات يُرفع
 *    علم صريح (dataQuality flags) وتُعرض حالة "بيانات غير كافية" في الواجهة.
 */

// ─── Input Contracts (decoupled minimal shapes) ────────────────────────────

export interface AnalyticsAccount {
  id: string;
  account_code: string;
  name_ar?: string;
  name_en?: string;
  account_type: string;
  opening_balance?: string | number;
  current_balance?: string | number;
}

export interface AnalyticsLine {
  transaction_id: string;
  account_id: string;
  debit_amount?: string | number;
  credit_amount?: string | number;
  project_id?: string | null;
  description?: string;
  account_code?: string;
}

export interface AnalyticsTransaction {
  id: string;
  transaction_date: string;
  transaction_type?: string;
  total_debit?: string | number;
  total_credit?: string | number;
}

export interface AnalyticsProject {
  id: string;
  code?: string;
  name_ar?: string;
  name_en?: string;
  budget?: string | number;
}

export type RatioStatus = 'PASS' | 'WATCH' | 'FAIL' | 'N/A';

// ─── Output Contracts (IPSAS aggregation) ───────────────────────────────────

export interface IpsasSummary {
  assets: number;
  liabilities: number;
  equity: number;
  revenue: number;
  expenses: number;
  netSurplus: number;
  netSurplusMargin: number; // %
  currentAssets: number;
  cashBankBalance: number;
}

export interface AssetStructureItem {
  key: 'cash' | 'bank' | 'receivables' | 'fixed';
  labelAr: string;
  labelEn: string;
  value: number;
  color: string;
}

export interface MonthlyTrendPoint {
  monthAr: string;
  monthEn: string;
  revenue: number;
  expense: number;
  surplus: number;
}

export interface BudgetVarianceRow {
  projectId: string;
  code: string;
  name: string;
  budget: number;
  actual: number;
  variance: number;
  utilizationPct: number;
  status: RatioStatus;
  classificationAr: string;
  classificationEn: string;
}

export interface StandardRatio {
  key: string;
  labelAr: string;
  labelEn: string;
  value: number;
  display: string;
  benchmarkAr: string;
  benchmarkEn: string;
  status: RatioStatus;
  methodologyAr: string;
  methodologyEn: string;
}

export interface HealthScoreDimension {
  key: string;
  labelAr: string;
  labelEn: string;
  weight: number;
  earned: number; // 0..weight
  status: RatioStatus;
}

export interface FinancialHealthScore {
  score: number; // 0..100
  grade: 'A' | 'B' | 'C' | 'D';
  gradeAr: string;
  gradeEn: string;
  dimensions: HealthScoreDimension[];
  methodologyAr: string;
  methodologyEn: string;
}

export interface CashFlowSummary {
  operatingInflows: number;
  operatingOutflows: number;
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
  openingEstimated: boolean;
}

export interface DataQualityFlags {
  hasLedgerLines: boolean;
  hasTransactions: boolean;
  hasMonthlyActivity: boolean;
  hasProjectLines: boolean;
  hasBudgets: boolean;
  hasCashAccounts: boolean;
  insufficientDataNotesAr: string[];
  insufficientDataNotesEn: string[];
}

export interface FinancialAnalyticsResult {
  summary: IpsasSummary;
  assetStructure: AssetStructureItem[];
  monthlyTrend: MonthlyTrendPoint[];
  budgetVariance: BudgetVarianceRow[];
  ratios: StandardRatio[];
  healthScore: FinancialHealthScore;
  cashFlow: CashFlowSummary;
  dataQuality: DataQualityFlags;
  programEfficiency: number;
  currentRatio: number;
  directProjectExpenses: number;
  totalExpenseAmount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const num = (v: string | number | undefined | null): number => {
  const n = parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
};

export const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type AssetKind = AssetStructureItem['key'];

// ─── Status presentation helper ─────────────────────────────────────────────

export const RATIO_STATUS_STYLES: Record<RatioStatus, { ar: string; en: string; cls: string }> = {
  PASS: { ar: 'مطابق للمعيار', en: 'Compliant', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  WATCH: { ar: 'يتطلب مراقبة', en: 'Watch', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  FAIL: { ar: 'يتطلب إجراءً تصحيحياً', en: 'Action Required', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
  'N/A': { ar: 'بيانات غير كافية', en: 'Insufficient Data', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
};

function classifyAsset(acc: AnalyticsAccount): AssetKind {
  const code = String(acc.account_code || '');
  const name = `${acc.name_ar || ''} ${acc.name_en || ''}`.toLowerCase();
  if (code.startsWith('111') || /نقد|صندوق|خزينة|قروش|cash/.test(name)) return 'cash';
  if (code.startsWith('112') || /بنك|حساب جار|bank/.test(name)) return 'bank';
  if (code.startsWith('12') || /مدين|عهد|ذمم|سلف|receivable|advance/.test(name)) return 'receivables';
  return 'fixed';
}

// ─── Main Engine ────────────────────────────────────────────────────────────

export function computeFinancialAnalytics(input: {
  accounts: AnalyticsAccount[];
  transactions: AnalyticsTransaction[];
  lines: AnalyticsLine[];
  projects: AnalyticsProject[];
}): FinancialAnalyticsResult {
  const { accounts, transactions, lines, projects } = input;
  const accById = new Map(accounts.map(a => [a.id, a]));

  // 1) IPSAS aggregation from authoritative account balances
  let assets = 0, liabilities = 0, equity = 0, revenue = 0, expenses = 0;
  let currentAssets = 0, cashBankBalance = 0;

  accounts.forEach(acc => {
    const bal = num(acc.current_balance);
    const kind = classifyAsset(acc);
    switch (acc.account_type) {
      case 'ASSET':
        assets += bal;
        if (kind === 'cash' || kind === 'bank') {
          currentAssets += bal;
          cashBankBalance += bal;
        } else if (kind === 'receivables') {
          currentAssets += bal;
        }
        break;
      case 'LIABILITY': liabilities += bal; break;
      case 'EQUITY': equity += bal; break;
      case 'REVENUE': revenue += bal; break;
      case 'EXPENSE': expenses += bal; break;
    }
  });

  const netSurplus = revenue - expenses;
  const netSurplusMargin = revenue > 0 ? (netSurplus / revenue) * 100 : 0;

  // 2) Ledger-line expense analysis (real, per-line — no baselines)
  let directProjectExpenses = 0;
  let totalExpenseAmount = 0;
  const revenueByAccount = new Map<string, number>();

  lines.forEach(line => {
    const acc = accById.get(line.account_id);
    if (!acc) return;
    const debit = num(line.debit_amount);
    const credit = num(line.credit_amount);
    if (acc.account_type === 'EXPENSE') {
      const amt = debit - credit;
      totalExpenseAmount += amt;
      if (line.project_id) directProjectExpenses += amt;
    } else if (acc.account_type === 'REVENUE') {
      const amt = credit - debit;
      revenueByAccount.set(acc.id, (revenueByAccount.get(acc.id) || 0) + amt);
    }
  });

  const programEfficiency = totalExpenseAmount > 0 ? (directProjectExpenses / totalExpenseAmount) * 100 : 0;
  const adminOverhead = totalExpenseAmount > 0 ? 100 - programEfficiency : 0;
  const currentRatio = liabilities > 0 ? currentAssets / liabilities : 0;

  // 3) Asset structure (real classification only)
  const structureMap: Record<AssetKind, number> = { cash: 0, bank: 0, receivables: 0, fixed: 0 };
  accounts.filter(a => a.account_type === 'ASSET').forEach(acc => {
    structureMap[classifyAsset(acc)] += num(acc.current_balance);
  });
  const assetStructure: AssetStructureItem[] = ([
    { key: 'cash' as const, labelAr: 'النقد بالخزائن', labelEn: 'Cash in Hand', value: structureMap.cash, color: '#059669' },
    { key: 'bank' as const, labelAr: 'الحسابات البنكية', labelEn: 'Bank Accounts', value: structureMap.bank, color: '#0ea5e9' },
    { key: 'receivables' as const, labelAr: 'العهد والمدينون', labelEn: 'Receivables & Advances', value: structureMap.receivables, color: '#d97706' },
    { key: 'fixed' as const, labelAr: 'الأصول الثابتة والمعدات', labelEn: 'Fixed Assets & Equipment', value: structureMap.fixed, color: '#8b5cf6' },
  ] as AssetStructureItem[]).filter(d => d.value > 0);

  // 4) Monthly trend — real transactional data only
  const monthlyMap = new Map<number, { revenue: number; expense: number }>();
  for (let i = 0; i < 12; i++) monthlyMap.set(i, { revenue: 0, expense: 0 });
  const linesByTx = new Map<string, AnalyticsLine[]>();
  lines.forEach(l => {
    const arr = linesByTx.get(l.transaction_id) || [];
    arr.push(l);
    linesByTx.set(l.transaction_id, arr);
  });
  transactions.forEach(tx => {
    const d = new Date(tx.transaction_date);
    if (isNaN(d.getTime())) return;
    const month = d.getMonth();
    (linesByTx.get(tx.id) || []).forEach(line => {
      const acc = accById.get(line.account_id);
      if (!acc) return;
      const bucket = monthlyMap.get(month)!;
      if (acc.account_type === 'REVENUE') bucket.revenue += num(line.credit_amount) - num(line.debit_amount);
      else if (acc.account_type === 'EXPENSE') bucket.expense += num(line.debit_amount) - num(line.credit_amount);
    });
  });
  const hasMonthlyActivity = Array.from(monthlyMap.values()).some(m => m.revenue !== 0 || m.expense !== 0);
  const monthlyTrend: MonthlyTrendPoint[] = Array.from({ length: 12 }, (_, i) => {
    const m = monthlyMap.get(i)!;
    return { monthAr: MONTHS_AR[i], monthEn: MONTHS_EN[i], revenue: m.revenue, expense: m.expense, surplus: m.revenue - m.expense };
  });

  // 5) Budget variance with standard classification thresholds
  const budgetVariance: BudgetVarianceRow[] = projects
    .map((proj): BudgetVarianceRow | null => {
      const budget = num(proj.budget);
      const projLines = lines.filter(l => l.project_id === proj.id);
      const actual = Math.abs(projLines.reduce((s, l) => s + num(l.debit_amount) - num(l.credit_amount), 0));
      if (budget <= 0 || projLines.length === 0) return null;
      const utilizationPct = (actual / budget) * 100;
      let status: RatioStatus, classificationAr: string, classificationEn: string;
      if (utilizationPct > 100) {
        status = 'FAIL'; classificationAr = 'تجاوز الموازنة'; classificationEn = 'Over Budget';
      } else if (utilizationPct >= 85) {
        status = 'PASS'; classificationAr = 'تنفيذ مثالي'; classificationEn = 'Optimal Execution';
      } else if (utilizationPct >= 70) {
        status = 'WATCH'; classificationAr = 'تنفيذ متأخر'; classificationEn = 'Under Execution';
      } else {
        status = 'FAIL'; classificationAr = 'تباطؤ حرج في الصرف'; classificationEn = 'Critical Under-Spend';
      }
      return {
        projectId: proj.id,
        code: proj.code || '',
        name: proj.name_ar || proj.name_en || '',
        budget, actual,
        variance: budget - actual,
        utilizationPct,
        status, classificationAr, classificationEn,
      };
    })
    .filter((r): r is BudgetVarianceRow => r !== null)
    .sort((a, b) => b.budget - a.budget);

  // 6) Revenue concentration (dependency on top funding source)
  const totalRevenueFromLines = Array.from(revenueByAccount.values()).reduce((s, v) => s + v, 0);
  const topRevenueSource = totalRevenueFromLines > 0
    ? Math.max(...Array.from(revenueByAccount.values()))
    : 0;
  const dependencyPct = totalRevenueFromLines > 0 ? (topRevenueSource / totalRevenueFromLines) * 100 : 0;

  // 7) Standard ratios with documented benchmarks
  const ratios: StandardRatio[] = [
    {
      key: 'liquidity',
      labelAr: 'نسبة تغطية السيولة (الأصول المتداولة / الالتزامات)',
      labelEn: 'Liquidity Coverage Ratio (Current Assets / Liabilities)',
      value: currentRatio,
      display: currentRatio.toFixed(2) + 'x',
      benchmarkAr: '≥ 1.50x آمن — أقل من 1.00x خطر',
      benchmarkEn: '≥ 1.50x Safe — below 1.00x Risk',
      status: liabilities <= 0 ? 'N/A' : currentRatio >= 1.5 ? 'PASS' : currentRatio >= 1 ? 'WATCH' : 'FAIL',
      methodologyAr: 'يقيس قدرة الأصول المتداولة على تغطية الالتزامات القائمة وفق إطار السيولة المعياري (IPSAS).',
      methodologyEn: 'Standard liquidity coverage of outstanding obligations per IPSAS financial framework.',
    },
    {
      key: 'program_efficiency',
      labelAr: 'كفاءة الإنفاق الميداني المباشر',
      labelEn: 'Direct Program Expense Ratio',
      value: programEfficiency,
      display: programEfficiency.toFixed(1) + '%',
      benchmarkAr: '≥ 85% أفضل ممارسة (Sphere/CHS) — ≥ 70% حد أدنى',
      benchmarkEn: '≥ 85% Best Practice (Sphere/CHS) — ≥ 70% Minimum',
      status: totalExpenseAmount <= 0 ? 'N/A' : programEfficiency >= 85 ? 'PASS' : programEfficiency >= 70 ? 'WATCH' : 'FAIL',
      methodologyAr: 'نسبة المصروفات المرتبطة مباشرة بمشاريع ميدانية من إجمالي المصروفات، وفق معايير العمل الإنساني Sphere/CHS.',
      methodologyEn: 'Share of expenditure booked directly against field projects, per Sphere/CHS humanitarian standards.',
    },
    {
      key: 'admin_overhead',
      labelAr: 'هامش النفقات الإدارية والعمومية',
      labelEn: 'Administrative Overhead Ratio',
      value: adminOverhead,
      display: adminOverhead.toFixed(1) + '%',
      benchmarkAr: '≤ 15% أفضل ممارسة — ≤ 30% حد أعلى مقبول',
      benchmarkEn: '≤ 15% Best Practice — ≤ 30% Acceptable Ceiling',
      status: totalExpenseAmount <= 0 ? 'N/A' : adminOverhead <= 15 ? 'PASS' : adminOverhead <= 30 ? 'WATCH' : 'FAIL',
      methodologyAr: 'مكمل نسبة الإنفاق الميداني؛ يقاس وفق مدونات حوكمة الجمعيات الأهلية.',
      methodologyEn: 'Complement of the program ratio; measured per charity governance codes.',
    },
    {
      key: 'reserve_margin',
      labelAr: 'هامش الفائض التشغيلي (الاحتياطي)',
      labelEn: 'Operating Surplus / Reserve Margin',
      value: netSurplusMargin,
      display: netSurplusMargin.toFixed(1) + '%',
      benchmarkAr: 'فائض موجب ≥ 0% — يُفضل تغطية 3–6 أشهر تشغيل',
      benchmarkEn: 'Positive surplus ≥ 0% — target 3–6 months cover',
      status: revenue <= 0 ? 'N/A' : netSurplusMargin >= 10 ? 'PASS' : netSurplusMargin >= 0 ? 'WATCH' : 'FAIL',
      methodologyAr: 'نسبة الفائض (الإيراد − المصروف) إلى الإيراد؛ يغذي الاحتياطي الاستراتيجي لمواجهة تقلبات التمويل.',
      methodologyEn: 'Surplus (revenue − expenses) as share of revenue; feeds the strategic funding-volatility reserve.',
    },
    {
      key: 'dependency',
      labelAr: 'تركز مصادر التمويل (أكبر مصدر إيراد)',
      labelEn: 'Funding Concentration (Top Revenue Source)',
      value: dependencyPct,
      display: dependencyPct.toFixed(1) + '%',
      benchmarkAr: '≤ 40% تنويع صحي — أكثر من 60% اعتماد حرج',
      benchmarkEn: '≤ 40% Healthy — above 60% Critical Dependency',
      status: totalRevenueFromLines <= 0 ? 'N/A' : dependencyPct <= 40 ? 'PASS' : dependencyPct <= 60 ? 'WATCH' : 'FAIL',
      methodologyAr: 'مخاطر الاعتماد على مصدر تمويل واحد؛ مقياس معياري لاستدامة التمويل المؤسسي.',
      methodologyEn: 'Single-source funding dependency risk; standard measure of institutional funding sustainability.',
    },
  ];

  // 8) Composite evaluative health score (منهجية تقييمية مرجحة)
  const passingProjects = budgetVariance.filter(r => r.status === 'PASS').length;
  const budgetDisciplineScore = budgetVariance.length > 0
    ? (passingProjects / budgetVariance.length) * 100
    : 0;

  const dimensions: HealthScoreDimension[] = [
    {
      key: 'liquidity',
      labelAr: 'السيولة والملاءة',
      labelEn: 'Liquidity & Solvency',
      weight: 25,
      earned: currentRatio > 0 ? Math.min(1, currentRatio / 2) * 25 : 0,
      status: liabilities <= 0 ? 'N/A' : currentRatio >= 1.5 ? 'PASS' : currentRatio >= 1 ? 'WATCH' : 'FAIL',
    },
    {
      key: 'program',
      labelAr: 'كفاءة الإنفاق الميداني',
      labelEn: 'Program Spend Efficiency',
      weight: 30,
      earned: totalExpenseAmount > 0 ? Math.min(1, programEfficiency / 85) * 30 : 0,
      status: totalExpenseAmount <= 0 ? 'N/A' : programEfficiency >= 85 ? 'PASS' : programEfficiency >= 70 ? 'WATCH' : 'FAIL',
    },
    {
      key: 'budget',
      labelAr: 'الانضباط الموازني',
      labelEn: 'Budget Discipline',
      weight: 20,
      earned: budgetVariance.length > 0 ? (passingProjects / budgetVariance.length) * 20 : 0,
      status: budgetVariance.length <= 0 ? 'N/A' : budgetDisciplineScore >= 80 ? 'PASS' : budgetDisciplineScore >= 50 ? 'WATCH' : 'FAIL',
    },
    {
      key: 'reserve',
      labelAr: 'الاستدامة والاحتياطي',
      labelEn: 'Sustainability & Reserve',
      weight: 15,
      earned: revenue > 0 ? Math.max(0, Math.min(1, netSurplusMargin / 15)) * 15 : 0,
      status: revenue <= 0 ? 'N/A' : netSurplusMargin >= 10 ? 'PASS' : netSurplusMargin >= 0 ? 'WATCH' : 'FAIL',
    },
    {
      key: 'diversification',
      labelAr: 'تنويع مصادر التمويل',
      labelEn: 'Funding Diversification',
      weight: 10,
      earned: totalRevenueFromLines > 0 ? Math.max(0, 1 - Math.max(0, dependencyPct - 40) / 60) * 10 : 0,
      status: totalRevenueFromLines <= 0 ? 'N/A' : dependencyPct <= 40 ? 'PASS' : dependencyPct <= 60 ? 'WATCH' : 'FAIL',
    },
  ];

  const score = Math.round(dimensions.reduce((s, d) => s + d.earned, 0) * 10) / 10;
  const healthScore: FinancialHealthScore = {
    score,
    grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D',
    gradeAr: score >= 85 ? 'مركز مالي ممتاز' : score >= 70 ? 'مركز مالي جيد' : score >= 55 ? 'مقبول مع متابعة' : 'يتطلب تدخلاً عاجلاً',
    gradeEn: score >= 85 ? 'Excellent Standing' : score >= 70 ? 'Good Standing' : score >= 55 ? 'Acceptable — Monitor' : 'Urgent Intervention Required',
    dimensions,
    methodologyAr: 'بطاقة تقييم مرجحة (100 نقطة): السيولة 25، كفاءة الإنفاق 30، الانضباط الموازني 20، الاستدامة 15، تنويع التمويل 10 — وفق منهجية UAMEX NEB-10 المعيارية.',
    methodologyEn: 'Weighted evaluative scorecard (100 pts): Liquidity 25, Program Efficiency 30, Budget Discipline 20, Sustainability 15, Diversification 10 — UAMEX NEB-10 standard methodology.',
  };

  // 9) Cash flow — real vouchers only (direct method)
  const operatingInflows = transactions
    .filter(t => t.transaction_type === 'RECEIPT')
    .reduce((s, t) => s + num(t.total_debit || t.total_credit), 0);
  const operatingOutflows = transactions
    .filter(t => t.transaction_type === 'PAYMENT')
    .reduce((s, t) => s + num(t.total_debit || t.total_credit), 0);
  const netCashFlow = operatingInflows - operatingOutflows;
  // الرصيد الافتتاحي مشتق بأمانة: رصيد النقد والبنوك الحالي − صافي الحركة (يُعلَّم كتقدير مشتق)
  const openingCash = cashBankBalance > 0 ? cashBankBalance - netCashFlow : 0;
  const cashFlow: CashFlowSummary = {
    operatingInflows,
    operatingOutflows,
    netCashFlow,
    openingCash,
    closingCash: openingCash + netCashFlow,
    openingEstimated: cashBankBalance > 0,
  };

  // 10) Data quality flags — honest insufficient-data reporting
  const hasLedgerLines = lines.length > 0;
  const hasTransactions = transactions.length > 0;

  const hasProjectLines = lines.some(l => l.project_id);
  const hasBudgets = projects.some(p => num(p.budget) > 0);
  const hasCashAccounts = cashBankBalance > 0;
  const insufficientDataNotesAr: string[] = [];
  const insufficientDataNotesEn: string[] = [];
  if (!hasTransactions) {
    insufficientDataNotesAr.push('لا توجد قيود مرحّلة في الدفتر العام لهذه الفترة — لا يمكن إصدار الاتجاهات الشهرية أو التدفقات النقدية.');
    insufficientDataNotesEn.push('No posted ledger entries for the period — monthly trends and cash flows cannot be produced.');
  }
  if (hasLedgerLines && !hasProjectLines) {
    insufficientDataNotesAr.push('لا توجد قيود مرتبطة بمشاريع — كفاءة الإنفاق الميداني لا يمكن احتسابها من السجلات.');
    insufficientDataNotesEn.push('No project-linked ledger lines — direct program efficiency cannot be derived from records.');
  }
  if (!hasBudgets) {
    insufficientDataNotesAr.push('لا توجد موازنات معتمدة للمشاريع — تحليل الانحرافات معطل.');
    insufficientDataNotesEn.push('No approved project budgets — variance analysis disabled.');
  }
  if (!hasCashAccounts) {
    insufficientDataNotesAr.push('لا توجد أرصدة نقد/بنوك — قائمة التدفقات النقدية تفتقر لرصيد افتتاحي موثق.');
    insufficientDataNotesEn.push('No cash/bank balances — cash flow statement lacks a documented opening position.');
  }

  const dataQuality: DataQualityFlags = {
    hasLedgerLines, hasTransactions, hasMonthlyActivity, hasProjectLines, hasBudgets, hasCashAccounts,
    insufficientDataNotesAr, insufficientDataNotesEn,
  };

  return {
    summary: { assets, liabilities, equity, revenue, expenses, netSurplus, netSurplusMargin, currentAssets, cashBankBalance },
    assetStructure,
    monthlyTrend,
    budgetVariance,
    ratios,
    healthScore,
    cashFlow,
    dataQuality,
    programEfficiency,
    currentRatio,
    directProjectExpenses,
    totalExpenseAmount,
  };
}
