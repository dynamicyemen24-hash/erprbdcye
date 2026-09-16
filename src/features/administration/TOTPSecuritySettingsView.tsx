import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, AlertCircle, Loader2, KeyRound, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { logAuditEvent } from '../../lib/audit';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('rbd_token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function TOTPSecuritySettingsView({ lang, currentUser }: { lang: 'ar' | 'en', currentUser: any }) {
  const isRtl = lang === 'ar';
  const [statusLoading, setStatusLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Enrollment flow
  const [setupData, setSetupData] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Disable flow
  const [showDisable, setShowDisable] = useState(false);
  const [password, setPassword] = useState('');
  const [disabling, setDisabling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const refreshStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await fetch('/api/auth/mfa/status', { headers: authHeaders() });
      if (!res.ok) throw new Error(isRtl ? 'تعذر قراءة حالة التحقق بخطوتين' : 'Could not read MFA status');
      const data = await res.json();
      setEnabled(!!data.enabled);
      setVerifiedAt(data.verifiedAt || null);
    } catch (err: any) {
      setStatusError(err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSetup = async () => {
    setSetupLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch('/api/auth/mfa/setup', { method: 'POST', headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.secret) throw new Error(data.error || (isRtl ? 'فشل بدء الإعداد' : 'Failed to start setup'));
      setSetupData({ secret: data.secret, otpauth_url: data.otpauth_url });
      setCode('');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSetupLoading(false);
    }
  };

  const confirmEnable = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.trim().length !== 6 || verifying) return;
    setVerifying(true);
    setActionError(null);
    try {
      const res = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || (isRtl ? 'رمز غير صحيح' : 'Invalid code'));
      setSetupData(null);
      setCode('');
      await refreshStatus();
      setActionSuccess(isRtl ? 'تم تفعيل التحقق بخطوتين بنجاح' : 'Two-step verification enabled');
      try {
        await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'UPDATE',
          'تفعيل المصادقة الثنائية (TOTP)', 'Enabled MFA (TOTP)', 'security', 'high', 'mfa_totp', 'success');
      } catch { /* audit is best-effort */ }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const confirmDisable = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password || disabling) return;
    setDisabling(true);
    setActionError(null);
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || (isRtl ? 'فشل التعطيل' : 'Failed to disable'));
      setPassword('');
      setShowDisable(false);
      await refreshStatus();
      setActionSuccess(isRtl ? 'تم تعطيل التحقق بخطوتين — سجّل الدخول مجدداً' : 'MFA disabled — please sign in again');
      try {
        await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'UPDATE',
          'تعطيل المصادقة الثنائية (TOTP)', 'Disabled MFA (TOTP)', 'security', 'high', 'mfa_totp', 'success');
      } catch { /* audit is best-effort */ }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = async () => {
    if (!setupData) return;
    try {
      await navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
      <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Smartphone className="w-5 h-5 text-indigo-600" />
        {isRtl ? 'المصادقة الثنائية (TOTP)' : 'Multi-Factor Authentication (TOTP)'}
      </h2>

      {statusLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-6" role="status">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{isRtl ? 'جاري قراءة حالة الحماية من الخادم...' : 'Reading protection status from server...'}</span>
        </div>
      ) : statusError ? (
        <div className="p-4 border border-rose-200 dark:border-rose-900 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 space-y-3" role="alert">
          <p className="font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{statusError}</p>
          <button
            type="button"
            onClick={refreshStatus}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isRtl ? 'إعادة المحاولة' : 'Try again'}
          </button>
        </div>
      ) : (
        <>
          <div className="p-4 bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className={`w-8 h-8 ${enabled ? 'text-emerald-600' : 'text-indigo-600'}`} />
              <div>
                <p className="text-xs font-bold">
                  {enabled
                    ? (isRtl ? 'التحقق بخطوتين مفعّل ومفروض من الخادم' : 'Two-step verification enforced by server')
                    : (isRtl ? 'إعدادات المصادقة' : 'MFA Settings')}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {enabled
                    ? (verifiedAt
                        ? (isRtl ? `تم التحقق في ${new Date(verifiedAt).toLocaleDateString()}` : `Verified ${new Date(verifiedAt).toLocaleDateString()}`)
                        : (isRtl ? 'تأمين المعاملات المالية الحساسة' : 'Secure high-value transactions'))
                    : (isRtl ? 'تأمين المعاملات المالية الحساسة' : 'Secure high-value transactions')}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[11px] font-black ${enabled ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>
              {enabled ? (isRtl ? 'مفعّل' : 'ON') : (isRtl ? 'معطّل' : 'OFF')}
            </span>
          </div>

          {actionError && (
            <div className="mb-4 p-3 border border-rose-200 dark:border-rose-900 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-300 font-bold" role="alert">
              {actionError}
            </div>
          )}
          {actionSuccess && (
            <div className="mb-4 p-3 border border-emerald-200 dark:border-emerald-900 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-700 dark:text-emerald-300 font-bold" role="status">
              {actionSuccess}
            </div>
          )}

          {!enabled && !setupData && (
            <button
              type="button"
              onClick={startSetup}
              disabled={setupLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{isRtl ? 'بدء تفعيل التحقق بخطوتين' : 'Enable two-step verification'}</span>
            </button>
          )}

          {!enabled && setupData && (
            <div className="space-y-4">
              <div className="p-4 border border-indigo-200 dark:border-indigo-900 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-200">
                <p className="font-bold flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4" />
                  {isRtl ? 'امسح الرمز بتطبيق المصادقة (Google Authenticator / Authy) ثم أدخل الرمز' : 'Scan with your authenticator app, then enter the code'}
                </p>
                <div className="bg-white rounded-xl border border-indigo-200 p-4 w-fit mx-auto">
                  <QRCodeSVG value={setupData.otpauth_url} size={160} />
                </div>
                <button
                  type="button"
                  onClick={copySecret}
                  className="mt-3 mx-auto flex items-center gap-1.5 text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span dir="ltr">{setupData.secret}</span>
                </button>
              </div>

              <form onSubmit={confirmEnable} className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  dir="ltr"
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="——————"
                  aria-label={isRtl ? 'رمز التحقق المكون من 6 أرقام' : '6-digit verification code'}
                  className="w-full py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-center text-xl font-black tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setSetupData(null); setCode(''); }}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={verifying || code.length !== 6}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-2"
                  >
                    {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isRtl ? 'تأكيد التفعيل' : 'Confirm enable'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {enabled && !showDisable && (
            <button
              type="button"
              onClick={() => setShowDisable(true)}
              className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {isRtl ? 'تعطيل التحقق بخطوتين' : 'Disable two-step verification'}
            </button>
          )}

          {enabled && showDisable && (
            <form onSubmit={confirmDisable} className="space-y-3 p-4 border border-rose-200 dark:border-rose-900 rounded-xl bg-rose-50/50 dark:bg-rose-950/20">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                {isRtl ? 'أدخل كلمة المرور للتأكيد — سيتم إلغاء جميع الجلسات' : 'Enter your password to confirm — all sessions will be revoked'}
              </p>
              <input
                type="password"
                autoFocus
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isRtl ? 'كلمة المرور الحالية' : 'Current password'}
                className="w-full py-2.5 px-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowDisable(false); setPassword(''); }}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isRtl ? 'تراجع' : 'Back'}
                </button>
                <button
                  type="submit"
                  disabled={disabling || !password}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-2"
                >
                  {disabling && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isRtl ? 'تأكيد التعطيل' : 'Confirm disable'}</span>
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
