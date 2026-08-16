import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { updateFavicon } from '../utils/faviconUtils';

export interface EnterpriseContextType {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  organizationId: string;
  setOrganizationId: (id: string) => void;
  selectedBranchCode: string;
  setSelectedBranchCode: (branch: string) => void;
  fiscalYear: string;
  setFiscalYear: (year: string) => void;
  activeRolePerspective: 'executive' | 'manager' | 'field';
  setActiveRolePerspective: (perspective: 'executive' | 'manager' | 'field') => void;
  securityClearanceLevel: 'L1_AUDITOR' | 'L2_FIELD' | 'L3_MANAGER' | 'L4_EXECUTIVE' | 'L5_ADMIN';
  setSecurityClearanceLevel: (level: 'L1_AUDITOR' | 'L2_FIELD' | 'L3_MANAGER' | 'L4_EXECUTIVE' | 'L5_ADMIN') => void;
  complianceStandards: string[];
  setComplianceStandards: (stds: string[]) => void;
  layoutDensity: 'compact' | 'comfortable' | 'spacious';
  setLayoutDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;
  isOnline: boolean;
  currentUser: { id: string; email: string; name: string; role: string } | null;
  setCurrentUser: (user: { id: string; email: string; name: string; role: string } | null) => void;

  // Dynamic Organization Identity Properties
  organizations: any[];
  setOrganizations: (orgs: any[]) => void;
  activeOrg: any | null;
  orgName: string;
  organizationName: string;
  logoUrl: string;
  licenseText: string;
  brandingColors: {
    primary: string;
    accent: string;
    darkBg: string;
    lightBg: string;
  };
  loadingOrganizations: boolean;
  refetchOrganizations: () => Promise<void>;
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

export const EnterpriseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('rbd_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });

  const [organizationId, setOrganizationId] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('HQ');
  const [fiscalYear, setFiscalYear] = useState<string>('FY2026');
  const [activeRolePerspective, setActiveRolePerspective] = useState<'executive' | 'manager' | 'field'>('executive');
  const [securityClearanceLevel, setSecurityClearanceLevel] = useState<'L1_AUDITOR' | 'L2_FIELD' | 'L3_MANAGER' | 'L4_EXECUTIVE' | 'L5_ADMIN'>('L5_ADMIN');
  const [complianceStandards, setComplianceStandards] = useState<string[]>(['IPSAS', 'IATI', 'Sphere', 'CHS', 'ISO27001']);
  
  const [layoutDensity, setLayoutDensity] = useState<'compact' | 'comfortable' | 'spacious'>(() => {
    try {
      const saved = localStorage.getItem('rbd_density');
      if (saved === 'compact' || saved === 'comfortable' || saved === 'spacious') return saved;
    } catch (e) {}
    return 'comfortable';
  });

  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(() => {
    try {
      const saved = localStorage.getItem('rbd_user') || localStorage.getItem('roh_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState<boolean>(false);

  const fetchOrganizations = async () => {
    try {
      setLoadingOrganizations(true);
      const res = await fetch('/api/tables/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
      }
    } catch (e) {
      console.warn("Failed to fetch organizations in EnterpriseContext:", e);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const activeOrg = useMemo(() => {
    return organizations.find(o => o.id === organizationId) || organizations[0] || null;
  }, [organizations, organizationId]);

  const orgName = useMemo(() => {
    if (!activeOrg) {
      try {
        const saved = localStorage.getItem('rbd_org_name');
        if (saved && saved.trim() !== '') return saved;
      } catch (e) {}
      return lang === 'ar' ? 'المؤسسة المرخصة (Subscriber Organization)' : 'Licensed Tenant Organization';
    }
    return lang === 'ar' ? activeOrg.name_ar : activeOrg.name_en;
  }, [activeOrg, lang]);

  const logoUrl = useMemo(() => {
    return activeOrg?.logo_url || '/LogoRohamaab.png';
  }, [activeOrg]);

  const licenseText = useMemo(() => {
    if (!activeOrg?.license_number) {
      return lang === 'ar' ? 'ترخيص رقم: 1042/م' : 'Lic: 1042/M';
    }
    return `${lang === 'ar' ? 'ترخيص رقم:' : 'Lic:'} ${activeOrg.license_number}`;
  }, [activeOrg, lang]);

  const brandingColors = useMemo(() => {
    const fallbackColors = {
      primary: '#059669', // Emerald Green
      accent: '#d97706',  // Accent Gold/Amber
      darkBg: '#090d16',  // Dark Mode Background
      lightBg: '#f8fafc', // Light Mode Background
    };

    if (!activeOrg) return fallbackColors;

    let settingsObj: any = {};
    if (activeOrg.settings) {
      if (typeof activeOrg.settings === 'string') {
        try {
          settingsObj = JSON.parse(activeOrg.settings);
        } catch (e) {
          console.warn("Failed to parse organization settings JSON string", e);
        }
      } else if (typeof activeOrg.settings === 'object') {
        settingsObj = activeOrg.settings;
      }
    }

    return {
      primary: settingsObj?.primary_color || settingsObj?.brand_primary_color || fallbackColors.primary,
      accent: settingsObj?.accent_color || settingsObj?.brand_accent_color || fallbackColors.accent,
      darkBg: settingsObj?.dark_bg || settingsObj?.brand_dark_bg || fallbackColors.darkBg,
      lightBg: settingsObj?.light_bg || settingsObj?.brand_light_bg || fallbackColors.lightBg,
    };
  }, [activeOrg]);

  useEffect(() => {
    try {
      localStorage.setItem('rbd_density', layoutDensity);
      document.documentElement.setAttribute('data-density', layoutDensity);
    } catch (e) {}
  }, [layoutDensity]);

  useEffect(() => {
    try {
      localStorage.setItem('rbd_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('rbd_logo_url', logoUrl);
      localStorage.setItem('rbd_org_name', orgName);
      updateFavicon(logoUrl);
    } catch (e) {}
  }, [logoUrl, orgName]);

  useEffect(() => {
    if (brandingColors) {
      document.documentElement.style.setProperty('--color-primary', brandingColors.primary);
      document.documentElement.style.setProperty('--color-accent', brandingColors.accent);
      // Fallbacks to standard tailwind class variables
      document.documentElement.style.setProperty('--color-emerald-600', brandingColors.primary);
      document.documentElement.style.setProperty('--color-emerald-500', brandingColors.primary);
      document.documentElement.style.setProperty('--color-amber-500', brandingColors.accent);
    }
  }, [brandingColors]);

  const contextValue = useMemo(() => ({
    lang,
    setLang,
    theme,
    setTheme,
    organizationId,
    setOrganizationId,
    selectedBranchCode,
    setSelectedBranchCode,
    fiscalYear,
    setFiscalYear,
    activeRolePerspective,
    setActiveRolePerspective,
    securityClearanceLevel,
    setSecurityClearanceLevel,
    complianceStandards,
    setComplianceStandards,
    layoutDensity,
    setLayoutDensity,
    isOnline,
    currentUser,
    setCurrentUser,
    organizations,
    setOrganizations,
    activeOrg,
    orgName,
    organizationName: orgName,
    logoUrl,
    licenseText,
    brandingColors,
    loadingOrganizations,
    refetchOrganizations: fetchOrganizations
  }), [
    lang, setLang, theme, setTheme, organizationId, setOrganizationId,
    selectedBranchCode, setSelectedBranchCode, fiscalYear, setFiscalYear,
    activeRolePerspective, setActiveRolePerspective, securityClearanceLevel, setSecurityClearanceLevel,
    complianceStandards, setComplianceStandards, layoutDensity, setLayoutDensity,
    isOnline, currentUser, setCurrentUser, organizations, setOrganizations,
    activeOrg, orgName, logoUrl, licenseText, brandingColors, loadingOrganizations, fetchOrganizations
  ]);

  return (
    <EnterpriseContext.Provider value={contextValue}>
      {children}
    </EnterpriseContext.Provider>
  );
};

export const useEnterprise = () => {
  const context = useContext(EnterpriseContext);
  if (!context) {
    throw new Error('useEnterprise must be used within an EnterpriseProvider');
  }
  return context;
};
