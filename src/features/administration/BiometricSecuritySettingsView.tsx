
import React, { useState, useEffect } from 'react';
import { Fingerprint, User, ShieldAlert, ShieldCheck } from 'lucide-react';
import { logAuditEvent } from '../../lib/audit';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserBiometricConfig {
  id: string;
  name: string;
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high' | 'mandatory';
}

interface BiometricAttempt {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export default function BiometricSecuritySettingsView({ lang, currentUser }: { lang: 'ar' | 'en', currentUser: any }) {
  // Mock users for the table
  const [users, setUsers] = useState<UserBiometricConfig[]>([
    { id: '1', name: 'Admin User', enabled: true, sensitivity: 'mandatory' },
    { id: '2', name: 'Finance Accountant', enabled: true, sensitivity: 'high' },
    { id: '3', name: 'HR Manager', enabled: false, sensitivity: 'medium' },
  ]);

  const [attempts] = useState<BiometricAttempt[]>([
    { id: 'a1', userId: '1', userName: 'Admin User', timestamp: '2026-08-10 04:50:00', status: 'success' },
    { id: 'a2', userId: '2', userName: 'Finance Accountant', timestamp: '2026-08-10 04:45:00', status: 'failed' },
    { id: 'a3', userId: '1', userName: 'Admin User', timestamp: '2026-08-10 04:40:00', status: 'success' },
  ]);

  const [filterUserId, setFilterUserId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');

  const filteredAttempts = attempts.filter(a => {
    const matchesUser = filterUserId === '' || a.userId === filterUserId;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesUser && matchesStatus;
  });

  const chartData = [
    { time: '04:40', success: 1, failed: 0 },
    { time: '04:45', success: 0, failed: 1 },
    { time: '04:50', success: 1, failed: 0 },
  ];

  const [mandatoryTransactionAuth, setMandatoryTransactionAuth] = useState(() => {
    return localStorage.getItem('nexora_biometric_mandatory_tx') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('nexora_biometric_mandatory_tx', String(mandatoryTransactionAuth));
  }, [mandatoryTransactionAuth]);

  const toggleMandatoryTxAuth = async () => {
    const newValue = !mandatoryTransactionAuth;
    setMandatoryTransactionAuth(newValue);
    await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'UPDATE', 'تعديل سياسة المصادقة للمعاملات الحساسة', 'Update mandatory transaction auth policy', 'security', 'medium', 'transaction_auth', 'success');
  };

  const toggleUserBiometric = async (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, enabled: !u.enabled } : u));
    await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'UPDATE', 'تعديل حالة المصادقة الحيوية للمستخدم', 'Update biometric status for user', 'security', 'medium', userId, 'success');
  };

  const updateSensitivity = async (userId: string, level: UserBiometricConfig['sensitivity']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, sensitivity: level } : u));
    await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'UPDATE', 'تعديل مستوى حساسية الأمان للمستخدم', 'Update security sensitivity for user', 'security', 'medium', userId, 'success');
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
      <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Fingerprint className="w-5 h-5 text-emerald-600" />
        {lang === 'ar' ? 'إعدادات الأمان الحيوية' : 'Biometric Security Settings'}
      </h2>

      <div className="h-64 mb-8 bg-slate-50 dark:bg-zinc-800 p-4 rounded-xl">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="success" stroke="#059669" name="Success" />
            <Line type="monotone" dataKey="failed" stroke="#e11d48" name="Failed" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 mb-6">
        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          {lang === 'ar' ? 'سياسات الحماية الديناميكية' : 'Dynamic Protection Policies'}
        </h3>
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl">
          <span className="text-xs font-bold">{lang === 'ar' ? 'المصادقة الإجبارية عند تغيير المعاملات المالية الحساسة' : 'Mandatory Auth for Sensitive Financial Transactions'}</span>
          <button
            onClick={toggleMandatoryTxAuth}
            className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-all ${mandatoryTransactionAuth ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'}`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-zinc-500 font-bold uppercase text-[9px]">
            <tr>
              <th className="p-3 text-right">{lang === 'ar' ? 'المستخدم' : 'User'}</th>
              <th className="p-3 text-center">{lang === 'ar' ? 'المصادقة الحيوية' : 'Biometric Auth'}</th>
              <th className="p-3 text-center">{lang === 'ar' ? 'مستوى الحساسية' : 'Sensitivity Level'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {users.map(user => (
              <tr key={user.id}>
                <td className="p-3 flex items-center gap-2 font-bold">{user.name}</td>
                <td className="p-3 text-center">
                  <button 
                    onClick={() => toggleUserBiometric(user.id)}
                    className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-all ${user.enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-200 justify-start'}`}
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
                    <option value="low">{lang === 'ar' ? 'منخفض' : 'Low'}</option>
                    <option value="medium">{lang === 'ar' ? 'متوسط' : 'Medium'}</option>
                    <option value="high">{lang === 'ar' ? 'عالي' : 'High'}</option>
                    <option value="mandatory">{lang === 'ar' ? 'إلزامي' : 'Mandatory'}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
            {lang === 'ar' ? 'محاولات الدخول الأخيرة' : 'Recent Login Attempts'}
          </h3>
          <div className="flex gap-2 text-xs">
            <input 
              type="text" 
              placeholder={lang === 'ar' ? 'معرف المستخدم' : 'User ID'}
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="p-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-transparent"
            />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-transparent"
            >
              <option value="all">{lang === 'ar' ? 'الكل' : 'All'}</option>
              <option value="success">{lang === 'ar' ? 'نجاح' : 'Success'}</option>
              <option value="failed">{lang === 'ar' ? 'فشل' : 'Failed'}</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 text-zinc-500 font-bold uppercase text-[9px]">
              <tr>
                <th className="p-3 text-right">{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                <th className="p-3 text-center">{lang === 'ar' ? 'التوقيت' : 'Timestamp'}</th>
                <th className="p-3 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredAttempts.map(attempt => (
                <tr key={attempt.id}>
                  <td className="p-3 font-bold">{attempt.userName}</td>
                  <td className="p-3 text-center text-zinc-500">{attempt.timestamp}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${attempt.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {attempt.status === 'success' ? (lang === 'ar' ? 'نجاح' : 'Success') : (lang === 'ar' ? 'فشل' : 'Failed')}
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
