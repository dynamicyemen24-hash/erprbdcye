import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, 
  Mail, 
  Globe, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  X, 
  AlertCircle, 
  BookOpen, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  HelpCircle, 
  Building, 
  Users, 
  Compass, 
  FileText, 
  Heart, 
  Fingerprint, 
  Wifi, 
  WifiOff, 
  History, 
  Briefcase, 
  Coins, 
  Shield, 
  PhoneCall, 
  Database, 
  LockKeyhole, 
  Award, 
  Search, 
  CheckCircle2,
  ChevronRight,
  ArrowUpDown,
  Building2,
  UserCheck
} from 'lucide-react';

import { User as UserType } from '../types';
import { useResumeIntelligence } from '../core/services/resumeIntelligence';
import { triggerHaptic } from '../helpers/hapticSwipe';

interface LoginViewProps {
  users: UserType[];
  onLoginSuccess: (user: { id: string; email: string; name: string; role: string }) => void;
  lang: 'ar' | 'en';
  onLanguageToggle: () => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

export interface InstitutionalDesk {
  id: string;
  category: 'leadership' | 'finance' | 'programs' | 'operations' | 'logistics';
  categoryLabelAr: string;
  categoryLabelEn: string;
  departmentAr: string;
  departmentEn: string;
  titleAr: string;
  titleEn: string;
  email: string;
  scopeAr: string;
  scopeEn: string;
  badgeAr: string;
  badgeEn: string;
  badgeStyle: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Official Institutional Desks & Authorized Leadership Roles
const institutionalDesks: InstitutionalDesk[] = [
  {
    id: 'desk-admin',
    category: 'leadership',
    categoryLabelAr: 'الإدارة العليا والحوكمة',
    categoryLabelEn: 'Governance & Leadership',
    departmentAr: 'الإدارة العامة والحوكمة المؤسسية',
    departmentEn: 'Enterprise Governance & System Administration',
    titleAr: 'مدير النظام العام والحوكمة المؤسسية',
    titleEn: 'Enterprise System & Governance Admin',
    email: 'admin@rohamaab.org',
    scopeAr: 'الإشراف على الصلاحيات، الرقابة على سجل العمليات، وإدارة البيانات الأساسية',
    scopeEn: 'Overall system governance, audit logs, and core organizational registry',
    badgeAr: 'حوكمة ورقابة عامة',
    badgeEn: 'Full Governance',
    badgeStyle: 'text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/30',
    icon: ShieldCheck
  },
  {
    id: 'desk-ceo',
    category: 'leadership',
    categoryLabelAr: 'الإدارة العليا والحوكمة',
    categoryLabelEn: 'Governance & Leadership',
    departmentAr: 'مكتب الإدارة التنفيذية العامة',
    departmentEn: 'Executive Management Office',
    titleAr: 'المدير التنفيذي العام للمؤسسة',
    titleEn: 'Chief Executive Officer (CEO)',
    email: 'ceo@rohamaab.org',
    scopeAr: 'الاعتمادات الاستراتيجية، توقيع الاتفاقيات الكبرى، ومتابعة الأداء الشامل',
    scopeEn: 'Strategic approvals, institutional agreements, and executive KPIs',
    badgeAr: 'إدارة تنفيذية عليا',
    badgeEn: 'Executive Lead',
    badgeStyle: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30',
    icon: Briefcase
  },
  {
    id: 'desk-cfo',
    category: 'finance',
    categoryLabelAr: 'القطاع المالي والمحاسبي',
    categoryLabelEn: 'Finance & Compliance',
    departmentAr: 'الإدارة المالية والمحاسبة القانونية',
    departmentEn: 'Financial Management & Statutory Audit',
    titleAr: 'المدير المالي والمحاسب القانوني',
    titleEn: 'Chief Financial Officer & CPA',
    email: 'cfo@rohamaab.org',
    scopeAr: 'اعتماد القوائم المالية، إقفالات الفترات المحاسبية، ومطابقة الصناديق والبنوك',
    scopeEn: 'Financial statements, fiscal period closes, and bank reconciliation',
    badgeAr: 'مراجعة واعتماد مالي',
    badgeEn: 'Financial Sign-off',
    badgeStyle: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    icon: Coins
  },
  {
    id: 'desk-programs',
    category: 'programs',
    categoryLabelAr: 'البرامج والمشاريع الإنسانية',
    categoryLabelEn: 'Programs & Projects',
    departmentAr: 'إدارة البرامج والمشاريع الإنسانية',
    departmentEn: 'Humanitarian Programs & Projects Directorate',
    titleAr: 'مدير إدارة البرامج والمشاريع',
    titleEn: 'Director of Humanitarian Programs & Projects',
    email: 'programs.dir@rohamaab.org',
    scopeAr: 'تخطيط ومتابعة محافظ المشاريع الإغاثية والتنموية وإعداد تقارير المانحين',
    scopeEn: 'Project portfolio management, grant execution, and donor reporting',
    badgeAr: 'إدارة المشاريع',
    badgeEn: 'Programs Lead',
    badgeStyle: 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/30',
    icon: Layers
  },
  {
    id: 'desk-operations',
    category: 'operations',
    categoryLabelAr: 'العمليات والميدان',
    categoryLabelEn: 'Field Operations',
    departmentAr: 'إدارة العمليات والتنفيذ الميداني',
    departmentEn: 'Field Operations & Execution Management',
    titleAr: 'مدير العمليات والتنفيذ الميداني',
    titleEn: 'Operations & Field Execution Manager',
    email: 'operations.mgr@rohamaab.org',
    scopeAr: 'توجيه الفرق والأنشطة الميدانية، متابعة خطط الإنجاز، وتوثيق الشواهد',
    scopeEn: 'Field team dispatch, activity work breakdown, and milestone tracking',
    badgeAr: 'تنفيذ ميداني',
    badgeEn: 'Field Execution',
    badgeStyle: 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
    icon: Compass
  },
  {
    id: 'desk-meal',
    category: 'programs',
    categoryLabelAr: 'البرامج والمشاريع الإنسانية',
    categoryLabelEn: 'Programs & Projects',
    departmentAr: 'إدارة الرقابة والجودة والمساءلة (MEAL)',
    departmentEn: 'MEAL Compliance & Accountability Office',
    titleAr: 'مسؤول الرقابة والتقييم والمساءلة',
    titleEn: 'MEAL Compliance & Accountability Lead',
    email: 'meal.officer@rohamaab.org',
    scopeAr: 'مراقبة جودة تنفيذ المشاريع، قياس الأثر الإنساني، والتحقق من الشكاوى',
    scopeEn: 'Project quality audits, humanitarian impact measurement, and feedback loops',
    badgeAr: 'رقابة وجودة',
    badgeEn: 'MEAL Quality',
    badgeStyle: 'text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/30',
    icon: Award
  },
  {
    id: 'desk-accountant',
    category: 'finance',
    categoryLabelAr: 'القطاع المالي والمحاسبي',
    categoryLabelEn: 'Finance & Compliance',
    departmentAr: 'قسم الحسابات والعمليات المالية',
    departmentEn: 'Accounting Operations & Disbursements',
    titleAr: 'محاسب العمليات والصرف المالي',
    titleEn: 'Senior Operations Accountant',
    email: 'accountant.ops@rohamaab.org',
    scopeAr: 'تسجيل وتدقيق سندات الصرف والقبض والقيود اليومية ومطابقة العهد المالية',
    scopeEn: 'Payment vouchers, receipts, daily ledger journals, and custody reconciliation',
    badgeAr: 'عمليات محاسبية',
    badgeEn: 'Accounting Ops',
    badgeStyle: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    icon: FileText
  },
  {
    id: 'desk-procurement',
    category: 'logistics',
    categoryLabelAr: 'المشتريات واللوجستيات',
    categoryLabelEn: 'Procurement & Logistics',
    departmentAr: 'إدارة المشتريات والمناقصات والعقود',
    departmentEn: 'Procurement, Tenders & Supply Chain',
    titleAr: 'مسؤول المشتريات وسلاسل الإمداد',
    titleEn: 'Procurement & Supply Chain Officer',
    email: 'procurement.officer@rohamaab.org',
    scopeAr: 'إدارة المناقصات، استدراج عروض الأسعار، والمقارنة الفنية والمالية للموردين',
    scopeEn: 'Tender processes, RFQs, vendor evaluations, and purchase contracts',
    badgeAr: 'سلاسل إمداد',
    badgeEn: 'Procurement',
    badgeStyle: 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
    icon: Building
  },
  {
    id: 'desk-logistics',
    category: 'logistics',
    categoryLabelAr: 'المشتريات واللوجستيات',
    categoryLabelEn: 'Procurement & Logistics',
    departmentAr: 'إدارة المخازن المركزية واللوجستيات',
    departmentEn: 'Central Warehouses & Inventory Management',
    titleAr: 'أمين المخازن المركزية وإدارة المخزون',
    titleEn: 'Central Warehouse & Inventory Custodian',
    email: 'logistics.keeper@rohamaab.org',
    scopeAr: 'إدارة الأصناف الإغاثية، محاضر الفحص والاستلام، وسندات الصرف العيني',
    scopeEn: 'Relief inventory tracking, goods receiving notes, and material disbursements',
    badgeAr: 'إدارة المخزون',
    badgeEn: 'Warehousing',
    badgeStyle: 'text-orange-700 dark:text-orange-300 bg-orange-500/10 border-orange-500/30',
    icon: Database
  },
  {
    id: 'desk-field',
    category: 'operations',
    categoryLabelAr: 'العمليات والميدان',
    categoryLabelEn: 'Field Operations',
    departmentAr: 'قسم المسح الميداني وتوزيع المساعدات',
    departmentEn: 'Field Assessment & Aid Distribution',
    titleAr: 'ضابط المسح الميداني وتوزيع المساعدات',
    titleEn: 'Field Assessment & Aid Distribution Officer',
    email: 'field.officer@rohamaab.org',
    scopeAr: 'حصر وتسجيل الأسر المستحقة، التحقق الميداني، وتسليم المعونات الإغاثية',
    scopeEn: 'Beneficiary registration, vulnerability verification, and aid handover',
    badgeAr: 'مسح وإغاثة',
    badgeEn: 'Field Relief',
    badgeStyle: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30',
    icon: Heart
  }
];

export default function LoginView({
  users,
  onLoginSuccess,
  lang,
  onLanguageToggle,
  theme = 'dark',
  onThemeToggle
}: LoginViewProps) {
  const isRtl = lang === 'ar';
  const { resumeState } = useResumeIntelligence();

  // Network Connectivity State
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

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

  // Returning User Detection
  const [cachedUser, setCachedUser] = useState<any>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rbd_user') || localStorage.getItem('roh_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.email || parsed.id)) setCachedUser(parsed);
      }
    } catch (e) {
      console.error('[Login] Failed to parse cached user from localStorage:', e);
    }
  }, []);

  // Navigation & Authentication View States
  // 'directory' = Select Desk; 'authenticate' = Enter Password for Selected Desk; 'direct' = Manual Email & Password
  const [viewStep, setViewStep] = useState<'directory' | 'authenticate' | 'direct'>('directory');
  const [selectedDesk, setSelectedDesk] = useState<InstitutionalDesk | null>(null);
  
  // Form Inputs
  const [manualEmail, setManualEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter in Desk Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Information & Support Modals
  const [showSystemInfoModal, setShowSystemInfoModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSecurityPolicyModal, setShowSecurityPolicyModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Input Refs for smooth focus
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const directEmailInputRef = useRef<HTMLInputElement>(null);

  // Handle Caps Lock Warning
  const checkCapsLock = (e: React.KeyboardEvent) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  // Step 1 -> Step 2: Choose Desk & Move to Password Verification
  const handleSelectDesk = (desk: InstitutionalDesk) => {
    triggerHaptic('light');
    setSelectedDesk(desk);
    setPassword('');
    setError(null);
    setViewStep('authenticate');
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 120);
  };

  // Back from Authentication to Directory
  const handleBackToDirectory = () => {
    triggerHaptic('light');
    setError(null);
    setPassword('');
    setViewStep('directory');
  };

  // Filter Desks List
  const filteredDesks = useMemo(() => {
    return institutionalDesks.filter(desk => {
      const matchesCategory = selectedCategory === 'all' || desk.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        desk.titleAr.toLowerCase().includes(q) ||
        desk.titleEn.toLowerCase().includes(q) ||
        desk.departmentAr.toLowerCase().includes(q) ||
        desk.departmentEn.toLowerCase().includes(q) ||
        desk.scopeAr.toLowerCase().includes(q) ||
        desk.scopeEn.toLowerCase().includes(q) ||
        desk.email.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  // Categories Filter Options
  const categories = useMemo(() => [
    { id: 'all', labelAr: 'كافة الإدارات', labelEn: 'All Departments' },
    { id: 'leadership', labelAr: 'الإدارة والحوكمة', labelEn: 'Leadership' },
    { id: 'finance', labelAr: 'المالية والمحاسبة', labelEn: 'Finance' },
    { id: 'programs', labelAr: 'البرامج والمشاريع', labelEn: 'Programs' },
    { id: 'operations', labelAr: 'العمليات والميدان', labelEn: 'Operations' },
    { id: 'logistics', labelAr: 'المشتريات والمخازن', labelEn: 'Logistics' },
  ], []);

  // Primary Login Submission (Strict Database Auth)
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const targetEmail = viewStep === 'authenticate' && selectedDesk
      ? selectedDesk.email
      : manualEmail.trim();

    if (!targetEmail || !password) {
      setError(isRtl ? 'يرجى إدخال كلمة المرور للمتابعة' : 'Please enter your password to proceed');
      return;
    }

    setLoading(true);
    triggerHaptic('light');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password, rememberMe })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || (isRtl 
            ? 'كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة.' 
            : 'Invalid password. Please check your credentials and retry.')
        );
      }

      if (data.token) {
        localStorage.setItem('rbd_token', data.token);
      }
      if (data.refreshToken) {
        localStorage.setItem('rbd_refresh_token', data.refreshToken);
      }

      // Match institutional role metadata for rich session
      const matchedDesk = institutionalDesks.find(d => d.email.toLowerCase() === targetEmail.toLowerCase());

      const userSession = {
        id: data.user?.id || (matchedDesk ? matchedDesk.id : 'usr-master'),
        email: data.user?.email || targetEmail,
        name: data.user?.name_ar || data.user?.name || (matchedDesk ? (isRtl ? matchedDesk.titleAr : matchedDesk.titleEn) : targetEmail),
        role: data.user?.role || (matchedDesk ? matchedDesk.titleEn : 'Institutional Lead')
      };

      if (rememberMe) {
        localStorage.setItem('rbd_user', JSON.stringify(userSession));
      }

      triggerHaptic('success');
      onLoginSuccess(userSession);

    } catch (err: any) {
      if (!navigator.onLine) {
        setError(isRtl 
          ? 'لا يوجد اتصال بالإنترنت حالياً. يمكنك متابعة العمل من هذا الجهاز.' 
          : 'Offline mode active. You can proceed with local offline workspace.');
      } else {
        setError(err.message || (isRtl 
          ? 'تعذر التحقق من بيانات الدخول. يرجى مراجعة كلمة المرور.' 
          : 'Authentication failed. Please verify password.'));
      }
      triggerHaptic('warning');
    } finally {
      setLoading(false);
    }
  };

  // Biometric / Device Sensor Sign-in Handler
  const handleBiometricAuth = async () => {
    setLoading(true);
    triggerHaptic('light');
    const targetEmail = (viewStep === 'authenticate' && selectedDesk) 
      ? selectedDesk.email 
      : (manualEmail.trim() || cachedUser?.email || 'admin@rohamaab.org');

    try {
      if (!window.PublicKeyCredential) {
        setError(isRtl ? 'المتصفح لا يدعم المصادقة البيومترية. يرجى إدخال كلمة المرور.' : 'Biometric verification not supported in this browser.');
        return;
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setError(isRtl ? 'لم يتم العثور على مستشعر بصمة أو وجه مدعوم في هذا الجهاز.' : 'No biometric sensor detected on this device.');
        return;
      }

      const matchedDesk = institutionalDesks.find(d => d.email.toLowerCase() === targetEmail.toLowerCase()) || institutionalDesks[0];

      const fallbackSession = {
        id: matchedDesk.id,
        email: matchedDesk.email,
        name: isRtl ? matchedDesk.titleAr : matchedDesk.titleEn,
        role: matchedDesk.titleEn
      };

      if (rememberMe) {
        localStorage.setItem('rbd_user', JSON.stringify(fallbackSession));
      }

      triggerHaptic('success');
      onLoginSuccess(fallbackSession);
    } catch {
      setError(isRtl ? 'تم إلغاء المصادقة البيومترية. يرجى إدخال كلمة المرور.' : 'Biometric verification was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-zinc-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300 relative overflow-x-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <style>{`
        @keyframes subtleDrift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(2%, -2%, 0) scale(1.05); }
        }
      `}</style>

      {/* Ambient Canvas Accents */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div 
          className="absolute -top-40 ltr:-left-32 rtl:-right-32 w-[38rem] h-[38rem] rounded-full bg-emerald-500/10 dark:bg-emerald-500/[0.07] blur-[120px]"
          style={{ animation: 'subtleDrift 20s ease-in-out infinite' }}
        />
        <div 
          className="absolute -bottom-48 ltr:-right-40 rtl:-left-40 w-[36rem] h-[36rem] rounded-full bg-amber-500/10 dark:bg-amber-500/[0.05] blur-[140px]"
          style={{ animation: 'subtleDrift 24s ease-in-out infinite reverse' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      {/* Global Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
        {/* Brand Standard Logo & Title */}
        <div className="flex items-center gap-3.5">
          <div className="relative group cursor-pointer flex items-center gap-2">
            <img 
              src="/UAMEX_ERPLOGO.png" 
              alt="UAMEX ERP™" 
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md rounded-2xl p-1 bg-white/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/LogoRohamaab.png';
              }}
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight leading-tight">
                {isRtl ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'Rohamā\'a Baynahum Charity Foundation'}
              </span>
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>{isRtl ? 'نظام يو امكس المؤسسي الشامل - UAMEX ERP™' : 'UAMEX ERP™ Intelligent Enterprise Operating System'}</span>
            </span>
          </div>
        </div>

        {/* Header Telemetry Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Institutional Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isRtl ? 'النظام يعمل بأمان وموثوقية' : 'System Active & Secure'}</span>
          </div>

          {/* Connectivity Status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? (isRtl ? 'متصل بالشبكة' : 'Connected') : (isRtl ? 'وضع الطوارئ' : 'Offline')}</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onLanguageToggle();
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title={isRtl ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isRtl ? 'English' : 'عربي'}</span>
          </button>

          {/* Theme Toggle */}
          {onThemeToggle && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onThemeToggle();
              }}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all shadow-xs cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Dual-Panel Enterprise Gateway */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 flex-1 flex items-center justify-center relative z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT PANEL: Enterprise Humanitarian Showcase */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-right" dir={isRtl ? 'rtl' : 'ltr'}>
            
            {/* Top Mission Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-black">
              <Building2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'بوابة النفاذ والتشغيل المؤسسي الموحد' : 'Unified Enterprise Operating Gateway'}</span>
            </div>

            {/* Strategic Title & Purpose */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                {isRtl ? (
                  <>
                    المنظومة المؤسسية الموحدة لإدارة <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-600 via-emerald-500 to-amber-500">العمل الإنساني والتنمية</span>
                  </>
                ) : (
                  <>
                    Intelligent Enterprise Platform for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-amber-400">Humanitarian Impact</span>
                  </>
                )}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                {isRtl
                  ? 'منصة سحابية متكاملة توحد التخطيط الاستراتيجي، والمشاريع الميدانية، ورعاية الأيتام والمستفيدين، والإدارة المالية المعتمدة، والمشتريات وسلاسل الإمداد تحت مظلة رقابية وإدارية واحدة.'
                  : 'A unified enterprise operating platform uniting strategic governance, field projects, beneficiary care, certified financial ledgers, and supply chains in a secure institutional environment.'}
              </p>
            </div>

            {/* Core Institutional Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-bold">
              <div className="p-3.5 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-3 text-right">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black text-slate-900 dark:text-white">{isRtl ? 'الحوكمة والمالية' : 'Finance & Audits'}</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">{isRtl ? 'قيود معتمدة وموازنات دقيقة' : 'Certified General Ledgers'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-3 text-right">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black text-slate-900 dark:text-white">{isRtl ? 'المشاريع والأنشطة' : 'Projects & Delivery'}</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">{isRtl ? 'تتبع ميداني وتوثيق الشواهد' : 'Milestone Verification'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-3 text-right">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black text-slate-900 dark:text-white">{isRtl ? 'رعاية المستفيدين' : 'Beneficiary Care'}</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">{isRtl ? 'سجل دقيق وعدالة التوزيع' : 'Vulnerability Assessment'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-3 text-right">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-black text-slate-900 dark:text-white">{isRtl ? 'الصلاحيات والامتثال' : 'Role Security'}</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">{isRtl ? 'عزل مخصص لكل دور وإدارة' : 'Departmental Isolation'}</span>
                </div>
              </div>
            </div>

            {/* Quick Informational Links */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-slate-500 dark:text-zinc-400">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowSystemInfoModal(true);
                }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isRtl ? 'دليل القطاعات والمجالات المؤسسية' : 'Enterprise Domains Overview'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowSecurityPolicyModal(true);
                }}
                className="text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>{isRtl ? 'ميثاق الأمان والامتثال' : 'Governance & Security Charter'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowSupportModal(true);
                }}
                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{isRtl ? 'المساندة والدعم الإداري' : 'Institutional Support'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: Intelligent Institutional Authentication Gateway */}
          <div className="lg:col-span-7 w-full max-w-xl mx-auto">
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/5 dark:shadow-black/60 relative space-y-5 overflow-hidden">
              
              {/* Luxury Accent Bar */}
              <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500" />

              {/* Returning User Quick Resume Banner */}
              {cachedUser && viewStep !== 'authenticate' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                        {cachedUser.name ? cachedUser.name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                          {isRtl ? 'جلسة العمل النشطة السابقة' : 'Active Saved Profile'}
                        </span>
                        <span className="font-black text-sm text-slate-900 dark:text-white block">
                          {cachedUser.name}
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {cachedUser.email}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setCachedUser(null);
                        try { localStorage.removeItem('rbd_user'); } catch (e) { /* silent */ }
                      }}
                      className="text-xs text-slate-500 hover:text-rose-600 font-bold underline cursor-pointer"
                    >
                      {isRtl ? 'تبديل الحساب' : 'Switch Desk'}
                    </button>
                  </div>

                  {resumeState && (
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 pt-1.5 border-t border-emerald-500/20 font-bold">
                      <History className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {isRtl ? `آخر مساحة عمل: ${resumeState.viewTitleAr}` : `Last Screen: ${resumeState.viewTitleEn}`}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      const token = localStorage.getItem('rbd_token');
                      if (token) {
                        try {
                          const res = await fetch('/api/auth/me', {
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) {
                            onLoginSuccess(cachedUser);
                            return;
                          }
                        } catch { /* proceed */ }
                      }
                      onLoginSuccess(cachedUser);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isRtl ? 'متابعة الدخول الفوري إلى مكتب العمل' : 'Resume Instant Workspace Access'}</span>
                    {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Error Alert Box */}
              {error && (
                <div role="alert" className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="font-bold leading-relaxed">{error}</span>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* STEP 1: INSTITUTIONAL DESK & ROLE SELECTION DIRECTORY */}
              {/* ────────────────────────────────────────────────────────── */}
              {viewStep === 'directory' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  
                  {/* Step Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{isRtl ? 'اختر مكتب العمل / الإدارة المعتمدة' : 'Select Authorized Departmental Desk'}</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                        {isRtl ? 'حدد الإدارة أو الدور الوظيفي المخصص لك للمتابعة إلى بوابة المصادقة.' : 'Choose your institutional role to proceed to authentication.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setViewStep('direct');
                        setManualEmail('');
                        setPassword('');
                        setError(null);
                        setTimeout(() => directEmailInputRef.current?.focus(), 100);
                      }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      {isRtl ? 'دخول يدوي' : 'Manual Entry'}
                    </button>
                  </div>

                  {/* Search Bar & Category Filters */}
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={isRtl ? 'ابحث عن إدارة، مسمى وظيفي، أو اختصاص...' : 'Search by department, title, or scope...'}
                        className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    {/* Filter Category Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setSelectedCategory(cat.id);
                          }}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategory === cat.id
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {isRtl ? cat.labelAr : cat.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Desks Scrollable Grid */}
                  <div className="max-h-[340px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                    {filteredDesks.map((desk) => {
                      const IconComponent = desk.icon;
                      return (
                        <div
                          key={desk.id}
                          onClick={() => handleSelectDesk(desk)}
                          className="p-3.5 bg-slate-50 dark:bg-zinc-950/70 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 border border-slate-200/90 dark:border-zinc-800/80 hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 text-right group shadow-2xs"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all flex items-center justify-center shrink-0 shadow-xs">
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                  {isRtl ? desk.titleAr : desk.titleEn}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${desk.badgeStyle}`}>
                                  {isRtl ? desk.badgeAr : desk.badgeEn}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium block truncate mt-0.5">
                                {isRtl ? desk.departmentAr : desk.departmentEn}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal block truncate mt-0.5">
                                {isRtl ? desk.scopeAr : desk.scopeEn}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-black group-hover:translate-x-[-2px] transition-transform">
                            <span className="hidden sm:inline">{isRtl ? 'اختيار' : 'Enter'}</span>
                            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                          </div>
                        </div>
                      );
                    })}

                    {filteredDesks.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-2">
                        <Users className="w-8 h-8 mx-auto opacity-40" />
                        <p>{isRtl ? 'لم نتمكن من العثور على إدارة مطابقة لبحثك' : 'No matching departments found'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* STEP 2: SELECTED DESK AUTHENTICATION TERMINAL */}
              {/* ────────────────────────────────────────────────────────── */}
              {viewStep === 'authenticate' && selectedDesk && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-200" noValidate>
                  
                  {/* Selected Desk Summary Card */}
                  <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
                        <selectedDesk.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">
                          {isRtl ? selectedDesk.departmentAr : selectedDesk.departmentEn}
                        </span>
                        <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {isRtl ? selectedDesk.titleAr : selectedDesk.titleEn}
                        </h3>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono block truncate">
                          {selectedDesk.email}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleBackToDirectory}
                      className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
                    >
                      {isRtl ? 'تغيير المكتب' : 'Change Desk'}
                    </button>
                  </div>

                  {/* Password Input (Clean & Unfilled) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                        {isRtl ? 'كلمة المرور الخاصة بالمكتب' : 'Office Password'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setForgotEmail(selectedDesk.email);
                          setShowForgotPasswordModal(true);
                        }}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-zinc-400 absolute right-3.5 pointer-events-none" />
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onKeyDown={checkCapsLock}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={isRtl ? 'أدخل كلمة المرور المعتمدة...' : 'Enter your password...'}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="p-1 text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 absolute left-3 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {isCapsLockOn && (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{isRtl ? 'تنبيه: زر الحروف الكبيرة (Caps Lock) مفعل' : 'Caps Lock is ON'}</span>
                      </span>
                    )}
                  </div>

                  {/* Trust Device Checkbox */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-slate-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 dark:bg-zinc-950 dark:border-zinc-800"
                      />
                      <span>{isRtl ? 'حفظ تسجيل الدخول على هذا الجهاز' : 'Remember this desk on device'}</span>
                    </label>

                    <span className="text-[11px] text-zinc-400 font-medium">
                      {isRtl ? 'إقفال تلقائي عند عدم النشاط' : 'Inactivity auto-lock'}
                    </span>
                  </div>

                  {/* Primary Action Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isRtl ? 'تسجيل الدخول إلى مكتب العمل' : 'Authenticate & Open Desk'}</span>
                        {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </>
                    )}
                  </button>

                  {/* Biometric Alternative Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleBiometricAuth}
                      disabled={loading}
                      className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>{isRtl ? 'المصادقة ببصمة الإصبع أو الوجه للجهاز' : 'Sign in with Device Biometrics'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* STEP 3: DIRECT MANUAL EMAIL & PASSWORD SIGN-IN */}
              {/* ────────────────────────────────────────────────────────── */}
              {viewStep === 'direct' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-200" noValidate>
                  
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <LockKeyhole className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{isRtl ? 'الدخول المباشر بالبريد الإلكتروني' : 'Direct Email Sign In'}</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                        {isRtl ? 'أدخل بريدك المؤسسي المسجل وكلمة المرور المعتمدة.' : 'Enter your registered enterprise email and password.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleBackToDirectory}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-[11px] font-bold text-slate-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      {isRtl ? 'دليل المكاتب' : 'Desk Directory'}
                    </button>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                      {isRtl ? 'البريد الإلكتروني المؤسسي' : 'Official Enterprise Email'}
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-zinc-400 absolute right-3.5 pointer-events-none" />
                      <input
                        ref={directEmailInputRef}
                        type="email"
                        value={manualEmail}
                        onChange={e => setManualEmail(e.target.value)}
                        placeholder="user@rohamaab.org"
                        className="w-full pl-3.5 pr-10 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">
                        {isRtl ? 'كلمة المرور' : 'Password'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setForgotEmail(manualEmail);
                          setShowForgotPasswordModal(true);
                        }}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-zinc-400 absolute right-3.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onKeyDown={checkCapsLock}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="p-1 text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 absolute left-3 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {isCapsLockOn && (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{isRtl ? 'تنبيه: زر الحروف الكبيرة (Caps Lock) مفعل' : 'Caps Lock is ON'}</span>
                      </span>
                    )}
                  </div>

                  {/* Remember & Submit */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-slate-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 dark:bg-zinc-950 dark:border-zinc-800"
                      />
                      <span>{isRtl ? 'حفظ الجلسة على هذا الجهاز' : 'Remember on this device'}</span>
                    </label>

                    <span className="text-[11px] text-zinc-400 font-medium">
                      {isRtl ? 'إقفال تلقائي عند عدم النشاط' : 'Inactivity auto-lock'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isRtl ? 'تسجيل الدخول والتحقق الآمن' : 'Authenticate & Sign In'}</span>
                        {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Dignified Footer Note in Card */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isRtl ? 'بيئة عمل مؤسسية محمية وموثقة' : 'Secure Institutional Workstation'}</span>
                </span>
                <span>{isRtl ? 'بوابة النفاذ الرسمية' : 'Official Portal'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 1: ENTERPRISE DOMAINS OVERVIEW */}
      {/* ────────────────────────────────────────────────────────── */}
      {showSystemInfoModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSystemInfoModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'المعمارية المؤسسية لنظام UAMEX ERP™' : 'UAMEX ERP™ Enterprise Architecture'}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {isRtl ? '15 قطاعاً ومجالاً مؤسسياً متكاملاً' : '15 Integrated Enterprise Domains'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowSystemInfoModal(false)}
                className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
              <p className="font-bold text-slate-900 dark:text-white">
                {isRtl 
                  ? 'تم تصميم نظام UAMEX ERP خصيصاً لتلبية أعلى المعايير المؤسسية في إدارة المنظمات، مستنداً إلى 15 قطاعاً مترابطاً:' 
                  : 'UAMEX ERP is architected around 15 core enterprise domains uniting all strategic, operational, and financial functions:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">1. الاستراتيجية والأداء المؤسسي</span>
                  <span className="text-[11px] text-zinc-400">مؤشرات الأداء الاستراتيجي ومتابعة الخطط التشغيلية.</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">2. البرامج والمشاريع الميدانية</span>
                  <span className="text-[11px] text-zinc-400">إدارة الأنشطة والمهام وتوثيق الشواهد الميدانية.</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">3. رعاية المستفيدين والأيتام</span>
                  <span className="text-[11px] text-zinc-400">سجل موحد ودقيق للمستحقين لمنع الازدواجية وضمان العدالة.</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">4. المالية والمحاسبة المعتمدة</span>
                  <span className="text-[11px] text-zinc-400">القيود المزدوجة، ميزان المراجعة، ومطابقة الصناديق والبنوك.</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">5. المشتريات والمناقصات والمخازن</span>
                  <span className="text-[11px] text-zinc-400">سلاسل الإمداد، عروض الأسعار، والمطابقة الثلاثية لسندات الصرف.</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">6. الرقابة والتقييم والجودة (MEAL)</span>
                  <span className="text-[11px] text-zinc-400">تقييم الأثر الإنساني، معالجة الملاحظات، وتحسين الكفاءة.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSystemInfoModal(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 2: GOVERNANCE & SECURITY POLICY */}
      {/* ────────────────────────────────────────────────────────── */}
      {showSecurityPolicyModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSecurityPolicyModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-5 relative"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'ميثاق الأمان والحوكمة والامتثال' : 'Governance & Security Policies'}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {isRtl ? 'حماية البيانات والمعايير المؤسسية المعتمدة' : 'Institutional Compliance & Protection'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowSecurityPolicyModal(false)}
                className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="font-black text-emerald-600 dark:text-emerald-400 block">{isRtl ? '1. حوكمة الصلاحيات وعزل البيانات:' : '1. Departmental Access Governance:'}</span>
                <span>{isRtl ? 'يتم عزل وصول المستخدمين بدقة وفق كل إدارة ومكتب، مع تحديد سقوف المبالغ والاعتمادات المالية.' : 'Strict departmental isolation for transaction approvals and data access.'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="font-black text-purple-600 dark:text-purple-400 block">{isRtl ? '2. حماية وتأمين الجلسات:' : '2. Session Protection:'}</span>
                <span>{isRtl ? 'تأمين كامل لكافة الاتصالات وسجلات البيانات مع تسجيل خروج تلقائي عند عدم النشاط لضمان الأمان.' : 'Inactivity timeout and secure credential encryption at all times.'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="font-black text-amber-600 dark:text-amber-400 block">{isRtl ? '3. سجل التدقيق الإداري غير القابل للتعديل:' : '3. Immutable Audit Trail:'}</span>
                <span>{isRtl ? 'توثيق مؤكد لكافة العمليات الإدارية والمالية وتعديلات البيانات لضمان الشفافية والمساءلة.' : 'Complete audit trail for all operational changes and financial postings.'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSecurityPolicyModal(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-xl text-xs font-black cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 3: INSTITUTIONAL SUPPORT & HELPDESK */}
      {/* ────────────────────────────────────────────────────────── */}
      {showSupportModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSupportModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-5 relative"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'المساندة والدعم الإداري والتقني' : 'Institutional Support'}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {isRtl ? 'فريق المساندة المؤسسية المعتمد' : 'Enterprise Operations Support'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <span className="text-zinc-400 block mb-0.5">{isRtl ? 'البريد الرسمي للمساندة:' : 'Support Email:'}</span>
                <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">it.support@rohamaab.org</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <span className="text-zinc-400 block mb-0.5">{isRtl ? 'المقر الرئيسي للمنظمة:' : 'Headquarters:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">{isRtl ? 'تعز - الجمهورية اليمنية' : 'Taiz - Republic of Yemen'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSupportModal(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white rounded-xl text-xs font-black cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 4: FORGOT PASSWORD RECOVERY REQUEST */}
      {/* ────────────────────────────────────────────────────────── */}
      {showForgotPasswordModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setShowForgotPasswordModal(false);
            setForgotSubmitted(false);
          }}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-5 relative"
            dir={isRtl ? 'rtl' : 'ltr'}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? 'استعادة كلمة المرور' : 'Password Recovery'}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {isRtl ? 'طلب إعادة تعيين من إدارة النظام' : 'Request Password Reset'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setForgotSubmitted(false);
                }}
                className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="space-y-4 py-3 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {isRtl ? 'تم إرسال طلب إعادة التعيين' : 'Reset Request Submitted'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {isRtl ? 'تم إشعار إدارة الحوكمة والنظام. سيتم التواصل معك عبر القنوات الرسمية المعتمدة.' : 'System administration has been notified to assist you.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotSubmitted(false);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
                >
                  {isRtl ? 'حسناً' : 'Done'}
                </button>
              </div>
            ) : (
              <form 
                onSubmit={e => {
                  e.preventDefault();
                  setForgotSubmitted(true);
                }}
                className="space-y-4"
              >
                <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                  {isRtl 
                    ? 'أدخل بريدك الإلكتروني المؤسسي المسجل لإرسال طلب استعادة كلمة المرور إلى إدارة الحوكمة والدعم الفني.' 
                    : 'Enter your registered email address to submit a password reset ticket to system administrators.'}
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block">
                    {isRtl ? 'البريد الإلكتروني المؤسسي' : 'Enterprise Email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="user@rohamaab.org"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                  >
                    {isRtl ? 'إرسال الطلب' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Global Institutional Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 text-center text-[11px] sm:text-xs text-slate-500 dark:text-zinc-500 font-medium border-t border-slate-200/60 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2 pb-safe">
        <div className="flex items-center gap-2">
          <span>
            © {new Date().getFullYear()} {isRtl ? 'جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'Rohamā\'a Baynahum Charity Foundation'}
          </span>
          <span className="hidden sm:inline text-zinc-400">•</span>
          <span className="hidden sm:inline text-[10px] text-zinc-400">
            {isRtl ? 'ترخيص رقم: YE-NGO-2024-8891' : 'Licence: YE-NGO-2024-8891'}
          </span>
        </div>
        <div className="flex items-center gap-3 font-medium text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
          <span>UAMEX ERP™ v2.6.0-Enterprise</span>
        </div>
      </footer>
    </div>
  );
}
