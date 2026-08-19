import React, { useState } from 'react';
import { 
  Menu, 
  Grid, 
  Minus, 
  Square, 
  X, 
  Building2, 
  Calendar, 
  Search, 
  MoreHorizontal, 
  Brain, 
  RefreshCw, 
  ShieldCheck,
  CheckCircle2,
  Globe
} from "lucide-react";
import { EnterpriseLogo } from './EnterpriseLogo';
import NexoraOSLogo from './NexoraOSLogo';
import ERPSearchBar from './ERPSearchBar';
import NotificationCenter from './NotificationCenter';
import AutoDarkModeManager from './AutoDarkModeManager';
import UserProfilePopover from './UserProfilePopover';
import HeaderQuickMenu from './HeaderQuickMenu';
import OfflineSyncStatusWidget from './OfflineSyncStatusWidget';
import { ActiveTab, User } from '../core/types';
import { useTenantContext } from '../core/TenantContext';
import { useEnvironmentMode, ENVIRONMENT_MODES } from '../core/context/EnvironmentModeContext';

export interface GlobalEnterpriseHeaderProps {
  lang: 'ar' | 'en';
  setLang: React.Dispatch<React.SetStateAction<'ar' | 'en'>>;
  orgName: string;
  licenseText: string;
  isOnline: boolean;
  loading: boolean;
  fetchAllData: () => void;
  setIsMobileMenuOpen: (open: boolean) => void;
  setShowAppLauncherModal: (open: boolean) => void;
  setShowAboutSystemModal: (open: boolean) => void;
  setIsCommandCenterOpen: (open: boolean) => void;
  beneficiaries: any[];
  projects: any[];
  users: User[];
  approvalRequests: any[];
  handleSelectTab: (tab: ActiveTab) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  layoutDensity: 'compact' | 'comfortable' | 'spacious';
  setLayoutDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;
  setIsShortcutsModalOpen: (open: boolean) => void;
  setShowExportModal: (open: boolean) => void;
  setShowScenariosModal: (open: boolean) => void;
  setShowHelpersModal: (open: boolean) => void;
  setShowDocsModal: (open: boolean) => void;
  isSystemsDockPinned: boolean;
  setIsSystemsDockPinned: (pinned: boolean) => void;
  setPendingSecureTab: (tab: ActiveTab | null) => void;
  onOpenCopilot?: () => void;
}

export const GlobalEnterpriseHeader: React.FC<GlobalEnterpriseHeaderProps> = ({
  lang, setLang, orgName, licenseText, isOnline, loading, fetchAllData,
  setIsMobileMenuOpen, setShowAppLauncherModal, setShowAboutSystemModal,
  setIsCommandCenterOpen, beneficiaries, projects, users, approvalRequests,
  handleSelectTab, theme, setTheme, currentUser, setCurrentUser,
  layoutDensity, setLayoutDensity, setIsShortcutsModalOpen, setShowExportModal,
  setShowScenariosModal, setShowHelpersModal, setShowDocsModal,
  isSystemsDockPinned, setIsSystemsDockPinned, setPendingSecureTab,
  onOpenCopilot
}) => {
  const isRtl = lang === 'ar';
  const { tenantContext, availableOrganizations, switchOrganization } = useTenantContext();
  const { isTrainingMode, currentConfig, toggleEnvironmentMode, trainingSessionDuration } = useEnvironmentMode();
  const [showUserProfilePopover, setShowUserProfilePopover] = useState(false);
  // Initialize branch from tenant context branchCode if available
  const defaultBranch = tenantContext?.branchCode || 'MAIN';
  const [selectedBranch, setSelectedBranch] = useState(defaultBranch);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('FY2026');
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  return (
    <header className="flex flex-col border-b border-emerald-500/20 bg-slate-950 text-white z-50 select-none relative shadow-lg">
      
      {/* ========================================================================= */}
      {/* BAR 1: TOP MAIN HEADER (Clean Enterprise Ribbon) */}
      {/* ========================================================================= */}
      <div className="h-10 px-3 md:px-5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/95 text-xs">
        
        {/* START: SYSTEM IDENTITY & QUICK APP MENU */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded-lg border border-emerald-500/30 cursor-pointer transition"
            title={isRtl ? 'القائمة التشغيلية' : 'Operational Menu'}
          >
            <Menu className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => setShowAppLauncherModal(true)}
            className="p-1.5 bg-emerald-950/60 hover:bg-emerald-800/80 text-emerald-200 rounded-lg border border-emerald-500/30 transition-all cursor-pointer flex items-center justify-center group shadow-xs"
            title={isRtl ? 'الأنظمة والوحدات التشغيلية' : 'Operational Modules'}
          >
            <Grid className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1"></div>

          {/* SYSTEM PRODUCT IDENTITY */}
          <button
            onClick={() => setShowAboutSystemModal(true)}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-right rtl:text-right"
            title={isRtl ? 'نظرة عامة وهوية النظام' : 'System Overview'}
          >
            <NexoraOSLogo lang={lang} size="sm" />
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1"></div>

          {/* MULTI-TENANT ORGANIZATION SWITCHER */}
          <div className="hidden md:flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-lg text-[11px] shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={tenantContext.organizationId}
              onChange={(e) => {
                const selected = availableOrganizations.find(o => o.id === e.target.value);
                if (selected) {
                  switchOrganization(selected.id, selected.name_ar, selected.name_en);
                }
              }}
              className="bg-transparent text-zinc-200 font-semibold cursor-pointer outline-none text-[11px]"
            >
              {availableOrganizations.map(org => (
                <option key={org.id} value={org.id} className="bg-zinc-950 text-white">
                  {isRtl ? org.name_ar : org.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* ENVIRONMENT MODE INDICATOR */}
          <button
            onClick={toggleEnvironmentMode}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
              isTrainingMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
            }`}
            title={isRtl ? currentConfig.descriptionAr : currentConfig.descriptionEn}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${isTrainingMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span>{isRtl ? currentConfig.labelAr : currentConfig.labelEn}</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1"></div>
        </div>

        {/* MIDDLE: FREE FLEXIBLE SPACER */}
        <div className="flex-1"></div>

        {/* END: WINDOW CONTROL BUTTONS (?????? ?????? ?????) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { /* Minimize handled by parent */ }}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
            title={isRtl ? 'تصغير الشاشة' : 'Minimize Window'}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsWindowMaximized(!isWindowMaximized)}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
            title={isRtl ? (isWindowMaximized ? 'استغلال المال' : 'كفاءة الفريق') : (isWindowMaximized ? 'Restore Window' : 'Maximize Window')}
          >
            <Square className="w-3 h-3" />
          </button>

          <button
            onClick={() => {
              if (confirm(isRtl ? 'هل ترغب في قفل الجلسة والحروج؟' : 'Lock session and return to login?')) {
                localStorage.removeItem('rbd_token');
                localStorage.removeItem('rbd_refresh_token');
                setCurrentUser(null);
              }
            }}
            className="p-1.5 hover:bg-rose-600 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
            title={isRtl ? 'إغلاق وقفل الجلسة' : 'Close / Logout'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* BAR 2: SUB-HEADER TOOLBAR (??????? + ????? + ????? + ????? ?????? + ???????) */}
      {/* ========================================================================= */}
      <div className="h-11 px-3 md:px-5 flex items-center justify-between gap-3 text-xs bg-zinc-900/90 border-t border-zinc-800/50">
        
        {/* START: LOGO + TENANT + BRANCH + FISCAL YEAR + QUICK SEARCH */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar flex-1 py-1">
          
          {/* ORG LOGO & TENANT */}
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-lg shrink-0 shadow-xs">
            <div className="bg-white rounded p-0.5 shrink-0">
              <EnterpriseLogo className="h-4 w-auto object-contain" />
            </div>
            <span className="text-emerald-200 font-extrabold text-[11px] truncate max-w-[200px] sm:max-w-xs">
              {orgName}
            </span>
          </div>

          {/* BRANCH SELECTOR */}
          <div className="flex items-center gap-1.5 bg-zinc-950/70 border border-zinc-800 px-2.5 py-1 rounded-lg shrink-0">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-zinc-200 font-semibold text-[11px] outline-none cursor-pointer border-none"
            >
              <option value="HQ_SANAA" className="bg-zinc-900 text-white">{isRtl ? 'المركز الرئيسي - صنعاء' : 'Main HQ - Sanaa'}</option>
              <option value="BR_ADEN" className="bg-zinc-900 text-white">{isRtl ? 'فرع عدن' : 'Aden Branch'}</option>
              <option value="BR_TAIZ" className="bg-zinc-900 text-white">{isRtl ? 'فرع تعز والميدان' : 'Taiz Branch'}</option>
            </select>
          </div>

          {/* FISCAL YEAR */}
          <div className="flex items-center gap-1.5 bg-zinc-950/70 border border-zinc-800 px-2.5 py-1 rounded-lg shrink-0">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="bg-transparent text-emerald-400 font-semibold text-[11px] outline-none cursor-pointer border-none"
            >
              <option value="FY2026" className="bg-zinc-900 text-white">2026</option>
              <option value="FY2025" className="bg-zinc-900 text-white">2025</option>
            </select>
          </div>

          {/* QUICK ACCESS SEARCH BOX */}
          <div className="flex-1 max-w-xs min-w-[140px] hidden sm:block">
            <ERPSearchBar 
              lang={lang}
              beneficiaries={beneficiaries}
              projects={projects}
              users={users}
              onNavigate={(tab) => handleSelectTab(tab)}
            />
          </div>

        </div>

        {/* END: AUXILIARY TOOLS */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* COPILOT AI BUTTON */}
          {onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              className="px-2.5 py-1 bg-emerald-900/50 hover:bg-emerald-800/80 border border-emerald-600/50 text-amber-400 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 shadow-xs"
              title={isRtl ? 'المساعد الذكي' : 'AI Assistant'}
            >
              <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden md:inline font-semibold">{isRtl ? 'المساعد الذكي' : 'Copilot AI'}</span>
            </button>
          )}

          {/* NOTIFICATION CENTER */}
          <NotificationCenter 
            lang={lang}
            approvalRequests={approvalRequests}
            projects={projects}
            onNavigate={(tab) => handleSelectTab(tab as any)}
          />

          {/* AUTO DARK MODE */}
          <AutoDarkModeManager 
            lang={lang}
            theme={theme}
            setTheme={setTheme}
          />

          {/* LANGUAGE SWITCHER */}
          <button 
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="px-2 py-1 hover:bg-emerald-900/80 rounded-lg border border-emerald-800 text-xs font-black text-amber-400 font-mono transition-all cursor-pointer"
          >
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>

          {/* USER PROFILE POPOVER */}
          <div className="relative">
            <button
              onClick={() => setShowUserProfilePopover(!showUserProfilePopover)}
              className="flex items-center gap-2 px-2 py-1 bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-800 rounded-xl text-white transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded bg-emerald-600 border border-emerald-300/40 flex items-center justify-center text-white font-black text-[10px]">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden xl:inline text-xs font-bold text-emerald-100">
                {currentUser?.name || (isRtl ? 'المستخدم المسئول' : 'User')}
              </span>
            </button>

            <UserProfilePopover
              isOpen={showUserProfilePopover}
              onClose={() => setShowUserProfilePopover(false)}
              lang={lang}
              currentUser={currentUser as any}
              onSwitchUser={(u) => {
                setCurrentUser(u);
                try { localStorage.setItem('rbd_user', JSON.stringify(u)); } catch (e) { console.error('[Header] Failed to save user to localStorage:', e); }
              }}
              onLogout={() => {
                setCurrentUser(null);
                try { 
                  localStorage.removeItem('rbd_user'); 
                  localStorage.removeItem('roh_user'); 
                  localStorage.removeItem('rbd_token');
                  localStorage.removeItem('rbd_refresh_token');
                } catch (e) { console.error('[Header] Failed to clear user from localStorage:', e); }
              }}
            />
          </div>

          {/* "??????" (MORE) DROPDOWN BUTTON FOR AUXILIARY TOOLS */}
          <HeaderQuickMenu
            lang={lang}
            density={layoutDensity}
            onDensityChange={setLayoutDensity}
            onRefreshData={fetchAllData}
            isLoading={loading}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
            onOpenExportModal={() => setShowExportModal(true)}
            onOpenScenarios={() => setShowScenariosModal(true)}
            onOpenHelpers={() => setShowHelpersModal(true)}
            onOpenDocs={() => setShowDocsModal(true)}
            isSystemsDockPinned={isSystemsDockPinned}
            onToggleDockPin={() => setIsSystemsDockPinned(!isSystemsDockPinned)}
            onOpenCommandCenter={() => setIsCommandCenterOpen(true)}
            onLockSession={() => setPendingSecureTab('finance')}
          />

        </div>

      </div>

    </header>
  );
};

export default GlobalEnterpriseHeader;
