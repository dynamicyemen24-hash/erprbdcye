/**
 * UAMEX ERP™ — NEB-05/NEB-09: Inventory & Warehouse OS
 * Inventory Workspace View — وركسبيس المخازن المستقلة (Production-Grade E2E)
 *
 * الأقسام: لوحة قيادة BI — المدخلات الأساسية — العمليات — الجرد —
 * المستندات — التقارير — الإعدادات والسياسات والصلاحيات
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Boxes, Warehouse, ArrowLeftRight, ClipboardCheck, FileText,
  BarChart3, Settings2, Plus, Search, RefreshCw, AlertTriangle, ShieldCheck,
  TrendingDown, CalendarClock, CheckCircle2, XCircle, Send, Printer,
  Download, Layers, Ruler, Tag, Loader2, Coins,
} from 'lucide-react';
import { printHTML } from '../../lib/printUtils';
import { cn } from '../../design-system/utils/cn';
import { EmptyState } from '../../design-system/components/EmptyState';
import { ErrorState } from '../../design-system/components/ErrorState';
import { Spinner } from '../../design-system/components/Spinner';
import { ConfirmDialog } from '../../design-system/components/ConfirmDialog';
import { EnterpriseButton } from '../common/EnterpriseButton';
import {
  MOVEMENT_TYPE_LABELS, INVENTORY_STATUS_LABELS, ADJUSTMENT_REASON_LABELS,
  INVENTORY_ROLE_PERMISSIONS,
} from '../../features/inventory/inventoryTypes';

interface InventoryWorkspaceViewProps {
  lang: 'ar' | 'en';
  currentUser?: any;
  onNavigate?: (tab: any) => void;
}

type SubTab = 'dashboard' | 'master' | 'operations' | 'stocktake' | 'documents' | 'reports' | 'settings';

// ─── طبقة استدعاء API المعيارية ────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('rbd_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function invApi<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v2/inventory${path}`, {
    headers: getAuthHeaders(),
    ...options,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || json?.message || `HTTP ${res.status}`);
  }
  return json.data as T;
}

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const fmtMoney = (v: any) => nf.format(Number(v || 0));
const fmtQty = (v: any) => nf.format(Number(v || 0));

const STATUS_TONE: Record<string, string> = {
  POSTED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  APPROVED: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  PENDING_APPROVAL: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  DRAFT: 'bg-slate-500/15 text-slate-600 dark:text-zinc-300 border-slate-500/30',
  IN_TRANSIT: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  RECEIVED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  REJECTED: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  CANCELLED: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  OPEN: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  COUNTING: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
};

const INPUT_CLS =
  'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
const LABEL_CLS = 'block text-[11px] font-black text-slate-500 dark:text-zinc-400 mb-1';
const BTN_PRIMARY =
  'px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_GHOST =
  'px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50';
const TH_CLS = 'px-3 py-2.5 text-[11px] font-black text-slate-500 dark:text-zinc-400 text-right whitespace-nowrap';
const TD_CLS = 'px-3 py-2.5 text-xs text-slate-700 dark:text-zinc-200 whitespace-nowrap';

// ─── مكونات مساعدة معيارية ─────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] || 'bg-slate-500/15 text-slate-600 dark:text-zinc-300 border-slate-500/30';
  const label = INVENTORY_STATUS_LABELS[status]?.ar || status;
  return <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black ${tone}`}>{label}</span>;
}

function KpiCard({ icon: Icon, title, value, sub, tone }: {
  icon: any; title: string; value: string; sub?: string; tone: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-black text-slate-500 dark:text-zinc-400">{title}</div>
        <div className="text-xl font-black text-slate-800 dark:text-zinc-100 tabular-nums truncate">{value}</div>
        {sub && <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">{sub}</div>}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, desc, actions }: {
  icon: any; title: string; desc?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <Icon size={18} strokeWidth={2.2} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">{title}</h3>
          {desc && <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">{desc}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">{actions}</div>
    </div>
  );
}

function DataTable({ headers, rows, empty }: {
  headers: string[]; rows: React.ReactNode[]; empty: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        variant="empty"
        title="No data"
        titleAr={empty}
        lang="ar"
        className="py-8"
      />
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-zinc-800">
      <table className="w-full min-w-max">
        <thead className="bg-slate-50 dark:bg-zinc-900">
          <tr>{headers.map((h, i) => <th key={i} className={TH_CLS}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
          {rows}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ open, title, onClose, children }: {
  open: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-zinc-900 px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between z-10">
          <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer">
            <XCircle size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}

// ─── لوحة القيادة التنفيذية (BI) ───────────────────────────

function DashboardPanel({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    invApi('/dashboard')
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setData(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="md" variant="primary" lang="ar" labelAr="جارٍ تحميل لوحة القيادة..." />
      </div>
    );
  }
  if (!data) {
    return (
      <ErrorState
        onRetry={() => {}}
        lang="ar"
        messageAr="تعذر تحميل بيانات لوحة القيادة. تأكد من تشغيل الخادم ثم أعد المحاولة."
      />
    );
  }

  const s = data.summary || {};
  const alerts = data.alerts || {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Coins} title="قيمة المخزون الإجمالية" value={fmtMoney(s.total_stock_value)} sub="ريال" tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <KpiCard icon={Boxes} title="إجمالي الوحدات" value={fmtQty(s.total_units)} sub={`${s.active_skus || 0} صنف نشط`} tone="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
        <KpiCard icon={AlertTriangle} title="تحت حد إعادة الطلب" value={String(alerts.below_reorder || 0)} sub={`${alerts.near_expiry || 0} قريب الانتهاء`} tone="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <KpiCard icon={Warehouse} title="المخازن النشطة" value={String(s.active_warehouses || 0)} sub={`${alerts.zero_stock || 0} صنف منتهي`} tone="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" />
      </div>

      {(alerts.below_reorder > 0 || alerts.near_expiry > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200 font-bold leading-relaxed">
            تنبيه تشغيلي: {alerts.below_reorder || 0} صنف تحت حد إعادة الطلب، و{alerts.near_expiry || 0} دفعة قاربت على انتهاء الصلاحية (خلال {data.expiryAlertDays || 60} يوماً).
            يُنصح بمراجعة تقارير التنبيهات واتخاذ إجراءات الصرف أو التبرع قبل التلف.
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
          <SectionHeader icon={TrendingDown} title="الأكثر صرفاً" desc="أعلى 10 أصناف بالكمية المصروفة" />
          <DataTable
            headers={['الصنف', 'الكمية', 'القيمة']}
            empty="لا توجد حركات صرف بعد"
            rows={(data.topIssued || []).map((r: any, i: number) => (
              <tr key={i}>
                <td className={TD_CLS}>{r.item_name_ar}</td>
                <td className={`${TD_CLS} tabular-nums`}>{fmtQty(r.total_qty)}</td>
                <td className={`${TD_CLS} tabular-nums`}>{fmtMoney(r.total_value)}</td>
              </tr>
            ))}
          />
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
          <SectionHeader icon={Warehouse} title="توزيع القيمة على المخازن" desc="قيمة المخزون لكل مخزن" />
          <DataTable
            headers={['المخزن', 'الأصناف', 'القيمة']}
            empty="لا توجد مخازن مسجلة"
            rows={(data.warehouseBreakdown || []).map((r: any, i: number) => (
              <tr key={i}>
                <td className={TD_CLS}>{r.warehouse_name_ar}</td>
                <td className={`${TD_CLS} tabular-nums`}>{r.skus}</td>
                <td className={`${TD_CLS} tabular-nums`}>{fmtMoney(r.stock_value)}</td>
              </tr>
            ))}
          />
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
          <SectionHeader icon={Tag} title="القيمة حسب الفئة" desc="تحليل فئات الأصناف" />
          <DataTable
            headers={['الفئة', 'الأصناف', 'القيمة']}
            empty="لا توجد فئات مسجلة"
            rows={(data.categoryBreakdown || []).map((r: any, i: number) => (
              <tr key={i}>
                <td className={TD_CLS}>{r.category_name_ar}</td>
                <td className={`${TD_CLS} tabular-nums`}>{r.skus}</td>
                <td className={`${TD_CLS} tabular-nums`}>{fmtMoney(r.stock_value)}</td>
              </tr>
            ))}
          />
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
          <SectionHeader icon={ClipboardCheck} title="المستندات المعلقة" desc="بانتظار الاعتماد أو الإجراء" />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: 'تحويلات', value: data.pendingDocs?.transfers },
              { label: 'تسويات', value: data.pendingDocs?.adjustments },
              { label: 'جرد', value: data.pendingDocs?.stocktakes },
            ].map((x) => (
              <div key={x.label} className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                <div className="text-lg font-black text-slate-800 dark:text-zinc-100 tabular-nums">{x.value || 0}</div>
                <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500">{x.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-slate-400 dark:text-zinc-500 font-bold leading-relaxed">
            اتجاه الحركات آخر 6 أشهر: {(data.movementTrend || []).map((t: any) => `${t.ym}: ${t.count}`).join(' • ') || 'لا توجد بيانات'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── المدخلات الأساسية: دليل الأصناف والمخازن ──────────────

function MasterDataPanel({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showWhModal, setShowWhModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [itemForm, setItemForm] = useState<any>({ item_type: 'STOCK', status: 'ACTIVE' });
  const [whForm, setWhForm] = useState<any>({ status: 'ACTIVE' });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      invApi(`/items?limit=100&search=${encodeURIComponent(search)}`).catch(() => null),
      invApi('/warehouses?limit=50').catch(() => null),
      invApi('/categories').catch(() => null),
      invApi('/uoms').catch(() => null),
    ]).then(([it, wh, cat, uom]) => {
      setItems(it?.data || []);
      setWarehouses(wh?.data || []);
      setCategories(cat || []);
      setUoms(uom || []);
    }).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const saveItem = async () => {
    if (!itemForm.name_ar) { setErr('اسم الصنف مطلوب'); return; }
    setBusy(true); setErr('');
    try {
      await invApi('/items', { method: 'POST', body: JSON.stringify(itemForm) });
      setShowItemModal(false);
      setItemForm({ item_type: 'STOCK', status: 'ACTIVE' });
      load(); onChanged();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const saveWarehouse = async () => {
    if (!whForm.name_ar) { setErr('اسم المخزن مطلوب'); return; }
    setBusy(true); setErr('');
    try {
      await invApi('/warehouses', { method: 'POST', body: JSON.stringify(whForm) });
      setShowWhModal(false);
      setWhForm({ status: 'ACTIVE' });
      load(); onChanged();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

    return (
    <div className="space-y-5">
      <SectionHeader
        icon={Boxes}
        title="دليل الأصناف (Master Data)"
        desc={`${items.length} صنف مسجل — البطاقة الرئيسية لكل صنف ووحدة قياسه وفئته وحدود الطلب`}
        actions={
          <>
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو الرمز..."
                className="pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <button className={BTN_PRIMARY} onClick={() => setShowItemModal(true)} disabled={busy}>
              <Plus size={15} /> إضافة صنف
            </button>
            <button className={BTN_PRIMARY} onClick={() => setShowWhModal(true)} disabled={busy}>
              <Plus size={15} /> إضافة مخزن
            </button>
          </>
        }
      />
            <DataTable
        headers={['الصنف', 'الوحدة', 'التصنيف', 'حد الطلب', 'المتوفر', 'القيمة', 'الحالة']}
        empty="لا توجد أصناف مسجلة"
        rows={items.map((it: any) => (
          <tr key={it.id}>
            <td className={TD_CLS}>
              <div className="font-black">{it.item_code}</div>
              <div className="text-[10px] text-slate-400 dark:text-zinc-500">{it.name_ar}</div>
            </td>
            <td className={TD_CLS}>{it.uom_code}</td>
            <td className={TD_CLS}>{it.category_name_ar || '—'}</td>
            <td className={TD_CLS}>{fmtQty(it.reorder_level)}</td>
            <td className={TD_CLS}>{fmtQty(it.total_on_hand || 0)}</td>
            <td className={TD_CLS}><span className="tabular-nums">{fmtMoney(it.total_value || 0)}</span></td>
            <td className={TD_CLS}><StatusBadge status={it.status} /></td>
          </tr>
        ))}
      />

      {/* نافذة إضافة / تعديل صنف */}
      <Modal open={showItemModal} title="إضافة صنف جديد" onClose={() => setShowItemModal(false)}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="الرمز">
            <input className={INPUT_CLS}
              value={itemForm.item_code || ''}
              onChange={(e) => setItemForm({ ...itemForm, item_code: e.target.value })}
              placeholder="يُولد تلقائياً إذا تُرك فارغاً" />
          </Field>
          <Field label="الاسم العربي *">
            <input className={INPUT_CLS}
              value={itemForm.name_ar || ''}
              onChange={(e) => setItemForm({ ...itemForm, name_ar: e.target.value })} />
          </Field>
          <Field label="الوحدة">
            <select className={INPUT_CLS} value={itemForm.uom_id || ''}
              onChange={(e) => setItemForm({ ...itemForm, uom_id: e.target.value || null })}>
              <option value="">اختر وحدة</option>
              {uoms.map((u: any) => <option key={u.id} value={u.id}>{u.code} - {u.name_ar}</option>)}
            </select>
          </Field>
          <Field label="التصنيف">
            <select className={INPUT_CLS} value={itemForm.category_id || ''}
              onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value || null })}>
              <option value="">اختر فئة</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.code} - {c.name_ar}</option>)}
            </select>
          </Field>
          <Field label="الاسم الإنجليزي">
            <input className={INPUT_CLS} value={itemForm.name_en || ''}
              onChange={(e) => setItemForm({ ...itemForm, name_en: e.target.value })} />
          </Field>
          <Field label="نوع الصنف">
            <select className={INPUT_CLS} value={itemForm.item_type || 'STOCK'}
              onChange={(e) => setItemForm({ ...itemForm, item_type: e.target.value })}>
              <option value="STOCK">مخزون دوري</option>
              <option value="CONSUMABLE">مستهلك</option>
              <option value="ASSET_SPARE">قطعة بديلة أصل</option>
              <option value="DONATION_GOODS">بضائع تبرعية</option>
            </select>
          </Field>
          <Field label="طريقة التقييم">
            <select className={INPUT_CLS} value={itemForm.valuation_method || 'WEIGHTED_AVERAGE'}
              onChange={(e) => setItemForm({ ...itemForm, valuation_method: e.target.value })}>
              <option value="WEIGHTED_AVERAGE">متوسط مرجّح</option>
              <option value="FIFO">أول دخل أول خروج</option>
            </select>
          </Field>
          <Field label="حد إعادة الطلب"><input type="number" className={INPUT_CLS} value={itemForm.reorder_level || 0} onChange={(e) => setItemForm({ ...itemForm, reorder_level: Number(e.target.value) })} /></Field>
          <Field label="الحد الأدنى"><input type="number" className={INPUT_CLS} value={itemForm.min_level || 0} onChange={(e) => setItemForm({ ...itemForm, min_level: Number(e.target.value) })} /></Field>
          {err && <div className="col-span-2 text-xs text-rose-600 font-black p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className={BTN_GHOST} onClick={() => setShowItemModal(false)}>إلغاء</button>
          <button className={BTN_PRIMARY} onClick={saveItem} disabled={busy}>
            {busy && <Spinner size="xs" />} حفظ الصنف
          </button>
        </div>
      </Modal>

      <Modal open={showWhModal} title="إضافة مخزن جديد" onClose={() => setShowWhModal(false)}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="الاسم العربي *"><input className={INPUT_CLS} value={whForm.name_ar || ''} onChange={(e) => setWhForm({ ...whForm, name_ar: e.target.value })} /></Field>
          <Field label="الاسم الإنجليزي"><input className={INPUT_CLS} value={whForm.name_en || ''} onChange={(e) => setWhForm({ ...whForm, name_en: e.target.value })} /></Field>
          <Field label="الموقع"><input className={INPUT_CLS} value={whForm.location || ''} onChange={(e) => setWhForm({ ...whForm, location: e.target.value })} /></Field>
          <Field label="مدير المخزن"><input className={INPUT_CLS} value={whForm.manager_name || ''} onChange={(e) => setWhForm({ ...whForm, manager_name: e.target.value })} /></Field>
          {err && <div className="col-span-2 text-xs text-rose-600 font-black p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl">{err}</div>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className={BTN_GHOST} onClick={() => setShowWhModal(false)}>إلغاء</button>
          <button className={BTN_PRIMARY} onClick={saveWarehouse} disabled={busy}>
            {busy && <Spinner size="xs" />} حفظ المخزن
          </button>
        </div>
            </Modal>
    </div>
  );
}

// ─── لوحة العمليات: استلام — صرف — تحويلات ───────────────────

function OperationsPanel({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    invApi(`/movements?limit=100`)
      .then((d: any) => setMovements(d?.data || []))
      .catch(() => setMovements([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Package}
        title="العمليات اليومية: استلام — صرف — تحويل"
        desc="كل حركة تُسجل في دفتر حركات موحد غير قابل للتعديل بتكلفة متوسط مرجّح تلقائية"
        actions={null}
      />
      <DataTable
        headers={['الرقم', 'النوع', 'المخزن', 'الصنف', 'الكمية', 'التكلفة', 'التاريخ', 'الحالة']}
        empty="لا توجد حركات مسجلة"
        rows={movements.map((m: any) => (
          <tr key={m.id}>
            <td className={TD_CLS}>{m.movement_number}</td>
            <td className={TD_CLS}>{MOVEMENT_TYPE_LABELS[m.movement_type]?.ar || m.movement_type}</td>
            <td className={TD_CLS}>{m.warehouse_name_ar}</td>
            <td className={TD_CLS}>{m.item_name_ar} ({m.item_code})</td>
            <td className={TD_CLS}><span className="tabular-nums">{fmtQty(m.quantity)}</span></td>
            <td className={TD_CLS}><span className="tabular-nums">{fmtMoney(m.total_value)}</span></td>
                        <td className={TD_CLS}>{m.doc_date}</td>
            <td className={TD_CLS}><StatusBadge status={m.status} /></td>
          </tr>
        ))}
      />
    </div>
  );
}

// ─── لوحة الجرد الفعلي ───────────────────────────────────────

function StocktakePanel({ refreshKey, onChanged, lang = 'ar', isRtl = true }: { refreshKey: number; onChanged: () => void; lang?: 'ar' | 'en'; isRtl?: boolean }) {
  const [stocktakes, setStocktakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    invApi(`/stocktakes?limit=100`)
      .then((d: any) => setStocktakes(d?.data || []))
      .catch(() => setStocktakes([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <SectionHeader icon={ClipboardCheck} title="جلسات الجرد الفعلي" desc="جرد دوري أو نقطي — يُرحّل الفرق تلقائياً كتسويات" actions={null} />
      <DataTable
        headers={['رقم الجلسة', 'المخزن', 'نوع الجرد', 'عدد الأسطر', 'فروقات', 'الحالة']}
        empty="لا توجد جلسات جرد"
        rows={stocktakes.map((s: any) => (
          <tr key={s.id}>
            <td className={TD_CLS}>{s.stocktake_number}</td>
            <td className={TD_CLS}>{s.warehouse_name_ar}</td>
            <td className={TD_CLS}>{s.count_type}</td>
            <td className={TD_CLS}><span className="tabular-nums">{s.lines_count || 0}</span></td>
            <td className={TD_CLS}><span className="tabular-nums">{fmtQty(s.total_variance_value || 0)}</span></td>
            <td className={TD_CLS}><StatusBadge status={s.status} /></td>
          </tr>
        ))}
      />
    </div>
  );
}

// ─── لوحة المستندات ──────────────────────────────────────────

function DocumentsPanel({ refreshKey, lang = 'ar', isRtl = true }: { refreshKey: number; lang?: 'ar' | 'en'; isRtl?: boolean }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    invApi('/movements?limit=200')
      .then((d: any) => { if (alive) setDocs(d?.data || []); })
      .catch(() => { if (alive) setDocs([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshKey]);

  return (
    <div className="space-y-5">
      <SectionHeader icon={FileText} title="المستندات والفواتير الذكية" desc="حركات مخزن قابلة للطباعة" actions={null} />
      <DataTable
        headers={['الرقم', 'النوع', 'الصنف', 'القيمة', '']}
        empty="لا توجد مستندات"
        rows={docs.map((d: any) => (
          <tr key={d.id}>
            <td className={TD_CLS}>{d.movement_number}</td>
            <td className={TD_CLS}>{MOVEMENT_TYPE_LABELS[d.movement_type]?.ar || d.movement_type}</td>
            <td className={TD_CLS}>{d.item_name_ar} ({d.item_code})</td>
            <td className={TD_CLS}><span className="tabular-nums">{fmtMoney(d.total_value)}</span></td>
            <td className={TD_CLS}><button className={BTN_GHOST} onClick={() => {
              let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>حركة مخزن</title>`;
              html += `<style>body{font-family:'Cairo',sans-serif;margin:30px;font-size:11px;color:#111;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #999;padding:5px 8px;text-align:right;}.hd{background:#059669;color:#fff;}</style>`;
              html += `</head><body><h2 style="color:#059669">حركة مخزن — ${d.movement_number}</h2>`;
              html += `<p>النوع: ${MOVEMENT_TYPE_LABELS[d.movement_type]?.ar || ''} | التاريخ: ${d.doc_date} | الصنف: ${d.item_name_ar}</p>`;
              html += `<table><tr class="hd"><th>الحقل</th><th>القيمة</th></tr>`;
              html += `<tr><td>الكمية</td><td>${fmtQty(d.quantity)}</td></tr>`;
              html += `<tr><td>التكلفة الواحدة</td><td>${fmtMoney(d.unit_cost)}</td></tr>`;
              html += `<tr><td>القيمة الإجمالية</td><td>${fmtMoney(d.total_value)}</td></tr>`;
              html += `<tr><td>الرصيد بعد الحركة</td><td>${fmtQty(d.balance_after)}</td></tr>`;
              html += `<tr><td>الحالة</td><td>${INVENTORY_STATUS_LABELS[d.status]?.ar || d.status}</td></tr></table>`;
              html += `<p style="margin-top:20px">جمعية رُحماء بينهم للعمل الإنساني والتنمية — UAMEX ERP™</p></body></html>`;
                            printHTML(html);
            }}><Printer size={14} /> طباعة</button></td>
          </tr>
        ))}
      />
    </div>
  );
}

// ─── لوحة التقارير والتحليلات ───────────────────────────────

function ReportsPanel({ refreshKey, lang = 'ar', isRtl = true }: { refreshKey: number; lang?: 'ar' | 'en'; isRtl?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    invApi('/dashboard')
      .then((d: any) => { if (alive) setData(d); })
      .catch(() => { if (alive) setData(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshKey]);

  if (loading) return <div className="flex items-center justify-center py-16"><Spinner size="md" variant="primary" lang="ar" labelAr="جارٍ تحميل التقارير..." /></div>;
  if (!data) return <ErrorState onRetry={() => {}} lang="ar" messageAr="لا توجد بيانات تقارير." />;

  return (
    <div className="space-y-5">
      <SectionHeader icon={BarChart3} title="التقارير التحليلية والذكاء الأعمال" desc="لوحة القيادة • توزيع القيمة • اتجاه الحركات" actions={null} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Coins} title="قيمة المخزون" value={fmtMoney(data.summary?.total_stock_value)} sub="ريال" tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
        <KpiCard icon={Boxes} title="أصناف نشطة" value={String(data.summary?.active_skus || 0)} sub={`${data.summary?.active_warehouses || 0} مخزن`} tone="bg-sky-500/10 text-sky-600 dark:text-sky-400" />
        <KpiCard icon={AlertTriangle} title="تحت الحد الأدنى" value={String(data.alerts?.below_reorder || 0)} sub={`${data.alerts?.near_expiry || 0} قريب الانتهاء`} tone="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
        <KpiCard icon={TrendingDown} title="نفادي" value={String(data.alerts?.zero_stock || 0)} sub="صنف نفد توافره" tone="bg-rose-500/10 text-rose-600 dark:text-rose-400" />
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-4">
        <SectionHeader icon={Layers} title="توزيع القيمة حسب المخزن" actions={null} />
        <DataTable
          headers={['المخزن', 'الأصناف', 'القيمة']}
          empty="لا توجد بيانات"
          rows={(data.warehouseBreakdown || []).map((r: any, i: number) => (
            <tr key={i}>
              <td className={TD_CLS}>{r.name_ar}</td>
              <td className={TD_CLS}><span className="tabular-nums">{r.sku_count}</span></td>
              <td className={TD_CLS}><span className="tabular-nums">{fmtMoney(r.stock_value)}</span></td>
            </tr>
          ))}
        />
      </div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════
// لوحة الإعدادات والسياسات والصلاحيات — وحدة المخازن NEB-05/NEB-09
// ══════════════════════════════════════════════════════════════

function SettingsPanel({ refreshKey, onChanged, currentUser }: { refreshKey: number; onChanged: () => void; currentUser?: any }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<any>({});
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    invApi('/policies')
      .then((d: any) => { setForm(d); })
      .catch(() => setForm({}))
      .finally(() => setLoading(false));
  }, [refreshKey]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true); setErr('');
    try {
      await invApi('/policies', { method: 'PUT', body: JSON.stringify(form) });
      onChanged();
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Spinner size="md" variant="primary" lang="ar" labelAr="جارٍ تحميل الإعدادات..." /></div>;

  return (
    <div className="space-y-5">
      <SectionHeader icon={Settings2} title="سياسات وإعدادات وحدة المخازن" desc="ضوابط التكلفة، الموافقة، التنبيهات" actions={null} />
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="طريقة التكلفة"><select className={INPUT_CLS} value={form.costing_method || 'WEIGHTED_AVERAGE'} onChange={(e) => setForm({ ...form, costing_method: e.target.value })}><option value="WEIGHTED_AVERAGE">متوسط مرجّح</option><option value="FIFO">FIFO</option></select></Field>
          <Field label="السماح بالرصيد السالب"><select className={INPUT_CLS} value={String(form.allow_negative_stock)} onChange={(e) => setForm({ ...form, allow_negative_stock: e.target.value === 'true' })}><option value="false">لا</option><option value="true">نعم</option></select></Field>
          <Field label="اعتماد صرف"><select className={INPUT_CLS} value={String(form.require_approval_issue)} onChange={(e) => setForm({ ...form, require_approval_issue: e.target.value === 'true' })}><option value="true">مطلوب</option><option value="false">لا يوجد</option></select></Field>
          <Field label="اعتماد تحويل"><select className={INPUT_CLS} value={String(form.require_approval_transfer)} onChange={(e) => setForm({ ...form, require_approval_transfer: e.target.value === 'true' })}><option value="true">مطلوب</option><option value="false">لا يوجد</option></select></Field>
          <Field label="اعتماد تسوية"><select className={INPUT_CLS} value={String(form.require_approval_adjustment)} onChange={(e) => setForm({ ...form, require_approval_adjustment: e.target.value === 'true' })}><option value="true">مطلوب</option><option value="false">لا يوجد</option></select></Field>
          <Field label="حد إشعار الانتهاء (أيام)"><input type="number" className={INPUT_CLS} value={form.expiry_alert_days ?? 60} onChange={(e) => setForm({ ...form, expiry_alert_days: Number(e.target.value) })} /></Field>
          <Field label="تكرار الجرد الافتراضي"><select className={INPUT_CLS} value={form.default_stocktake_frequency || 'MONTHLY'} onChange={(e) => setForm({ ...form, default_stocktake_frequency: e.target.value })}><option value="MONTHLY">شهري</option><option value="QUARTERLY">ربع سنوي</option><option value="ANNUAL">سنوي</option></select></Field>
          <Field label="تفعيل تنبيهات إعادة الطلب"><select className={INPUT_CLS} value={String(form.reorder_alert_enabled)} onChange={(e) => setForm({ ...form, reorder_alert_enabled: e.target.value === 'true' })}><option value="true">مفعّل</option><option value="false">معطل</option></select></Field>
        </div>
        {err && <div className="mt-3 text-xs text-rose-600 font-black p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl">{err}</div>}
        <div className="mt-4 flex justify-end">
          <button className={BTN_PRIMARY} onClick={save} disabled={busy}>{busy && <Spinner size="xs" />} حفظ السياسات</button>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5">
        <SectionHeader icon={ShieldCheck} title="مصفوفة الصلاحيات المعيارية" desc={`دور المستخدم الحالي: ${currentUser?.role || 'غير محدد'}`} actions={null} />
        <DataTable
          headers={['الدور', 'الصلاحيات المسموحة']}
          empty="لا توجد صلاحيات"
          rows={Object.entries(INVENTORY_ROLE_PERMISSIONS).map(([role, perms]) => (
            <tr key={role}>
              <td className={TD_CLS}><span className="font-black">{role}</span></td>
              <td className={TD_CLS}><span className="text-xs">{(perms as string[]).join('، ')}</span></td>
            </tr>
          ))}
        />
      </div>
    </div>
  );
}

// ─── المكوّن الرئيسي: الوركسبيس المستقل الكامل ─────────────────────

export default function InventoryWorkspaceView({ lang, currentUser, onNavigate }: InventoryWorkspaceViewProps) {
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<SubTab>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const onChanged = () => setRefreshKey((k) => k + 1);

  const tabs: { id: SubTab; label: string; icon: any; tone: string }[] = [
    { id: 'dashboard', label: 'لوحة القيادة', icon: BarChart3, tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { id: 'master', label: 'المدخلات الأساسية', icon: Boxes, tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { id: 'operations', label: 'العمليات', icon: Package, tone: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    { id: 'stocktake', label: 'الجرد الفعلي', icon: ClipboardCheck, tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { id: 'documents', label: 'المستندات', icon: FileText, tone: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    { id: 'reports', label: 'التقارير والذكاء', icon: BarChart3, tone: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { id: 'settings', label: 'الإعدادات والصلاحيات', icon: Settings2, tone: 'bg-slate-500/10 text-slate-600 dark:text-zinc-400' },
  ];

  const renderPanel = () => {
    switch (activeTab) {
      case 'dashboard':  return <DashboardPanel refreshKey={refreshKey} />;
      case 'master':     return <MasterDataPanel refreshKey={refreshKey} onChanged={onChanged} />;
      case 'operations': return <OperationsPanel refreshKey={refreshKey} onChanged={onChanged} />;
      case 'stocktake':  return <StocktakePanel refreshKey={refreshKey} onChanged={onChanged} />;
      case 'documents':  return <DocumentsPanel refreshKey={refreshKey} />;
      case 'reports':    return <ReportsPanel refreshKey={refreshKey} />;
      case 'settings':   return <SettingsPanel refreshKey={refreshKey} onChanged={onChanged} currentUser={currentUser} />;
      default:           return null;
    }
  };

  return (
    <div className={`min-h-screen text-slate-800 dark:text-zinc-100 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center overflow-x-auto gap-1 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl text-xs font-black whitespace-nowrap transition-all border-b-3 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 border-transparent hover:border-slate-300 dark:hover:border-zinc-600'
                }`}
              >
                <tab.icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-5 space-y-4">{renderPanel()}</div>
    </div>
  );
}

