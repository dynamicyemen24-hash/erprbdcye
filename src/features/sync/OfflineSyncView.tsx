import React, { useState, useEffect } from 'react';
import { Wifi, RefreshCw, AlertTriangle, Cloud } from 'lucide-react';
import { getSyncStatus, forceSync, SyncStatus } from '../../core/services/syncService';

interface OfflineSyncViewProps {
  lang: 'ar' | 'en';
}

export default function OfflineSyncView({ lang }: OfflineSyncViewProps) {
  const [syncData, setSyncData] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    const status = await getSyncStatus();
    setSyncData(status);
  };

  const handleForceSync = async () => {
    setLoading(true);
    await forceSync();
    await fetchStatus();
    setLoading(false);
  };

  if (!syncData) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Wifi className="w-5 h-5 text-emerald-500" />
        {lang === 'ar' ? 'مزامنة البيانات (بدون اتصال)' : 'Offline Data Sync'}
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
            <p className="text-[10px] text-zinc-500">{lang === 'ar' ? 'محلي' : 'Local'}</p>
            <p className="text-lg font-black">{syncData.pendingTasksCount}</p>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
            <p className="text-[10px] text-zinc-500">{lang === 'ar' ? 'سيرفر' : 'Server'}</p>
            <p className="text-lg font-black">{0}</p>
        </div>
      </div>

      <button 
        onClick={handleForceSync}
        disabled={loading}
        className="w-full py-3 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {lang === 'ar' ? 'فرض المزامنة' : 'Force Sync'}
      </button>

      {syncData.conflicts.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {lang === 'ar' ? 'تعارضات مكتشفة' : 'Conflicts Detected'}
          </p>
          {syncData.conflicts.map((c, i) => (
            <p key={i} className="text-[10px] text-amber-800 dark:text-amber-200">{c.description}</p>
          ))}
        </div>
      )}
    </div>
  );
}
