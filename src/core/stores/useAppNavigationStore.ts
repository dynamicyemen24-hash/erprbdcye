/**
 * NexoraOS™ — Enterprise Navigation Store Hook
 * Manages active tabs, tab stacks, drill-down filters, and navigation transitions
 */

import { useState, useCallback } from 'react';
import { ActiveTab } from '../types';
import { resumeIntelligenceService } from '../services/resumeIntelligence';

export interface DrillDownFilters {
  programsStatus?: string;
  projectsStatus?: string;
  approvalsStatus?: 'all' | 'pending' | 'approved' | 'rejected';
  beneficiariesStatus?: string;
  beneficiariesCategory?: string;
  [key: string]: any;
}

export function useAppNavigationStore() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [openTabs, setOpenTabs] = useState<ActiveTab[]>(['dashboard']);
  const [authenticatedModules, setAuthenticatedModules] = useState<ActiveTab[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingSecureTab, setPendingSecureTab] = useState<ActiveTab | null>(null);
  const [drillDownFilters, setDrillDownFilters] = useState<DrillDownFilters>({});

  const handleSelectTab = useCallback((tab: ActiveTab) => {
    setIsNavigating(true);
    setDrillDownFilters({});
    setOpenTabs(prev => (prev.includes(tab) ? prev : [...prev, tab]));
    setActiveTab(tab);

    // Record activity telemetry
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
      geospatial: { ar: 'خريطة الأثر الجغرافي', en: 'Geospatial Map' },
    };
    const info = tabNames[tab] || { ar: tab, en: tab };
    resumeIntelligenceService.recordActivity({
      lastActiveTab: tab,
      viewTitleAr: info.ar,
      viewTitleEn: info.en,
    });
  }, []);

  const handleDrillDown = useCallback((tab: ActiveTab, filters: DrillDownFilters) => {
    setIsNavigating(true);
    setDrillDownFilters(filters);
    setOpenTabs(prev => (prev.includes(tab) ? prev : [...prev, tab]));
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

  return {
    activeTab,
    openTabs,
    authenticatedModules,
    isNavigating,
    pendingSecureTab,
    drillDownFilters,
    setActiveTab,
    setOpenTabs,
    setAuthenticatedModules,
    setIsNavigating,
    setPendingSecureTab,
    setDrillDownFilters,
    handleSelectTab,
    handleDrillDown,
    handleCloseTab,
  };
}
