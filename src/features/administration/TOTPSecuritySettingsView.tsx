
import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';
import { logAuditEvent } from '../../lib/audit';

export default function TOTPSecuritySettingsView({ lang, currentUser }: { lang: 'ar' | 'en', currentUser: any }) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem('nexora_totp_enabled') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('nexora_totp_enabled', String(enabled));
  }, [enabled]);

  const toggleTOTP = async () => {
    const newValue = !enabled;
    setEnabled(newValue);
    await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'UPDATE', 
      newValue ? 'تفعيل المصادقة الثنائية (TOTP)' : 'تعطيل المصادقة الثنائية (TOTP)',
      newValue ? 'Enabled MFA (TOTP)' : 'Disabled MFA (TOTP)',
      'security', 'high', 'mfa_totp', 'success');
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
      <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Smartphone className="w-5 h-5 text-indigo-600" />
        {lang === 'ar' ? 'المصادقة الثنائية (TOTP)' : 'Multi-Factor Authentication (TOTP)'}
      </h2>

      <div className="p-4 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          <div>
            <p className="text-xs font-bold">{lang === 'ar' ? 'إعدادات المصادقة' : 'MFA Settings'}</p>
            <p className="text-[10px] text-zinc-500">{lang === 'ar' ? 'تأمين المعاملات المالية الحساسة' : 'Secure high-value transactions'}</p>
          </div>
        </div>
        <button 
          onClick={toggleTOTP}
          className={`w-12 h-6 rounded-full flex items-center p-1 transition-all ${enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'}`}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
        </button>
      </div>

      {enabled && (
        <div className="p-4 border border-indigo-200 dark:border-indigo-900 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-200">
          <AlertCircle className="w-4 h-4 mb-2" />
          <p>{lang === 'ar' ? 'قم بمسح رمز الاستجابة السريع أدناه باستخدام تطبيق المصادقة الخاص بك.' : 'Scan the QR code below with your authenticator app.'}</p>
          <div className="mt-4 w-32 h-32 bg-white rounded-lg border-2 border-dashed border-indigo-300 mx-auto" />
        </div>
      )}
    </div>
  );
}
