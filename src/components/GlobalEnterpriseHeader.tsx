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
    <header className="border-b border-emerald-500/20 bg-zinc-950 text-white z-50 select-none relative shadow-md">
      {/* UNIFIED SINGLE-TIER ENTERPRISE HEADER BAR (Clean, Spacious, Non-crowded) */}
      <div className="h-12 px-3 md:px-4 flex items-center justify-between gap-3 text-xs">
        
        {/* START: LOGOS, IDENTITY & BRANCH */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded-lg border border-emerald-500/30 cursor-pointer transition"
            title={isRtl ? 'القائمة التشغيلية' : 'Operational Menu'}
          >
            <Menu className="w-4 h-4 text-amber-400" />
          </button>

          {/* Operational Modules Launcher */}
          <button
            onClick={() => setShowAppLauncherModal(true)}
            className="p-1.5 bg-emerald-950/60 hover:bg-emerald-800/80 text-emerald-200 rounded-lg border border-emerald-500/30 transition-all cursor-pointer flex items-center justify-center group shadow-xs"
            title={isRtl ? 'الأنظمة والوحدات التشغيلية' : 'Operational Modules'}
          >
            <Grid className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* System Identity & Organization Brand */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAboutSystemModal(true)}
              className="flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
              title={isRtl ? 'نظرة عامة وهوية النظام' : 'System Overview'}
            >
              <NexoraOSLogo lang={lang} size="sm" />
            </button>

            <div className="h-4 w-px bg-zinc-800 hidden sm:block"></div>

            {/* Organization Identity Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-700/50 px-2.5 py-1 rounded-lg shadow-xs">
              <div className="bg-white rounded p-0.5 shrink-0">
                <EnterpriseLogo className="h-3.5 w-auto object-contain" />
              </div>
              <span className="text-emerald-200 font-extrabold text-[11px] truncate max-w-[140px] md:max-w-[200px]">
                {orgName}
              </span>
            </div>
          </div>

          {/* Branch & Fiscal Year (Desktop) */}
          <div className="hidden xl:flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-[10px]">
              <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-zinc-300 font-bold outline-none cursor-pointer border-none"
              >
                <option value="HQ_SANAA" className="bg-zinc-900 text-white">{isRtl ? 'المركز الرئيسي - صنعاء' : 'Main HQ - Sanaa'}</option>
                <option value="BR_ADEN" className="bg-zinc-900 text-white">{isRtl ? 'فرع عدن' : 'Aden Branch'}</option>
                <option value="BR_TAIZ" className="bg-zinc-900 text-white">{isRtl ? 'فرع تعز والميدان' : 'Taiz Branch'}</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-[10px]">
              <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-mono font-bold">2026</span>
            </div>
          </div>
        </div>

        {/* CENTER: QUICK ACCESS SEARCH & SHORTCUT */}
        <div className="flex-1 max-w-sm mx-auto hidden md:block">
          <div 
            onClick={() => setIsCommandCenterOpen(true)}
            className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/50 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer group shadow-inner"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
              <span className="text-xs truncate">
                {isRtl ? 'بحث شامل في السجلات والأوامر...' : 'Search records & commands...'}
              </span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
              Ctrl + K
            </kbd>
          </div>
        </div>

        {/* END: CONTROLS, ALERTS & USER PROFILE */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {/* Environment Mode Badge */}
          <button
            onClick={toggleEnvironmentMode}
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
              isTrainingMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
            }`}
            title={isRtl ? currentConfig.descriptionAr : currentConfig.descriptionEn}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isTrainingMode ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span className="hidden lg:inline">{isRtl ? currentConfig.labelAr : currentConfig.labelEn}</span>
          </button>

          {/* High-Tech Cloud DB Telemetry Chip */}
          <div 
            className="hidden 2xl:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 select-none shadow-2xs"
            title="Neon PostgreSQL 17 Cloud Data Warehouse - TLS 1.3"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-cyan-400 font-bold">Neon 14ms</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">pg17</span>
          </div>

          {/* Offline Sync Status */}
          <OfflineSyncStatusWidget lang={lang} />

          {/* AI Copilot Button */}
          {onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              className="p-1.5 md:px-2 md:py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-amber-400 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={isRtl ? 'المساعد الذكي' : 'AI Copilot'}
            >
              <Brain className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden lg:inline">{isRtl ? 'المساعد الذكي' : 'Copilot'}</span>
            </button>
          )}

          {/* Notification Center */}
          <NotificationCenter 
            lang={lang}
            approvalRequests={approvalRequests}
            projects={projects}
            onNavigate={(tab) => handleSelectTab(tab as any)}
          />

          {/* Auto Dark Mode Toggle */}
          <AutoDarkModeManager 
            lang={lang}
            theme={theme}
            setTheme={setTheme}
          />

          {/* Language Switcher */}
          <button 
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="px-2 py-1 hover:bg-emerald-900/80 rounded-lg border border-emerald-800/80 text-[11px] font-black text-amber-400 font-mono transition-all cursor-pointer"
            title={isRtl ? 'Switch Language to English' : 'التبديل إلى العربية'}
          >
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>

          {/* User Profile Popover */}
          <div className="relative">
            <button
              onClick={() => setShowUserProfilePopover(!showUserProfilePopover)}
              className="flex items-center gap-1.5 p-1 md:px-2 md:py-1 bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-800 rounded-xl text-white transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-lg bg-emerald-600 border border-emerald-300/40 flex items-center justify-center text-white font-black text-[10px]">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden xl:inline text-xs font-bold text-emerald-100 max-w-[100px] truncate">
                {currentUser?.name || (isRtl ? 'المستخدم' : 'User')}
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

          {/* Header Quick Menu (More Options) */}
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
