
import React, { useState } from 'react';
import { Laptop, Smartphone, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { logAuditEvent } from '../../lib/audit';

interface Device {
  id: string;
  name: string;
  type: 'laptop' | 'mobile';
  lastLogin: string;
  ip: string;
}

export default function TrustedDevicesView({ lang, currentUser }: { lang: 'ar' | 'en', currentUser: any }) {
  // HONESTY + IDENTITY (DEBT PAID): no fabricated MacBook/iPhone rows, no crash on null session.
  const [devices, setDevices] = useState<Device[]>([]);

  const revokeDevice = async (deviceId: string) => {
    if (!currentUser?.email) return;
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'DELETE',
      'إلغاء صلاحية جهاز موثوق', 'Revoked trusted device access', 'security', 'high', deviceId, 'success');
  };

  if (!currentUser?.email) {
    return (
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center">
        <p className="text-sm font-bold text-slate-500">{lang === 'ar' ? 'سجل الدخول لعرض أجهزتك الموثوقة' : 'Sign in to view your trusted devices'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
      <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Laptop className="w-5 h-5 text-emerald-600" />
        {lang === 'ar' ? 'إدارة الأجهزة الموثوقة' : 'Trusted Devices Management'}
      </h2>

      {devices.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">
          {lang === 'ar' ? 'لا توجد أجهزة موثوقة مسجلة بعد — تُسجل الأجهزة عند تسجيل الدخول' : 'No trusted devices yet — devices register on sign-in'}
        </p>
      ) : (
      <div className="space-y-4">
        {devices.map(device => (
          <div key={device.id} className="flex items-center justify-between p-4 border border-slate-100 dark:border-zinc-700 rounded-xl">
            <div className="flex items-center gap-4">
              {device.type === 'laptop' ? <Laptop className="w-8 h-8 text-zinc-400" /> : <Smartphone className="w-8 h-8 text-zinc-400" />}
              <div>
                <p className="text-sm font-bold">{device.name}</p>
                <p className="text-[10px] text-zinc-500">{device.lastLogin} • IP: {device.ip}</p>
              </div>
            </div>
            <button 
              onClick={() => revokeDevice(device.id)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
