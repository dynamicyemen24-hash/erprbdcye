
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
  const [devices, setDevices] = useState<Device[]>([
    { id: 'd1', name: 'MacBook Pro 14"', type: 'laptop', lastLogin: '2026-08-10 04:00:00', ip: '192.168.1.10' },
    { id: 'd2', name: 'iPhone 15 Pro', type: 'mobile', lastLogin: '2026-08-10 03:30:00', ip: '192.168.1.15' },
    { id: 'd3', name: 'Office PC', type: 'laptop', lastLogin: '2026-08-09 17:00:00', ip: '10.0.0.5' },
  ]);

  const revokeDevice = async (deviceId: string) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    await logAuditEvent(currentUser.email, currentUser.name, currentUser.role, 'DELETE', 
      'إلغاء صلاحية جهاز موثوق', 'Revoked trusted device access', 'security', 'high', deviceId, 'success');
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
      <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Laptop className="w-5 h-5 text-emerald-600" />
        {lang === 'ar' ? 'إدارة الأجهزة الموثوقة' : 'Trusted Devices Management'}
      </h2>

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
    </div>
  );
}
