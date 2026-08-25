import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, CheckCircle2 } from 'lucide-react';

interface NexoraTopProgressBarProps {
  isLoading: boolean;
  isNavigating?: boolean;
  lang?: 'ar' | 'en';
  activeTabLabel?: string;
}

export const NexoraTopProgressBar: React.FC<NexoraTopProgressBarProps> = ({
  isLoading,
  isNavigating = false,
  lang = 'ar',
  activeTabLabel
}) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const active = isLoading || isNavigating;

  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (active) {
      setVisible(true);
      const initial = progressRef.current > 0 && progressRef.current < 90 ? progressRef.current : 15;
      progressRef.current = initial;
      setProgress(initial);

      let lastTime = performance.now();

      const tick = (now: number) => {
        const delta = now - lastTime;
        if (delta >= 120) {
          lastTime = now;
          setProgress((prev) => {
            let next = prev;
            if (prev < 40) next = prev + Math.random() * 15 + 10;
            else if (prev < 75) next = prev + Math.random() * 8 + 3;
            else if (prev < 92) next = prev + Math.random() * 3 + 1;
            progressRef.current = next;
            return next;
          });
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      setStatusMessage(
        isNavigating
          ? (lang === 'ar' ? `جاري تحميل ${activeTabLabel || 'القسم'}...` : `Loading ${activeTabLabel || 'module'}...`)
          : (lang === 'ar' ? 'جاري مزامنة المحرك المؤسسي والبيانات...' : 'Syncing enterprise engine & data...')
      );

    } else {
      setProgress(100);
      progressRef.current = 100;
      setStatusMessage(lang === 'ar' ? 'تمت المزامنة بنجاح' : 'Sync completed');

      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
        progressRef.current = 0;
      }, 400);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, isNavigating, activeTabLabel, lang]);

  if (!visible && progress === 0) return null;

  return (
    <>
      {/* Top Fixed High-Performance Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[100000] pointer-events-none h-1 bg-slate-200/20 dark:bg-zinc-900/30 overflow-hidden">
        <motion.div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 via-amber-400 to-emerald-400 dark:from-emerald-400 dark:via-cyan-300 dark:to-amber-300 relative shadow-[0_0_15px_rgba(16,185,129,0.9),0_0_6px_rgba(217,119,6,0.8)]"
          initial={{ width: '0%', opacity: 1 }}
          animate={{
            width: `${progress}%`,
            opacity: progress === 100 ? [1, 0] : 1
          }}
          transition={{
            width: { ease: 'easeOut', duration: progress === 100 ? 0.2 : 0.3 },
            opacity: { duration: 0.4, delay: progress === 100 ? 0.2 : 0 }
          }}
        >
          {/* Animated Particle Head */}
          <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-transparent to-white/90 dark:to-emerald-200/90 rounded-full animate-pulse shadow-[0_0_12px_#34d399]" />
        </motion.div>
      </div>

      {/* Floating Micro Status Toast for Active Sync / Navigation */}
      <AnimatePresence>
        {visible && progress < 100 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 ltr:right-4 rtl:left-4 z-[99999] pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 dark:bg-zinc-950/90 text-white text-[11px] font-medium border border-emerald-500/40 shadow-2xl backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-sans text-slate-200 tracking-wide">{statusMessage}</span>
            <span className="font-mono text-emerald-400 font-bold ltr:ml-1 rtl:mr-1">{Math.round(progress)}%</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NexoraTopProgressBar;
