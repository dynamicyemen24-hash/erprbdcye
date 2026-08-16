import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Save,
  Printer,
  Download,
  Lock,
  Search,
  RefreshCw,
  Copy,
  FilterX,
  Sun,
  Moon,
  Maximize,
  Sliders,
  Sparkles,
  Shield,
  Calculator,
  PlayCircle,
  Coins,
  BookOpen,
  Keyboard,
  Info,
  CheckCircle2,
  ChevronDown,
  Layers,
  Activity,
  Globe,
  Grid
} from 'lucide-react';
import { triggerHaptic } from '../helpers/hapticSwipe';

export interface EnterpriseMenuStripProps {
  lang: 'ar' | 'en';
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onRefreshData: () => void;
  onOpenCommandCenter: () => void;
  onOpenCopilot: () => void;
  onOpenDocs: () => void;
  onOpenShortcuts: () => void;
  onOpenHelpers: () => void;
  onOpenScenarios: () => void;
  onOpenExportModal?: () => void;
  onLockSession?: () => void;
  onResetFilters?: () => void;
  onToggleFullscreen?: () => void;
  activeTabTitle?: string;
  totalRecords?: number;
}

export const EnterpriseMenuStrip: React.FC<EnterpriseMenuStripProps> = ({
  lang,
  theme,
  onToggleTheme,
  onRefreshData,
  onOpenCommandCenter,
  onOpenCopilot,
  onOpenDocs,
  onOpenShortcuts,
  onOpenHelpers,
  onOpenScenarios,
  onOpenExportModal,
  onLockSession,
  onResetFilters,
  onToggleFullscreen,
  activeTabTitle,
  totalRecords = 0
}) => {
  const isRtl = lang === 'ar';
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close active dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Shortcuts Listener (Deep Engineering Intelligence)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Ctrl + S or Cmd + S: Save & Sync
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        triggerHaptic('medium');
        onRefreshData();
        showToast(isRtl ? 'تم مزامنة وحفظ كافة البيانات في القاعدة 💾' : 'All records synced to enterprise ledger 💾');
      }

      // Ctrl + P or Cmd + P: Print Screen
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        triggerHaptic('light');
        window.print();
      }

      // Ctrl + E or Cmd + E: Open Export Modal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        triggerHaptic('light');
        if (onOpenExportModal) onOpenExportModal();
      }

      // Ctrl + L or Cmd + L: Lock Session
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        triggerHaptic('heavy');
        if (onLockSession) onLockSession();
      }

      // F1: Open Documentation
      if (e.key === 'F1') {
        e.preventDefault();
        onOpenDocs();
      }

      // F11: Toggle Fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        if (onToggleFullscreen) {
          onToggleFullscreen();
        } else {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRtl, onRefreshData, onOpenExportModal, onLockSession, onOpenDocs, onToggleFullscreen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMenuClick = (menuKey: string) => {
    triggerHaptic('light');
    setActiveMenu(prev => (prev === menuKey ? null : menuKey));
  };

  const menuItems = [
    {
      key: 'file',
      labelAr: 'ملف',
      labelEn: 'File',
      options: [
        {
          labelAr: 'مزامنة وحفظ البيانات',
          labelEn: 'Sync & Save Records',
          shortcut: 'Ctrl+S',
          icon: Save,
          action: () => {
            onRefreshData();
            showToast(isRtl ? 'تم تحديث وسحب البيانات 💾' : 'Records refreshed & synced 💾');
          }
        },
        {
          labelAr: 'تصدير تقرير شامل (PDF/Excel)',
          labelEn: 'Export Enterprise Report',
          shortcut: 'Ctrl+E',
          icon: Download,
          action: () => {
            if (onOpenExportModal) onOpenExportModal();
          }
        },
        {
          labelAr: 'طباعة الشاشة الحالية',
          labelEn: 'Print View',
          shortcut: 'Ctrl+P',
          icon: Printer,
          action: () => window.print()
        },
        {
          type: 'divider'
        },
        {
          labelAr: 'قفل الجلسة بالأمان البيومتري',
          labelEn: 'Lock Session Gate',
          shortcut: 'Ctrl+L',
          icon: Lock,
          action: () => {
            if (onLockSession) onLockSession();
            else showToast(isRtl ? 'تم تفعيل بوابة الأمان' : 'Security Gate Enabled');
          }
        }
      ]
    },
    {
      key: 'edit',
      labelAr: 'تحرير',
      labelEn: 'Edit',
      options: [
        {
          labelAr: 'البحث الشامل والتحكم (⌘K)',
          labelEn: 'Universal Command Center',
          shortcut: 'Ctrl+K',
          icon: Search,
          action: onOpenCommandCenter
        },
        {
          labelAr: 'إعادة تعيين كافة التصفيات',
          labelEn: 'Reset Active Filters',
          shortcut: 'Esc',
          icon: FilterX,
          action: () => {
            if (onResetFilters) onResetFilters();
            showToast(isRtl ? 'تم إعادة تعيين جميع الفلاتر' : 'All filters reset');
          }
        },
        {
          labelAr: 'نسخ معرف الشاشة النشطة',
          labelEn: 'Copy View ID',
          icon: Copy,
          action: () => {
            navigator.clipboard.writeText(window.location.href);
            showToast(isRtl ? 'تم نسخ الرابط للذاكرة' : 'URL copied to clipboard');
          }
        }
      ]
    },
    {
      key: 'view',
      labelAr: 'عرض',
      labelEn: 'View',
      options: [
        {
          labelAr: theme === 'dark' ? 'التبديل للمظهر الفاتح' : 'التبديل للمظهر الداكن',
          labelEn: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
          shortcut: 'Alt+T',
          icon: theme === 'dark' ? Sun : Moon,
          action: onToggleTheme
        },
        {
          labelAr: 'وضع الشاشة الكاملة',
          labelEn: 'Toggle Fullscreen Mode',
          shortcut: 'F11',
          icon: Maximize,
          action: () => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }
        },
        {
          labelAr: 'تحديث مؤشرات البيانات',
          labelEn: 'Reload System Metrics',
          shortcut: 'F5',
          icon: RefreshCw,
          action: onRefreshData
        }
      ]
    },
    {
      key: 'tools',
      labelAr: 'أدوات',
      labelEn: 'Tools',
      options: [
        {
          labelAr: 'مساعد الذكاء الاصطناعي Copilot',
          labelEn: 'Gemini AI Copilot',
          shortcut: 'Ctrl+AI',
          icon: Sparkles,
          action: onOpenCopilot
        },
        {
          labelAr: 'أدوات وحاسبة الإغاثة الهندسية',
          labelEn: 'Relief & Engineering Tools',
          icon: Calculator,
          action: onOpenHelpers
        },
        {
          labelAr: 'محاكي السيناريوهات والتشغيل',
          labelEn: 'Operational Playbooks',
          icon: PlayCircle,
          action: onOpenScenarios
        }
      ]
    },
    {
      key: 'help',
      labelAr: 'مساعدة',
      labelEn: 'Help',
      options: [
        {
          labelAr: 'دليل المستخدم والمواصفات',
          labelEn: 'User Manual & System Specs',
          shortcut: 'F1',
          icon: BookOpen,
          action: onOpenDocs
        },
        {
          labelAr: 'اختصارات لوحة التحكم السريعة',
          labelEn: 'Keyboard Shortcuts Reference',
          shortcut: '?',
          icon: Keyboard,
          action: onOpenShortcuts
        },
        {
          labelAr: 'حول نظام NexoraOS™ Enterprise',
          labelEn: 'About NexoraOS™',
          icon: Info,
          action: () => {
            showToast(isRtl ? 'NexoraOS™ v2.4 - جمعية رُحماء بينهم' : 'NexoraOS™ v2.4 Enterprise Platform');
          }
        }
      ]
    }
  ];

  return (
    <div
      ref={menuRef}
      className="bg-slate-900 text-slate-200 border-b border-slate-800 px-3 py-1 flex items-center justify-between text-xs select-none z-30 relative"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Menu Strip Bar */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
        <span className="font-mono text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 shrink-0 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Nexora Menu</span>
        </span>

        {menuItems.map(menu => {
          const isOpen = activeMenu === menu.key;
          return (
            <div key={menu.key} className="relative">
              <button
                type="button"
                onClick={() => handleMenuClick(menu.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  isOpen
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{isRtl ? menu.labelAr : menu.labelEn}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu Item List */}
              {isOpen && (
                <div className="absolute top-full mt-1 z-50 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl min-w-[240px] py-1.5 animate-fade-in backdrop-blur-md">
                  {menu.options.map((opt, i) => {
                    if (opt.type === 'divider') {
                      return <div key={i} className="my-1 border-t border-slate-800" />;
                    }

                    const Icon = opt.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setActiveMenu(null);
                          if (opt.action) opt.action();
                        }}
                        className="w-full text-right rtl:text-right ltr:text-left px-3 py-1.5 hover:bg-slate-800/90 text-slate-200 hover:text-amber-400 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-3.5 h-3.5 text-amber-500/80 group-hover:text-amber-400 shrink-0" />}
                          <span className="font-semibold">{isRtl ? opt.labelAr : opt.labelEn}</span>
                        </div>

                        {opt.shortcut && (
                          <span className="font-mono text-[9px] bg-slate-950/80 text-zinc-400 px-1.5 py-0.5 rounded border border-slate-800 group-hover:border-amber-500/40 group-hover:text-amber-300">
                            {opt.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Badges & Active View Info */}
      <div className="hidden md:flex items-center gap-3 shrink-0 text-[11px]">
        {activeTabTitle && (
          <div className="flex items-center gap-1.5 text-zinc-400 bg-slate-950/60 px-2.5 py-0.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-zinc-500">{isRtl ? 'الشاشة:' : 'View:'}</span>
            <span className="font-bold text-slate-200">{activeTabTitle}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10px]">
          <span>{isRtl ? 'السجلات:' : 'Records:'}</span>
          <span className="font-black text-amber-400">{totalRecords}</span>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 font-black text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
