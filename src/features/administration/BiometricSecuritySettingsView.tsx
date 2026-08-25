
import React, { useState, useEffect, useMemo } from 'react';
import { Fingerprint, ShieldAlert, RefreshCw } from 'lucide-react';
import { logAuditEvent } from '../../lib/audit';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserBiometricConfig {
  id: string;
  name: string;
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high' | 'mandatory';
}

interface LoginAttempt {
  id: string;
  userName: string;
  timestamp: string;
  status: 'success' | 'failed';
}

const SENSITIVITY_KEY = (userId: string) => `nexora_biometric_cfg_${userId}`;

export default function BiometricSecuritySettingsView({ lang, currentUser }: { lang: 'ar' | 'en', currentUser: any }) {
  const isAr = lang === 'ar';

  // LIVE users from the database
  const [users, setUsers] = useState<UserBiometricConfig[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // LIVE login attempts from the audit trail
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);

  // Device-local biometric preferences (biometric hardware is per-device by nature)
  const readCfg = (userId: string): { enabled: boolean; sensitivity: UserBiometricConfig['sensitivity'] } => {
    try {
      const raw = localStorage.getItem(SENSITIVITY_KEY(userId));
      if (raw) return JSON.parse(raw);
    } catch { /* ignore malformed */ }
    return { enabled: false, sensitivity: 'high' };
  };

  const loadLive = async () => {
    setUsersLoading(true);
    setUsersError(null);
    setAttemptsLoading(true);
    try {
      const token = localStorage.getItem('rbd_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // Real users
      const uRes = await fetch('/api/tables/users?limit=200', { headers });
      if (!uRes.ok) throw new Error(`HTTP ${uRes.status}`);
      const uData = await uRes.json();
      const rows = uData.data || uData || [];
      setUsers((Array.isArray(rows) ? rows : []).map((u: any) => {
        const cfg = readCfg(u.id);
        return {
          id: u.id,
          name: u.name_ar || u.name || u.email || u.id,
          enabled: !!cfg.enabled,
          sensitivity: cfg.sensitivity
        };
      }));
      setUsersLoading(false);

      // Real authentication events from audit_logs
      const aRes = await fetch('/api/tables/audit_logs?limit=200', { headers });
      const aRowsRaw = aRes.ok ? ((await aRes.json()).data || []) : [];
      const authEvents = (Array.isArray(aRowsRaw) ? aRowsRaw : [])
        .filter((l: any) => l.action === 'LOGIN' || l.action === 'LOGIN_FAILED')
        .map((l: any) => ({
          id: l.id,
          userName: l.user_name || l.details?.email || l.action,
          timestamp: l.created_at ? new Date(l.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-GB') : '-',
          status: (l.action === 'LOGIN' ? 'success' : 'failed') as 'success' | 'failed'
        }));
      setAttempts(authEvents);
    } catch (err) {
      console.error('[BiometricSecurity] Failed to load live data:', err);
      setUsersError(isAr ? 'تعذر الاتصال بقاعدة البيانات.' : 'Failed to connect to the database.');
      setUsers([]);
    } finally {
      setUsersLoading(false);
      setAttemptsLoading(false);
    }
  };

  useEffect(() => { loadLive(); }, []);

  const [filterUserId, setFilterUserId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');

  const filteredAttempts = attempts.filter(a => {
    const matchesUser = filterUserId === '' || a.userName.includes(filterUserId);
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesUser && matchesStatus;
  });

  // Chart derived from REAL attempts — honest empty state when no telemetry exists yet
  const chartData = useMemo(() => {
    if (attempts.length === 0) return [];
    const buckets = new Map<string, { time: string; success: number; failed: number }>();
    attempts.forEach(a => {
      const bucketKey = a.timestamp.slice(0, 16); // minute-level
      const existing = buckets.get(bucketKey) || { time: bucketKey.split(', ')[1] || bucketKey, success: 0, failed: 0 };
      if (a.status === 'success') existing.success += 1; else existing.failed += 1;
      buckets.set(bucketKey, existing);
    });
    return Array.from(buckets.values()).sort((a, b) => a.time.localeCompare(b.time)).slice(-12);
  }, [attempts]);

  const persistCfg = async (userId: string, patch: Partial<{ enabled: boolean; sensitivity: UserBiometricConfig['sensitivity'] }>) => {
    const current = readCfg(userId);
    const next = { ...current, ...patch };
    localStorage.setItem(SENSITIVITY_KEY(userId), JSON.stringify(next));
  };

  const toggleMandatoryTxAuth = async () => {
    const newValue = !(localStorage.getItem('nexora_biometric_mandatory_tx') === 'true');
    localStorage.setItem('nexora_biometric_mandatory_tx', String(newValue));
    setMandatoryTxAuth(newValue);
    await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'UPDATE', 'تعديل سياسة المصادقة للمعاملات الحساسة', 'Update mandatory transaction auth policy', 'security', 'medium', 'transaction_auth', 'success');
  };

  const [mandatoryTxAuth, setMandatoryTxAuth] = useState(() => {
    return localStorage.getItem('nexora_biometric_mandatory_tx') === 'true';
  });

  const toggleUserBiometric = async (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, enabled: !u.enabled } : u));
    await persistCfg(userId, { enabled: !readCfg(userId).enabled });
    await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'UPDATE', 'تعديل حالة المصادقة الحيوية للمستخدم', 'Update biometric status for user', 'security', 'medium', userId, 'success');
  };

  const updateSensitivity = async (userId: string, level: UserBiometricConfig['sensitivity']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, sensitivity: level } : u));
    await persistCfg(userId, { sensitivity: level });
    await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'UPDATE', 'تعديل مستوى حساسية الأمان للمستخدم', 'Update security sensitivity for user', 'security', 'medium', userId, 'success');
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-emerald-600" />
          {isAr ? 'إعدادات الأمان الحيوية' : 'Biometric Security Settings'}
        </h2>
        <button
          onClick={loadLive}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {isAr ? 'تحديث من قاعدة البيانات' : 'Refresh from database'}
        </button>
      </div>

      <div className="text-[10px] text-slate-400 mb-4 font-bold uppercase tracking-wide">
        {isAr
          ? 'بيانات المصادقة الحقيقية من سجل التدقيق المركزي • إعدادات البصمة خاصة بكل جهاز'
          : 'Real authentication data from the central audit trail • Biometric settings are device-local'}
      </div>

      {chartData.length > 0 ? (
        <div className="h-64 mb-8 bg-slate-50 dark:bg-zinc-800 p-4 rounded-xl">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="success" stroke="#059669" name={isAr ? 'نجاح' : 'Success'} />
              <Line type="monotone" dataKey="failed" stroke="#e11d48" name={isAr ? 'فشل' : 'Failed'} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-40 mb-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
          <Fingerprint className="w-8 h-8 text-slate-300 dark:text-zinc-600 mb-2" />
          <p className="text-xs font-bold text-slate-400">
            {attemptsLoading
              ? (isAr ? 'جاري تحميل أحداث المصادقة الحقيقية...' : 'Loading real auth events...')
              : (isAr ? 'لا توجد محاولات دخول مسجلة بعد في سجل التدقيق.' : 'No login attempts recorded in the audit trail yet.')}
          </p>
        </div>
      )}

      <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 mb-6">
        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          {isAr ? 'سياسات الحماية الديناميكية' : 'Dynamic Protection Policies'}
        </h3>
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl">
          <span className="text-xs font-bold">{isAr ? 'المصادقة الإجبارية عند تغيير المعاملات المالية الحساسة' : 'Mandatory Auth for Sensitive Financial Transactions'}</span>
          <button
            onClick={toggleMandatoryTxAuth}
            className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-all cursor-pointer ${mandatoryTxAuth ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'}`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {usersLoading ? (
          <div className="py-10 text-center">
            <RefreshCw className="w-7 h-7 text-emerald-500 animate-spin mx-auto" />
            <p className="mt-2 text-xs font-bold text-slate-500">{isAr ? 'جاري جلب المستخدمين الحقيقيين...' : 'Loading real users...'}</p>
          </div>
        ) : usersError ? (
          <div className="py-10 text-center bg-amber-500/5 rounded-xl border border-dashed border-amber-500/40">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-3">{usersError}</p>
            <button onClick={loadLive} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-black transition-colors cursor-pointer">
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-zinc-500 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-3 text-right">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="p-3 text-center">{isAr ? 'المصادقة الحيوية' : 'Biometric Auth'}</th>
                  <th className="p-3 text-center">{isAr ? 'مستوى الحساسية' : 'Sensitivity Level'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400 font-bold">
                      {isAr ? 'لا يوجد مستخدمون في قاعدة البيانات.' : 'No users exist in the database.'}
                    </td>
                  </tr>
                ) : users.map(user => (
                  <tr key={user.id}>
                    <td className="p-3 flex items-center gap-2 font-bold">{user.name}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleUserBiometric(user.id)}
                        className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-all cursor-pointer ${user.enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-200 justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <select
                        value={user.sensitivity}
                        onChange={(e) => updateSensitivity(user.id, e.target.value as any)}
                        className="p-1 bg-slate-50 dark:bg-zinc-800 text-xs rounded-lg border-0 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="low">{isAr ? 'منخفض' : 'Low'}</option>
                        <option value="medium">{isAr ? 'متوسط' : 'Medium'}</option>
                        <option value="high">{isAr ? 'عالي' : 'High'}</option>
                        <option value="mandatory">{isAr ? 'إلزامي' : 'Mandatory'}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            {isAr ? 'محاولات الدخول الأخيرة (من سجل التدقيق الفعلي)' : 'Recent Login Attempts (live audit trail)'}
          </h3>
          <div className="flex gap-2 text-xs">
            <input
              type="text"
              placeholder={isAr ? 'اسم المستخدم' : 'User name'}
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="p-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-transparent"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-transparent"
            >
              <option value="all">{isAr ? 'الكل' : 'All'}</option>
              <option value="success">{isAr ? 'نجاح' : 'Success'}</option>
              <option value="failed">{isAr ? 'فشل' : 'Failed'}</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-zinc-500 font-bold uppercase text-[9px]">
              <tr>
                <th className="p-3 text-right">{isAr ? 'المستخدم' : 'User'}</th>
                <th className="p-3 text-center">{isAr ? 'التوقيت' : 'Timestamp'}</th>
                <th className="p-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400 font-bold">
                    {isAr ? 'لا توجد محاولات دخول مطابقة في السجل.' : 'No matching login attempts in the audit trail.'}
                  </td>
                </tr>
              ) : filteredAttempts.map(attempt => (
                <tr key={attempt.id}>
                  <td className="p-3 font-bold">{attempt.userName}</td>
                  <td className="p-3 text-center text-zinc-500">{attempt.timestamp}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${attempt.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {attempt.status === 'success' ? (isAr ? 'نجاح' : 'Success') : (isAr ? 'فشل' : 'Failed')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
