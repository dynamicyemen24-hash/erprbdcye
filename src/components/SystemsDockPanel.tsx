import React, { useState, useMemo } from 'react';
import { 
  Grid, Pin, PinOff, Search, ChevronRight, ChevronLeft, 
  Layers, Briefcase, Compass, Users, Heart, Brain, Coins, 
  ShieldCheck, Settings, Database, Activity, Sliders,
  Maximize2, Minimize2, CheckCircle2, X, Calendar, Globe,
  BookOpen, PlayCircle, TrendingUp, Sparkles, Filter, ChevronDown,
  FileCheck, Building2, Calculator
} from 'lucide-react';
import { useEnterprise } from '../core/context/EnterpriseContext';

export type ActiveTab = 
  | 'dashboard' | 'control_panel' | 'domains' | 'programs' | 'projects' | 'activities' 
  | 'beneficiaries' | 'sponsorships' | 'reports' | 'finance' | 'currencies' | 'inventory' | 'contracts' 
  | 'users' | 'approvals' | 'audit' | 'settings' | 'backup' | 'scenarios' | 'docs' | 'allocations' | 'geospatial' | 'strategic_planning' | 'investments' | 'hr_dashboard' | 'third-party-network';

interface SystemsDockPanelProps {
  lang: 'ar' | 'en';
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  isDockPinned: boolean;
  onToggleDockPin: () => void;
  isMobileMode?: boolean;
  onOpenCopilot?: () => void;
  onOpenDocs?: () => void;
  onOpenScenarios?: () => void;
  onOpenHelpers?: () => void;
}

export interface SystemItem {
  id: string;
  tab: ActiveTab;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  suiteId: 'strategy' | 'ops' | 'services' | 'finance' | 'governance';
  suiteAr: string;
  suiteEn: string;
  icon: any;
  statusAr: string;
  statusEn: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
}

export const SystemsDockPanel: React.FC<SystemsDockPanelProps> = ({
  lang,
  activeTab,
  onNavigate,
  isDockPinned,
  onToggleDockPin,
  isMobileMode = false,
  onOpenCopilot,
  onOpenDocs,
  onOpenScenarios,
  onOpenHelpers
}) => {
  const isRtl = lang === 'ar';
  const { activeRolePerspective } = useEnterprise();

  const allowedTabsByPerspective = useMemo(() => {
    switch (activeRolePerspective) {
      case 'executive':
        return [
          'strategic_planning', 'dashboard', 'domains', 'programs',
          'investments', 'finance', 'currencies', 'reports',
          'approvals', 'docs', 'scenarios', 'hr_dashboard'
        ];
      case 'manager':
        return [
          'programs', 'projects', 'activities', 'investments', 'finance',
          'currencies', 'contracts', 'approvals', 'users', 'control_panel',
          'settings', 'audit', 'backup', 'docs', 'scenarios', 'hr_dashboard'
        ];
      case 'field':
        return [
          'projects', 'activities', 'geospatial', 'allocations',
          'beneficiaries', 'sponsorships', 'docs', 'scenarios'
        ];
      default:
        return [];
    }
  }, [activeRolePerspective]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuite, setSelectedSuite] = useState<string>('all');
  const [collapsedSuites, setCollapsedSuites] = useState<Record<string, boolean>>({});

  const isCompact = isMobileMode ? false : !isDockPinned;

  // 13 NexoraOS Enterprise Systems - Clean Standard Business Names (No NEB Codes!)
  const allSystems: SystemItem[] = useMemo(() => [
    // 1. Strategy & Planning Suite
    {
      id: 'sys-strategic-plan',
      tab: 'strategic_planning',
      titleAr: 'Ø§Ù„ØªØ®Ø·ÙŠØ· Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠ Ø§Ù„Ø®Ù…Ø§Ø³ÙŠ',
      titleEn: 'Strategic Planning & SWOT',
      descAr: 'Ø§Ù„Ø£Ù‡Ø¯Ø§Ù Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ© ÙˆÙ…Ø¤Ø´Ø±Ø§Øª Ø§Ù„Ø£Ø¯Ø§Ø¡ ÙˆØ§Ù„Ø®Ø·Ø© Ø§Ù„Ø®Ù…Ø³ÙŠØ©',
      descEn: '5-Year Strategic Goals, SWOT Matrix & Database Integration',
      suiteId: 'strategy',
      suiteAr: 'Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ© ÙˆØ§Ù„ØªØ®Ø·ÙŠØ·',
      suiteEn: 'Strategy & Planning',
      icon: Activity,
      statusAr: 'Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠ',
      statusEn: 'Strategic',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-strategy',
      tab: 'dashboard',
      titleAr: 'Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ© ÙˆØ§Ù„Ø£Ø¯Ø§Ø¡ Ø§Ù„Ù…Ø¤Ø³Ø³ÙŠ',
      titleEn: 'Strategy & Performance',
      descAr: 'Ù…Ø¤Ø´Ø±Ø§Øª Ø§Ù„Ø£Ø¯Ø§Ø¡ Ø§Ù„Ø£Ù‡Ø¯Ø§Ù Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ©',
      descEn: 'Strategic KPIs & Balanced Scorecards',
      suiteId: 'strategy',
      suiteAr: 'Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ© ÙˆØ§Ù„ØªØ®Ø·ÙŠØ·',
      suiteEn: 'Strategy & Planning',
      icon: Activity,
      statusAr: 'Ù‚ÙŠØ§Ø¯ÙŠ',
      statusEn: 'Executive',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-domains',
      tab: 'domains',
      titleAr: 'Ø§Ù„Ù…Ø­Ø§ÙØ¸ ÙˆØ§Ù„Ø£Ù†Ø¸Ù…Ø©',
      titleEn: 'Portfolios & Domains',
      descAr: 'Ø¥Ø´Ø±Ø§Ù Ø§Ù„Ù…Ø­Ø§ÙØ¸ Ø§Ù„ØªÙ†Ù…ÙˆÙŠØ© ÙˆØ§Ù„Ù‚Ø·Ø§Ø¹Ø§Øª',
      descEn: 'Development Portfolios Overview',
      suiteId: 'strategy',
      suiteAr: 'Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ© ÙˆØ§Ù„ØªØ®Ø·ÙŠØ·',
      suiteEn: 'Strategy & Planning',
      icon: Compass,
      statusAr: 'Ù…Ø¨Ø§Ø´Ø±',
      statusEn: 'Active',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    },
    {
      id: 'sys-programs',
      tab: 'programs',
      titleAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„ØªÙ†Ù…ÙˆÙŠØ©',
      titleEn: 'Program Management',
      descAr: 'Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„ØªÙ†Ù…ÙˆÙŠØ© ÙˆØ§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ§Øª Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø©',
      descEn: 'Programs & Strategic Initiatives',
      suiteId: 'strategy',
      suiteAr: 'Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ© ÙˆØ§Ù„ØªØ®Ø·ÙŠØ·',
      suiteEn: 'Strategy & Planning',
      icon: Briefcase,
      statusAr: 'Ù…Ø¹ØªÙ…Ø¯',
      statusEn: 'Approved',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },

    // 2. Operations & Field Execution Suite
    {
      id: 'sys-projects',
      tab: 'projects',
      titleAr: 'Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ©',
      titleEn: 'Field Project Operations',
      descAr: 'Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ÙˆÙ†Ø³Ø¨ Ø§Ù„Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„ÙØ¹Ù„ÙŠ',
      descEn: 'Field Projects & Milestones',
      suiteId: 'ops',
      suiteAr: 'Ø§Ù„ØªØ´ØºÙŠÙ„ ÙˆØ§Ù„Ù…ÙŠØ¯Ø§Ù†',
      suiteEn: 'Operations & Field',
      icon: Layers,
      statusAr: 'Ù…ÙŠØ¯Ø§Ù†ÙŠ',
      statusEn: 'Field',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-activities',
      tab: 'activities',
      titleAr: 'Ù‡ÙŠÙƒÙ„ WBS ÙˆØ§Ù„Ø£Ù†Ø´Ø·Ø© Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠØ©',
      titleEn: 'WBS Activities & M&E',
      descAr: 'Ø¬Ø¯ÙˆÙ„Ø© Ø§Ù„Ø£Ù†Ø´Ø·Ø© ÙˆØ§Ù„Ù…Ø®Ø±Ø¬Ø§Øª Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ©',
      descEn: 'Work Breakdown & Outputs',
      suiteId: 'ops',
      suiteAr: 'Ø§Ù„ØªØ´ØºÙŠÙ„ ÙˆØ§Ù„Ù…ÙŠØ¯Ø§Ù†',
      suiteEn: 'Operations & Field',
      icon: CheckCircle2,
      statusAr: 'ØªØ´ØºÙŠÙ„ÙŠ',
      statusEn: 'Operational',
      accentColor: 'cyan',
      badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      badgeText: 'text-cyan-700 dark:text-cyan-400 border-cyan-500/20'
    },
    {
      id: 'sys-geospatial',
      tab: 'geospatial',
      titleAr: 'Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ù…ÙƒØ§Ù†ÙŠØ© GIS ÙˆØ¨Ø¤Ø± Ø§Ù„ÙƒØ«Ø§ÙØ©',
      titleEn: 'Geospatial GIS Field Map',
      descAr: 'Ø§Ù„Ø±Ø¨Ø· Ø§Ù„Ø¬ØºØ±Ø§ÙÙŠ ÙˆØ¨Ø¤Ø± Ø§Ù„Ø§Ø­ØªÙŠØ§Ø¬ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠ',
      descEn: 'Spatial Heatmaps & Geotagging',
      suiteId: 'ops',
      suiteAr: 'Ø§Ù„ØªØ´ØºÙŠÙ„ ÙˆØ§Ù„Ù…ÙŠØ¯Ø§Ù†',
      suiteEn: 'Operations & Field',
      icon: Globe,
      statusAr: 'Ù…ÙƒØ§Ù†ÙŠØ© GIS',
      statusEn: 'GIS Spatial',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-allocations',
      tab: 'allocations',
      titleAr: 'ØªØ®ØµÙŠØµ Ø§Ù„ÙƒÙˆØ§Ø¯Ø± ÙˆØ§Ù„Ù…ÙˆØ§Ø±Ø¯',
      titleEn: 'Staff & Resource Allocation',
      descAr: 'ØªÙˆØ²ÙŠØ¹ Ø§Ù„ÙƒÙˆØ§Ø¯Ø± Ø§Ù„ÙÙ†ÙŠØ© Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†',
      descEn: 'Resource Planning & Workload',
      suiteId: 'ops',
      suiteAr: 'Ø§Ù„ØªØ´ØºÙŠÙ„ ÙˆØ§Ù„Ù…ÙŠØ¯Ø§Ù†',
      suiteEn: 'Operations & Field',
      icon: Calendar,
      statusAr: 'Ù…ÙˆØ§Ø±Ø¯',
      statusEn: 'Resources',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    },

    // 3. Social Services & Welfare Suite
    {
      id: 'sys-beneficiaries',
      tab: 'beneficiaries',
      titleAr: 'Ø³Ø¬Ù„ Ø§Ù„Ù…Ø³ØªÙÙŠØ¯ÙŠÙ† ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª',
      titleEn: 'Beneficiaries & Services',
      descAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªÙÙŠØ¯ÙŠÙ† ÙˆØ§Ù„Ù…Ø³ÙˆØ­Ø§Øª Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ©',
      descEn: 'Beneficiary Registry & Service Log',
      suiteId: 'services',
      suiteAr: 'Ø§Ù„Ø®Ø¯Ù…Ø§Øª ÙˆØ§Ù„Ø±Ø¹Ø§ÙŠØ©',
      suiteEn: 'Services & Welfare',
      icon: Users,
      statusAr: 'Ø®Ø¯Ù…ÙŠ',
      statusEn: 'Service',
      accentColor: 'blue',
      badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      badgeText: 'text-blue-700 dark:text-blue-400 border-blue-500/20'
    },
    {
      id: 'sys-sponsorships',
      tab: 'sponsorships',
      titleAr: 'ÙƒÙØ§Ù„Ø§Øª Ø§Ù„Ø£ÙŠØªØ§Ù… ÙˆØ§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØ©',
      titleEn: 'Orphan Care & Sponsorships',
      descAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ÙƒÙØ§Ù„Ø§Øª ÙˆØ§Ù„Ø£Ø³Ø± Ø§Ù„Ù…ØªØ¹ÙÙØ©',
      descEn: 'Orphan Care & Social Welfare',
      suiteId: 'services',
      suiteAr: 'Ø§Ù„Ø®Ø¯Ù…Ø§Øª ÙˆØ§Ù„Ø±Ø¹Ø§ÙŠØ©',
      suiteEn: 'Services & Welfare',
      icon: Heart,
      statusAr: 'Ø±Ø¹Ø§ÙŠØ©',
      statusEn: 'Welfare',
      accentColor: 'rose',
      badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
      badgeText: 'text-rose-700 dark:text-rose-400 border-rose-500/20'
    },

    // 4. Finance, Assets & Impact Analytics Suite
    {
      id: 'sys-investments',
      tab: 'investments',
      titleAr: 'Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø±ÙŠØ© ÙˆØ§Ù„Ø£ÙˆÙ‚Ø§Ù Ø§Ù„ØªÙ†Ù…ÙˆÙŠØ©',
      titleEn: 'Investment & Endowment OS',
      descAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£ÙˆÙ‚Ø§Ù Ø§Ù„ØªÙ†Ù…ÙˆÙŠØ©ØŒ Ø¹ÙˆØ§Ø¦Ø¯ Ø§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø±ØŒ ÙˆÙ…Ø¤Ø´Ø±Ø§Øª ROI/IRR',
      descEn: 'Endowment Investments, Yield Distribution & RBAC Controls',
      suiteId: 'finance',
      suiteAr: 'Ø§Ù„Ù…Ø§Ù„ÙŠØ© ÙˆØ§Ù„Ø£Ø«Ø±',
      suiteEn: 'Finance & Impact',
      icon: TrendingUp,
      statusAr: 'Ø£ÙˆÙ‚Ø§Ù ÙˆØ§Ø³ØªØ«Ù…Ø§Ø±',
      statusEn: 'Endowment',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    },
    {
      id: 'sys-finance',
      tab: 'finance',
      titleAr: 'Ø§Ù„Ù…Ø§Ù„ÙŠØ© ÙˆØ¯ÙØªØ± Ø§Ù„Ø£Ø³ØªØ§Ø° IPSAS',
      titleEn: 'IPSAS Finance & Ledger',
      descAr: 'Ø§Ù„Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© IPSAS ÙˆØ´Ø¬Ø±Ø© Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª',
      descEn: 'IPSAS Accounting & Ledger',
      suiteId: 'finance',
      suiteAr: 'Ø§Ù„Ù…Ø§Ù„ÙŠØ© ÙˆØ§Ù„Ø£Ø«Ø±',
      suiteEn: 'Finance & Impact',
      icon: Coins,
      statusAr: 'Ù…Ø§Ù„ÙŠØ© IPSAS',
      statusEn: 'IPSAS',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-currencies',
      tab: 'currencies',
      titleAr: 'Ø§Ù„Ø¹Ù…Ù„Ø§Øª ÙˆØ£Ø³Ø¹Ø§Ø± Ø§Ù„ØµØ±Ù',
      titleEn: 'Currencies & Exchange Rates',
      descAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¹Ù…Ù„Ø§Øª ÙˆØ§Ù„ØªØ­ÙˆÙŠÙ„Ø§Øª Ø§Ù„Ù…Ø§Ù„ÙŠØ©',
      descEn: 'Multi-currency & FX Rates',
      suiteId: 'finance',
      suiteAr: 'Ø§Ù„Ù…Ø§Ù„ÙŠØ© ÙˆØ§Ù„Ø£Ø«Ø±',
      suiteEn: 'Finance & Impact',
      icon: Coins,
      statusAr: 'Ø¹Ù…Ù„Ø§Øª',
      statusEn: 'Forex',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    },
    {
      id: 'sys-contracts',
      tab: 'contracts',
      titleAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø¹Ù‚ÙˆØ¯ Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ† ÙˆØ§Ù„Ø§Ù„ØªØ²Ø§Ù…Ø§Øª',
      titleEn: 'Contract & Vendor Obligations OS',
      descAr: 'Ø¹Ù‚ÙˆØ¯ Ø§Ù„ØªÙˆØ±ÙŠØ¯ ÙˆØ§Ù„Ù…Ù‚Ø§ÙˆÙ„Ø§Øª ÙˆØ±Ø§Ø¯Ø§Ø± Ø§Ù„ØªØ¬Ø¯ÙŠØ¯ ÙˆØ§Ù„ØªØ³Ø¯ÙŠØ¯',
      descEn: 'Procurement contracts, renewals & payment milestones',
      suiteId: 'finance',
      suiteAr: 'Ø§Ù„Ù…Ø§Ù„ÙŠØ© ÙˆØ§Ù„Ø£Ø«Ø±',
      suiteEn: 'Finance & Impact',
      icon: FileCheck,
      statusAr: 'Ø§Ù„Ø¹Ù‚ÙˆØ¯ ÙˆØ§Ù„Ø´Ø±Ø§ÙƒØ§Øª',
      statusEn: 'Contracts',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-reports',
      tab: 'reports',
      titleAr: 'Ù…Ø¤Ø´Ø±Ø§Øª Ø§Ù„Ø£Ø«Ø± ÙˆØ§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ',
      titleEn: 'AI Impact & Analytics',
      descAr: 'Ù…Ø¹Ø§ÙŠÙŠØ± Sphere / CHS ÙˆØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ø£Ø«Ø±',
      descEn: 'Sphere & CHS Standards Analytics',
      suiteId: 'finance',
      suiteAr: 'Ø§Ù„Ù…Ø§Ù„ÙŠØ© ÙˆØ§Ù„Ø£Ø«Ø±',
      suiteEn: 'Finance & Impact',
      icon: Brain,
      statusAr: 'Ø°ÙƒØ§Ø¡ Ø£Ø«Ø±',
      statusEn: 'AI Analytics',
      accentColor: 'purple',
      badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20',
      badgeText: 'text-purple-700 dark:text-purple-400 border-purple-500/20'
    },

    // 5. Governance & Platform Core Suite
    {
      id: 'sys-approvals',
      tab: 'approvals',
      titleAr: 'Ø³ÙŠØ± Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯Ø§Øª ÙˆØ§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª',
      titleEn: 'Approval Workflows',
      descAr: 'Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª Ø§Ù„Ù…Ø§Ù„ÙŠØ© ÙˆØ§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© Ù…ØªØ¹Ø¯Ø¯Ø© Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª',
      descEn: 'Multi-level Authorization Engine',
      suiteId: 'governance',
      suiteAr: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…',
      suiteEn: 'Governance & Core',
      icon: ShieldCheck,
      statusAr: 'Ø§Ø¹ØªÙ…Ø§Ø¯Ø§Øª',
      statusEn: 'Approvals',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-hr-dashboard',
      tab: 'hr_dashboard',
      titleAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ© ÙˆØ§Ù„ÙƒÙˆØ§Ø¯Ø±',
      titleEn: 'HR Workspace & Talent OS',
      descAr: 'Ù„ÙˆØ­Ø© Ø§Ù„Ø£Ø¯Ø§Ø¡ØŒ Ù…Ø³ÙŠØ±Ø§Øª Ø§Ù„Ø±ÙˆØ§ØªØ¨ ÙˆØ§Ù„Ø¨Ø¯Ù„Ø§ØªØŒ ÙˆØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ø¹Ù‡Ø¯ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©',
      descEn: 'Performance dashboard, payroll, field allowances & staff custodianship ledger',
      suiteId: 'governance',
      suiteAr: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…',
      suiteEn: 'Governance & Core',
      icon: Users,
      statusAr: 'Ù…Ø³ØªÙ…Ø±',
      statusEn: 'Live',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      badgeText: 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'sys-users',
      tab: 'users',
      titleAr: 'Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ† ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª',
      titleEn: 'Users & Permissions',
      descAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¯ÙˆØ§Ø± ÙˆØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„ÙˆØµÙˆÙ„',
      descEn: 'Role-Based Access Control',
      suiteId: 'governance',
      suiteAr: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…',
      suiteEn: 'Governance & Core',
      icon: Users,
      statusAr: 'Ø£Ù…Ø§Ù†',
      statusEn: 'RBAC',
      accentColor: 'indigo',
      badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      badgeText: 'text-indigo-700 dark:text-indigo-400 border-indigo-500/20'
    },
    {
      id: 'sys-control-panel',
      tab: 'control_panel',
      titleAr: 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ… ÙˆØ§Ù„Ø¹Ù…Ù„ÙŠØ§Øª',
      titleEn: 'Control Panel & Console',
      descAr: 'Ø§Ù„ØªØ­ÙƒÙ… Ø¨Ø§Ù„Ø¨Ù†ÙŠØ© Ø§Ù„ØªØ­ØªÙŠØ©ØŒ Neon DBØŒ ÙˆÙ…ÙØ§ØªÙŠØ­ Ø§Ù„ØªØ´ØºÙŠÙ„',
      descEn: 'Cloud Engine, Neon DB & System Switches',
      suiteId: 'governance',
      suiteAr: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…',
      suiteEn: 'Governance & Core',
      icon: Sliders,
      statusAr: 'ØªØ­ÙƒÙ…',
      statusEn: 'Console',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    },
    {
      id: 'sys-settings',
      tab: 'settings',
      titleAr: 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¤Ø³Ø³Ø© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…',
      titleEn: 'Platform Settings',
      descAr: 'Ø§Ù„Ù‡ÙˆÙŠØ© Ø§Ù„Ø¨ØµØ±ÙŠØ© ÙˆØ¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¤Ø³Ø³Ø© Ø§Ù„Ø¹Ø§Ù…Ø©',
      descEn: 'Enterprise Identity & Config',
      suiteId: 'governance',
      suiteAr: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…',
      suiteEn: 'Governance & Core',
      icon: Settings,
      statusAr: 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª',
      statusEn: 'Settings',
      accentColor: 'slate',
      badgeBg: 'bg-slate-500/10 dark:bg-slate-500/20',
      badgeText: 'text-slate-700 dark:text-slate-300 border-slate-500/20'
    },
    {
      id: 'sys-audit',
      tab: 'audit',
      titleAr: 'Ø³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚ ÙˆØ§Ù„Ø£Ù…Ø§Ù†',
      titleEn: 'Audit & Compliance Logs',
      descAr: 'ØªØªØ¨Ø¹ ÙƒØ§ÙØ© Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª ÙˆØ§Ù„Ø£Ù†Ø´Ø·Ø© Ø§Ù„Ø£Ù…Ù†ÙŠØ©',
      descEn: 'Immutable System Audit Trail',
      suiteId: 'governance',
      suiteAr: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…',
      suiteEn: 'Governance & Core',
      icon: Database,
      statusAr: 'ØªØ¯Ù‚ÙŠÙ‚',
      statusEn: 'Audit',
      accentColor: 'slate',
      badgeBg: 'bg-slate-500/10 dark:bg-slate-500/20',
      badgeText: 'text-slate-700 dark:text-slate-300 border-slate-500/20'
    },
    {
      id: 'sys-backup',
      tab: 'backup',
      titleAr: 'Ø§Ù„Ù†Ø³Ø® Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ ÙˆØ§Ù„ØªØ¹Ø§ÙÙŠ',
      titleEn: 'Backup & Recovery',
      descAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù†Ø³Ø® Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ Ù„Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª',
      descEn: 'Database Backups & Disaster Recovery',
      suiteId: 'governance',
      suiteAr: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…',
      suiteEn: 'Governance & Core',
      icon: Database,
      statusAr: 'Ø¨ÙŠØ§Ù†Ø§Øª',
      statusEn: 'Backup',
      accentColor: 'slate',
      badgeBg: 'bg-slate-500/10 dark:bg-slate-500/20',
      badgeText: 'text-slate-700 dark:text-slate-300 border-slate-500/20'
    },
    {
      id: 'sys-docs',
      tab: 'docs',
      titleAr: 'Ø§Ù„Ø¯Ù„ÙŠÙ„ Ø§Ù„Ù…Ø¹Ø±ÙÙŠ ÙˆØ§Ù„Ù„ÙˆØ§Ø¦Ø­',
      titleEn: 'SOP & Knowledge Base',
      descAr: 'Ø§Ù„Ø£Ø¯Ù„Ø© Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¦ÙŠØ© ÙˆØ§Ù„Ø³ÙŠØ§Ø³Ø§Øª Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©',
      descEn: 'Operating Manuals & Governance',
      suiteId: 'governance',
      suiteAr: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…',
      suiteEn: 'Governance & Core',
      icon: BookOpen,
      statusAr: 'Ø¯Ù„ÙŠÙ„',
      statusEn: 'Docs',
      accentColor: 'sky',
      badgeBg: 'bg-sky-500/10 dark:bg-sky-500/20',
      badgeText: 'text-sky-700 dark:text-sky-400 border-sky-500/20'
    },
    {
      id: 'sys-scenarios',
      tab: 'scenarios',
      titleAr: 'Ø§Ù„Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆÙ‡Ø§Øª Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠØ©',
      titleEn: 'Operational Playbooks',
      descAr: 'Ù…Ø­Ø§ÙƒØ§Ø© Ø§Ù„Ø£Ø²Ù…Ø§Øª ÙˆØ³ÙŠÙ†Ø§Ø±ÙŠÙˆÙ‡Ø§Øª Ø§Ù„ØªØ¯Ø®Ù„',
      descEn: 'Emergency Response Playbooks',
      suiteId: 'governance',
      suiteAr: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…',
      suiteEn: 'Governance & Core',
      icon: PlayCircle,
      statusAr: 'Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆ',
      statusEn: 'Playbooks',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-400 border-amber-500/20'
    }
  ], []);

  // Filtered list based on role, search and suite tab
  const filteredSystems = useMemo(() => {
    return allSystems.filter(sys => {
      const matchesRole = allowedTabsByPerspective.includes(sys.tab);
      if (!matchesRole) return false;

      const matchesSuite = selectedSuite === 'all' || sys.suiteId === selectedSuite;
      const matchesSearch = !searchTerm || (
        sys.titleAr.includes(searchTerm) ||
        sys.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sys.descAr.includes(searchTerm) ||
        sys.descEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sys.suiteAr.includes(searchTerm)
      );
      return matchesSuite && matchesSearch;
    });
  }, [allSystems, searchTerm, selectedSuite, allowedTabsByPerspective]);

  // Group by suite
  const groupedSuites = useMemo(() => {
    const suitesMap: Record<string, { suiteAr: string; suiteEn: string; items: SystemItem[] }> = {};

    filteredSystems.forEach(sys => {
      if (!suitesMap[sys.suiteId]) {
        suitesMap[sys.suiteId] = {
          suiteAr: sys.suiteAr,
          suiteEn: sys.suiteEn,
          items: []
        };
      }
      suitesMap[sys.suiteId].items.push(sys);
    });

    return Object.entries(suitesMap);
  }, [filteredSystems]);

  const toggleSuiteCollapse = (suiteId: string) => {
    setCollapsedSuites(prev => ({
      ...prev,
      [suiteId]: !prev[suiteId]
    }));
  };

  const suiteFilterPills = [
    { id: 'all', labelAr: 'Ø§Ù„ÙƒÙ„', labelEn: 'All', count: allSystems.length },
    { id: 'strategy', labelAr: 'Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ©', labelEn: 'Strategy', count: allSystems.filter(s => s.suiteId === 'strategy').length },
    { id: 'ops', labelAr: 'Ø§Ù„Ù…ÙŠØ¯Ø§Ù†', labelEn: 'Field Ops', count: allSystems.filter(s => s.suiteId === 'ops').length },
    { id: 'services', labelAr: 'Ø§Ù„Ø®Ø¯Ù…Ø§Øª', labelEn: 'Services', count: allSystems.filter(s => s.suiteId === 'services').length },
    { id: 'finance', labelAr: 'Ø§Ù„Ù…Ø§Ù„ÙŠØ©', labelEn: 'Finance', count: allSystems.filter(s => s.suiteId === 'finance').length },
    { id: 'governance', labelAr: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø©', labelEn: 'Governance', count: allSystems.filter(s => s.suiteId === 'governance').length },
  ];

  return (
    <div className="flex flex-col h-full w-full select-none">
      
      {/* HEADER: Dock Launcher Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-slate-200 dark:border-zinc-800">
        {!isCompact && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20 shrink-0">
              <Grid className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <span>{isRtl ? 'Ù„ÙˆØ­Ø© Ø§Ù„Ø£Ù†Ø¸Ù…Ø© Ø§Ù„Ù…Ø¤Ø³Ø³ÙŠØ©' : 'Enterprise Systems Dock'}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-500/20 shrink-0">
                  {allSystems.length} {isRtl ? 'Ù†Ø¸Ø§Ù…' : 'Systems'}
                </span>
              </h3>
              <p className="text-[9px] text-slate-500 dark:text-zinc-400 font-bold truncate">
                {isRtl ? 'Ø§Ù„ØªÙ†Ù‚Ù„ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø¹Ø¨Ø± Ø§Ù„Ù…Ù†Ø¸ÙˆÙ…Ø© Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠØ©' : 'Instant Platform Navigation'}
              </p>
            </div>
          </div>
        )}

        {!isMobileMode && (
          <div className="flex items-center gap-1 mx-auto sm:mx-0 shrink-0">
            <button
              onClick={onToggleDockPin}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
              title={isCompact ? (isRtl ? 'ØªÙˆØ³ÙŠØ¹ Ù„ÙˆØ­Ø© Ø§Ù„Ø£Ù†Ø¸Ù…Ø©' : 'Expand Systems Panel') : (isRtl ? 'ØªØµØºÙŠØ± Ø¥Ù„Ù‰ Ø´Ø±ÙŠØ· Ø§Ù„Ø¯ÙˆÙƒ' : 'Compact Dock Mode')}
            >
              {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* EXPANDED MODE SEARCH & SUITE FILTERS */}
      {!isCompact && (
        <div className="space-y-2 mb-2.5">
          {/* Live Search Input */}
          <div className="relative">
            <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-2.5 ${isRtl ? 'right-2.5' : 'left-2.5'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRtl ? 'Ø¨Ø­Ø« Ø³Ø±ÙŠØ¹ ÙÙŠ Ø§Ù„Ø£Ù†Ø¸Ù…Ø©...' : 'Filter Enterprise Systems...'}
              className={`w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-1.5 ${
                isRtl ? 'pr-8 pl-6' : 'pl-8 pr-6'
              } text-[11px] font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors shadow-2xs`}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded-md`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Suite Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 pt-0.5">
            {suiteFilterPills.map((pill) => {
              const isSelected = selectedSuite === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setSelectedSuite(pill.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>{isRtl ? pill.labelAr : pill.labelEn}</span>
                  <span className={`text-[8px] font-mono rtl:mr-1 ltr:ml-1 px-1 rounded-full ${isSelected ? 'bg-amber-600/60 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'}`}>
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SYSTEMS LIST AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-0.5">
        {/* COMPACT MODE RAIL */}
        {isCompact ? (
          <div className="space-y-1.5 flex flex-col items-center">
            {allSystems.map((system) => {
              const IconComp = system.icon;
              const isActive = activeTab === system.tab;

              return (
                <button
                  key={system.id}
                  onClick={() => onNavigate(system.tab)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group border ${
                    isActive 
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-105' 
                      : 'bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                  title={`${isRtl ? system.titleAr : system.titleEn} (${isRtl ? system.suiteAr : system.suiteEn})`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1 ring-2 ring-emerald-700"></span>
                  )}

                  {/* Hover Tooltip Card */}
                  <div className={`absolute ${isRtl ? 'right-12' : 'left-12'} top-0 hidden group-hover:flex flex-col bg-slate-900 dark:bg-zinc-900 text-white p-2.5 rounded-xl shadow-2xl border border-slate-700 dark:border-zinc-700 z-50 w-48 text-right rtl:text-right ltr:text-left animate-in fade-in zoom-in-95 duration-150`}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black text-amber-400">
                        {isRtl ? system.suiteAr : system.suiteEn}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${system.badgeBg} ${system.badgeText}`}>
                        {isRtl ? system.statusAr : system.statusEn}
                      </span>
                    </div>
                    <span className="text-[11px] font-extrabold leading-snug">
                      {isRtl ? system.titleAr : system.titleEn}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                      {isRtl ? system.descAr : system.descEn}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* EXPANDED MODE CATEGORIZED SUITES */
          <>
            {groupedSuites.length === 0 ? (
              <div className="p-4 text-center text-slate-400 dark:text-zinc-500 text-xs font-bold bg-slate-50 dark:bg-zinc-900/40 rounded-xl border border-slate-200 dark:border-zinc-800">
                {isRtl ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ù†Ø¸Ù…Ø© ØªØ·Ø§Ø¨Ù‚ Ø§Ù„Ø¨Ø­Ø« Ø§Ù„Ø­Ø±ÙÙŠ' : 'No matching systems found'}
              </div>
            ) : (
              groupedSuites.map(([suiteId, suiteData]) => {
                const isCollapsed = collapsedSuites[suiteId] || false;

                return (
                  <div key={suiteId} className="space-y-1">
                    {/* Suite Category Header */}
                    <button
                      onClick={() => toggleSuiteCollapse(suiteId)}
                      className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[10px] font-black uppercase text-amber-600 dark:text-amber-400/90 tracking-wider hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>{isRtl ? suiteData.suiteAr : suiteData.suiteEn}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500">
                          ({suiteData.items.length})
                        </span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90 rtl:rotate-90' : ''}`} />
                      </div>
                    </button>

                    {/* Suite Items List */}
                    {!isCollapsed && (
                      <div className="space-y-1 pt-0.5">
                        {suiteData.items.map((system) => {
                          const IconComp = system.icon;
                          const isActive = activeTab === system.tab;

                          return (
                            <button
                              key={system.id}
                              onClick={() => onNavigate(system.tab)}
                              className={`w-full p-2 rounded-xl text-left rtl:text-right flex items-center justify-between transition-all cursor-pointer border ${
                                isActive 
                                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-extrabold shadow-2xs' 
                                  : 'bg-slate-50/60 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border-slate-200/80 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`p-1.5 rounded-lg shrink-0 ${
                                  isActive 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                                }`}>
                                  <IconComp className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-black truncate leading-tight">
                                      {isRtl ? system.titleAr : system.titleEn}
                                    </span>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${system.badgeBg} ${system.badgeText}`}>
                                      {isRtl ? system.statusAr : system.statusEn}
                                    </span>
                                  </div>
                                  <p className={`text-[9.5px] font-medium block truncate mt-0.5 ${isActive ? 'text-emerald-700/90 dark:text-emerald-400/90' : 'text-slate-500 dark:text-zinc-400'}`}>
                                    {isRtl ? system.descAr : system.descEn}
                                  </p>
                                </div>
                              </div>

                              {isActive && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 rtl:mr-1.5 ltr:ml-1.5 shadow-xs"></span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* UTILITY RAIL CONSOLIDATION AREA */}
      {(() => {
        const helperTools = [
          {
            id: 'copilot',
            icon: Brain,
            titleAr: 'Ù…Ø³Ø§Ø¹Ø¯ Ø§Ù„Ø°ÙƒØ§Ø¡ Copilot',
            titleEn: 'AI Copilot',
            onClick: onOpenCopilot,
            color: 'text-emerald-600 dark:text-emerald-400',
            bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
          },
          {
            id: 'docs',
            icon: BookOpen,
            titleAr: 'Ø¯Ù„ÙŠÙ„ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…',
            titleEn: 'User Manual',
            onClick: onOpenDocs,
            color: 'text-sky-600 dark:text-sky-400',
            bgHover: 'hover:bg-sky-50 dark:hover:bg-sky-950/20'
          },
          {
            id: 'scenarios',
            icon: PlayCircle,
            titleAr: 'Ø§Ù„Ø³ÙŠÙ†Ø§Ø±ÙŠÙˆÙ‡Ø§Øª SOP',
            titleEn: 'Playbooks',
            onClick: onOpenScenarios,
            color: 'text-amber-600 dark:text-amber-400',
            bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-950/20'
          },
          {
            id: 'helpers',
            icon: Calculator,
            titleAr: 'Ø­Ø§Ø³Ø¨Ø§Øª Ø§Ù„Ø¥ØºØ§Ø«Ø©',
            titleEn: 'Relief Calculators',
            onClick: onOpenHelpers,
            color: 'text-rose-600 dark:text-rose-400',
            bgHover: 'hover:bg-rose-50 dark:hover:bg-rose-950/20'
          }
        ];
        const activeHelpers = helperTools.filter(h => h.onClick !== undefined);

        if (activeHelpers.length === 0) return null;

        if (isCompact) {
          return (
            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-zinc-800 flex flex-col items-center gap-1.5 shrink-0">
              {activeHelpers.map(h => {
                const Icon = h.icon;
                return (
                  <button
                    key={h.id}
                    onClick={h.onClick}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 ${h.bgHover} ${h.color} relative group/tool`}
                    title={isRtl ? h.titleAr : h.titleEn}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className={`absolute ${isRtl ? 'right-11' : 'left-11'} top-1 hidden group-hover/tool:block bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-50`}>
                      {isRtl ? h.titleAr : h.titleEn}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        }

        return (
          <div className="pt-2 mt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1.5 shrink-0">
            <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-1">
              {isRtl ? 'Ø§Ù„Ø£Ø¯ÙˆØ§Øª ÙˆØ§Ù„Ù…Ø³Ø§Ø¹Ø¯Ø©' : 'Utility & AI Assistance'}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {activeHelpers.map(h => {
                const Icon = h.icon;
                return (
                  <button
                    key={h.id}
                    onClick={h.onClick}
                    className={`p-2 rounded-xl border border-slate-200/50 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900 text-left rtl:text-right flex flex-col gap-1 items-start transition-all cursor-pointer group/tool ${h.bgHover}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${h.color} group-hover/tool:scale-110 transition-transform`} />
                    <span className="text-[9.5px] font-extrabold text-slate-700 dark:text-zinc-300 leading-tight">
                      {isRtl ? h.titleAr : h.titleEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* FOOTER: Live Status & System Engine Info */}
      {!isCompact && (
        <div className="pt-2 mt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isRtl ? 'Ø§Ù„Ù…Ù†Ø¸ÙˆÙ…Ø©: Ù†Ø´Ø·Ø©' : 'System: Operational'}</span>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Nexora Engine</span>
        </div>
      )}

    </div>
  );
};
