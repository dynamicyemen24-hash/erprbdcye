/**
 * NexoraOS™ — NEB-07/HCM: Volunteers, Committees & Membership OS
 * Recruit → tasks → hours → committees → membership review (e2e)
 * APIs: GET/POST /api/v2/domains/volunteers|committees|membership,
 *       GET /volunteers/hours-report, POST /membership/:id/review,
 *       GET /api/tables/volunteer_tasks (whitelisted)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Plus, RefreshCw, CheckCircle2, XCircle, Clock, Award, ClipboardCheck } from 'lucide-react';
import { cn } from '../design-system/utils/cn';
import { EmptyState } from '../design-system/components/EmptyState';
import { ErrorState } from '../design-system/components/ErrorState';
import { Spinner } from '../design-system/components/Spinner';
import { EnterpriseButton } from './common/EnterpriseButton';
import { useTrainingWriteGuard } from '../core/context/EnvironmentModeContext';

interface Props { lang: 'ar' | 'en'; onNavigate?: (tab: string) => void; }
type SubTab = 'dashboard' | 'volunteers' | 'tasks' | 'committees' | 'membership';

function headers(): Record<string, string> {
  const t = (() => { try { return localStorage.getItem('rbd_token'); } catch { return null; } })();
  let tenant = 'demo';
  try { tenant = localStorage.getItem('uamex_tenant_id') || 'demo'; } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), 'X-Tenant-Id': tenant };
}
async function get<T = any>(path: string): Promise<T> {
  const r = await fetch(path, { headers: headers() });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error?.message || j?.error || `HTTP ${r.status}`);
  return (j && typeof j === 'object' && 'data' in j ? (j as any).data : j) as T;
}
async function post<T = any>(path: string, body?: any): Promise<T> {
  const r = await fetch(path, { method: 'POST', headers: headers(), body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => null);
  if (!r.ok || j?.success === false) throw new Error(j?.error?.message || j?.error || `HTTP ${r.status}`);
  return (j && typeof j === 'object' && 'data' in j ? (j as any).data : j ?? {}) as T;
}
const norm = (v: any): any[] => (Array.isArray(v) ? v : v?.data && Array.isArray(v.data) ? v.data : v?.items && Array.isArray(v.items) ? v.items : []);
const INPUT = 'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
const LABEL = 'block text-[11px] font-black text-slate-500 dark:text-zinc-400 mb-1';
const BTN = 'px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50';
const TH = 'px-3 py-2.5 text-[11px] font-black text-slate-500 text-right whitespace-nowrap';
const TD = 'px-3 py-2.5 text-xs whitespace-nowrap';

export default function CommunityWorkspaceView({ lang, onNavigate }: Props) {
  const isRtl = lang === 'ar';
  const training = useTrainingWriteGuard(lang);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<SubTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState<'volunteer' | 'committee' | 'member' | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [vForm, setVForm] = useState({ name: '', email: '', phone: '', field: '' });
  const [cForm, setCForm] = useState({ name_ar: '', governorate: '', committee_type: 'PROTECTION' });
  const [mForm, setMForm] = useState({ applicant_name_ar: '', phone: '', membership_type: 'VOLUNTEER' });

  const fetchAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [v, c, m, h, t] = await Promise.all([
        get<any[]>('/api/v2/domains/volunteers?limit=200').catch(() => []),
        get<any[]>('/api/v2/domains/committees').catch(() => []),
        get<any[]>('/api/v2/domains/membership?limit=200').catch(() => []),
        get<any[]>('/api/v2/domains/volunteers/hours-report').catch(() => []),
        get<any[]>('/api/tables/volunteer_tasks?limit=200').catch(() => []),
      ]);
      setVolunteers(norm(v)); setCommittees(norm(c)); setMembers(norm(m)); setHours(norm(h)); setTasks(norm(t));
    } catch (e: any) { setErr(e?.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredV = useMemo(() => {
    if (!search) return volunteers;
    const q = search.toLowerCase();
    return volunteers.filter((v) => `${v.name || ''} ${v.email || ''} ${v.phone || ''}`.toLowerCase().includes(q));
  }, [volunteers, search]);

  const totalHours = hours.reduce((s, h: any) => s + Number(h.total_hours || h.actual_hours || 0), 0);
  const pendingMembers = members.filter((m) => ['PENDING', 'UNDER_REVIEW'].includes(String(m.status || '').toUpperCase())).length;

  const createVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!training.guard()) { setFormErr(training.blockMessage); return; }
    if (!vForm.name.trim()) { setFormErr(isRtl ? 'اسم المتطوع مطلوب' : 'Volunteer name is required'); return; }
    setSaving(true); setFormErr(null);
    try {
      await post('/api/v2/domains/volunteers', { name: vForm.name.trim(), email: vForm.email || undefined, phone: vForm.phone || undefined, field: vForm.field || undefined });
      setShowModal(null); setVForm({ name: '', email: '', phone: '', field: '' }); await fetchAll();
    } catch (e: any) { setFormErr(e?.message); } finally { setSaving(false); }
  };

  const createCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!training.guard()) { setFormErr(training.blockMessage); return; }
    if (!cForm.name_ar.trim()) { setFormErr(isRtl ? 'اسم اللجنة مطلوب' : 'Committee name is required'); return; }
    setSaving(true); setFormErr(null);
    try {
      await post('/api/v2/domains/committees', { nameAr: cForm.name_ar, name_ar: cForm.name_ar, governorate: cForm.governorate || undefined, committeeType: cForm.committee_type });
      setShowModal(null); setCForm({ name_ar: '', governorate: '', committee_type: 'PROTECTION' }); await fetchAll();
    } catch (e: any) { setFormErr(e?.message); } finally { setSaving(false); }
  };

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!training.guard()) { setFormErr(training.blockMessage); return; }
    if (!mForm.applicant_name_ar.trim()) { setFormErr(isRtl ? 'اسم المتقدم مطلوب' : 'Applicant name is required'); return; }
    setSaving(true); setFormErr(null);
    try {
      await post('/api/v2/domains/membership', { applicantNameAr: mForm.applicant_name_ar, applicant_name_ar: mForm.applicant_name_ar, phone: mForm.phone || undefined, membershipType: mForm.membership_type });
      setShowModal(null); setMForm({ applicant_name_ar: '', phone: '', membership_type: 'VOLUNTEER' }); await fetchAll();
    } catch (e: any) { setFormErr(e?.message); } finally { setSaving(false); }
  };

  const reviewMember = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    if (!training.guard()) { setActionMsg(training.blockMessage); return; }
    setSaving(true);
    try { await post(`/api/v2/domains/membership/${id}/review`, { decision }); await fetchAll(); }
    catch (e: any) { setErr(e?.message); } finally { setSaving(false); }
  };

  const TABS: { id: SubTab; ar: string; en: string }[] = [
    { id: 'dashboard', ar: 'اللوحة', en: 'Dashboard' },
    { id: 'volunteers', ar: 'المتطوعون', en: 'Volunteers' },
    { id: 'tasks', ar: 'المهام', en: 'Tasks' },
    { id: 'committees', ar: 'اللجان', en: 'Committees' },
    { id: 'membership', ar: 'العضوية', en: 'Membership' },
  ];

  if (loading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (err) return <div className="p-4"><ErrorState title="Load failed" message={err} onRetry={fetchAll} /></div>;

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-teal-950 via-zinc-950 to-slate-900 border border-teal-500/30 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/40"><Users className="w-7 h-7" /></div>
          <div>
            <span className="px-2 py-0.5 bg-teal-500/30 rounded text-[10px] font-black font-mono">NEB-07 • HCM</span>
            <h2 className="text-lg font-black">{isRtl ? 'التطوع واللجان والعضوية' : 'Volunteers, Committees & Membership'}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <EnterpriseButton variant="secondary" size="sm" onClick={fetchAll}><RefreshCw className="w-3.5 h-3.5" /><span>{isRtl ? 'تحديث' : 'Refresh'}</span></EnterpriseButton>
          {onNavigate && <EnterpriseButton variant="secondary" size="sm" onClick={() => onNavigate('beneficiaries')}><Users className="w-3.5 h-3.5" /><span>{isRtl ? 'المستفيدون' : 'Beneficiaries'}</span></EnterpriseButton>}
        </div>
      </div>

      {training.isTrainingMode && (
        <div className="text-[11px] font-black text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
          {training.blockMessage}
        </div>
      )}
      {actionMsg && (
        <div className="text-[11px] font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          {actionMsg}
        </div>
      )}

      <div className="flex gap-1.5 bg-white dark:bg-zinc-900 border rounded-2xl p-2 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('px-4 py-2 rounded-xl text-[11px] font-black cursor-pointer whitespace-nowrap', tab === t.id ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100')}>{isRtl ? t.ar : t.en}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[[isRtl ? 'المتطوعون' : 'Volunteers', volunteers.length], [isRtl ? 'ساعات التطوع' : 'Hours', totalHours], [isRtl ? 'المهام' : 'Tasks', tasks.length], [isRtl ? 'طلبات معلقة' : 'Pending', pendingMembers]].map(([t, v], i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border p-4"><div className="text-[11px] font-black text-slate-500">{t}</div><div className="text-xl font-black font-mono">{v}</div></div>
          ))}
        </div>
      )}

      {tab === 'volunteers' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isRtl ? 'بحث...' : 'Search...'} className={cn(INPUT, 'flex-1 min-w-[200px]')} />
            <button onClick={() => setShowModal('volunteer')} className={BTN}><Plus className="w-4 h-4" />{isRtl ? 'متطوع جديد' : 'New volunteer'}</button>
          </div>
          {filteredV.length === 0 ? <EmptyState title={isRtl ? 'لا يوجد متطوعون' : 'No volunteers'} description={isRtl ? 'استقطب أول متطوع' : 'Recruit the first volunteer'} /> : (
            <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="bg-slate-50"><tr><th className={TH}>{isRtl ? 'الاسم' : 'Name'}</th><th className={TH}>{isRtl ? 'المجال' : 'Field'}</th><th className={TH}>{isRtl ? 'الحالة' : 'Status'}</th></tr></thead>
              <tbody>{filteredV.map((v: any) => (<tr key={v.id} className="border-t"><td className={TD}>{v.name || '—'}</td><td className={TD}>{v.field || ''}</td><td className={TD}>{v.status || 'ACTIVE'}</td></tr>))}</tbody></table></div>
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-black flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-teal-600" />{isRtl ? `مهام المتطوعين (${tasks.length})` : `Volunteer tasks (${tasks.length})`}</h3>
          {tasks.length === 0 ? <EmptyState title={isRtl ? 'لا توجد مهام' : 'No tasks'} description={isRtl ? 'تُسند مهام المتطوعين من الأنشطة الميدانية' : 'Volunteer tasks are dispatched from field activities'} /> : (
            <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="bg-slate-50"><tr><th className={TH}>{isRtl ? 'المهمة' : 'Task'}</th><th className={TH}>{isRtl ? 'التاريخ' : 'Date'}</th><th className={TH}>{isRtl ? 'الحالة' : 'Status'}</th></tr></thead>
              <tbody>{tasks.slice(0, 100).map((t: any) => (<tr key={t.id} className="border-t"><td className={TD}>{t.title_ar || t.title_en || t.task_code || '—'}</td><td className={TD}>{t.planned_date || t.actual_date || ''}</td><td className={TD}>{t.status || ''}</td></tr>))}</tbody></table></div>
          )}
        </div>
      )}

      {tab === 'committees' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center"><h3 className="text-sm font-black">{isRtl ? `اللجان المجتمعية (${committees.length})` : `Committees (${committees.length})`}</h3>
            <button onClick={() => setShowModal('committee')} className={BTN}><Plus className="w-4 h-4" />{isRtl ? 'لجنة جديدة' : 'New committee'}</button></div>
          {committees.length === 0 ? <EmptyState title={isRtl ? 'لا توجد لجان' : 'No committees'} description={isRtl ? 'شكل أول لجنة مجتمعية' : 'Form the first community committee'} /> : (
            <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="bg-slate-50"><tr><th className={TH}>{isRtl ? 'اللجنة' : 'Committee'}</th><th className={TH}>{isRtl ? 'النوع' : 'Type'}</th><th className={TH}>{isRtl ? 'المحافظة' : 'Governorate'}</th></tr></thead>
              <tbody>{committees.map((c: any) => (<tr key={c.id} className="border-t"><td className={TD}>{c.name_ar || c.name_en || '—'}</td><td className={TD}>{c.committee_type || ''}</td><td className={TD}>{c.governorate || ''}</td></tr>))}</tbody></table></div>
          )}
        </div>
      )}

      {tab === 'membership' && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center"><h3 className="text-sm font-black">{isRtl ? `طلبات العضوية (${members.length})` : `Membership (${members.length})`}</h3>
            <button onClick={() => setShowModal('member')} className={BTN}><Plus className="w-4 h-4" />{isRtl ? 'طلب جديد' : 'New application'}</button></div>
          {members.length === 0 ? <EmptyState title={isRtl ? 'لا توجد طلبات' : 'No applications'} description={isRtl ? 'استقبل أول طلب عضوية' : 'Receive the first membership application'} /> : (
            <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="bg-slate-50"><tr><th className={TH}>{isRtl ? 'المتقدم' : 'Applicant'}</th><th className={TH}>{isRtl ? 'النوع' : 'Type'}</th><th className={TH}>{isRtl ? 'الحالة' : 'Status'}</th><th className={TH}>{isRtl ? 'قرار' : 'Decision'}</th></tr></thead>
              <tbody>{members.map((m: any) => {
                const pending = ['PENDING', 'UNDER_REVIEW'].includes(String(m.status || '').toUpperCase());
                return (<tr key={m.id} className="border-t"><td className={TD}>{m.applicant_name_ar || m.applicant_name_en || '—'}</td><td className={TD}>{m.membership_type || ''}</td><td className={TD}>{m.status || ''}</td>
                  <td className={TD}>{pending ? (<div className="flex gap-1"><button onClick={() => reviewMember(m.id, 'APPROVED')} disabled={saving} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer"><CheckCircle2 className="w-3 h-3 inline" /></button><button onClick={() => reviewMember(m.id, 'REJECTED')} disabled={saving} className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black cursor-pointer"><XCircle className="w-3 h-3 inline" /></button></div>) : '—'}</td></tr>);
              })}</tbody></table></div>
          )}
          {pendingMembers > 0 && <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{isRtl ? `${pendingMembers} بانتظار المراجعة` : `${pendingMembers} awaiting review`}</p>}
        </div>
      )}

      {showModal === 'volunteer' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={createVolunteer} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-black text-sm">{isRtl ? 'متطوع جديد' : 'New volunteer'}</h3>
            {formErr && <div className="text-[11px] font-bold text-rose-600">{formErr}</div>}
            <div><label className={LABEL}>{isRtl ? 'الاسم *' : 'Name *'}</label><input value={vForm.name} onChange={(e) => setVForm({ ...vForm, name: e.target.value })} className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-2"><div><label className={LABEL}>Email</label><input value={vForm.email} onChange={(e) => setVForm({ ...vForm, email: e.target.value })} className={INPUT} /></div>
              <div><label className={LABEL}>{isRtl ? 'الهاتف' : 'Phone'}</label><input value={vForm.phone} onChange={(e) => setVForm({ ...vForm, phone: e.target.value })} className={INPUT} /></div></div>
            <div><label className={LABEL}>{isRtl ? 'المجال' : 'Field'}</label><input value={vForm.field} onChange={(e) => setVForm({ ...vForm, field: e.target.value })} className={INPUT} /></div>
            <div className="flex gap-2"><button type="submit" disabled={saving} className={BTN}>{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button></div>
          </form>
        </div>
      )}
      {showModal === 'committee' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={createCommittee} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-black text-sm">{isRtl ? 'لجنة مجتمعية جديدة' : 'New committee'}</h3>
            {formErr && <div className="text-[11px] font-bold text-rose-600">{formErr}</div>}
            <div><label className={LABEL}>{isRtl ? 'الاسم *' : 'Name *'}</label><input value={cForm.name_ar} onChange={(e) => setCForm({ ...cForm, name_ar: e.target.value })} className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-2"><div><label className={LABEL}>{isRtl ? 'المحافظة' : 'Governorate'}</label><input value={cForm.governorate} onChange={(e) => setCForm({ ...cForm, governorate: e.target.value })} className={INPUT} /></div>
              <div><label className={LABEL}>{isRtl ? 'النوع' : 'Type'}</label><select value={cForm.committee_type} onChange={(e) => setCForm({ ...cForm, committee_type: e.target.value })} className={INPUT}><option value="PROTECTION">PROTECTION</option><option value="WATER">WATER</option><option value="HEALTH">HEALTH</option><option value="EDUCATION">EDUCATION</option><option value="WOMENS">WOMENS</option><option value="YOUTH">YOUTH</option></select></div></div>
            <div className="flex gap-2"><button type="submit" disabled={saving} className={BTN}>{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button></div>
          </form>
        </div>
      )}
      {showModal === 'member' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={createMember} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-black text-sm">{isRtl ? 'طلب عضوية جديد' : 'New membership application'}</h3>
            {formErr && <div className="text-[11px] font-bold text-rose-600">{formErr}</div>}
            <div><label className={LABEL}>{isRtl ? 'اسم المتقدم *' : 'Applicant *'}</label><input value={mForm.applicant_name_ar} onChange={(e) => setMForm({ ...mForm, applicant_name_ar: e.target.value })} className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-2"><div><label className={LABEL}>{isRtl ? 'الهاتف' : 'Phone'}</label><input value={mForm.phone} onChange={(e) => setMForm({ ...mForm, phone: e.target.value })} className={INPUT} /></div>
              <div><label className={LABEL}>{isRtl ? 'النوع' : 'Type'}</label><select value={mForm.membership_type} onChange={(e) => setMForm({ ...mForm, membership_type: e.target.value })} className={INPUT}><option value="VOLUNTEER">VOLUNTEER</option><option value="MEMBER">MEMBER</option><option value="PARTNER">PARTNER</option><option value="OBSERVER">OBSERVER</option></select></div></div>
            <div className="flex gap-2"><button type="submit" disabled={saving} className={BTN}>{isRtl ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button></div>
          </form>
        </div>
      )}
      <p className="text-[10px] text-slate-400 flex items-center gap-1"><Award className="w-3 h-3" />{isRtl ? 'ساعات التطوع من تقرير الساعات الحي' : 'Volunteer hours from the live hours report'}: {totalHours}</p>
    </div>
  );
}
