import React, { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, X, Smartphone } from 'lucide-react';

interface PWAUpdatePromptProps {
  lang: 'ar' | 'en';
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * UAMEX ERP™ — PWA install + service-worker update prompts.
 * - Install: captures `beforeinstallprompt` and shows a one-time banner
 *   (dismissal persisted; re-arms after 30 days).
 * - Update: watches the active SW registration for a `waiting` worker and
 *   offers one-tap reload so field devices never run a stale cached shell.
 */
export default function PWAUpdatePrompt({ lang }: PWAUpdatePromptProps) {
  const isRtl = lang === 'ar';
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // ── Install prompt ──
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const dismissedAt = Number(localStorage.getItem('pwa_install_dismissed_at') || 0);
      const thirtyDays = 30 * 24 * 3600 * 1000;
      if (Date.now() - dismissedAt < thirtyDays) return;
      // Don't prompt when already installed (standalone / fullscreen)
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (standalone) return;
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // ── SW update detection ──
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    const trackRegistration = (reg: ServiceWorkerRegistration | undefined) => {
      if (!reg || cancelled) return;
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting);
      }
      reg.onupdatefound = () => {
        const next = reg.installing;
        if (!next) return;
        next.onstatechange = () => {
          if (next.state === 'installed' && navigator.serviceWorker.controller && !cancelled) {
            setWaitingWorker(next);
          }
        };
      };
      // Poll hourly for updates while the app stays open (field tablets)
      interval = setInterval(() => {
        reg.update().catch(() => { /* offline — skip silently */ });
      }, 3600 * 1000);
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then(trackRegistration)
        .catch(() => { /* SW unsupported — nothing to do */ });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installEvent || installing) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
    } catch { /* user dismissed natively */ }
    finally {
      setInstalling(false);
      setShowInstall(false);
      setInstallEvent(null);
    }
  }, [installEvent, installing]);

  const dismissInstall = useCallback(() => {
    try {
      localStorage.setItem('pwa_install_dismissed_at', String(Date.now()));
    } catch { /* storage unavailable */ }
    setShowInstall(false);
    setInstallEvent(null);
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    // Reload once the new worker takes control
    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    }
    // Fallback: reload anyway after 2s even if controllerchange never fires
    setTimeout(() => {
      if (!reloaded) {
        reloaded = true;
        window.location.reload();
      }
    }, 2000);
  }, [waitingWorker]);

  if (!showInstall && !waitingWorker) return null;

  return (
    <div
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:end-6 z-[90] max-w-sm"
      role="status"
      aria-live="polite"
    >
      {waitingWorker && (
        <div className="bg-zinc-950 text-white border border-emerald-500/40 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black">
                {isRtl ? 'يتوفر إصدار جديد من النظام' : 'A new version is available'}
              </p>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                {isRtl ? 'أعد التحميل لتفعيل آخر التحسينات والإصلاحات' : 'Reload to activate the latest improvements'}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={applyUpdate}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  {isRtl ? 'تحديث الآن' : 'Update now'}
                </button>
                <button
                  type="button"
                  onClick={() => setWaitingWorker(null)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isRtl ? 'لاحقاً' : 'Later'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInstall && !waitingWorker && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900 dark:text-white">
                {isRtl ? 'ثبّت التطبيق على جهازك' : 'Install the app'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                {isRtl ? 'وصول أسرع وعمل دون اتصال للميدان' : 'Faster access and offline field mode'}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تثبيت' : 'Install'}</span>
                </button>
                <button
                  type="button"
                  onClick={dismissInstall}
                  aria-label={isRtl ? 'إغلاق' : 'Dismiss'}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
