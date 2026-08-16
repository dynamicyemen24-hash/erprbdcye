import React from 'react';
import { X, Command, Keyboard, Sparkles, CornerDownLeft } from 'lucide-react';
import { triggerHaptic } from '../helpers/hapticSwipe';

interface KeyboardShortcutsModalProps {
  lang: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ lang, isOpen, onClose }) => {
  if (!isOpen) return null;
  const isRtl = lang === 'ar';

  const shortcutGroups = [
    {
      titleAr: 'التنقل الرئيسي والبحث',
      titleEn: 'Navigation & Search',
      shortcuts: [
        { keys: ['Ctrl', 'K'], descAr: 'فتح مركز الأوامر الشامل (Command Center)', descEn: 'Open Universal Command Center' },
        { keys: ['Ctrl', '/'], descAr: 'البحث السريع المباشر في النظام', descEn: 'Quick Global Search' },
        { keys: ['?'], descAr: 'عرض قائمة اختصارات لوحة التحكم الحالية', descEn: 'Show Shortcuts Help' },
        { keys: ['Esc'], descAr: 'إغلاق النوافذ واللوائح المفتوحة', descEn: 'Close Modal / Dialog / Overlay' },
      ]
    },
    {
      titleAr: 'إدارة مساحة العمل والتبويبات',
      titleEn: 'Workspace & Density',
      shortcuts: [
        { keys: ['Alt', '1'], descAr: 'الانتقال للوحة القيادة الاستراتيجية', descEn: 'Jump to Strategy Dashboard' },
        { keys: ['Alt', '2'], descAr: 'الانتقال إلى إشراف المشاريع الميدانية', descEn: 'Jump to Projects' },
        { keys: ['Alt', '3'], descAr: 'الانتقال إلى سجل الخدمات والمستفيدين', descEn: 'Jump to Beneficiaries' },
        { keys: ['Alt', '4'], descAr: 'الانتقال إلى الخريطة المكانية GIS', descEn: 'Jump to Geospatial Field Map' },
        { keys: ['Ctrl', 'B'], descAr: 'توسيع / طي قائمة الأنظمة الجانبية', descEn: 'Toggle Systems Dock Sidebar' },
      ]
    },
    {
      titleAr: 'العمليات السريعة وإدارة البيانات',
      titleEn: 'Quick Operations & Data',
      shortcuts: [
        { keys: ['Ctrl', 'R'], descAr: 'تحديث بيانات النظام والذاكرة المؤقتة', descEn: 'Refresh Application State' },
        { keys: ['Alt', 'L'], descAr: 'التبديل بين اللغة العربية والإنجليزية', descEn: 'Toggle Language (AR/EN)' },
        { keys: ['Alt', 'D'], descAr: 'التبديل بين الوضع الداكن والنهاري', descEn: 'Toggle Dark Mode Theme' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto custom-scrollbar"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isRtl ? 'اختصارات لوحة التحكم السريعة (Keyboard Shortcuts)' : 'Keyboard Shortcuts Reference'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isRtl ? 'استخدم الاختصارات لزيادة الإنتاجية وتقليل خطوات العمل الميداني.' : 'Power navigation shortcuts for maximum enterprise operational speed.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Groups */}
        <div className="space-y-6">
          {shortcutGroups.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isRtl ? group.titleAr : group.titleEn}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.shortcuts.map((sc, scIdx) => (
                  <div 
                    key={scIdx} 
                    className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-bold text-slate-700 dark:text-zinc-300">
                      {isRtl ? sc.descAr : sc.descEn}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      {sc.keys.map((k, kIdx) => (
                        <kbd key={kIdx} className="px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md text-[10px] font-black shadow-xs text-slate-800 dark:text-zinc-200">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isRtl ? 'اضغط Esc لإغلاق النافذة في أي وقت' : 'Press Esc to close any time'}</span>
          </span>
          <span className="font-mono text-[10px]">NexoraOS v3.8 Shortcuts</span>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
