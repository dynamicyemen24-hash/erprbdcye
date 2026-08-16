import React from 'react';
import { X, Brain, BookOpen, PlayCircle } from 'lucide-react';
import { EnterpriseLogo } from './EnterpriseLogo';
import { SystemsDockPanel } from './SystemsDockPanel';
import { ActiveTab } from '../core/types';

export interface MobileNavigationDrawerProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  lang: 'ar' | 'en';
  orgName: string;
  activeRolePerspective: 'executive' | 'manager' | 'field';
  setActiveRolePerspective: (role: 'executive' | 'manager' | 'field') => void;
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  setShowCopilotDrawer: (open: boolean) => void;
  setShowDocsModal: (open: boolean) => void;
  setShowScenariosModal: (open: boolean) => void;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  lang,
  orgName,
  activeRolePerspective,
  setActiveRolePerspective,
  activeTab,
  onNavigate,
  setShowCopilotDrawer,
  setShowDocsModal,
  setShowScenariosModal
}) => {
  if (!isMobileMenuOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Drawer content panel */}
      <div className={`relative flex flex-col w-72 max-w-[85vw] h-full bg-white dark:bg-zinc-950 shadow-2xl border-y-0 border-slate-200 dark:border-zinc-800 transition-all duration-300 ease-out z-10 ${
        lang === 'ar' ? 'mr-auto border-l' : 'ml-auto border-r'
      }`}>
        {/* Drawer Header */}
        <div className="h-14 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-slate-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <EnterpriseLogo 
              className="h-6 w-auto object-contain bg-white/90 p-0.5 rounded"
            />
            <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
              {lang === 'ar' ? `بوابة ${orgName} التشغيلية` : `${orgName} Portal`}
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 hover:text-rose-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Perspective Selector in mobile menu */}
        <div className="p-3 bg-slate-100/50 dark:bg-zinc-900/30 border-b border-slate-200 dark:border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-400 block mb-1.5">
            {lang === 'ar' ? 'منظور الدور النشط' : 'Active Role Perspective'}
          </span>
          <div className="grid grid-cols-3 gap-1 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
            {(['executive', 'manager', 'field'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setActiveRolePerspective(r)}
                className={`py-1 text-[9px] font-black rounded transition-all capitalize ${
                  activeRolePerspective === r
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                {r === 'executive' ? (lang === 'ar' ? 'قيادي' : 'Exec') : r === 'manager' ? (lang === 'ar' ? 'مدير' : 'Mgr') : (lang === 'ar' ? 'ميداني' : 'Field')}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Dock Navigation Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="mb-4">
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block mb-2 px-1">
              {lang === 'ar' ? 'الأنظمة والعمليات الـ13' : '13 Enterprise Systems'}
            </span>
            <SystemsDockPanel
              lang={lang}
              activeTab={activeTab}
              onNavigate={(tab) => {
                onNavigate(tab);
                setIsMobileMenuOpen(false);
              }}
              isDockPinned={true}
              onToggleDockPin={() => {}}
              isMobileMode={true}
            />
          </div>

          {/* Mobile Quick Tools and Helper links */}
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 mt-3">
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block mb-2 px-1">
              {lang === 'ar' ? 'أدوات الدعم والمساعدة' : 'Support & Co-Pilot'}
            </span>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setShowCopilotDrawer(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2 rounded-xl text-left rtl:text-right hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-zinc-300"
              >
                <Brain className="w-4 h-4 text-emerald-500" />
                <span>Nexora AI Copilot</span>
              </button>

              <button
                onClick={() => {
                  setShowDocsModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2 rounded-xl text-left rtl:text-right hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-zinc-300"
              >
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>{lang === 'ar' ? 'دليل الاستخدام والتشغيل' : 'Operational Guide'}</span>
              </button>

              <button
                onClick={() => {
                  setShowScenariosModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2 rounded-xl text-left rtl:text-right hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-zinc-300"
              >
                <PlayCircle className="w-4 h-4 text-amber-500" />
                <span>{lang === 'ar' ? 'سيناريوهات SOP التفاعلية' : 'Interactive SOP Playbooks'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex flex-col items-center gap-1.5 text-center">
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-500">
            {orgName}
          </span>
          <span className="text-[8px] font-mono text-slate-400">
            NexoraOS™ Suite v1.2.6
          </span>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigationDrawer;
