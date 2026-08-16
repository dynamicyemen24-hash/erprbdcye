import React, { useState } from 'react';
import { Smartphone, Zap, Check, ArrowRightLeft, Hand, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '../../helpers/hapticSwipe';

interface FieldSwipeNavigationBannerProps {
  lang: 'ar' | 'en';
  activeColumnName?: string;
  onSimulateSwipeLeft?: () => void;
  onSimulateSwipeRight?: () => void;
}

export const FieldSwipeNavigationBanner: React.FC<FieldSwipeNavigationBannerProps> = ({
  lang,
  activeColumnName,
  onSimulateSwipeLeft,
  onSimulateSwipeRight
}) => {
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const testHaptic = (type: 'light' | 'success' | 'warning') => {
    const success = triggerHaptic(type);
    if (success) {
      setLastFeedback(lang === 'ar' ? 'تمت الاستجابة اللمسية ⚡' : 'Haptic Vibrated ⚡');
    } else {
      setLastFeedback(lang === 'ar' ? 'وضع المحاكاة اللمسية البصرية نشط' : 'Visual Haptic Active');
    }
    setTimeout(() => setLastFeedback(null), 2500);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-zinc-900 to-amber-950 p-3.5 rounded-2xl border border-emerald-700/60 shadow-md text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      {/* Left side info */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 animate-pulse">
          <Hand className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-300">
              {lang === 'ar' ? 'محتوى متجاوب مع إيماءات السحب الميدانية (Swipe Gestures)' : 'Field Touch Swipe & Haptic Engine'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              HAPTIC READY
            </span>
          </div>
          <p className="text-[10px] text-zinc-300 mt-0.5">
            {lang === 'ar' 
              ? 'اسحب البطاقات للأفق (يمين/يسار) للإنجاز والتعديل، أو اسحب للتنقل بين أعمدة الحالات'
              : 'Swipe cards left/right to execute field actions or switch Kanban status columns'}
          </p>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {lastFeedback && (
          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30 animate-bounce">
            {lastFeedback}
          </span>
        )}

        <button
          onClick={() => {
            setHapticEnabled(!hapticEnabled);
            testHaptic('success');
          }}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
            hapticEnabled 
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs' 
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
          title={lang === 'ar' ? 'اختبار تفعيل التفاعل اللمسي' : 'Test Haptic Vibration'}
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>{lang === 'ar' ? 'الاهتزاز اللمسي' : 'Haptic Vibration'}</span>
        </button>

        {/* Desktop simulation buttons for testing swipe without a touch device */}
        {onSimulateSwipeLeft && (
          <button
            onClick={() => {
              triggerHaptic('light');
              onSimulateSwipeLeft();
            }}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
            title={lang === 'ar' ? 'محاكاة سحب لليسار' : 'Simulate Swipe Left'}
          >
            <span>👈 {lang === 'ar' ? 'سحب يسار' : 'Swipe Left'}</span>
          </button>
        )}

        {onSimulateSwipeRight && (
          <button
            onClick={() => {
              triggerHaptic('light');
              onSimulateSwipeRight();
            }}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
            title={lang === 'ar' ? 'محاكاة سحب لليمين' : 'Simulate Swipe Right'}
          >
            <span>👉 {lang === 'ar' ? 'سحب يمين' : 'Swipe Right'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
