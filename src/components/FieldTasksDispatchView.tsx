/**
 * NexoraOS™ — NEB-05: Field Task Dispatch OS (dedicated view)
 * ─────────────────────────────────────────────────────────────
 * DEBT PAID: `field_tasks` tab rendered the same `ActivitiesView` as the
 * `activities` tab — no dispatch, no WBS cascade, no offline proof.
 * This view is the operational dispatch desk:
 *   Activities → Tasks (WBS L3+) → progress cascade (task → activity → project)
 *   + honest offline queue (localStorage, user-created only — zero demo names).
 *
 * APIs (V2 domains):
 *   GET  /api/v2/domains/activities
 *   GET  /api/v2/domains/activities/:activityId/tasks
 *   POST /api/v2/domains/activities/:activityId/tasks
 *   PUT  /api/v2/domains/tasks/:taskId/progress        (cascades to activity+project)
 *   PUT  /api/v2/domains/activities/:id/progress       (recalc project progress)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2, Plus, Search, RefreshCw, Wifi, WifiOff, Send,
  ClipboardList, TrendingUp, AlertTriangle, XCircle, Clock,
} from 'lucide-react';
import { cn } from '../design-system/utils/cn';
import { EmptyState } from '../design-system/components/EmptyState';
import { ErrorState } from '../design-system/components/ErrorState';
import { Spinner } from '../design-system/components/Spinner';
import { EnterpriseButton } from './common/EnterpriseButton';
import { useTrainingWriteGuard } from '../core/context/EnvironmentModeContext';

interface FieldTasksDispatchViewProps {
  lang: 'ar' | 'en';
  programs?: any[];
  projects?: any[];
  onNavigate?: (tab: string) => void;
}

type SubTab = 'dispatch' | 'queue';

function getAuthHeaders(): Record<string, string> {
  const token = (() => { try { return localStorage.getItem('rbd_token'); } catch { return null; } })();
  let tenant = 'demo';
  try { tenant = localStorage.getItem('uamex_tenant_id') || 'demo'; } catch { /* ignore */ }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'X-Tenant-Id': tenant,
  };
}

async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(path, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message || json?.error || `HTTP ${res.status}`);
  if (json && typeof json === 'object' && 'data' in json) return (json as any).data as T;
  return json as T;
}

async function apiSend<T = any>(method: string, path: string, body?: any): Promise<T> {
  const res = await fetch(path, { method, headers: getAuthHeaders(), body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) throw new Error(json?.error?.message || json?.error || `HTTP ${res.status}`);
  if (json && typeof json === 'object' && 'data' in json) return (json as any).data as T;
  return (json ?? {}) as T;
}

const norm = (v: any): any[] =>
  Array.isArray(v) ? v : v?.data && Array.isArray(v.data) ? v.data : v?.items && Array.isArray(v.items) ? v.items : [];

const INPUT_CLS =
  'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
const LABEL_CLS = 'block text-[11px] font-black text-slate-500 dark:text-zinc-400 mb-1';
const BTN_PRIMARY =
  'px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50';
const TH_CLS = 'px-3 py-2.5 text-[11px] font-black text-slate-500 dark:text-zinc-400 text-right whitespace-nowrap';
const TD_CLS = 'px-3 py-2.5 text-xs text-slate-700 dark:text-zinc-200 whitespace-nowrap';

interface QueuedOp {
  id: string;
  kind: 'TASK_PROGRESS' | 'TASK_CREATE';
  activityId: string;
  taskId?: string;
  payload: any;
  createdAt: string;
}

const QUEUE_KEY = 'nexora_field_tasks_queue_v1';

function loadQueue(): QueuedOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export default function FieldTasksDispatchView({ lang, projects = [], onNavigate }: FieldTasksDispatchViewProps) {
  const isRtl = lang === 'ar';
  const training = useTrainingWriteGuard(lang);
  const [subTab, setSubTab] = useState<SubTab>('dispatch');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queue, setQueue] = useState<QueuedOp[]>(() => loadQueue());
  const [syncing, setSyncing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taskForm, setTaskForm] = useState({ title_ar: '', title_en: '', planned_hours: '4' });
  const [progressDrafts, setProgressDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch { /* ignore */ }
  }, [queue]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await apiGet<any[]>('/api/v2/domains/activities?limit=200');
      const rows = norm(data);
      setActivities(rows);
      if (!selectedActivityId && rows.length > 0) setSelectedActivityId(String(rows[0].id));
    } catch (e: any) {
      setFetchError(e?.message || (isRtl ? 'تعذر تحميل الأنشطة' : 'Failed to load activities'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRtl]);

  const fetchTasks = useCallback(async (activityId: string) => {
    if (!activityId) { setTasks([]); return; }
    setTasksLoading(true);
    try {
      const data = await apiGet<any[]>(`/api/v2/domains/activities/${activityId}/tasks`);
      setTasks(norm(data));
    } catch {
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);
  useEffect(() => { if (selectedActivityId) fetchTasks(selectedActivityId); }, [selectedActivityId, fetchTasks]);

  const filteredActivities = useMemo(() => {
    if (!search) return activities;
    const q = search.toLowerCase();
    return activities.filter((a) => `${a.name_ar || a.title_ar || ''} ${a.name_en || ''}`.toLowerCase().includes(q));
  }, [activities, search]);

  const doneTasks = tasks.filter((t) => Number(t.progress_pct ?? t.progressPct ?? 0) >= 100).length;
  const avgProgress = tasks.length > 0
    ? tasks.reduce((s, t) => s + Number(t.progress_pct ?? t.progressPct ?? 0), 0) / tasks.length
    : 0;

  const enqueue = (op: Omit<QueuedOp, 'id' | 'createdAt'>) => {
    setQueue((q) => [...q, { ...op, id: `Q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() }]);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!training.guard()) { setActionError(training.blockMessage); return; }
    if (!selectedActivityId) return;
    if (!taskForm.title_ar.trim()) { setActionError(isRtl ? 'عنوان المهمة مطلوب' : 'Task title is required'); return; }
    setSaving(true);
    setActionError(null);
    const payload = {
      titleAr: taskForm.title_ar.trim(),
      titleEn: taskForm.title_en.trim() || undefined,
      plannedHours: Number(taskForm.planned_hours || 4),
    };
    try {
      if (!isOnline) throw new Error('OFFLINE');
      await apiSend('POST', `/api/v2/domains/activities/${selectedActivityId}/tasks`, payload);
      setShowCreateModal(false);
      setTaskForm({ title_ar: '', title_en: '', planned_hours: '4' });
      await fetchTasks(selectedActivityId);
    } catch (err: any) {
      if (err?.message === 'OFFLINE' || !isOnline) {
        enqueue({ kind: 'TASK_CREATE', activityId: selectedActivityId, payload });
        setShowCreateModal(false);
        setTaskForm({ title_ar: '', title_en: '', planned_hours: '4' });
        setSubTab('queue');
      } else {
        setActionError(err?.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleProgress = async (taskId: string) => {
    if (!training.guard()) { setActionError(training.blockMessage); return; }
    const raw = progressDrafts[taskId];
    const pct = Number(raw);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setActionError(isRtl ? 'النسبة يجب أن تكون بين 0 و 100' : 'Progress must be between 0 and 100');
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      if (!isOnline) throw new Error('OFFLINE');
      await apiSend('PUT', `/api/v2/domains/tasks/${taskId}/progress`, { progressPct: pct });
      await fetchTasks(selectedActivityId);
    } catch (err: any) {
      if (err?.message === 'OFFLINE' || !isOnline) {
        enqueue({ kind: 'TASK_PROGRESS', activityId: selectedActivityId, taskId, payload: { progressPct: pct } });
        setSubTab('queue');
      } else {
        setActionError(err?.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSyncQueue = async () => {
    if (!training.guard()) { setActionError(training.blockMessage); return; }
    if (!isOnline || queue.length === 0 || syncing) return;
    setSyncing(true);
    setActionError(null);
    const remaining: QueuedOp[] = [];
    for (const op of queue) {
      try {
        if (op.kind === 'TASK_CREATE') {
          await apiSend('POST', `/api/v2/domains/activities/${op.activityId}/tasks`, op.payload);
        } else if (op.kind === 'TASK_PROGRESS' && op.taskId) {
          await apiSend('PUT', `/api/v2/domains/tasks/${op.taskId}/progress`, op.payload);
        }
      } catch {
        remaining.push(op);
      }
    }
    setQueue(remaining);
    setSyncing(false);
    if (selectedActivityId) await fetchTasks(selectedActivityId);
  };

  if (loading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (fetchError) return <div className="p-4"><ErrorState title={isRtl ? 'تعذر التحميل' : 'Load failed'} message={fetchError} onRetry={fetchActivities} /></div>;

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-sky-950 via-zinc-950 to-slate-900 border border-sky-500/30 rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-500/40">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-sky-500/30 text-sky-200 rounded text-[10px] font-black font-mono">NEB-05 • PM</span>
              <span className={cn('flex items-center gap-1 text-[10px] font-bold', isOnline ? 'text-emerald-300' : 'text-amber-300')}>
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {isOnline ? (isRtl ? 'متصل' : 'Online') : (isRtl ? 'دون اتصال — طابور محلي' : 'Offline — local queue')}
              </span>
            </div>
            <h2 className="text-lg font-black">{isRtl ? 'توزيع المهام الميدانية والتنفيذ اليومي' : 'Field Task Dispatch & Daily Execution'}</h2>
            <p className="text-[11px] text-zinc-400">{isRtl ? 'نشاط → مهام (WBS) → تقدم متتابع حتى المشروع' : 'Activity → tasks (WBS) → cascading progress to project'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EnterpriseButton variant="secondary" size="sm" onClick={fetchActivities}>
            <RefreshCw className="w-3.5 h-3.5" /><span>{isRtl ? 'تحديث' : 'Refresh'}</span>
          </EnterpriseButton>
          {onNavigate && (
            <EnterpriseButton variant="secondary" size="sm" onClick={() => onNavigate('activities')}>
              <ClipboardList className="w-3.5 h-3.5" /><span>{isRtl ? 'سجل الأنشطة' : 'Activities'}</span>
            </EnterpriseButton>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2 w-fit">
        {(['dispatch', 'queue'] as SubTab[]).map((t) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={cn('px-4 py-2 rounded-xl text-[11px] font-black cursor-pointer transition-all',
              subTab === t ? 'bg-sky-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800')}>
            {t === 'dispatch' ? (isRtl ? `التوزيع (${tasks.length})` : `Dispatch (${tasks.length})`) : (isRtl ? `طابور المزامنة (${queue.length})` : `Sync queue (${queue.length})`)}
          </button>
        ))}
      </div>

      {training.isTrainingMode && (
        <div className="text-[11px] font-black text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
          {training.blockMessage}
        </div>
      )}

      {actionError && (
        <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          <XCircle className="w-3.5 h-3.5" />{actionError}
        </div>
      )}

      {subTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث في الأنشطة...' : 'Search activities...'} className={cn(INPUT_CLS, 'pr-9')} />
            </div>
            <div className="max-h-[480px] overflow-y-auto space-y-1.5">
              {filteredActivities.length === 0 ? (
                <EmptyState title={isRtl ? 'لا توجد أنشطة' : 'No activities'} description={isRtl ? 'أنشئ نشاطاً من سجل الأنشطة أولاً' : 'Create an activity first'} />
              ) : filteredActivities.map((a) => (
                <button key={a.id} onClick={() => setSelectedActivityId(String(a.id))}
                  className={cn('w-full text-right p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all',
                    selectedActivityId === String(a.id)
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 hover:border-sky-500/40')}>
                  <div className="truncate">{a.name_ar || a.title_ar || a.name_en || '—'}</div>
                  <div className={cn('text-[10px] font-mono mt-0.5', selectedActivityId === String(a.id) ? 'text-sky-100' : 'text-slate-400')}>
                    {a.status || a.status_code || ''} • {Number(a.progress_pct ?? a.progressPct ?? 0).toFixed(0)}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 text-[11px] font-black text-slate-500">
                <span className="flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" />{tasks.length} {isRtl ? 'مهمة' : 'tasks'}</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{doneTasks} {isRtl ? 'منجزة' : 'done'}</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-sky-500" />{avgProgress.toFixed(1)}%</span>
              </div>
              <button onClick={() => { setShowCreateModal(true); }} disabled={!selectedActivityId} className={BTN_PRIMARY}>
                <Plus className="w-4 h-4" />{isRtl ? 'مهمة جديدة' : 'New task'}
              </button>
            </div>
            {tasksLoading ? (
              <div className="flex justify-center p-6"><Spinner /></div>
            ) : tasks.length === 0 ? (
              <EmptyState title={isRtl ? 'لا توجد مهام لهذا النشاط' : 'No tasks for this activity'} description={isRtl ? 'وزع أول مهمة ميدانية يومية' : 'Dispatch the first daily field task'} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-zinc-950"><tr>
                    <th className={TH_CLS}>{isRtl ? 'المهمة' : 'Task'}</th>
                    <th className={TH_CLS}>{isRtl ? 'التقدم' : 'Progress'}</th>
                    <th className={TH_CLS}>{isRtl ? 'تحديث' : 'Update'}</th>
                  </tr></thead>
                  <tbody>
                    {tasks.map((t: any) => {
                      const pct = Number(t.progress_pct ?? t.progressPct ?? 0);
                      return (
                        <tr key={t.id} className="border-t border-slate-100 dark:border-zinc-800">
                          <td className={TD_CLS}>
                            <div className="font-black">{t.title_ar || t.titleAr || t.title_en || '—'}</div>
                            <div className="text-[10px] text-slate-400">{t.status || ''}</div>
                          </td>
                          <td className={TD_CLS}>
                            <div className="flex items-center gap-2 min-w-[140px]">
                              <div className="flex-1 h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-600 rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                              </div>
                              <span className="font-mono font-black text-[11px]">{pct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className={TD_CLS}>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number" min={0} max={100}
                                value={progressDrafts[String(t.id)] ?? String(pct)}
                                onChange={(e) => setProgressDrafts((d) => ({ ...d, [String(t.id)]: e.target.value }))}
                                className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
                              />
                              <button onClick={() => handleProgress(String(t.id))} disabled={saving} className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-black cursor-pointer disabled:opacity-50">
                                {isRtl ? 'حفظ' : 'Save'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {isRtl ? 'حفظ التقدم يحدّث المهمة ثم النشاط ثم المشروع تلقائياً (تتابع WBS)' : 'Saving progress cascades task → activity → project automatically (WBS)'}
            </p>
          </div>
        </div>
      )}

      {subTab === 'queue' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              {isRtl ? `عمليات معلقة (${queue.length})` : `Pending operations (${queue.length})`}
            </h3>
            <button onClick={handleSyncQueue} disabled={!isOnline || queue.length === 0 || syncing} className={BTN_PRIMARY}>
              <Send className="w-4 h-4" />{syncing ? (isRtl ? 'جارٍ المزامنة...' : 'Syncing...') : (isRtl ? 'مزامنة الآن' : 'Sync now')}
            </button>
          </div>
          {!isOnline && (
            <p className="text-[11px] text-amber-600 font-bold">{isRtl ? 'الجهاز دون اتصال — العمليات محفوظة محلياً وستُرسل عند عودة الشبكة' : 'Device offline — operations are stored locally and will send on reconnect'}</p>
          )}
          {queue.length === 0 ? (
            <EmptyState title={isRtl ? 'الطابور فارغ' : 'Queue is empty'} description={isRtl ? 'كل العمليات الميدانية مُزامنة' : 'All field operations are synced'} />
          ) : (
            <div className="space-y-2">
              {queue.map((q) => (
                <div key={q.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs flex items-center justify-between">
                  <span className="font-bold">{q.kind === 'TASK_CREATE' ? (isRtl ? 'إنشاء مهمة' : 'Create task') : (isRtl ? 'تحديث تقدم' : 'Progress update')}</span>
                  <span className="font-mono text-[10px] text-slate-400">{q.createdAt.slice(0, 16).replace('T', ' ')}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-400">Projects in scope: {projects.length}</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-black text-sm">{isRtl ? 'مهمة ميدانية جديدة' : 'New field task'}</h3>
            <div><label className={LABEL_CLS}>{isRtl ? 'العنوان (عربي) *' : 'Title (AR) *'}</label><input value={taskForm.title_ar} onChange={(e) => setTaskForm({ ...taskForm, title_ar: e.target.value })} className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS}>{isRtl ? 'العنوان (إنجليزي)' : 'Title (EN)'}</label><input value={taskForm.title_en} onChange={(e) => setTaskForm({ ...taskForm, title_en: e.target.value })} className={INPUT_CLS} /></div>
            <div><label className={LABEL_CLS}>{isRtl ? 'الساعات المخططة' : 'Planned hours'}</label><input type="number" min={1} value={taskForm.planned_hours} onChange={(e) => setTaskForm({ ...taskForm, planned_hours: e.target.value })} className={INPUT_CLS} /></div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
