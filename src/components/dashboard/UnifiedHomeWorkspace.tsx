import React, { useCallback, useEffect, useState } from 'react';
import {
  Briefcase,
  FolderKanban,
  HeartHandshake,
  LayoutGrid,
  Map,
  RefreshCw,
  Users,
  Wallet
} from 'lucide-react';
import { EmptyState, MetricTile, PageHeader, cn, type MetricFreshness } from '../../design-system';
import { User } from '../../core/types/users';
import { readAuthToken } from '../../shared/hooks/useApi';
import { formatCurrency } from '../../shared/utils/formatters';

/**
 * UnifiedHomeWorkspace — the single default home experience.
 *
 * Every number rendered here comes from live sources only: the dashboard
 * stats memo (server stats / loaded collections), the approval queue prop,
 * the loaded programs/projects arrays, and a live fetch of recent
 * transactions. There are no hardcoded fallbacks, no fabricated sample
 * transactions, and no optimistic placeholders — missing data renders as an
 * explicit empty/error state instead of a made-up value.
 */

type HomeLang = 'ar' | 'en';

interface HomeStatsLike {
  counts?: Record<string, unknown>;
  financials?: Record<string, unknown>;
}

interface NamedRow {
  id?: string | number;
  name_ar?: string;
  name_en?: string;
  code?: string;
  status?: string;
}

interface ApprovalRow {
  id?: string | number;
  status?: string;
  title?: string;
  title_en?: string;
  description?: string;
  amount?: string | number;
  requester_name?: string;
  project_code?: string;
}

interface TransactionRow {
  id?: string;
  transaction_number?: string;
  transaction_date?: string | null;
  transaction_type?: string;
  description?: string | null;
  total_debit?: string | number;
  total_credit?: string | number;
  status?: string | null;
}

export interface UnifiedHomeWorkspaceProps {
  lang: HomeLang;
  stats?: HomeStatsLike | null;
  loading?: boolean;
  currentUser?: User | null;
  programs: NamedRow[];
  projects: NamedRow[];
  beneficiaries: NamedRow[];
  sponsorships: NamedRow[];
  approvalRequests: ApprovalRow[];
  onNavigate: (tabId: string) => void;
  onDrillDown?: (tabId: string, filters: Record<string, unknown>) => void;
  onOpenSystemMap?: () => void;
  onSwitchToClassicAnalytics?: () => void;
  onOpenExperienceModeModal?: () => void;
  onRefresh?: () => void;
}

const DASH = '—';

const toFiniteNumber = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const todayLabel = (lang: HomeLang): string => {
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-YE' : 'en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date());
  } catch {
    return '';
  }
};

const rowName = (row: NamedRow, lang: HomeLang): string =>
  (lang === 'ar' ? row.name_ar : row.name_en) || row.name_ar || row.name_en || DASH;

const approvalTitle = (row: ApprovalRow, lang: HomeLang): string =>
  (lang === 'ar' ? row.title || row.description : row.title_en || row.title) ||
  row.title ||
  row.description ||
  DASH;

const approvalId = (row: ApprovalRow, idx: number): string =>
  row.id !== undefined && row.id !== null ? String(row.id) : `req-${idx}`;

const txTypeName = (type: string | undefined, lang: HomeLang): string => {
  if (!type) return DASH;
  const map: Record<string, string> = {
    PAYMENT: lang === 'ar' ? 'سند صرف' : 'Payment',
    RECEIPT: lang === 'ar' ? 'سند قبض' : 'Receipt',
    JOURNAL: lang === 'ar' ? 'قيد يومية' : 'Journal',
    CONTRA: lang === 'ar' ? 'قيد مقابل' : 'Contra'
  };
  return map[type] || type;
};

const statusLabel = (status: string | null | undefined, lang: HomeLang): string => {
  if (!status) return DASH;
  const map: Record<string, string> = {
    POSTED: lang === 'ar' ? 'مرحّل' : 'Posted',
    DRAFT: lang === 'ar' ? 'مسودة' : 'Draft',
    PENDING: lang === 'ar' ? 'معلّق' : 'Pending',
    APPROVED: lang === 'ar' ? 'معتمد' : 'Approved',
    ACTIVE: lang === 'ar' ? 'نشط' : 'Active'
  };
  return map[status] || status;
};

function SectionCard({
  title,
  count,
  actions,
  children,
  className
}: {
  title: string;
  count?: number | null;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-4',
        className
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-black text-zinc-900 dark:text-white truncate">{title}</h2>
          {count !== undefined && count !== null && (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-black tabular-nums text-zinc-600 dark:text-zinc-300"
            >
              {count}
            </span>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      ))}
    </div>
  );
}

export function UnifiedHomeWorkspace({
  lang,
  stats,
  loading = false,
  currentUser,
  programs,
  projects,
  beneficiaries,
  sponsorships,
  approvalRequests,
  onNavigate,
  onDrillDown,
  onOpenSystemMap,
  onSwitchToClassicAnalytics,
  onOpenExperienceModeModal,
  onRefresh
}: UnifiedHomeWorkspaceProps) {
  const isRtl = lang === 'ar';
  const locale = isRtl ? 'ar-YE' : 'en-US';

  const counts = (stats && typeof stats === 'object' && stats.counts) || {};
  const financials = (stats && typeof stats === 'object' && stats.financials) || {};
  const statsFreshness: MetricFreshness = stats ? 'live' : 'error';

  const pendingApprovals = (approvalRequests || []).filter((r) => r && r.status === 'pending');
  const recentPrograms = (programs || []).slice(0, 6);
  const recentProjects = (projects || []).slice(0, 6);

  // Recent transactions: a real, tenant-scoped read with honest
  // loading / empty / error states (never a fabricated fallback row).
  const [txAttempt, setTxAttempt] = useState(0);
  const [txState, setTxState] = useState<{ loading: boolean; rows: TransactionRow[] | null; error: string | null }>({
    loading: true,
    rows: null,
    error: null
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setTxState((prev) => ({ ...prev, loading: true, error: null }));

    (async () => {
      try {
        const token = readAuthToken();
        const response = await fetch('/api/tables/transactions?limit=6', {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (!response.ok) {
          const body: unknown = await response.json().catch(() => null);
          const message =
            body && typeof body === 'object' && 'error' in body && typeof (body as { error?: unknown }).error === 'string'
              ? ((body as { error: string }).error)
              : `HTTP ${response.status}`;
          throw new Error(message);
        }
        const payload: unknown = await response.json();
        const rows: TransactionRow[] = Array.isArray(payload) ? (payload as TransactionRow[]) : [];
        if (active) setTxState({ loading: false, rows, error: null });
      } catch (e) {
        if (controller.signal.aborted || !active) return;
        const message = e instanceof Error ? e.message : 'Request failed';
        setTxState({ loading: false, rows: null, error: message });
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [txAttempt]);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
    setTxAttempt((n) => n + 1);
  }, [onRefresh]);

  const handleQueueOpen = useCallback(() => {
    if (onDrillDown) {
      onDrillDown('approvals', { approvalsStatus: 'pending' });
    } else {
      onNavigate('approvals');
    }
  }, [onDrillDown, onNavigate]);

  const kpiValue = (countKey: string, fallbackCount: number): string | number => {
    if (loading) return DASH;
    const fromStats = toFiniteNumber(counts[countKey]);
    if (fromStats !== null) return fromStats;
    return fallbackCount;
  };

  const budgetValue = (): string => {
    if (loading) return DASH;
    const budget = toFiniteNumber(financials.totalProgramBudget);
    return budget !== null ? formatCurrency(budget, 'YER', locale) : DASH;
  };

  const budgetFreshness: MetricFreshness = loading || stats ? statsFreshness : 'error';

  const userName = currentUser && typeof currentUser === 'object' ? (currentUser as User).name : undefined;
  const greeting = userName
    ? `${isRtl ? `مرحباً ${userName}` : `Welcome, ${userName}`} · ${todayLabel(lang)}`
    : todayLabel(lang);

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-8" data-testid="unified-home-workspace">
      <PageHeader
        lang={lang}
        title="Workspace"
        titleAr="مركز العمل"
        subtitle={greeting}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenExperienceModeModal && (
              <button
                type="button"
                onClick={onOpenExperienceModeModal}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                {isRtl ? 'أنماط العرض' : 'View modes'}
              </button>
            )}
            {onSwitchToClassicAnalytics && (
              <button
                type="button"
                onClick={onSwitchToClassicAnalytics}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {isRtl ? 'العرض الكلاسيكي' : 'Classic analytics'}
              </button>
            )}
            {onOpenSystemMap && (
              <button
                type="button"
                onClick={onOpenSystemMap}
                aria-label={isRtl ? 'خريطة النظام' : 'System map'}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Map className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefresh}
                aria-label={isRtl ? 'تحديث البيانات' : 'Refresh data'}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        }
      />

      {/* KPI strip — every value is live or explicitly unavailable. */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricTile
          lang={lang}
          label="البرامج"
          labelEn="Programs"
          value={kpiValue('programs', (programs || []).length)}
          tone="brand"
          freshness={statsFreshness}
          loading={loading}
          icon={<Briefcase className="w-4 h-4" aria-hidden="true" />}
          onClick={() => onNavigate('programs')}
        />
        <MetricTile
          lang={lang}
          label="المشاريع"
          labelEn="Projects"
          value={kpiValue('projects', (projects || []).length)}
          tone="brand"
          freshness={statsFreshness}
          loading={loading}
          icon={<FolderKanban className="w-4 h-4" aria-hidden="true" />}
          onClick={() => onNavigate('projects')}
        />
        <MetricTile
          lang={lang}
          label="المستفيدون"
          labelEn="Beneficiaries"
          value={kpiValue('beneficiaries', (beneficiaries || []).length)}
          tone="success"
          freshness={statsFreshness}
          loading={loading}
          icon={<Users className="w-4 h-4" aria-hidden="true" />}
          onClick={() => onNavigate('beneficiaries')}
        />
        <MetricTile
          lang={lang}
          label="الكفالات"
          labelEn="Sponsorships"
          value={kpiValue('sponsorships', (sponsorships || []).length)}
          tone="success"
          freshness={statsFreshness}
          loading={loading}
          icon={<HeartHandshake className="w-4 h-4" aria-hidden="true" />}
          onClick={() => onNavigate('sponsorships')}
        />
        <MetricTile
          lang={lang}
          label="ميزانية البرامج"
          labelEn="Program budget"
          value={budgetValue()}
          tone="neutral"
          freshness={budgetFreshness}
          loading={loading}
          icon={<Wallet className="w-4 h-4" aria-hidden="true" />}
          onClick={() => onNavigate('finance')}
        />
      </div>

      {/* Decision queue + programs */}
      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <SectionCard
          className="lg:col-span-2"
          title={isRtl ? 'بانتظار قرارك' : 'Awaiting your decision'}
          count={pendingApprovals.length}
        >
          {loading ? (
            <ListSkeleton rows={3} />
          ) : pendingApprovals.length === 0 ? (
            <EmptyState
              lang={lang}
              variant="empty"
              title={isRtl ? 'لا توجد طلبات بانتظار قرارك' : 'No approvals waiting for you'}
              description={
                isRtl
                  ? 'ستظهر هنا طلبات الاعتماد المعلقة فور وصولها من قواعد العمل الحيّة'
                  : 'Pending approval requests appear here as soon as live workflows raise them'
              }
            />
          ) : (
            <ul className="flex flex-col gap-1.5" aria-label={isRtl ? 'قائمة طلبات الاعتماد المعلقة' : 'Pending approval requests'}>
              {pendingApprovals.slice(0, 8).map((row, idx) => {
                const amount = toFiniteNumber(row.amount);
                return (
                  <li key={approvalId(row, idx)}>
                    <button
                      type="button"
                      onClick={handleQueueOpen}
                      className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">
                          {approvalTitle(row, lang)}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span className="font-mono">#{approvalId(row, idx)}</span>
                          {row.project_code && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-bold">
                              {row.project_code}
                            </span>
                          )}
                          {row.requester_name && <span className="truncate">{row.requester_name}</span>}
                        </div>
                      </div>
                      <span className="text-sm font-black tabular-nums text-zinc-700 dark:text-zinc-200 shrink-0">
                        {amount !== null ? formatCurrency(amount, 'YER', locale) : DASH}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {pendingApprovals.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="self-start text-xs font-black text-[var(--ux-primary)] hover:underline"
            >
              {isRtl ? 'فتح شاشة الاعتماد الكاملة' : 'Open full approvals screen'}
            </button>
          )}
        </SectionCard>

        <SectionCard
          title={isRtl ? 'البرامج' : 'Programs'}
          actions={
            <button
              type="button"
              onClick={() => onNavigate('programs')}
              className="text-xs font-black text-[var(--ux-primary)] hover:underline"
            >
              {isRtl ? 'عرض الكل' : 'View all'}
            </button>
          }
        >
          {loading ? (
            <ListSkeleton rows={4} />
          ) : recentPrograms.length === 0 ? (
            <EmptyState
              lang={lang}
              variant="empty"
              title={isRtl ? 'لا توجد برامج مسجلة' : 'No programs yet'}
              description={isRtl ? 'أنشئ أول برنامج تنموي للبدء' : 'Create your first development program to begin'}
            />
          ) : (
            <ul className="flex flex-col gap-1" aria-label={isRtl ? 'أحدث البرامج' : 'Latest programs'}>
              {recentPrograms.map((program, idx) => (
                <li key={program.id !== undefined ? String(program.id) : `program-${idx}`}>
                  <button
                    type="button"
                    onClick={() => onNavigate('programs')}
                    className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                      {rowName(program, lang)}
                    </span>
                    {program.code && (
                      <span className="text-[11px] font-mono text-zinc-400 shrink-0">{program.code}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Recent transactions + projects */}
      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <SectionCard
          className="lg:col-span-2"
          title={isRtl ? 'أحدث العمليات المالية' : 'Recent financial operations'}
          actions={
            <button
              type="button"
              onClick={() => setTxAttempt((n) => n + 1)}
              className="text-xs font-black text-[var(--ux-primary)] hover:underline"
            >
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </button>
          }
        >
          {txState.loading ? (
            <ListSkeleton rows={4} />
          ) : txState.error ? (
            <EmptyState
              lang={lang}
              variant="error"
              title={isRtl ? 'تعذّر تحميل العمليات المالية' : 'Could not load financial operations'}
              description={txState.error}
              actions={[
                {
                  label: 'Retry',
                  labelAr: 'إعادة المحاولة',
                  onClick: () => setTxAttempt((n) => n + 1)
                }
              ]}
            />
          ) : (txState.rows || []).length === 0 ? (
            <EmptyState
              lang={lang}
              variant="empty"
              title={isRtl ? 'لا توجد معاملات مالية مسجلة' : 'No financial transactions yet'}
              description={
                isRtl
                  ? 'ستظهر هنا أحدث السندات والقيود بعد تسجيلها'
                  : 'The latest vouchers and journal entries appear here once recorded'
              }
            />
          ) : (
            <ul className="flex flex-col gap-1.5" aria-label={isRtl ? 'أحدث المعاملات المالية' : 'Latest financial transactions'}>
              {(txState.rows || []).map((tx, idx) => {
                const debit = toFiniteNumber(tx.total_debit);
                const credit = toFiniteNumber(tx.total_credit);
                const amount = debit !== null && debit !== 0 ? debit : credit;
                return (
                  <li key={tx.id || tx.transaction_number || `tx-${idx}`}>
                    <button
                      type="button"
                      onClick={() => onNavigate('finance')}
                      className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                          {txTypeName(tx.transaction_type, lang)}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-100 truncate">
                            {tx.transaction_number || DASH}
                          </div>
                          {tx.description && (
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{tx.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-end shrink-0">
                        <div className="text-sm font-black tabular-nums text-zinc-700 dark:text-zinc-200">
                          {amount !== null && amount !== 0 ? formatCurrency(amount, 'YER', locale) : DASH}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 justify-end">
                          {tx.transaction_date && <span>{tx.transaction_date}</span>}
                          <span>·</span>
                          <span>{statusLabel(tx.status, lang)}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={isRtl ? 'المشاريع' : 'Projects'}
          actions={
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="text-xs font-black text-[var(--ux-primary)] hover:underline"
            >
              {isRtl ? 'عرض الكل' : 'View all'}
            </button>
          }
        >
          {loading ? (
            <ListSkeleton rows={4} />
          ) : recentProjects.length === 0 ? (
            <EmptyState
              lang={lang}
              variant="empty"
              title={isRtl ? 'لا توجد مشاريع مسجلة' : 'No projects yet'}
              description={isRtl ? 'ستظهر المشاريع بعد إضافتها' : 'Projects appear here once added'}
            />
          ) : (
            <ul className="flex flex-col gap-1" aria-label={isRtl ? 'أحدث المشاريع' : 'Latest projects'}>
              {recentProjects.map((project, idx) => (
                <li key={project.id !== undefined ? String(project.id) : `project-${idx}`}>
                  <button
                    type="button"
                    onClick={() => onNavigate('projects')}
                    className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                      {rowName(project, lang)}
                    </span>
                    {project.status && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                        {statusLabel(project.status, lang)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export default UnifiedHomeWorkspace;
