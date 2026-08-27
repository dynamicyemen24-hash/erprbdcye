import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react';
import { EnterpriseNotificationBus, ToastMessage } from '../../lib/enterpriseNotificationBus';

export const showToast = (toast: {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}) => {
  EnterpriseNotificationBus.getInstance().notifyToast(toast);
};

export const EnterpriseToastContainer: React.FC<{ lang?: 'ar' | 'en' }> = ({ lang = 'ar' }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const isRtl = lang === 'ar';

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const bus = EnterpriseNotificationBus.getInstance();
    const unsubscribe = bus.subscribeToToasts((toast: ToastMessage) => {
      setToasts(prev => {
        const filtered = prev.slice(-3);
        return [...filtered, toast];
      });

      const duration = toast.duration || 4500;
      setTimeout(() => {
        removeToast(toast.id);
      }, duration);
    });

    return unsubscribe;
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div 
      className={`fixed top-14 z-[99999] flex flex-col gap-2.5 max-w-sm w-[90vw] pointer-events-none transition-all duration-300 ${
        isRtl ? 'left-4' : 'right-4'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
      aria-live="polite"
    >
      {toasts.map(toast => {
        const typeConfig = {
          success: {
            bg: 'bg-emerald-950/90 dark:bg-emerald-950/95',
            border: 'border-emerald-500/50',
            text: 'text-emerald-300',
            icon: CheckCircle2,
            iconColor: 'text-emerald-400',
            shadow: 'shadow-emerald-900/30'
          },
          warning: {
            bg: 'bg-amber-950/90 dark:bg-amber-950/95',
            border: 'border-amber-500/50',
            text: 'text-amber-300',
            icon: AlertTriangle,
            iconColor: 'text-amber-400',
            shadow: 'shadow-amber-900/30'
          },
          error: {
            bg: 'bg-rose-950/90 dark:bg-rose-950/95',
            border: 'border-rose-500/50',
            text: 'text-rose-300',
            icon: AlertCircle,
            iconColor: 'text-rose-400',
            shadow: 'shadow-rose-900/30'
          },
          info: {
            bg: 'bg-sky-950/90 dark:bg-sky-950/95',
            border: 'border-sky-500/50',
            text: 'text-sky-300',
            icon: Info,
            iconColor: 'text-sky-400',
            shadow: 'shadow-sky-900/30'
          },
        }[toast.type] || {
          bg: 'bg-zinc-900/95',
          border: 'border-zinc-700',
          text: 'text-zinc-300',
          icon: Info,
          iconColor: 'text-zinc-400',
          shadow: 'shadow-black/40'
        };

        const IconComponent = typeConfig.icon;

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto rounded-2xl border backdrop-blur-md p-3.5 shadow-2xl flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${typeConfig.bg} ${typeConfig.border} ${typeConfig.shadow}`}
          >
            <div className={`p-1.5 rounded-xl bg-white/10 shrink-0 mt-0.5 ${typeConfig.iconColor}`}>
              <IconComponent className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-black text-white leading-snug">
                {toast.title}
              </h5>
              <p className={`text-[11px] leading-relaxed mt-0.5 font-sans line-clamp-3 ${typeConfig.text}`}>
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title={isRtl ? 'إغلاق الإشعار' : 'Dismiss'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default EnterpriseToastContainer;
