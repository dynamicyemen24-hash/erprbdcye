import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Command, 
  Search, 
  X, 
  Users, 
  Briefcase, 
  Layers, 
  Heart, 
  Coins, 
  Settings, 
  Database, 
  FileText, 
  Globe, 
  Compass, 
  Moon, 
  Sun, 
  RefreshCw, 
  Download, 
  Sliders, 
  Mic, 
  MicOff, 
  Sparkles, 
  Zap, 
  CornerDownLeft, 
  Keyboard,
  FileCheck,
  Target,
  PieChart,
  Handshake,
  Award,
  ShoppingCart,
  TrendingUp,
  Plus,
  Printer,
  History,
  Star,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

import { Project, User as UserType, TabId } from '../types';
import { triggerHaptic } from '../helpers/hapticSwipe';
import { fuzzyMatchArabic, normalizeArabicText } from '../core/utils/arabicSearch';

interface UniversalCommandCenterProps {
  lang: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabId) => void;
  projects?: Project[];
  beneficiaries?: any[];
  programs?: any[];
  users?: UserType[];
  density?: 'compact' | 'comfortable' | 'spacious';
  setDensity?: (density: 'compact' | 'comfortable' | 'spacious') => void;
  theme?: 'light' | 'dark' | 'system';
  setTheme?: (theme: 'light' | 'dark' | 'system') => void;
  setLang?: (fn: (prev: 'ar' | 'en') => 'ar' | 'en') => void;
  onRefreshData?: () => void;
  onOpenShortcutsModal?: () => void;
}

type CategoryType = 'ALL' | 'FREQUENT' | 'DOMAINS' | 'REPORTS' | 'ACTIONS' | 'RECORDS' | 'SETTINGS';

interface CommandItem {
  id: string;
  category: CategoryType;
  titleAr: string;
  titleEn: string;
  subAr?: string;
  subEn?: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  shortcut?: string;
  action: () => void;
  popularity?: number;
}

export const UniversalCommandCenter: React.FC<UniversalCommandCenterProps> = ({
  lang,
  isOpen,
  onClose,
  onNavigate,
  projects = [],
  beneficiaries = [],
  programs = [],
  users = [],
  density = 'comfortable',
  setDensity,
  theme = 'dark',
  setTheme,
  setLang,
  onRefreshData,
  onOpenShortcutsModal
}) => {
  if (!isOpen) return null;
  const isRtl = lang === 'ar';

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentActionIds, setRecentActionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_recent_commands');
      return saved ? JSON.parse(saved) : ['rep-exec', 'act-new-voucher', 'act-new-beneficiary', 'dom-neb10'];
    } catch {
      return ['rep-exec', 'act-new-voucher', 'act-new-beneficiary', 'dom-neb10'];
    }
  });

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const recordActionUse = useCallback((id: string) => {
    setRecentActionIds(prev => {
      const updated = [id, ...prev.filter(item => item !== id)].slice(0, 8);
      try {
        localStorage.setItem('nexora_recent_commands', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Voice Search Handler
  const toggleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isRtl ? 'خاصية التعرف الصوتي غير مدعومة في متصفحك الحالي' : 'Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isRtl ? 'ar-SA' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // 1. All 15 Nexora Enterprise Domains (NEB-01 to NEB-15)
  const domainCommands: CommandItem[] = useMemo(() => [
    { id: 'dom-neb01', category: 'DOMAINS', titleAr: 'NEB-01: الاستراتيجية والأداء المؤسسي', titleEn: 'NEB-01: Strategy & Performance OS', subAr: 'مؤشرات الأداء KPI، الخطة الاستراتيجية، ومصفوفة النتائج', subEn: 'Strategic plan, KPIs & outcome matrix', icon: Target, badge: 'NEB-01', badgeColor: 'bg-emerald-500/10 text-emerald-600', action: () => { onNavigate('strategic_planning'); onClose(); } },
    { id: 'dom-neb02', category: 'DOMAINS', titleAr: 'NEB-02: المحافظ والاستثمارات الوقفية', titleEn: 'NEB-02: Portfolio & Endowment OS', subAr: 'أصول الأوقاف، العقارات الوقفية، والعوائد الاستثمارية', subEn: 'Endowment assets & financial investments', icon: PieChart, badge: 'NEB-02', badgeColor: 'bg-indigo-500/10 text-indigo-600', action: () => { onNavigate('investments'); onClose(); } },
    { id: 'dom-neb03', category: 'DOMAINS', titleAr: 'NEB-03: إدارة البرامج التنموية الشاملة', titleEn: 'NEB-03: Program Management OS', subAr: '10 برامج معتمدة (الأيتام، الغذاء، المياه، المساجد)', subEn: '10 active development programs', icon: Layers, badge: 'NEB-03', badgeColor: 'bg-amber-500/10 text-amber-600', action: () => { onNavigate('programs'); onClose(); } },
    { id: 'dom-neb04', category: 'DOMAINS', titleAr: 'NEB-04: المشاريع الميدانية ومخططات الإنجاز', titleEn: 'NEB-04: Project Management OS', subAr: '18 مشروعاً ميدانياً، مؤشرات SPI/CPI، ومخطط Gantt', subEn: '18 field projects with Gantt timeline', icon: Briefcase, badge: 'NEB-04', badgeColor: 'bg-blue-500/10 text-blue-600', action: () => { onNavigate('projects'); onClose(); } },
    { id: 'dom-neb05', category: 'DOMAINS', titleAr: 'NEB-05: العمليات الميدانية وهيكل الأنشطة WBS', titleEn: 'NEB-05: Operations & WBS OS', subAr: '269 نشاطاً ميدانياً مرتبطاً بالكامل بسلسلة الإنجاز', subEn: '269 linked activities & field operations', icon: Compass, badge: 'NEB-05', badgeColor: 'bg-cyan-500/10 text-cyan-600', action: () => { onNavigate('activities'); onClose(); } },
    { id: 'dom-neb06', category: 'DOMAINS', titleAr: 'NEB-06: تقديم الخدمات وسجل المستفيدين', titleEn: 'NEB-06: Beneficiaries & Service Delivery OS', subAr: '418 مستفيداً مسجلاً، الفئات المستحقة، وتقييم الاحتياج', subEn: '418 beneficiaries registry & needs assessment', icon: Users, badge: 'NEB-06', badgeColor: 'bg-teal-500/10 text-teal-600', action: () => { onNavigate('beneficiaries'); onClose(); } },
    { id: 'dom-neb07', category: 'DOMAINS', titleAr: 'NEB-07: كفالات الأيتام والعمل المجتمعي', titleEn: 'NEB-07: Sponsorships & Community OS', subAr: '418 كفالة مسندة ومطابقة للمستفيدين', subEn: '418 active sponsorships & social care', icon: Heart, badge: 'NEB-07', badgeColor: 'bg-rose-500/10 text-rose-600', action: () => { onNavigate('sponsorships'); onClose(); } },
    { id: 'dom-neb08', category: 'DOMAINS', titleAr: 'NEB-08: الشراكات والمانحون وشبكة الأطراف', titleEn: 'NEB-08: Partnership & Funding OS', subAr: '470 طرفاً معتمداً، عقود المانحين، ومذكرات التفاهم', subEn: '470 approved parties & donor contracts', icon: Handshake, badge: 'NEB-08', badgeColor: 'bg-violet-500/10 text-violet-600', action: () => { onNavigate('contracts'); onClose(); } },
    { id: 'dom-neb09', category: 'DOMAINS', titleAr: 'NEB-09: الكادر البشري والأصول المؤسسية', titleEn: 'NEB-09: HR & Resource/Asset OS', subAr: '14 كادراً وظيفياً بهيكل الأقسام والرواتب والأصول', subEn: '14 staff positions, payroll & asset registry', icon: Award, badge: 'NEB-09', badgeColor: 'bg-sky-500/10 text-sky-600', action: () => { onNavigate('users'); onClose(); } },
    { id: 'dom-neb10', category: 'DOMAINS', titleAr: 'NEB-10: المحاسبة المالية والحوكمة IPSAS', titleEn: 'NEB-10: Finance & IPSAS Ledger OS', subAr: '246 حساباً شجرياً، سندات الصرف والقبض، وميزان المراجعة', subEn: '246 chart of accounts, vouchers & IPSAS trial balance', icon: Coins, badge: 'NEB-10', badgeColor: 'bg-emerald-500/10 text-emerald-600', action: () => { onNavigate('finance'); onClose(); } },
    { id: 'dom-neb11', category: 'DOMAINS', titleAr: 'NEB-11: المعرفة والأرشيف والسياسات', titleEn: 'NEB-11: Knowledge & Document OS', subAr: 'المستندات الرسمية، الأدلة الإجرائية، وسجل الاعتمادات', subEn: 'Official manuals & document repository', icon: FileText, badge: 'NEB-11', badgeColor: 'bg-amber-500/10 text-amber-600', action: () => { onNavigate('docs'); onClose(); } },
    { id: 'dom-neb12', category: 'DOMAINS', titleAr: 'NEB-12: التكامل والخدمات الرقمية والعملات', titleEn: 'NEB-12: Digital Services & Currency OS', subAr: 'أسعار الصرف، واجهات API، والمزامنة السحابية Neon', subEn: 'Exchange rates, APIs & Neon database integration', icon: Database, badge: 'NEB-12', badgeColor: 'bg-purple-500/10 text-purple-600', action: () => { onNavigate('currencies'); onClose(); } },
    { id: 'dom-neb13', category: 'DOMAINS', titleAr: 'NEB-13: ذكاء الأثر والتقارير التنفيذية AI', titleEn: 'NEB-13: AI Intelligence & Impact OS', subAr: 'التقارير التحليلية، معايير Sphere/CHS، والملخص الذكي', subEn: 'AI executive reporting & impact analytics', icon: Sparkles, badge: 'NEB-13', badgeColor: 'bg-fuchsia-500/10 text-fuchsia-600', action: () => { onNavigate('reports'); onClose(); } },
    { id: 'dom-neb14', category: 'DOMAINS', titleAr: 'NEB-14: المشتريات والمناقصات والعقود', titleEn: 'NEB-14: Procurement & Contracts OS', subAr: 'أوامر الشراء، عروض الأسعار، وتقييم الموردين', subEn: 'Procurement orders, RFQs & vendor evaluations', icon: ShoppingCart, badge: 'NEB-14', badgeColor: 'bg-orange-500/10 text-orange-600', action: () => { onNavigate('contracts'); onClose(); } },
    { id: 'dom-neb15', category: 'DOMAINS', titleAr: 'NEB-15: تنمية الموارد والتبرعات والإيرادات', titleEn: 'NEB-15: Fundraising & Revenue OS', subAr: 'إدارة التبرعات، الحملات التمويلية، وبوابات الدفع', subEn: 'Donation tracking & revenue optimization', icon: TrendingUp, badge: 'NEB-15', badgeColor: 'bg-lime-500/10 text-lime-600', action: () => { onNavigate('finance'); onClose(); } },
  ], [onNavigate, onClose]);

  // 2. High-Frequency Direct Operational Actions (1-Click Execution)
  const actionCommands: CommandItem[] = useMemo(() => [
    {
      id: 'act-new-voucher',
      category: 'ACTIONS',
      titleAr: 'إنشاء سند صرف / قيد محاسبي جديد',
      titleEn: 'Create New Financial Voucher / Journal Entry',
      subAr: 'إدخال قيد فوري مرتبط بالدليل المحاسبي الشجري والمشروع',
      subEn: 'Immediate voucher posting linked to chart of accounts',
      icon: Plus,
      badge: 'FINANCE',
      badgeColor: 'bg-emerald-500/10 text-emerald-600',
      action: () => { onNavigate('finance'); onClose(); }
    },
    {
      id: 'act-new-beneficiary',
      category: 'ACTIONS',
      titleAr: 'تسجيل مستفيد جديد في قاعدة البيانات',
      titleEn: 'Register New Beneficiary in Database',
      subAr: 'إضافة حالة مستحقة جديدة مع تقييم الاحتياج وبيانات الهوية',
      subEn: 'Add beneficiary record with needs assessment',
      icon: Users,
      badge: 'COMMUNITY',
      badgeColor: 'bg-teal-500/10 text-teal-600',
      action: () => { onNavigate('beneficiaries'); onClose(); }
    },
    {
      id: 'act-new-sponsorship',
      category: 'ACTIONS',
      titleAr: 'ربط كفالة يتيم / أسرة جديدة',
      titleEn: 'Assign New Orphan Sponsorship',
      subAr: 'إسناد كفالة شهرية لمستفيد محدد من البرنامج',
      subEn: 'Link monthly sponsorship to beneficiary',
      icon: Heart,
      badge: 'SPONSORSHIP',
      badgeColor: 'bg-rose-500/10 text-rose-600',
      action: () => { onNavigate('sponsorships'); onClose(); }
    },
    {
      id: 'act-new-activity',
      category: 'ACTIONS',
      titleAr: 'إضافة نشاط ميداني جديد (WBS Activity)',
      titleEn: 'Create New Field Activity (WBS)',
      subAr: 'ربط نشاط تنفيذي بالمشروع والبرنامج التنموي',
      subEn: 'Link field activity to project & program',
      icon: Compass,
      badge: 'OPERATIONS',
      badgeColor: 'bg-cyan-500/10 text-cyan-600',
      action: () => { onNavigate('activities'); onClose(); }
    },
    {
      id: 'act-backup-db',
      category: 'ACTIONS',
      titleAr: 'النسخ الاحتياطي الفوري لقاعدة البيانات وتنزيلها',
      titleEn: 'Database Backup & Instant Download',
      subAr: 'تصدير نسخة JSON/SQL مؤمنة وتنزيلها للحاسوب',
      subEn: 'Export secured backup snapshot to downloads',
      icon: Download,
      badge: 'SYSTEM',
      badgeColor: 'bg-slate-500/10 text-slate-600',
      action: () => { onNavigate('backup' as any); onClose(); }
    },
    {
      id: 'act-refresh-data',
      category: 'ACTIONS',
      titleAr: 'تحديث ومزامنة كافة السجلات الحية مع Neon PostgreSQL',
      titleEn: 'Refresh Live Sync with Neon DB',
      subAr: 'تفريغ الكاش اللحظي وإعادة جلب البيانات الحديثة',
      subEn: 'Flush local cache and fetch fresh datasets',
      icon: RefreshCw,
      badge: 'CACHE',
      badgeColor: 'bg-blue-500/10 text-blue-600',
      action: () => { onRefreshData?.(); onClose(); }
    }
  ], [onNavigate, onRefreshData, onClose]);

  // 3. Direct Deep Links to Reports
  const reportCommands: CommandItem[] = useMemo(() => [
    {
      id: 'rep-exec',
      category: 'REPORTS',
      titleAr: 'التقرير التنفيذي الشامل ذو الـ 10 أجزاء للمجلس',
      titleEn: 'Comprehensive 10-Part Board Executive Report',
      subAr: 'المصفوفة التنفيذية المتكاملة مع إمكانية الطباعة الرسمية PDF',
      subEn: 'Integrated C-Level 10-part report with printable PDF',
      icon: Printer,
      badge: 'PDF EXEC',
      badgeColor: 'bg-amber-500/10 text-amber-600',
      action: () => { onNavigate('reports'); onClose(); }
    },
    {
      id: 'rep-financial-ipsas',
      category: 'REPORTS',
      titleAr: 'التقرير المالي المحاسبي IPSAS والقوائم الختامية',
      titleEn: 'Financial IPSAS Statements & Balance Sheet',
      subAr: 'تقرير الإيرادات والمصروفات والأرصدة الافتتاحية للمؤسسة',
      subEn: 'Revenue, expenses and account ledger balance',
      icon: FileSpreadsheet,
      badge: 'IPSAS BI',
      badgeColor: 'bg-emerald-500/10 text-emerald-600',
      action: () => { onNavigate('reports'); onClose(); }
    },
    {
      id: 'rep-interconnected',
      category: 'REPORTS',
      titleAr: 'مصفوفة الترابط المؤسسي الشاملة (Value Chain)',
      titleEn: 'Interconnected Enterprise Value Chain Tree',
      subAr: 'البرامج -> المشاريع -> الأنشطة -> المستفيدون',
      subEn: 'Programs -> Projects -> Activities -> Beneficiaries',
      icon: Layers,
      badge: 'HIERARCHY',
      badgeColor: 'bg-indigo-500/10 text-indigo-600',
      action: () => { onNavigate('reports'); onClose(); }
    },
    {
      id: 'rep-geo-yemen',
      category: 'REPORTS',
      titleAr: 'التقرير الجغرافي الميداني لكافة محافظات اليمن الـ 21',
      titleEn: '21 Yemen Governorates Field Coverage Report',
      subAr: 'توزيع التدخلات الإنسانية والاحتياج حسب المحافظات',
      subEn: 'Field presence & vulnerability stats by governorate',
      icon: Globe,
      badge: 'MAP 21',
      badgeColor: 'bg-cyan-500/10 text-cyan-600',
      action: () => { onNavigate('reports'); onClose(); }
    },
    {
      id: 'rep-hr-9box',
      category: 'REPORTS',
      titleAr: 'تحليلات الموارد البشرية ومصفوفة 9-Box Grid',
      titleEn: 'HR Intelligence & 9-Box Performance Grid',
      subAr: 'موازن أعباء العمل بالذكاء الاصطناعي وخريطة الامتثال',
      subEn: 'Workforce performance & AI workload balancer',
      icon: Award,
      badge: 'HR BI',
      badgeColor: 'bg-sky-500/10 text-sky-600',
      action: () => { onNavigate('reports'); onClose(); }
    },
    {
      id: 'rep-db-views',
      category: 'REPORTS',
      titleAr: 'مستكشف مشاهدات قاعدة البيانات الحية (74+ Views)',
      titleEn: 'Live Neon DB Views Explorer (74+ Views)',
      subAr: 'استعراض وتصدير بيانات الجداول والمشاهدات السحابية',
      subEn: 'Browse and query live PostgreSQL views',
      icon: Database,
      badge: 'SQL VIEWS',
      badgeColor: 'bg-purple-500/10 text-purple-600',
      action: () => { onNavigate('reports'); onClose(); }
    }
  ], [onNavigate, onClose]);

  // 4. Dynamic Live Records from DB (Projects, Beneficiaries, Programs)
  const recordCommands: CommandItem[] = useMemo(() => {
    const progCmds: CommandItem[] = (programs || []).map(p => ({
      id: `prog-${p.id}`,
      category: 'RECORDS',
      titleAr: `برنامج: ${p.name_ar || p.name_en} [${p.code || 'PROG'}]`,
      titleEn: `Program: ${p.name_en || p.name_ar} [${p.code || 'PROG'}]`,
      subAr: `ميزانية: ${Number(p.budget || 0).toLocaleString()} ريال • ${p.actual_beneficiaries || 0} مستفيد`,
      subEn: `Budget: ${Number(p.budget || 0).toLocaleString()} YER`,
      icon: Layers,
      badge: 'PROGRAM',
      badgeColor: 'bg-amber-500/10 text-amber-600',
      action: () => { onNavigate('programs'); onClose(); }
    }));

    const projCmds: CommandItem[] = (projects || []).map(p => ({
      id: `proj-${p.id}`,
      category: 'RECORDS',
      titleAr: `مشروع: ${p.name_ar || p.name_en} [${(p as any).project_code || p.code || 'PROJ'}]`,
      titleEn: `Project: ${p.name_en || p.name_ar} [${(p as any).project_code || p.code || 'PROJ'}]`,
      subAr: `نسبة الإنجاز: ${p.progress_percent || 0}% • الميزانية: ${Number(p.budget || 0).toLocaleString()} ريال`,
      subEn: `Progress: ${p.progress_percent || 0}%`,
      icon: Briefcase,
      badge: 'PROJECT',
      badgeColor: 'bg-blue-500/10 text-blue-600',
      action: () => { onNavigate('projects'); onClose(); }
    }));

    const benCmds: CommandItem[] = (beneficiaries || []).slice(0, 20).map(b => ({
      id: `ben-${b.id}`,
      category: 'RECORDS',
      titleAr: `مستفيد: ${b.full_name_ar || b.full_name || b.name || 'مستفيد'}`,
      titleEn: `Beneficiary: ${b.full_name_ar || b.full_name || b.name || 'Beneficiary'}`,
      subAr: `المحافظة: ${b.governorate || 'اليمن'} • الحالة: ${b.status_code || 'نشط'}`,
      subEn: `Gov: ${b.governorate || 'Yemen'}`,
      icon: Users,
      badge: 'BENEFICIARY',
      badgeColor: 'bg-teal-500/10 text-teal-600',
      action: () => { onNavigate('beneficiaries'); onClose(); }
    }));

    return [...progCmds, ...projCmds, ...benCmds];
  }, [programs, projects, beneficiaries, onNavigate, onClose]);

  // 5. System UI Settings Commands
  const settingCommands: CommandItem[] = useMemo(() => [
    {
      id: 'set-density-compact',
      category: 'SETTINGS',
      titleAr: 'تغيير كثافة الواجهة: مدمج عالي الكفاءة (Compact Density)',
      titleEn: 'Set Layout Density: Compact',
      subAr: 'عرض أقصى قدر من البيانات في الشاشة الواحدة',
      subEn: 'Display maximum data rows per screen',
      icon: Sliders,
      badge: 'UI',
      badgeColor: 'bg-slate-500/10 text-slate-600',
      action: () => { setDensity?.('compact'); onClose(); }
    },
    {
      id: 'set-density-comfortable',
      category: 'SETTINGS',
      titleAr: 'تغيير كثافة الواجهة: قياسي مريح (Comfortable Density)',
      titleEn: 'Set Layout Density: Comfortable',
      subAr: 'المسافات المعيارية الموصى بها للإدارة',
      subEn: 'Standard recommended layout density',
      icon: Sliders,
      badge: 'UI',
      badgeColor: 'bg-slate-500/10 text-slate-600',
      action: () => { setDensity?.('comfortable'); onClose(); }
    },
    {
      id: 'set-toggle-theme',
      category: 'SETTINGS',
      titleAr: 'التبديل بين الوضع الداكن والنهاري (Dark / Light Theme)',
      titleEn: 'Toggle Theme (Dark / Light)',
      subAr: `الوضع الحالي: ${theme === 'dark' ? 'داكن' : 'نهاري'}`,
      subEn: `Current theme: ${theme}`,
      icon: theme === 'dark' ? Sun : Moon,
      badge: 'THEME',
      badgeColor: 'bg-amber-500/10 text-amber-600',
      action: () => { setTheme?.(theme === 'dark' ? 'light' : 'dark'); onClose(); }
    },
    {
      id: 'set-toggle-lang',
      category: 'SETTINGS',
      titleAr: 'التبديل بين العربية والإنجليزية (Toggle AR / EN)',
      titleEn: 'Toggle Language (Arabic / English)',
      subAr: `اللغة الحالية: ${lang === 'ar' ? 'العربية' : 'English'}`,
      subEn: `Current language: ${lang}`,
      icon: Globe,
      badge: 'LANG',
      badgeColor: 'bg-indigo-500/10 text-indigo-600',
      action: () => { setLang?.(l => l === 'ar' ? 'en' : 'ar'); onClose(); }
    },
    {
      id: 'set-keyboard-shortcuts',
      category: 'SETTINGS',
      titleAr: 'عرض دليل اختصارات لوحة المفاتيح الاحترافية',
      titleEn: 'View Keyboard Shortcuts Cheat Sheet',
      subAr: 'دليل الأوامر السريعة للتنقل بلا ماوس',
      subEn: 'Mouse-free navigation cheatsheet',
      icon: Keyboard,
      badge: 'KEYS',
      badgeColor: 'bg-emerald-500/10 text-emerald-600',
      action: () => { onClose(); onOpenShortcutsModal?.(); }
    }
  ], [setDensity, theme, setTheme, lang, setLang, onOpenShortcutsModal, onClose]);

  // Combined Master Command List
  const masterCommandList = useMemo(() => [
    ...actionCommands,
    ...reportCommands,
    ...domainCommands,
    ...recordCommands,
    ...settingCommands
  ], [actionCommands, reportCommands, domainCommands, recordCommands, settingCommands]);

  // Fuzzy Filtered & Ranked Results
  const filteredCommands = useMemo(() => {
    const q = query.trim();

    if (!q) {
      if (activeCategory === 'FREQUENT') {
        return recentActionIds
          .map(id => masterCommandList.find(c => c.id === id))
          .filter(Boolean) as CommandItem[];
      }
      if (activeCategory !== 'ALL') {
        return masterCommandList.filter(c => c.category === activeCategory);
      }
      // Default view: Show Frequent at top, followed by Actions & Reports
      const recents = recentActionIds
        .map(id => masterCommandList.find(c => c.id === id))
        .filter(Boolean) as CommandItem[];
      const remaining = masterCommandList.filter(c => !recentActionIds.includes(c.id));
      return [...recents, ...remaining];
    }

    // High-speed Fuzzy matching using normalized Arabic & English
    const scored = masterCommandList
      .map(item => {
        if (activeCategory !== 'ALL' && item.category !== activeCategory) {
          return { item, score: 0 };
        }
        const arScore = fuzzyMatchArabic(q, item.titleAr + ' ' + (item.subAr || ''));
        const enScore = fuzzyMatchArabic(q, item.titleEn + ' ' + (item.subEn || ''));
        const badgeScore = item.badge ? fuzzyMatchArabic(q, item.badge) : 0;
        const maxScore = Math.max(arScore, enScore, badgeScore);
        return { item, score: maxScore };
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item);

    return scored;
  }, [query, activeCategory, masterCommandList, recentActionIds]);

  // Keyboard Navigation & Numeric Hotkeys (1-9)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        triggerHaptic('success');
        recordActionUse(filteredCommands[selectedIndex].id);
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.altKey && /^[1-9]$/.test(e.key)) {
      // Alt + 1-9 direct hotkey execution
      const num = parseInt(e.key, 10) - 1;
      if (filteredCommands[num]) {
        e.preventDefault();
        triggerHaptic('success');
        recordActionUse(filteredCommands[num].id);
        filteredCommands[num].action();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-20 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col relative"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3 bg-slate-50/70 dark:bg-zinc-950/70">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Command className="w-5 h-5" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder={isRtl ? 'ابحث عن أي نظام، تقرير، قيد مالي، مستفيد، مشروع، أو أمر تنفيذي...' : 'Search any domain, report, voucher, beneficiary, project or command...'}
            className="w-full bg-transparent border-none text-base font-bold text-slate-900 dark:text-white focus:outline-none placeholder-zinc-400"
          />

          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="text-xs text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 px-2 py-1 rounded-md"
            >
              {isRtl ? 'مسح' : 'Clear'}
            </button>
          )}

          {/* Voice Search Button */}
          <button
            onClick={toggleVoiceSearch}
            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              isListening ? 'bg-rose-500 text-white animate-pulse shadow-md' : 'bg-slate-100 dark:bg-zinc-800 text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={isRtl ? 'البحث الصوتي الذكي' : 'Voice Command Search'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Categories Bar */}
        <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar bg-white dark:bg-zinc-900 text-xs font-bold">
          {[
            { id: 'ALL', ar: 'الكل', en: 'All' },
            { id: 'FREQUENT', ar: 'المتكررة والمفضلة', en: 'Frequent' },
            { id: 'ACTIONS', ar: 'إجراءات سريعة', en: 'Fast Actions' },
            { id: 'REPORTS', ar: 'التقارير والمؤشرات', en: 'Reports & BI' },
            { id: 'DOMAINS', ar: 'المجالات الـ 15', en: '15 Domains' },
            { id: 'RECORDS', ar: 'السجلات الحية', en: 'Live Records' },
            { id: 'SETTINGS', ar: 'الإعدادات', en: 'Settings' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveCategory(cat.id as CategoryType);
                setSelectedIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white font-black shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              {cat.id === 'FREQUENT' && <Star className="w-3 h-3 text-amber-300" />}
              <span>{isRtl ? cat.ar : cat.en}</span>
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[420px] overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((item, idx) => {
              const IconComp = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    triggerHaptic('success');
                    recordActionUse(item.id);
                    item.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 border border-emerald-500/40 shadow-xs'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[13px] truncate text-slate-900 dark:text-white">
                          {isRtl ? item.titleAr : item.titleEn}
                        </span>
                        {item.badge && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border border-current/20 ${item.badgeColor || 'bg-zinc-500/10 text-zinc-400'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {(item.subAr || item.subEn) && (
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                          {isRtl ? item.subAr : item.subEn}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {idx < 9 && (
                      <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-zinc-400">
                        Alt+{idx + 1}
                      </kbd>
                    )}
                    {isSelected && (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black text-[10px]">
                        <span>{isRtl ? 'تشغيل' : 'Open'}</span>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center space-y-3">
              <Search className="w-10 h-10 text-zinc-400 mx-auto opacity-60" />
              <div>
                <p className="text-sm font-black text-slate-700 dark:text-zinc-300">
                  {isRtl ? 'لم يتم العثور على أي نتائج مطابقة' : 'No matching results found'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {isRtl ? 'جرب البحث بكلمات أخرى أو اختر من الأقسام المتاحة أعلاه' : 'Try searching with different keywords or pick a category'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300">↑↓</kbd>
              <span>{isRtl ? 'للتنقل' : 'Navigate'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300">↵</kbd>
              <span>{isRtl ? 'للتنفيذ' : 'Execute'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300">Esc</kbd>
              <span>{isRtl ? 'للإغلاق' : 'Close'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>{isRtl ? 'Neon DB متصل ومباشر' : 'Neon DB Live'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalCommandCenter;
