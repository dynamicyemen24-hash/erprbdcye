import './lib/apiConfig'; // Must be first — configures fetch wrapper for split deployment
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  Briefcase, 
  Users, 
  Coins, 
  Settings, 
  LayoutDashboard, 
  Building, 
  Globe, 
  User as UserIcon, 
  LogOut, 
  Bell,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Heart,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Compass,
  ShieldAlert,
  ShieldCheck,
  Database,
  Sun,
  Moon,
  BookOpen,
  PlayCircle,
  X,
  Target,
  Sparkles,
  CheckCircle2,
  Brain,
  Zap,
  Grid,
  Pin,
  PinOff,
  Activity,
  Menu,
  Calendar,
  Calculator,
  Command,
  Sliders,
  Keyboard,
  Box,
  Warehouse,
  FileCheck
} from 'lucide-react';

// Enterprise Domain Features & Shared Component Imports
import LoginView from './components/LoginView';
import NexoraTopProgressBar from './components/NexoraTopProgressBar';
import NexoraMicroProgress from './components/NexoraMicroProgress';
const DocumentationView = React.lazy(() => import('./components/DocumentationView'));
const OperationalScenariosView = React.lazy(() => import('./components/OperationalScenariosView'));

const AboutSystemModal = React.lazy(() => import('./components/AboutSystemModal'));
import UserProfilePopover from './components/UserProfilePopover';
const FloatingMobileFAB = React.lazy(() => import('./components/FloatingMobileFAB'));

// Lazy-loaded modal drawers to ensure zero impact on initial App Shell rendering
const ExportToolsModal = React.lazy(() => import('./components/ExportToolsModal'));
const HelperToolsPanel = React.lazy(() => import('./components/helpers/HelperToolsPanel'));
const BiometricSecurityGate = React.lazy(() => import('./components/BiometricSecurityGate'));
const NexoraAICopilotDrawer = React.lazy(() => import('./components/NexoraAICopilotDrawer'));
const AppMatrixLauncherModal = React.lazy(() => import('./components/AppMatrixLauncherModal'));
const UniversalCommandCenter = React.lazy(() => import('./components/UniversalCommandCenter'));
const CustomizableShortcutsModal = React.lazy(() => import('./components/shortcuts/CustomizableShortcutsManagerModal'));
const FastRecordRetrievalDrawer = React.lazy(() => import('./components/records/FastRecordRetrievalDrawer'));
const EnvironmentModeBanner = React.lazy(() => import('./components/EnvironmentModeBanner').then(m => ({ default: m.EnvironmentModeBanner })));

import { 
  EnterpriseLogo,
  NexoraOSLogo,
  EnterpriseMenuStrip,
  EnterpriseToolStrip,
  HeaderQuickMenu,
  NexoraBottomNav,
  SystemsDockPanel,
  UnifiedLeftSidebar,
  UnifiedContextRibbon,
  ERPSearchBar,
  NotificationCenter,
  SkeletonLoader,
  AutoDarkModeManager,
  MobileNavigationDrawer,
  GlobalEnterpriseHeader,
  GlobalOperationalFooter
} from './shared/components';
import { useNexoraData, useOrganizationBranding, performanceMonitor } from './core/hooks';
import { useSessionTimeout } from './core/security/useSessionTimeout';
import { SecureStorage } from './core/security/SecureStorage';
import { useTelemetry } from './core/hooks/useTelemetry';
import type { User } from './core/types/users';
import { useEnterprise } from './core/context/EnterpriseContext';
import { useEnvironmentMode } from './core/context/EnvironmentModeContext';
import { updateFavicon } from './core/utils/faviconUtils';
import { TabContentRenderer } from './app/components';
import { SuspenseFallback } from './components/common/SuspenseFallback';
import { STORAGE_KEYS, INTERVALS } from './lib/constants';
const ProjectStatusOverviewWidget = React.lazy(() => import('./components/ProjectStatusOverviewWidget'));
import { ActiveTab } from './core/types';
import { resumeIntelligenceService } from './core/services/resumeIntelligence';

export default function App() {
  const { isTrainingMode, environmentMode } = useEnvironmentMode();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [openTabs, setOpenTabs] = useState<ActiveTab[]>(['dashboard']);
  const [authenticatedModules, setAuthenticatedModules] = useState<ActiveTab[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('app-shell-render');
      try {
        performance.measure('app-startup-to-shell', 'app-start', 'app-shell-render');
        const measure = performance.getEntriesByName('app-startup-to-shell')[0];

      } catch (e) { console.error('[StartupPerf] Failed to measure app startup performance:', e); }
    }
  }, []);



  // Enterprise Feature: Telemetry
  useTelemetry('NexoraOS_AppRoot', true);
  const [pendingSecureTab, setPendingSecureTab] = useState<ActiveTab | null>(null);

  const [drillDownFilters, setDrillDownFilters] = useState<{
    programsStatus?: string;
    projectsStatus?: string;
    approvalsStatus?: 'all' | 'pending' | 'approved' | 'rejected';
    beneficiariesStatus?: string;
    beneficiariesCategory?: string;
  }>({});

  // Use Core Nexora Enterprise Data Hook
  const {
    programs,
    projects,
    users,
    roles,
    currencies,
    organizations,
    orgSettings,
    sysSettings,
    beneficiaries,
    sponsorships,
    activities,
    approvalRequests,
    serverStats,
    consolidatedKpis,
    loading,
    error,
    systemAlerts,
    refetchAllData: fetchAllData
  } = useNexoraData(lang);

  useEffect(() => {
    const handleRefresh = () => {
      fetchAllData();
    };
    window.addEventListener('nexora-refresh-data', handleRefresh);
    return () => window.removeEventListener('nexora-refresh-data', handleRefresh);
  }, [fetchAllData]);

  interface ToastNotification {
    id: string;
    message: string;
    type: 'delayed' | 'critical' | 'info' | 'anomaly';
    timestamp: string;
  }
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const lastAlertsRef = useRef<string[]>([]);
  const isInitialAlertsMount = useRef<boolean>(true);
  const langRef = useRef(lang);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Serialized representation to ensure useMemo identity stability
  const serializedAlerts = useMemo(() => {
    return systemAlerts ? systemAlerts.join('||') : '';
  }, [systemAlerts]);

  const memoizedSystemAlerts = useMemo(() => {
    return systemAlerts || [];
  }, [serializedAlerts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: 'critical' | 'delayed' | 'info' | 'anomaly' = 'info') => {
    const id = 'toast-' + crypto.randomUUID();
    const isCritical = type === 'critical' || message.toLowerCase().includes('critical') || message.includes('تعز');
    const toastType: ToastNotification['type'] = isCritical ? 'critical' : (type === 'info' ? 'delayed' : type);

    // Play alert tone
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        if (toastType === 'critical') {
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        } else {
          osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.12);
        }
      }
    } catch (e) {
      // ignore
    }

    const cleanMessage = message.replace('?', '').replace(/Status Change:|تغيير الحالة:/, '').trim();

    const newToast: ToastNotification = {
      id,
      message: cleanMessage,
      type: toastType,
      timestamp: new Date().toLocaleTimeString(langRef.current === 'ar' ? 'ar-YE' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after configured interval
    setTimeout(() => {
      removeToast(id);
    }, INTERVALS.TOAST_AUTO_DISMISS);
  }, [removeToast]);

  useEffect(() => {
    if (isInitialAlertsMount.current) {
      isInitialAlertsMount.current = false;
      lastAlertsRef.current = memoizedSystemAlerts;
      return;
    }

    if (!memoizedSystemAlerts || memoizedSystemAlerts.length === 0) {
      lastAlertsRef.current = [];
      return;
    }

    // Detect if there are any brand new status change alerts
    const newStatusChangeAlerts = memoizedSystemAlerts.filter(alert => 
      (alert.startsWith('?') || alert.includes('Status Change') || alert.includes('مسؤول النشاط')) &&
      !lastAlertsRef.current.includes(alert)
    );

    if (newStatusChangeAlerts.length > 0) {
      newStatusChangeAlerts.forEach(alertText => {
        const isCritical = alertText.toLowerCase().includes('critical') || alertText.includes('عرض');
        addToast(alertText, isCritical ? 'critical' : 'delayed');
      });
    }

    lastAlertsRef.current = memoizedSystemAlerts;
  }, [memoizedSystemAlerts, addToast]);

  useEffect(() => {
    const handleAddToast = (e: Event) => {
      const customEv = e as CustomEvent<{ message: string; type: 'critical' | 'delayed' | 'info' | 'anomaly' }>;
      if (customEv.detail && customEv.detail.message) {
        const { message, type = 'info' } = customEv.detail;
        addToast(message, type);
      }
    };
    window.addEventListener('nexora-add-toast', handleAddToast);
    return () => window.removeEventListener('nexora-add-toast', handleAddToast);
  }, [addToast]);

  const branding = useOrganizationBranding();

  // Dynamic Enterprise Branding CSS custom properties injection
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', branding.primaryColor);
      root.style.setProperty('--brand-accent', branding.accentColor);
      root.style.setProperty('--brand-dark-bg', branding.darkBg);
      root.style.setProperty('--brand-light-bg', branding.lightBg);
    } catch (e) {
      console.error('Failed to set CSS custom branding variables:', e);
    }
  }, [branding.primaryColor, branding.accentColor, branding.darkBg, branding.lightBg]);

  // Track page transitions & render loops using standard enterprise observability hooks
  useEffect(() => {
    const transactionName = `Tab Transition: ${activeTab}`;
    performanceMonitor.startTransaction(transactionName, 'page_load', { tab: activeTab });
    
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 180);

    const handle = requestAnimationFrame(() => {
      setTimeout(() => {
        performanceMonitor.endTransaction(transactionName);
      }, 50);
    });

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(handle);
    };
  }, [activeTab]);

  const handleSelectTab = useCallback((tab: ActiveTab) => {
    setIsNavigating(true);
    setDrillDownFilters({});
    setOpenTabs(prev => prev.includes(tab) ? prev : [...prev, tab]);
    setActiveTab(tab);
    
    // Resume Intelligence Tracking
    const tabNames: Record<string, { ar: string; en: string }> = {
      dashboard: { ar: 'اللوحة القيادية الاستراتيجية', en: 'Strategic Dashboard' },
      programs: { ar: 'البرامج التنموية', en: 'Development Programs' },
      projects: { ar: 'المشاريع الميدانية', en: 'Field Projects' },
      activities: { ar: 'الأنشطة والمهام الميدانية WBS', en: 'WBS Activities' },
      beneficiaries: { ar: 'سجل المستفيدين والخدمات', en: 'Beneficiaries Registry' },
      sponsorships: { ar: 'كفالات الأيتام والرعاية', en: 'Orphan Sponsorships' },
      finance: { ar: 'النظام المالي والحسابات IPSAS', en: 'Financial Ledger' },
      reports: { ar: 'التقارير ومؤشرات الأثر', en: 'Impact Reports' },
      users: { ar: 'الموارد البشرية والكادر', en: 'Human Resources' },
      contracts: { ar: 'العقود والمشتريات', en: 'Contracts & Procurement' },
      currencies: { ar: 'العملات وأسعار الصرف', en: 'Currencies & Rates' },
      settings: { ar: 'إعدادات النظام', en: 'System Settings' },
      geospatial: { ar: 'خريطة الأثر الجغرافي', en: 'Geospatial Map' }
    };
    const info = tabNames[tab] || { ar: tab, en: tab };
    resumeIntelligenceService.recordActivity({
      lastActiveTab: tab,
      viewTitleAr: info.ar,
      viewTitleEn: info.en
    });
  }, []);

  const handleDrillDown = useCallback((tab: ActiveTab, filters: typeof drillDownFilters) => {
    setIsNavigating(true);
    setDrillDownFilters(filters);
    setOpenTabs(prev => prev.includes(tab) ? prev : [...prev, tab]);
    setActiveTab(tab);
  }, []);

  const handleCloseTab = useCallback((tabToClose: ActiveTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenTabs(prev => {
      if (prev.length <= 1) return prev;
      const updated = prev.filter(t => t !== tabToClose);
      setActiveTab(currentActive => (currentActive === tabToClose ? updated[updated.length - 1] : currentActive));
      return updated;
    });
  }, []);

  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [globalToolStripSearch, setGlobalToolStripSearch] = useState('');
  const [showScenariosModal, setShowScenariosModal] = useState(false);
  const [showHelpersModal, setShowHelpersModal] = useState(false);
  const [showCopilotDrawer, setShowCopilotDrawer] = useState(false);
  const [showAppLauncherModal, setShowAppLauncherModal] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [showAboutSystemModal, setShowAboutSystemModal] = useState(false);
  const [showUserProfilePopover, setShowUserProfilePopover] = useState(false);
  const [layoutDensity, setLayoutDensity] = useState<'compact' | 'comfortable' | 'spacious'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DENSITY);
      if (saved === 'compact' || saved === 'comfortable' || saved === 'spacious') return saved;
    } catch (e) { console.error('[LayoutDensity] Failed to read layout density from localStorage:', e); }
    return 'comfortable';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DENSITY, layoutDensity);
      document.documentElement.setAttribute('data-density', layoutDensity);
    } catch (e) { console.error('[LayoutDensity] Failed to save layout density to localStorage:', e); }
  }, [layoutDensity]);

  const [isSystemsDockPinned, setIsSystemsDockPinned] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isRecordRetrievalOpen, setIsRecordRetrievalOpen] = useState<boolean>(false);
  
  // NexoraOS Context Controls
  const [activeRolePerspective, setActiveRolePerspective] = useState<'executive' | 'manager' | 'field'>('executive');
  const [organizationId, setOrganizationId] = useState<string>('hq');
  const [fiscalYear, setFiscalYear] = useState<string>('FY2026');

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+Shift+F for Record Finder, F1 for Docs, ?, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsRecordRetrievalOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandCenterOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsCommandCenterOpen(prev => !prev);
      } else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
      } else if (e.key === 'F1') {
        e.preventDefault();
        setShowDocsModal(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowDocsModal(false);
        setShowScenariosModal(false);
        setShowAppLauncherModal(false);
        setIsCommandCenterOpen(false);
        setIsShortcutsModalOpen(false);
        setIsRecordRetrievalOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // User Authentication State
  const enterprise = useEnterprise();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Validate token on mount — force login if token is missing/expired/invalid
  useEffect(() => {
    const validateSession = async () => {
      try {
        const token = localStorage.getItem('rbd_token');
        const saved = localStorage.getItem('rbd_user') || localStorage.getItem('roh_user');
        if (!saved || !token) {
          localStorage.removeItem('rbd_user');
          localStorage.removeItem('roh_user');
          localStorage.removeItem('rbd_token');
          localStorage.removeItem('rbd_refresh_token');
          setAuthChecked(true);
          return;
        }

        // Decode JWT to check expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token expired — try refresh
          const refreshToken = localStorage.getItem('rbd_refresh_token');
          if (refreshToken) {
            try {
              const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.token) {
                  localStorage.setItem('rbd_token', data.token);
                  const parsed = JSON.parse(saved);
                  if (parsed && (parsed.id || parsed.email)) {
                    setCurrentUser(parsed);
                    setAuthChecked(true);
                    return;
                  }
                }
              }
            } catch { /* refresh failed */ }
          }
          // Could not refresh — clear and force login
          localStorage.removeItem('rbd_user');
          localStorage.removeItem('roh_user');
          localStorage.removeItem('rbd_token');
          localStorage.removeItem('rbd_refresh_token');
          setAuthChecked(true);
          return;
        }

        // Token is valid — restore session
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.id || parsed.email)) {
          setCurrentUser(parsed);
        }
      } catch (e) {
        console.error('[Auth] Session validation failed:', e);
        localStorage.removeItem('rbd_user');
        localStorage.removeItem('roh_user');
        localStorage.removeItem('rbd_token');
        localStorage.removeItem('rbd_refresh_token');
      }
      setAuthChecked(true);
    };

    validateSession();
  }, []);

  // Keep EnterpriseContext currentUser synchronized and auto-authenticate modules
  useEffect(() => {
    if (currentUser) {
      enterprise.setCurrentUser(currentUser as any);
      setAuthenticatedModules(['finance', 'audit', 'settings', 'backup', 'control_panel']);
    }
  }, [currentUser]);

  // Enterprise Feature: Session Timeout Security
  const { isWarning: isSessionWarning, resetSession } = useSessionTimeout({
    timeoutMinutes: 30, // Auto-logout after 30 mins of inactivity
    isActive: !!currentUser,
    onTimeout: () => {
      setCurrentUser(null);
      setAuthenticatedModules([]);
      localStorage.removeItem('rbd_user');
      localStorage.removeItem('roh_user');
      localStorage.removeItem('rbd_token');
      localStorage.removeItem('rbd_refresh_token');
      alert(lang === 'ar' ? 'تم تسجيل الخروج تلقائياً لعدم النشاط (حماية أمنية).' : 'Automatically logged out due to inactivity (Security protection).');
    }
  });

  // Auto-refresh JWT access token before expiry using refresh token
  useEffect(() => {
    if (!currentUser) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      try {
        const token = localStorage.getItem('rbd_token');
        const refreshToken = localStorage.getItem('rbd_refresh_token');
        if (!token || !refreshToken) return;

        // Decode JWT payload (base64url)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (!payload.exp) return;

        const expiresInMs = (payload.exp * 1000) - Date.now();
        // Refresh when there are 30 minutes left (or immediately if already close)
        const refreshInMs = Math.max(expiresInMs - 30 * 60 * 1000, 0);

        refreshTimer = setTimeout(async () => {
          try {
            const res = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            const data = await res.json();
            if (res.ok && data.token) {
              localStorage.setItem('rbd_token', data.token);
              scheduleRefresh(); // schedule next refresh
            } else {
              // Refresh failed — force re-login
              setCurrentUser(null);
              setAuthenticatedModules([]);
              localStorage.removeItem('rbd_token');
              localStorage.removeItem('rbd_refresh_token');
            }
          } catch {
            // Network error — will retry on next interaction
          }
        }, refreshInMs);
      } catch {
        // Invalid token format — ignore
      }
    };

    scheduleRefresh();
    return () => { if (refreshTimer) clearTimeout(refreshTimer); };
  }, [currentUser]);

  // Connectivity state for PWA Service Worker offline caching strategy
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchAllData();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchAllData]);

  // Handle document direction and platform title
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    const currentOrg = enterprise.orgName || (lang === 'ar' ? 'المؤسسة المشتركة' : 'Subscriber Enterprise');
    document.title = `NexoraOS? | ${currentOrg}`;
  }, [lang, enterprise.orgName]);

  // Handle document theme mode
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) { console.error('[Theme] Failed to save theme to localStorage:', e); }
  }, [theme]);

  // Dynamic stats calculator
  const totalProgramBudget = useMemo(() => 
    programs.reduce((sum, p) => sum + parseFloat(p.budget || '0'), 0),
  [programs]);

  const totalBeneficiaries = useMemo(() => 
    programs.reduce((sum, p) => sum + (p.actual_beneficiaries || 0), 0) + projects.reduce((sum, p) => sum + (p.actual_beneficiaries || 0), 0),
  [programs, projects]);

  const totalTargetBeneficiaries = useMemo(() => 
    programs.reduce((sum, p) => sum + (p.target_beneficiaries || 0), 0) + projects.reduce((sum, p) => sum + (p.target_beneficiaries || 0), 0),
  [programs, projects]);

  const totalRecordsCount = useMemo(() => 
    programs.length + projects.length + beneficiaries.length + sponsorships.length + users.length + currencies.length,
  [programs.length, projects.length, beneficiaries.length, sponsorships.length, users.length, currencies.length]);

  // Synchronize organizations list from useNexoraData to the EnterpriseContext
  useEffect(() => {
    if (organizations && organizations.length > 0) {
      enterprise.setOrganizations(organizations);
    }
  }, [organizations]);

  // Synchronize document favicon based on the active organization's logo URL from context
  useEffect(() => {
    if (enterprise.logoUrl) {
      updateFavicon(enterprise.logoUrl);
    }
  }, [enterprise.logoUrl]);

  const activeOrg = useMemo(() => 
    enterprise.activeOrg || organizations.find(o => o.id === organizationId) || organizations[0],
  [enterprise.activeOrg, organizations, organizationId]);

  const orgName = enterprise.orgName;
  const licenseText = enterprise.licenseText;

  const dashboardStats = useMemo(() => ({
    counts: {
      organizations: organizations.length || 2,
      programs: programs.length,
      projects: projects.length,
      users: users.length,
      currencies: currencies.length,
      beneficiaries: serverStats?.counts?.beneficiaries || totalBeneficiaries || 418,
      sponsorships: serverStats?.counts?.sponsorships || totalTargetBeneficiaries || 595
    },
    financials: {
      totalProgramBudget: serverStats?.financials?.totalProgramBudget || totalProgramBudget
    },
    recentPrograms: programs.slice(0, 5),
    recentProjects: projects.slice(0, 5),
    consolidatedKpis: consolidatedKpis
  }), [organizations.length, programs, projects, users.length, currencies.length, serverStats, totalBeneficiaries, totalTargetBeneficiaries, totalProgramBudget, consolidatedKpis]);

  const TAB_CONFIG: Record<ActiveTab, { icon: any; title_ar: string; title_en: string; category_ar: string; category_en: string }> = {
    dashboard: { icon: LayoutDashboard, title_ar: 'لوحة القيادة الاستراتيجية', title_en: 'Strategy Dashboard', category_ar: 'الرئيسية', category_en: 'Core' },
    control_panel: { icon: Sliders, title_ar: 'لوحة التحكم والعمليات', title_en: 'Control Panel', category_ar: 'الإدارة', category_en: 'Admin' },
    domains: { icon: Compass, title_ar: 'الأنظمة المؤسسية', title_en: 'Enterprise Systems', category_ar: 'الأنظمة الـ13', category_en: 'Domains' },
    programs: { icon: Briefcase, title_ar: 'البرامج', title_en: 'Programs', category_ar: 'البرامج', category_en: 'Programs' },
    projects: { icon: Layers, title_ar: 'المشاريع', title_en: 'Projects', category_ar: 'المشاريع', category_en: 'Projects' },
    activities: { icon: Activity, title_ar: 'الأنشطة', title_en: 'Activities', category_ar: 'العمليات الميدانية', category_en: 'Operations' },
    beneficiaries: { icon: Users, title_ar: 'المستفيدون', title_en: 'Beneficiaries', category_ar: 'الخدمات', category_en: 'Services' },
    sponsorships: { icon: Heart, title_ar: 'الكفالات', title_en: 'Sponsorships', category_ar: 'الرعاية', category_en: 'Welfare' },
    finance: { icon: Coins, title_ar: 'المالية', title_en: 'Finance', category_ar: 'المالية والحوكمة', category_en: 'Finance' },
    approvals: { icon: ShieldCheck, title_ar: 'الموافقات', title_en: 'Approvals', category_ar: 'الاعتمادات', category_en: 'Approvals' },
    reports: { icon: TrendingUp, title_ar: 'التقارير', title_en: 'Reports', category_ar: 'مؤشرات الأثر', category_en: 'Impact' },
    users: { icon: UserIcon, title_ar: 'المستخدمون والكوادر', title_en: 'Users & Personnel', category_ar: 'الموارد والكادر', category_en: 'Resource OS' },
    inventory: { icon: Box, title_ar: 'إدارة المخزون الإغاثي', title_en: 'Inventory Management', category_ar: 'المخزون واللوجستيات', category_en: 'Logistics OS' },
    contracts: { icon: FileCheck, title_ar: 'إدارة عقود الموردين', title_en: 'Contract Management', category_ar: 'العقود والشراكات', category_en: 'Contract OS' },
    currencies: { icon: Coins, title_ar: 'العملات', title_en: 'Currencies', category_ar: 'العملات', category_en: 'Currencies' },
    settings: { icon: Settings, title_ar: 'الإعدادات', title_en: 'Settings', category_ar: 'الإعدادات', category_en: 'Settings' },
    audit: { icon: Database, title_ar: 'سجل التدقيق', title_en: 'Audit Logs', category_ar: 'الأمان', category_en: 'Security' },
    backup: { icon: Database, title_ar: 'النسخ الاحتياطي', title_en: 'Backup', category_ar: 'البيانات', category_en: 'Data' },
    docs: { icon: BookOpen, title_ar: 'الدليل', title_en: 'Docs', category_ar: 'الدليل', category_en: 'Docs' },
    scenarios: { icon: PlayCircle, title_ar: 'السيناريوهات', title_en: 'Scenarios', category_ar: 'السيناريوهات', category_en: 'Playbooks' },
    allocations: { icon: Calendar, title_ar: 'تخصيص الموارد', title_en: 'Resource Allocation', category_ar: 'الموارد', category_en: 'Resources' },
    geospatial: { icon: Globe, title_ar: 'الخريطة المكانية', title_en: 'Geospatial Map', category_ar: 'الخريطة التفاعلية', category_en: 'GIS Map' },
    strategic_planning: { icon: Target, title_ar: 'التخطيط الاستراتيجي', title_en: 'Strategic Planning', category_ar: 'التخطيط الاستراتيجي', category_en: 'Strategy' },
    investments: { icon: TrendingUp, title_ar: 'المشاريع الاستثمارية والأوقاف', title_en: 'Investment & Endowment OS', category_ar: 'الأوقاف والاستثمار', category_en: 'Investments' },
    hr_dashboard: { icon: Users, title_ar: 'لوحة إدارة الموارد البشرية', title_en: 'HR Management Dashboard', category_ar: 'الموارد البشرية', category_en: 'HR OS' },
    'third-party-network': { icon: ShieldCheck, title_ar: 'شبكة الأطراف ومطالبات التجار', title_en: 'Third-Party Network & Claims', category_ar: 'التزويد والمطالبات', category_en: 'Third-Party OS' },
    sales: { icon: Coins, title_ar: 'المبيعات والإيرادات وتنمية الموارد', title_en: 'Sales, Revenue & Fundraising OS', category_ar: 'تنمية الموارد', category_en: 'Fundraising' }
  };

  const dbConnected = !!serverStats;
  const pendingApprovalsCount = approvalRequests.filter(r => r.status === 'pending').length;

  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            {lang === 'ar' ? 'جاري التحقق من الجلسة...' : 'Validating session...'}
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        users={users as any}
        onLoginSuccess={(user) => {
          setCurrentUser(user as any);
          setAuthenticatedModules(['finance', 'audit', 'settings', 'backup', 'control_panel']);
          try {
            localStorage.setItem('rbd_user', JSON.stringify(user));
          } catch (e) { console.error('[Auth] Failed to save user to localStorage:', e); }
          fetchAllData(true);
        }}
        lang={lang}
        onLanguageToggle={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
        theme={theme === 'dark' ? 'dark' : 'light'}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen bg-slate-50 dark:bg-zinc-950 font-sans flex flex-col antialiased selection:bg-amber-100 selection:text-amber-900 text-slate-800 dark:text-zinc-100 transition-colors duration-200 overflow-hidden">
      
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        تخطي إلى المحتوى الرئيسي
      </a>

      {/* ULTRA-PROFESSIONAL GLOBAL PROGRESS BAR */}
      <NexoraTopProgressBar
        isLoading={loading}
        isNavigating={isNavigating}
        lang={lang}
        activeTabLabel={TAB_CONFIG[activeTab]?.[lang === 'ar' ? 'title_ar' : 'title_en']}
      />

      {/* MICRO E2E FETCH PROGRESS — precise real-network 2px indicator */}
      <NexoraMicroProgress />

      {/* LAYER 1: GLOBAL ENTERPRISE HEADER */}
      <GlobalEnterpriseHeader
        lang={lang}
        setLang={setLang}
        orgName={orgName}
        licenseText={licenseText}
        isOnline={isOnline}
        loading={loading}
        fetchAllData={fetchAllData}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setShowAppLauncherModal={setShowAppLauncherModal}
        setShowAboutSystemModal={setShowAboutSystemModal}
        setIsCommandCenterOpen={setIsCommandCenterOpen}
        beneficiaries={beneficiaries}
        projects={projects}
        users={users}
        approvalRequests={approvalRequests}
        handleSelectTab={(tab) => handleSelectTab(tab as ActiveTab)}
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser as any}
        setCurrentUser={setCurrentUser}
        layoutDensity={layoutDensity}
        setLayoutDensity={setLayoutDensity}
        setIsShortcutsModalOpen={setIsShortcutsModalOpen}
        setShowExportModal={setShowExportModal}
        setShowScenariosModal={setShowScenariosModal}
        setShowHelpersModal={setShowHelpersModal}
        setShowDocsModal={setShowDocsModal}
        isSystemsDockPinned={isSystemsDockPinned}
        setIsSystemsDockPinned={setIsSystemsDockPinned}
        setPendingSecureTab={setPendingSecureTab}
        onOpenCopilot={() => setShowCopilotDrawer(true)}
      />

      {/* LAYER 2: CONTEXT BREADCRUMB & UNIFIED RIBBON */}
      <UnifiedContextRibbon
        lang={lang}
        activeTab={activeTab}
        openTabs={openTabs}
        tabConfig={TAB_CONFIG}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onRefreshData={fetchAllData}
        isLoading={loading}
        searchQuery={globalToolStripSearch}
        onSearchChange={setGlobalToolStripSearch}
        onResetFilters={() => setGlobalToolStripSearch('')}
        onOpenExportModal={() => setShowExportModal(true)}
        onOpenCopilot={() => setShowCopilotDrawer(true)}
        organizationName={organizations.find(o => o.id === organizationId)?.[lang === 'ar' ? 'name_ar' : 'name_en']}
      />

      {/* LAYER 3: MAIN WORKSPACE + SIDE PANELS */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        
        {/* A. UNIFIED ENTERPRISE LEFT SIDEBAR */}
        <div className="hidden lg:block h-full">
          <UnifiedLeftSidebar
            lang={lang}
            activeTab={activeTab}
            onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
            isCollapsed={!isSystemsDockPinned}
            onToggleCollapse={() => setIsSystemsDockPinned(!isSystemsDockPinned)}
            onOpenCopilot={() => setShowCopilotDrawer(true)}
            onOpenDocs={() => setShowDocsModal(true)}
            onOpenScenarios={() => setShowScenariosModal(true)}
            onOpenHelpers={() => setShowHelpersModal(true)}
          />
        </div>

        {/* B. CENTER PRIMARY WORKSPACE */}
        <main id="main-content" className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-zinc-900/30 overflow-hidden relative">
          
          {/* Enterprise Session Timeout Warning */}
          {isSessionWarning && currentUser && (
            <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between shadow-md z-50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {lang === 'ar' ? 'تحذير: سيتم تسجيل الخروج قريباً لعدم النشاط' : 'Warning: Session expiring soon due to inactivity'}
                </span>
              </div>
              <button 
                onClick={resetSession}
                className="px-3 py-1 bg-amber-800 hover:bg-amber-900 rounded text-xs font-black transition-colors"
              >
                {lang === 'ar' ? 'متابعة العمل' : 'Keep Session Alive'}
              </button>
            </div>
          )}

          {/* Offline Read-Only Banner */}
          {!isOnline && (
            <div className="bg-rose-500/10 dark:bg-rose-500/5 border-b border-rose-500/20 px-4 py-2 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-xs">
                  <h4 className="font-bold text-rose-800 dark:text-rose-400">
                    {lang === 'ar' ? 'نمط التشغيل المستقل (عرض للقراءة فقط) 🛡️' : 'Offline Standby Mode (Read-Only) 🛡️'}
                  </h4>
                  <p className="text-rose-700/80 dark:text-rose-500/70 text-[10px]">
                    {lang === 'ar' 
                      ? 'تم التبديل تلقائياً للذاكرة المحلية المؤقتة. يمكنك استعراض كافة المشاريع والميزانيات بأمان.' 
                      : 'Switched to local snapshot cache. All operational modules remain readable.'}
                  </p>
                </div>
              </div>
              <div className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded text-[9px] font-black text-rose-700 dark:text-rose-400 shrink-0">
                {lang === 'ar' ? 'مستقل' : 'Standby'}
              </div>
            </div>
          )}

          {/* Training vs Production Environment Mode Banner */}
          <React.Suspense fallback={
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-pulse space-y-4 w-full max-w-md">
                <div className="h-4 bg-emerald-200/50 dark:bg-emerald-800/30 rounded w-3/4"></div>
                <div className="h-4 bg-emerald-200/30 dark:bg-emerald-800/20 rounded w-1/2"></div>
                <div className="h-4 bg-emerald-200/20 dark:bg-emerald-800/10 rounded w-2/3"></div>
              </div>
            </div>
          }>
            <div className="px-4 pt-3">
              <EnvironmentModeBanner lang={lang} variant="compact" showToggle={true} />
            </div>
          </React.Suspense>

          {/* Main Module Content View */}
          <div className={`flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar w-full ${
            layoutDensity === 'compact' ? 'p-2 md:p-3 pb-16 lg:pb-3' : layoutDensity === 'spacious' ? 'p-4 md:p-8 pb-24 lg:pb-8' : 'p-3 md:p-6 pb-20 lg:pb-6'
          }`}>
            {loading && projects.length === 0 && programs.length === 0 ? (
              <SkeletonLoader lang={lang} />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <React.Suspense fallback={
                    <div className="flex items-center justify-center min-h-[200px]">
                      <div className="animate-pulse space-y-4 w-full max-w-md">
                        <div className="h-4 bg-emerald-200/50 dark:bg-emerald-800/30 rounded w-3/4"></div>
                        <div className="h-4 bg-emerald-200/30 dark:bg-emerald-800/20 rounded w-1/2"></div>
                        <div className="h-4 bg-emerald-200/20 dark:bg-emerald-800/10 rounded w-2/3"></div>
                      </div>
                    </div>
                  }>
                    <ProjectStatusOverviewWidget 
                      projects={projects}
                      lang={lang}
                      onNavigate={(tab) => handleSelectTab(tab)}
                    />
                  </React.Suspense>
                )}
                <TabContentRenderer
                  activeTab={activeTab}
                  lang={lang}
                  loading={loading}
                  currentUser={currentUser as any}
                  dashboardStats={dashboardStats}
                  drillDownFilters={drillDownFilters}
                  programs={programs}
                  projects={projects}
                  users={users}
                  roles={roles}
                  currencies={currencies}
                  organizations={organizations}
                  orgSettings={orgSettings}
                  sysSettings={sysSettings}
                  beneficiaries={beneficiaries}
                  sponsorships={sponsorships}
                  approvalRequests={approvalRequests}
                  systemAlerts={systemAlerts}
                  serverStats={serverStats}
                  onNavigate={(tab) => handleSelectTab(tab)}
                  onDrillDown={(tab, filters) => handleDrillDown(tab, filters)}
                  onRefreshData={fetchAllData}
                  onOpenHelpers={() => setShowHelpersModal(true)}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* LAYER 5: GLOBAL OPERATIONAL FOOTER */}
      <GlobalOperationalFooter
        lang={lang}
        dbConnected={dbConnected}
        totalRecordsCount={totalRecordsCount}
        orgName={orgName}
      />

      {/* MODALS */}
      {showExportModal && (
        <React.Suspense fallback={<SuspenseFallback />}>
          <ExportToolsModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            titleAr={`تصدير بيانات ${TAB_CONFIG[activeTab]?.title_ar || 'التسليم'}`}
            titleEn={`Export ${TAB_CONFIG[activeTab]?.title_en || 'Records'} Data`}
            data={projects.length > 0 ? projects : programs}
            fileName={`NexoraOS_${activeTab}_Report`}
            lang={lang}
            tabName={activeTab}
          />
        </React.Suspense>
      )}

      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="h-14 px-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{lang === 'ar' ? 'دليل المستخدم الشامل' : 'Comprehensive User Manual'}</span>
                  </h3>
                </div>
              </div>
              <button onClick={() => setShowDocsModal(false)} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-900">
              <React.Suspense fallback={<div className="p-6 text-center text-slate-400">...</div>}>
                <DocumentationView lang={lang} onNavigate={(tab) => { setShowDocsModal(false); handleSelectTab(tab as ActiveTab); }} />
              </React.Suspense>
            </div>
          </div>
        </div>
      )}

      {showHelpersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="h-14 px-6 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <span>{lang === 'ar' ? 'أدوات ومقاييس الإغاثة الذكية' : 'Smart Relief & Engineering Calculators'}</span>
                  </h3>
                </div>
              </div>
              <button onClick={() => setShowHelpersModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30 dark:bg-zinc-950/20">
              <React.Suspense fallback={<div className="p-6 text-center text-slate-400">...</div>}>
                <HelperToolsPanel lang={lang} />
              </React.Suspense>
            </div>
          </div>
        </div>
      )}

      {showScenariosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="h-14 px-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{lang === 'ar' ? 'دليل السيناريوهات التشغيلية مع أدوار المستخدمين' : 'Operational Playbooks & Role Scenarios'}</span>
                  </h3>
                </div>
              </div>
              <button onClick={() => setShowScenariosModal(false)} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-900">
              <React.Suspense fallback={<div className="p-6 text-center text-slate-400">...</div>}>
                <OperationalScenariosView lang={lang} onNavigate={(tab) => { setShowScenariosModal(false); handleSelectTab(tab as ActiveTab); }} />
              </React.Suspense>
            </div>
          </div>
        </div>
      )}

      {pendingSecureTab && (
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-pulse space-y-4 w-full max-w-md">
              <div className="h-4 bg-emerald-200/50 dark:bg-emerald-800/30 rounded w-3/4"></div>
              <div className="h-4 bg-emerald-200/30 dark:bg-emerald-800/20 rounded w-1/2"></div>
              <div className="h-4 bg-emerald-200/20 dark:bg-emerald-800/10 rounded w-2/3"></div>
            </div>
          </div>
        }>
          <BiometricSecurityGate
            lang={lang}
            targetModule={pendingSecureTab as 'finance' | 'audit'}
            onSuccess={() => {
              const authorizedModule = pendingSecureTab;
              if (authorizedModule) {
                setAuthenticatedModules(prev => prev.includes(authorizedModule) ? prev : [...prev, authorizedModule]);
                setOpenTabs(prev => prev.includes(authorizedModule) ? prev : [...prev, authorizedModule]);
                setActiveTab(authorizedModule);
              }
              setPendingSecureTab(null);
            }}
            onCancel={() => {
              setPendingSecureTab(null);
            }}
          />
        </React.Suspense>
      )}

      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-4 bg-emerald-200/50 dark:bg-emerald-800/30 rounded w-3/4"></div>
            <div className="h-4 bg-emerald-200/30 dark:bg-emerald-800/20 rounded w-1/2"></div>
            <div className="h-4 bg-emerald-200/20 dark:bg-emerald-800/10 rounded w-2/3"></div>
          </div>
        </div>
      }>
        <NexoraAICopilotDrawer
          isOpen={showCopilotDrawer}
          onClose={() => setShowCopilotDrawer(false)}
          lang={lang}
          contextData={{
            programsCount: programs.length,
            projectsCount: projects.length,
            beneficiariesCount: beneficiaries.length,
            sponsorshipsCount: sponsorships.length,
            totalBudget: totalProgramBudget,
            pendingApprovals: pendingApprovalsCount,
            activeRole: activeRolePerspective,
            organization: organizationId,
            fiscalYear
          }}
        />
      </React.Suspense>

      <NexoraBottomNav
        activeTab={activeTab}
        onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
        lang={lang}
        onOpenCopilot={() => setShowCopilotDrawer(true)}
        onOpenDocs={() => setShowDocsModal(true)}
        onOpenLauncher={() => setShowAppLauncherModal(true)}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* 4. MOBILE DRAWER OVERLAY */}
      <MobileNavigationDrawer
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        lang={lang}
        orgName={orgName}
        activeRolePerspective={activeRolePerspective}
        setActiveRolePerspective={setActiveRolePerspective}
        activeTab={activeTab}
        onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
        setShowCopilotDrawer={setShowCopilotDrawer}
        setShowDocsModal={setShowDocsModal}
        setShowScenariosModal={setShowScenariosModal}
      />

      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-4 bg-emerald-200/50 dark:bg-emerald-800/30 rounded w-3/4"></div>
            <div className="h-4 bg-emerald-200/30 dark:bg-emerald-800/20 rounded w-1/2"></div>
            <div className="h-4 bg-emerald-200/20 dark:bg-emerald-800/10 rounded w-2/3"></div>
          </div>
        </div>
      }>
        <AppMatrixLauncherModal
          isOpen={showAppLauncherModal}
          onClose={() => setShowAppLauncherModal(false)}
          onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
          lang={lang}
          onOpenCopilot={() => { setShowAppLauncherModal(false); setShowCopilotDrawer(true); }}
          onOpenDocs={() => { setShowAppLauncherModal(false); setShowDocsModal(true); }}
          onOpenScenarios={() => { setShowAppLauncherModal(false); setShowScenariosModal(true); }}
          counts={{
            programs: programs.length,
            projects: projects.length,
            beneficiaries: beneficiaries.length,
            sponsorships: sponsorships.length,
            users: users.length,
            currencies: currencies.length,
            pendingApprovals: pendingApprovalsCount
          }}
        />
      </React.Suspense>

      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-4 bg-emerald-200/50 dark:bg-emerald-800/30 rounded w-3/4"></div>
            <div className="h-4 bg-emerald-200/30 dark:bg-emerald-800/20 rounded w-1/2"></div>
            <div className="h-4 bg-emerald-200/20 dark:bg-emerald-800/10 rounded w-2/3"></div>
          </div>
        </div>
      }>
        <UniversalCommandCenter 
          lang={lang}
          isOpen={isCommandCenterOpen}
          onClose={() => setIsCommandCenterOpen(false)}
          onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
          projects={projects}
          programs={programs}
          beneficiaries={beneficiaries}
          users={users}
          density={layoutDensity}
          setDensity={setLayoutDensity}
          theme={theme}
          setTheme={setTheme}
          setLang={setLang}
          onRefreshData={fetchAllData}
          onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        />
      </React.Suspense>

      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-4 bg-emerald-200/50 dark:bg-emerald-800/30 rounded w-3/4"></div>
            <div className="h-4 bg-emerald-200/30 dark:bg-emerald-800/20 rounded w-1/2"></div>
            <div className="h-4 bg-emerald-200/20 dark:bg-emerald-800/10 rounded w-2/3"></div>
          </div>
        </div>
      }>
        <CustomizableShortcutsModal 
          lang={lang}
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
        />
      </React.Suspense>

      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-4 bg-emerald-200/50 dark:bg-emerald-800/30 rounded w-3/4"></div>
            <div className="h-4 bg-emerald-200/30 dark:bg-emerald-800/20 rounded w-1/2"></div>
            <div className="h-4 bg-emerald-200/20 dark:bg-emerald-800/10 rounded w-2/3"></div>
          </div>
        </div>
      }>
        <FastRecordRetrievalDrawer 
          lang={lang}
          isOpen={isRecordRetrievalOpen}
          onClose={() => setIsRecordRetrievalOpen(false)}
          onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
          projects={projects}
          programs={programs}
          activities={activities}
        />
      </React.Suspense>

      <React.Suspense fallback={<SuspenseFallback />}>
        <AboutSystemModal
          isOpen={showAboutSystemModal}
          onClose={() => setShowAboutSystemModal(false)}
          lang={lang}
          currentUser={currentUser as any}
          isOnline={isOnline}
          onOpenDocs={() => setShowDocsModal(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        />
      </React.Suspense>

      <React.Suspense fallback={<SuspenseFallback />}>
        <FloatingMobileFAB onNavigate={handleSelectTab} />
      </React.Suspense>

      {/* Dynamic Toast System */}
      <div className={`fixed bottom-6 ${lang === 'ar' ? 'left-6' : 'right-6'} z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none`}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-full bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-start gap-3 p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  toast.type === 'critical' 
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400' 
                    : toast.type === 'anomaly'
                    ? 'bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400'
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}>
                  {toast.type === 'critical' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : toast.type === 'anomaly' ? (
                    <Activity className="w-5 h-5 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      toast.type === 'critical' 
                        ? 'text-rose-600 dark:text-rose-400' 
                        : toast.type === 'anomaly'
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {toast.type === 'critical' 
                        ? (lang === 'ar' ? 'مشروع غير مجدٍ' : 'CRITICAL ALERT') 
                        : toast.type === 'anomaly'
                        ? (lang === 'ar' ? 'اكتشاف شذوذ ذكي' : 'AI ANOMALY DETECTED')
                        : (lang === 'ar' ? 'نمذجة تنبؤية' : 'OPERATIONAL WARNING')}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                      {toast.timestamp}
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-800 dark:text-zinc-100 mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                </div>
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Animated Progress Timer Bar */}
              <div className="w-full h-1 bg-slate-100 dark:bg-zinc-900">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 6, ease: 'linear' }}
                  className={`h-full ${
                    toast.type === 'critical' ? 'bg-rose-500' : toast.type === 'anomaly' ? 'bg-violet-500' : 'bg-amber-500'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
