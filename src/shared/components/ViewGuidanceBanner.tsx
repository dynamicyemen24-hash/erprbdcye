import React, { useState } from 'react';
import { Lightbulb, ChevronDown, X, ListChecks, Info } from 'lucide-react';
import { getViewGuidance } from '../guidance/viewGuidance';

interface ViewGuidanceBannerProps {
  tab: string;
  lang: 'ar' | 'en';
}

const DISMISS_KEY = 'nexora_guidance_dismissed_v1';

function readDismissed(): Record<string, boolean> {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Contextual operating instructions rendered above every enterprise workspace screen.
 * Collapsible by default on repeat visits; dismissible per session.
 */
export const ViewGuidanceBanner: React.FC<ViewGuidanceBannerProps> = ({ tab, lang }) => {
  const isRtl = lang === 'ar';
  const guidance = getViewGuidance(tab);

  const [expanded, setExpanded] = useState(() => {
    // First visit of the session per screen starts expanded
    try {
      const seen = sessionStorage.getItem('nexora_guidance_seen');
      if (!seen || !seen.includes(tab)) {
        sessionStorage.setItem('nexora_guidance_seen', JSON.stringify([...JSON.parse(seen || '[]'), tab]));
        return true;
      }
      return false;
    } catch {
      return true;
    }
  });
  const [dismissed, setDismissed] = useState(() => readDismissed()[tab] === true);

  if (!guidance || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      const map = readDismissed();
      map[tab] = true;
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify(map));
    } catch { /* storage unavailable */ }
  };

  const steps = isRtl ? guidance.stepsAr : guidance.stepsEn;
  const tip = isRtl ? guidance.tipAr : guidance.tipEn;
  const purpose = isRtl ? guidance.purposeAr : guidance.purposeEn;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="mx-3 mt-3 mb-1 rounded-2xl border border-emerald-500/25 bg-gradient-to-l from-emerald-500/[0.07] via-transparent to-transparent dark:border-emerald-500/20 overflow-hidden"
      role="note"
      aria-label={isRtl ? 'إرشادات استخدام هذه الشاشة' : 'How to use this screen'}
    >
      <div className="flex items-start gap-2.5 p-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setExpanded(p => !p)}
            aria-expanded={expanded}
            className="w-full flex items-center gap-2 text-start cursor-pointer group"
          >
            <span className="text-xs font-black text-slate-800 dark:text-zinc-100 leading-relaxed">
              {purpose}
            </span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 text-emerald-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>

          {expanded && (
            <div className="mt-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <ol className="space-y-1.5">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] font-bold text-slate-600 dark:text-zinc-400 leading-relaxed">
                    <span className="w-4 h-4 mt-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[9px] font-black shrink-0">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              {tip && (
                <div className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-800 dark:text-amber-300 leading-relaxed">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                <ListChecks className="w-3 h-3" />
                <span>
                  {isRtl
                    ? 'الاختصارات السريعة: Ctrl+K بحث شامل • Ctrl+S حفظ • Ctrl+E تصدير • Ctrl+L قفل الجلسة'
                    : 'Quick keys: Ctrl+K search • Ctrl+S save • Ctrl+E export • Ctrl+L lock'}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label={isRtl ? 'إخفاء الإرشادات' : 'Hide guidance'}
          title={isRtl ? 'إخفاء إرشادات هذه الشاشة' : 'Dismiss this screen guidance'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ViewGuidanceBanner;
