import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Keyboard, 
  Sparkles, 
  RotateCcw, 
  Save, 
  Check, 
  AlertTriangle, 
  Edit2, 
  CheckCircle2, 
  Sliders,
  Download,
  Upload
} from 'lucide-react';
import { triggerHaptic } from '../../helpers/hapticSwipe';
import { persistenceService } from '../../core/services/persistence';

export interface ShortcutDefinition {
  id: string;
  categoryAr: string;
  categoryEn: string;
  descAr: string;
  descEn: string;
  defaultKeys: string[];
  customKeys?: string[];
}

const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'cmd-omni',
    categoryAr: 'التنقل الرئيسي والبحث',
    categoryEn: 'Navigation & Search',
    descAr: 'فتح مركز الأوامر والبحث الشامل (Command Center)',
    descEn: 'Open Universal Command Center',
    defaultKeys: ['Ctrl', 'K']
  },
  {
    id: 'cmd-search',
    categoryAr: 'التنقل الرئيسي والبحث',
    categoryEn: 'Navigation & Search',
    descAr: 'البحث السريع المباشر في السجلات (Quick Search)',
    descEn: 'Quick Global Search Bar',
    defaultKeys: ['Ctrl', '/']
  },
  {
    id: 'cmd-record-finder',
    categoryAr: 'الاسترجاع السريع للمستندات',
    categoryEn: 'Record Retrieval',
    descAr: 'محرك الاسترجاع السريع للسندات والفواتير والأنشطة',
    descEn: 'Fast Record Retrieval Drawer (Vouchers & Invoices)',
    defaultKeys: ['Ctrl', 'Shift', 'F']
  },
  {
    id: 'cmd-nav-dashboard',
    categoryAr: 'إدارة مساحة العمل',
    categoryEn: 'Workspace & Density',
    descAr: 'الانتقال للوحة القيادة الاستراتيجية',
    descEn: 'Jump to Strategy Dashboard',
    defaultKeys: ['Alt', '1']
  },
  {
    id: 'cmd-nav-finance',
    categoryAr: 'إدارة مساحة العمل',
    categoryEn: 'Workspace & Density',
    descAr: 'الانتقال إلى النظام المالي ودفتر الأستاذ IPSAS',
    descEn: 'Jump to Financial Ledger',
    defaultKeys: ['Alt', '2']
  },
  {
    id: 'cmd-nav-beneficiaries',
    categoryAr: 'إدارة مساحة العمل',
    categoryEn: 'Workspace & Density',
    descAr: 'الانتقال إلى سجل الخدمات والمستفيدين',
    descEn: 'Jump to Beneficiaries',
    defaultKeys: ['Alt', '3']
  },
  {
    id: 'cmd-nav-projects',
    categoryAr: 'إدارة مساحة العمل',
    categoryEn: 'Workspace & Density',
    descAr: 'الانتقال إلى إشراف المشاريع الميدانية',
    descEn: 'Jump to Projects',
    defaultKeys: ['Alt', '4']
  },
  {
    id: 'cmd-nav-reports',
    categoryAr: 'إدارة مساحة العمل',
    categoryEn: 'Workspace & Density',
    descAr: 'الانتقال إلى التقارير ومؤشرات الأثر',
    descEn: 'Jump to Impact Reports',
    defaultKeys: ['Alt', '5']
  },
  {
    id: 'cmd-refresh-data',
    categoryAr: 'العمليات السريعة وإدارة البيانات',
    categoryEn: 'Quick Operations',
    descAr: 'تحديث بيانات النظام ومزامنة الذاكرة المؤقتة',
    descEn: 'Refresh Application State & Cache',
    defaultKeys: ['Ctrl', 'R']
  },
  {
    id: 'cmd-toggle-theme',
    categoryAr: 'العمليات السريعة وإدارة البيانات',
    categoryEn: 'Quick Operations',
    descAr: 'التبديل بين الوضع الداكن والنهاري',
    descEn: 'Toggle Dark / Light Theme',
    defaultKeys: ['Alt', 'D']
  },
  {
    id: 'cmd-toggle-lang',
    categoryAr: 'العمليات السريعة وإدارة البيانات',
    categoryEn: 'Quick Operations',
    descAr: 'التبديل بين اللغة العربية والإنجليزية',
    descEn: 'Toggle Language (AR/EN)',
    defaultKeys: ['Alt', 'L']
  }
];

interface CustomizableShortcutsModalProps {
  lang: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
}

export const CustomizableShortcutsModal: React.FC<CustomizableShortcutsModalProps> = ({
  lang,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;
  const isRtl = lang === 'ar';

  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>(DEFAULT_SHORTCUTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [listeningKeys, setListeningKeys] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load custom shortcuts from persistence
  useEffect(() => {
    async function loadSaved() {
      try {
        const saved = await persistenceService.get<Record<string, string[]>>('user_preferences', 'custom_keybindings');
        if (saved) {
          setShortcuts(DEFAULT_SHORTCUTS.map(sc => ({
            ...sc,
            customKeys: saved[sc.id] || undefined
          })));
        }
      } catch (err) {
        console.warn('[Shortcuts] Load error:', err);
      }
    }
    loadSaved();
  }, [isOpen]);

  // Key recording listener
  useEffect(() => {
    if (!editingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setEditingId(null);
        setListeningKeys([]);
        return;
      }

      const keys: string[] = [];
      if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      const nonModifierKey = e.key.toUpperCase();
      if (!['CONTROL', 'ALT', 'SHIFT', 'META'].includes(nonModifierKey)) {
        keys.push(nonModifierKey);
        setListeningKeys(keys);

        // Auto save mapped key
        setShortcuts(prev => prev.map(sc => 
          sc.id === editingId ? { ...sc, customKeys: keys } : sc
        ));
        setEditingId(null);
        triggerHaptic('success');
      } else {
        setListeningKeys(keys);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [editingId]);

  // Save all shortcuts to storage
  const handleSaveAll = async () => {
    const keyMap: Record<string, string[]> = {};
    shortcuts.forEach(sc => {
      if (sc.customKeys && sc.customKeys.length > 0) {
        keyMap[sc.id] = sc.customKeys;
      }
    });

    await persistenceService.set('user_preferences', 'custom_keybindings', keyMap);
    triggerHaptic('success');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Reset to default
  const handleResetDefaults = async () => {
    await persistenceService.delete('user_preferences', 'custom_keybindings');
    setShortcuts(DEFAULT_SHORTCUTS);
    triggerHaptic('light');
  };

  return (
    <div 
      className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isRtl ? 'تخصيص اختصارات لوحة المفاتيح (Custom Keyboard Shortcuts)' : 'Custom Keyboard Shortcuts Manager'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isRtl ? 'انقر على أي اختصار لتعديله وتعيين الأزرار التي تناسب سير عملك اليومي.' : 'Click on any action to remap its hotkey to match your operational workflow.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List by Group */}
        <div className="space-y-4 flex-1">
          {shortcuts.map((sc) => {
            const isEditing = editingId === sc.id;
            const currentKeys = sc.customKeys || sc.defaultKeys;
            const isCustom = Boolean(sc.customKeys);

            return (
              <div
                key={sc.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                  isEditing 
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-2 ring-amber-500/20' 
                    : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-200/80 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    {isRtl ? sc.categoryAr : sc.categoryEn}
                  </span>
                  <p className="font-extrabold text-slate-900 dark:text-white truncate">
                    {isRtl ? sc.descAr : sc.descEn}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 animate-pulse bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl font-bold font-mono text-[11px]">
                      <span>{listeningKeys.length > 0 ? listeningKeys.join(' + ') : (isRtl ? 'اضغط الأزرار الآن...' : 'Press keys now...')}</span>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        triggerHaptic('light');
                        setEditingId(sc.id);
                        setListeningKeys([]);
                      }}
                      className="flex items-center gap-1 font-mono cursor-pointer group"
                      title={isRtl ? 'انقر لإعادة التعيين' : 'Click to remap'}
                    >
                      {currentKeys.map((k, idx) => (
                        <kbd 
                          key={idx} 
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border shadow-xs transition-colors ${
                            isCustom
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                              : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 group-hover:border-amber-500'
                          }`}
                        >
                          {k}
                        </kbd>
                      ))}
                      <div className="w-6 h-6 rounded-lg bg-slate-200/50 dark:bg-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <Edit2 className="w-3 h-3 text-slate-600 dark:text-zinc-400" />
                      </div>
                    </div>
                  )}

                  {isCustom && !isEditing && (
                    <button
                      onClick={() => {
                        setShortcuts(prev => prev.map(item => item.id === sc.id ? { ...item, customKeys: undefined } : item));
                        triggerHaptic('light');
                      }}
                      className="text-[10px] text-zinc-400 hover:text-rose-500 p-1"
                      title={isRtl ? 'استعادة الافتراضي' : 'Reset'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isRtl ? 'استعادة الإعدادات المصنعية' : 'Reset All to Defaults'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{isRtl ? 'تم الحفظ بنجاح' : 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isRtl ? 'حفظ التخصيص' : 'Save Custom Shortcuts'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizableShortcutsModal;
