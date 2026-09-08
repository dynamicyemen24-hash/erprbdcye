import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudCheck, X } from 'lucide-react';
import { triggerHaptic } from '../../helpers/hapticSwipe';
import { Spinner } from '../../design-system/components/Spinner';

interface OfflineSyncTelemetryBarProps {
  lang: 'ar' | 'en';
  onSyncNow?: () => void;
}

export const OfflineSyncTelemetryBar: React.FC<OfflineSyncTelemetryBarProps> = ({
  lang,
  onSyncNow
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isRtl = lang === 'ar';

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setDismissed(false);
      triggerHaptic('success');

      // Auto-hide restored notification after 4 seconds
      setTimeout(() => {
        setWasOffline(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
      triggerHaptic('warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    triggerHaptic('light');
    try {
      if (onSyncNow) await onSyncNow();
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 600);
    }
  };

  // If online and not coming back from offline, don't show
  if ((isOnline && !wasOffline) || dismissed) return null;

  return (
    <div 
      className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-[90] max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-bottom duration-300 pointer-events-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className={`px-4 py-2.5 rounded-2xl border shadow-xl backdrop-blur-xl flex items-center justify-between gap-3 text-xs ${
        !isOnline
          ? 'bg-amber-950/90 text-amber-100 border-amber-500/40 shadow-amber-950/30'
          : 'bg-emerald-950/90 text-emerald-100 border-emerald-500/40 shadow-emerald-950/30'
      }`}>
        <div className="flex items-center gap-2.5">
          {!isOnline ? (
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
              <WifiOff className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="font-bold flex items-center gap-1.5 leading-tight">
              <span>
                {!isOnline 
                  ? (isRtl ? 'العمل في وضع عدم الاتصال (Offline)' : 'Working in Offline Mode')
                  : (isRtl ? 'تمت استعادة الاتصال السحابي' : 'Cloud Sync Restored')}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white font-normal">
                Neon DB
              </span>
            </div>
            <p className="text-[11px] opacity-80 leading-tight">
              {!isOnline
                ? (isRtl ? 'البيانات والتعديلات محفوظة محلياً بأمان' : 'Changes safely buffered locally')
                : (isRtl ? 'المزامنة الحية تعمل الآن بكفاءة' : 'Live database sync is operational')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isOnline && onSyncNow && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Spinner size="xs" />
              <span>{isRtl ? 'مزامنة' : 'Sync'}</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineSyncTelemetryBar;
