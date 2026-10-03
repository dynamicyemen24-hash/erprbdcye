import { useState, useEffect, useCallback } from 'react';
import type { ComponentType } from 'react';
import { DollarSign, Users, Target, TrendingUp, Activity, CheckCircle2 } from 'lucide-react';

export type ReportLang = 'ar' | 'en';
export type DataSource = 'live' | 'fallback';
export type KpiIcon = ComponentType<{ className?: string }>;

const ICONS: Record<string, KpiIcon> = { DollarSign, Users, Target, TrendingUp, Activity, CheckCircle2 };

export interface LiveKpiCard {
  label_ar: string;
  label_en: string;
  value: string;
  change: number;
  icon: KpiIcon;
  color: string;
  bgColor: string;
}

export interface LiveReportCard {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  category: 'financial' | 'operational' | 'impact' | 'compliance' | 'hr' | 'project';
  status: 'ready' | 'generating' | 'scheduled' | 'failed';
  last_generated: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  format: string[];
  endpoint: string;
}

export function unwrap<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'success' in (json as Record<string, unknown>)) {
    const envelope = json as { success: boolean; data: T };
    if (envelope.success) return envelope.data;
    throw new Error('Request reported failure');
  }
  return json as T;
}

export async function fetchReport<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return unwrap<T>(await res.json());
}

export function useLiveReport<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchReport<T>(path, controller.signal)
      .then((json) => {
        if (!controller.signal.aborted) setData(json);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Request failed');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, attempt]);

  return { data, loading, error, retry, source: (data ? 'live' : 'fallback') as DataSource };
}

export function useConsolidatedKpis() {
  return useLiveReport<Record<string, Record<string, number>>>('/api/v2/reports/kpis/consolidated');
}

export function useExecutiveBrief() {
  return useLiveReport<Record<string, unknown>>('/api/v2/institutional-reports/executive-brief');
}

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function mapConsolidatedToKpiCards(kpis: Record<string, Record<string, number>>): LiveKpiCard[] {
  const finance = kpis.finance ?? {};
  const beneficiaries = kpis.beneficiaries ?? {};
  const projects = kpis.projects ?? {};
  return [
    { label_ar: 'إجمالي المقبوضات', label_en: 'Total Receipts', value: String(num(finance.totalReceipts)), change: 0, icon: ICONS.DollarSign, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { label_ar: 'المستفيدين', label_en: 'Beneficiaries', value: String(num(beneficiaries.total)), change: 0, icon: ICONS.Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label_ar: 'المشاريع النشطة', label_en: 'Active Projects', value: String(num(projects.active)), change: 0, icon: ICONS.Target, color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
    { label_ar: 'متوسط الإنجاز', label_en: 'Average Progress', value: `${num(projects.avgProgress)}%`, change: 0, icon: ICONS.TrendingUp, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { label_ar: 'استغلال الموازنة', label_en: 'Budget Utilization', value: `${num(finance.budgetUtilization)}%`, change: 0, icon: ICONS.Activity, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    { label_ar: 'المانحون النشطون', label_en: 'Active Donors', value: '—', change: 0, icon: ICONS.CheckCircle2, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  ];
}

export function buildLiveReportCards(brief: Record<string, unknown> | null): LiveReportCard[] {
  const generatedAt = typeof brief?.generatedAt === 'string' ? (brief.generatedAt as string).slice(0, 10) : '—';
  const def = (
    id: string, endpoint: string,
    title_ar: string, title_en: string, description_ar: string, description_en: string,
    category: LiveReportCard['category'],
  ): LiveReportCard => ({
    id, title_ar, title_en, description_ar, description_en, category,
    status: brief ? 'ready' : 'scheduled',
    last_generated: generatedAt,
    frequency: 'monthly',
    format: ['PDF', 'Excel'],
    endpoint,
  });
  return [
    def('live-budget-variance', '/api/v2/institutional-reports/budget-variance', 'الموازنة مقابل الفعلي (IPSAS 24)', 'Budget vs Actual (IPSAS 24)', 'المخصص مقابل المنصرف ونسب الاستغلال', 'Allocated vs spent with utilization', 'financial'),
    def('live-donor-report', '/api/v2/institutional-reports/donor-report', 'المانحون والمنح', 'Donor & Grant Stewardship', 'المتعهد مقابل المحصل وتقدم الحملات', 'Pledged vs received with campaign progress', 'compliance'),
    def('live-cash-flow', '/api/v2/institutional-reports/cash-flow', 'التدفقات النقدية (IPSAS 2)', 'Cash Flow (IPSAS 2)', 'المقبوضات والمدفوعات الشهرية', 'Monthly inflows and outflows', 'financial'),
    def('live-trial-balance', '/api/v2/institutional-reports/trial-balance', 'ميزان المراجعة', 'Trial Balance', 'أرصدة الحسابات من دفتر الأستاذ', 'Ledger balances by chart of accounts', 'financial'),
    def('live-executive-brief', '/api/v2/institutional-reports/executive-brief', 'الموجز التنفيذي المؤسسي', 'Institutional Executive Brief', 'لقطة قيادية موحدة عبر النطاقات', 'Unified leadership snapshot', 'operational'),
    def('live-audit-activity', '/api/v2/institutional-reports/audit-activity', 'النشاط الرقابي', 'Audit Activity', 'حجم الإجراءات الرقابية وأحدثها', 'Audit volume and latest entries', 'compliance'),
  ];
}
