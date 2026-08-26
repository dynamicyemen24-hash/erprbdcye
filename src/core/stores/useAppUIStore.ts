/**
 * NexoraOS™ — Enterprise UI & Modals Store Hook
 * Manages theme, language, density, drawers, modals, and keyboard shortcut states
 */

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../../lib/constants';

export type AppLanguage = 'ar' | 'en';
export type AppTheme = 'light' | 'dark' | 'system';
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';
export type RolePerspective = 'executive' | 'manager' | 'field';

export function useAppUIStore() {
  const [lang, setLang] = useState<AppLanguage>('ar');
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });

  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DENSITY);
      if (saved === 'compact' || saved === 'comfortable' || saved === 'spacious') return saved;
    } catch (e) {
      console.error('[LayoutDensity] Failed to read density:', e);
    }
    return 'comfortable';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DENSITY, layoutDensity);
      document.documentElement.setAttribute('data-density', layoutDensity);
    } catch (e) {
      console.error('[LayoutDensity] Failed to save density:', e);
    }
  }, [layoutDensity]);

  // Modals & Drawers Visibility States
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showScenariosModal, setShowScenariosModal] = useState(false);
  const [showHelpersModal, setShowHelpersModal] = useState(false);
  const [showCopilotDrawer, setShowCopilotDrawer] = useState(false);
  const [showAppLauncherModal, setShowAppLauncherModal] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [showAboutSystemModal, setShowAboutSystemModal] = useState(false);
  const [showUserProfilePopover, setShowUserProfilePopover] = useState(false);
  const [isSystemsDockPinned, setIsSystemsDockPinned] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRecordRetrievalOpen, setIsRecordRetrievalOpen] = useState(false);
  const [globalToolStripSearch, setGlobalToolStripSearch] = useState('');

  // Context perspective controls
  const [activeRolePerspective, setActiveRolePerspective] = useState<RolePerspective>('executive');
  const [organizationId, setOrganizationId] = useState('hq');
  const [fiscalYear, setFiscalYear] = useState('FY2026');

  // Close all modals (e.g., on Escape key)
  const closeAllModals = useCallback(() => {
    setShowDocsModal(false);
    setShowExportModal(false);
    setShowScenariosModal(false);
    setShowHelpersModal(false);
    setShowCopilotDrawer(false);
    setShowAppLauncherModal(false);
    setIsCommandCenterOpen(false);
    setIsShortcutsModalOpen(false);
    setShowAboutSystemModal(false);
    setShowUserProfilePopover(false);
    setIsMobileMenuOpen(false);
    setIsRecordRetrievalOpen(false);
  }, []);

  return {
    lang,
    theme,
    layoutDensity,
    showDocsModal,
    showExportModal,
    showScenariosModal,
    showHelpersModal,
    showCopilotDrawer,
    showAppLauncherModal,
    isCommandCenterOpen,
    isShortcutsModalOpen,
    showAboutSystemModal,
    showUserProfilePopover,
    isSystemsDockPinned,
    isMobileMenuOpen,
    isRecordRetrievalOpen,
    globalToolStripSearch,
    activeRolePerspective,
    organizationId,
    fiscalYear,
    setLang,
    setTheme,
    setLayoutDensity,
    setShowDocsModal,
    setShowExportModal,
    setShowScenariosModal,
    setShowHelpersModal,
    setShowCopilotDrawer,
    setShowAppLauncherModal,
    setIsCommandCenterOpen,
    setIsShortcutsModalOpen,
    setShowAboutSystemModal,
    setShowUserProfilePopover,
    setIsSystemsDockPinned,
    setIsMobileMenuOpen,
    setIsRecordRetrievalOpen,
    setGlobalToolStripSearch,
    setActiveRolePerspective,
    setOrganizationId,
    setFiscalYear,
    closeAllModals,
  };
}
