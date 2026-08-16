import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Heart, 
  QrCode, 
  Clock, 
  ShieldCheck, 
  Save, 
  Database,
  Smartphone
} from 'lucide-react';

interface OfflineFieldAppEngineProps {
  lang: 'ar' | 'en';
}

interface QueuedRecord {
  id: string;
  type: 'BENEFICIARY_AID' | 'VOLUNTEER_ATTENDANCE' | 'FIELD_INSPECTION';
  beneficiaryName: string;
  nationalId: string;
  aidType: string;
  timestamp: string;
  status: 'QUEUED' | 'SYNCED';
}

export default function OfflineFieldAppEngine({ lang }: OfflineFieldAppEngineProps) {
  const isRtl = lang === 'ar';
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedItems, setQueuedItems] = useState<QueuedRecord[]>([
    { id: 'Q-101', type: 'BENEFICIARY_AID', beneficiaryName: 'علي بن أحمد الكبسي', nationalId: '102938475', aidType: 'سلة غذائية رمضانية', timestamp: '2026-08-13 13:10', status: 'QUEUED' },
    { id: 'Q-102', type: 'VOLUNTEER_ATTENDANCE', beneficiaryName: 'د. خالد العماري (متطوع)', nationalId: '998877665', aidType: 'بصمة دوام ميداني', timestamp: '2026-08-13 13:14', status: 'QUEUED' },
  ]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerManualSync = () => {
    if (!isOnline) {
      alert(isRtl ? 'لا يمكن المزامنة حالياً - الجهاز غير متصل بالشبكة' : 'Cannot sync - device is currently offline.');
      return;
    }

    setIsSyncing(true);
    setTimeout(() => {
      setQueuedItems(prev => prev.map(item => ({ ...item, status: 'SYNCED' })));
      setIsSyncing(false);
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER WITH ONLINE/OFFLINE STATUS BADGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>{isRtl ? 'تطبيق الميدان غير المتصل شبكياً (Offline-First Field Execution Engine)' : 'Offline-First Field Execution Engine'}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase flex items-center gap-1 ${
                isOnline 
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
              }`}>
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
                <span>{isOnline ? (isRtl ? 'متصل بالشبكة' : 'Online') : (isRtl ? 'وضع العمل بدون انترنت' : 'Offline Mode Active')}</span>
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isRtl 
                ? 'تسليم المساعدات، توثيق البصمة، والجرد الميداني في المناطق النائية مع التخزين المحلي الآمن والمزامنة التلقائية' 
                : 'Field aid distribution, biometric proof, and inventory logs in remote areas with encrypted local storage.'
              }
            </p>
          </div>
        </div>

        <button
          onClick={triggerManualSync}
          disabled={isSyncing || !isOnline}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isRtl ? 'مزامنة السجلات الميدانية الآن' : 'Sync Field Logs Now'}</span>
        </button>
      </div>

      {/* QUEUED OFFLINE TRANSACTIONS STREAM */}
      <div className="p-5 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>{isRtl ? 'طابور المعاملات المخزنة محلياً (IndexedDB Queue)' : 'Local Storage Transaction Queue'}</span>
          </h4>
          <span className="font-mono text-xs font-bold text-slate-500">
            {queuedItems.filter(i => i.status === 'QUEUED').length} {isRtl ? 'في الانتظار' : 'Pending Sync'}
          </span>
        </div>

        <div className="space-y-3">
          {queuedItems.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg font-mono font-bold text-slate-600 dark:text-zinc-300">
                  {item.id}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{item.beneficiaryName}</span>
                  <span className="text-[10px] text-slate-400">الهوية: {item.nationalId} • {item.aidType}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">{item.timestamp}</span>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                  item.status === 'SYNCED' 
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                }`}>
                  {item.status === 'SYNCED' ? (isRtl ? 'تمت المزامنة' : 'Synced') : (isRtl ? 'مخزن محلياً' : 'Queued Offline')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
