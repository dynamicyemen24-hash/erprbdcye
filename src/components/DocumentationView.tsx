import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  Search, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Layers, 
  Sparkles, 
  Code, 
  ExternalLink, 
  Compass, 
  Cpu, 
  Database, 
  HelpCircle,
  FolderArchive,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import OperationalScenariosView from './OperationalScenariosView';
import { EnterpriseLogo } from './EnterpriseLogo';
import { ModuleShell } from './enterprise/ModuleShell';

interface DocumentationViewProps {
  lang: 'ar' | 'en';
  onNavigate?: (tab: string) => void;
  orgName?: string;
}

type DocTab = 'specifications' | 'manual' | 'scenarios';

export default function DocumentationView({ lang, onNavigate, orgName }: DocumentationViewProps) {
  const [activeDoc, setActiveDoc] = useState<DocTab>('scenarios');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    philosophy: true,
    domains: true,
    lifecycle: true,
    scenarios: true,
    instructions: true,
    data: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const docTitles = {
    scenarios: lang === 'ar' ? 'السيناريوهات والعمليات التشغيلية' : 'Operational Scenarios & Playbooks',
    specifications: lang === 'ar' ? 'وثيقة المواصفات الفنية والنظام' : 'System Specifications Document',
    manual: lang === 'ar' ? 'دليل المستخدم الشامل' : 'Comprehensive User Manual'
  };

  const docDescriptions = {
    scenarios: lang === 'ar' ? 'سيناريوهات تشغيلية تفاعلية ودليل خطوة بخطوة للعمليات الميدانية، والمالية، والرعاية والحوكمة' : 'Interactive operational playbooks for field, financial, welfare, and governance scenarios.',
    specifications: lang === 'ar' ? 'الهيكلية المؤسسية، الوحدات التشغيلية، وقواعد معالجة البيانات وإدارة السجلات المركزية' : 'Enterprise architecture, operational suites, data governance & central records.',
    manual: lang === 'ar' ? 'إرشادات الاستخدام خطوة بخطوة للمدراء الماليين، منسقي المشاريع الميدانية، والمدققين' : 'Step-by-step guidance for financial managers, field coordinators, and auditors.'
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Searchable documentation index — wired to real in-app doc content
  const DOC_SEARCH_INDEX: { id: string; tab: DocTab; section?: string; titleAr: string; titleEn: string; snippetAr: string; snippetEn: string }[] = [
    { id: 'philosophy', tab: 'specifications', section: 'philosophy', titleAr: 'فلسفة المنتج وسلسلة القيمة والأثر', titleEn: 'Product Philosophy & Value Pipeline', snippetAr: 'خط الرؤية والأثر: رؤية ➔ استراتيجية ➔ محفظة ➔ برامج ➔ مشاريع ➔ عمليات ➔ موارد ➔ نتائج ➔ أثر', snippetEn: 'Vision → Strategy → Portfolio → Programs → Projects → Operations → Resources → Impact' },
    { id: 'domains', tab: 'specifications', section: 'domains', titleAr: 'النطاقات المؤسسية NEB-01 إلى NEB-15', titleEn: 'Nexora Enterprise Domains NEB-01–NEB-15', snippetAr: 'الاستراتيجية، المحافظ، البرامج، المشاريع، العمليات، المستفيدون، المجتمع، الشراكات، الموارد، المالية IPSAS، المعرفة، التكامل، الذكاء الاصطناعي، المشتريات، المبيعات', snippetEn: 'Strategy, Portfolio, Programs, Projects, Operations, Beneficiaries, Community, Partnerships, Resources, Finance IPSAS, Knowledge, Integration, AI, Procurement, Sales' },
    { id: 'lifecycle', tab: 'specifications', section: 'lifecycle', titleAr: 'دورة حياة المشروع والصرف والتعليم والمشتريات', titleEn: 'Project Lifecycle & Cycles', snippetAr: 'مراحل المشروع من الفكرة إلى الإغلاق ودوائر الصرف والتعليم والتوريد', snippetEn: 'Project stages from initiation to closure plus disbursement, education and procurement cycles' },
    { id: 'data', tab: 'specifications', section: 'data', titleAr: 'قواعد البيانات والحوكمة المركزية', titleEn: 'Central Data Governance', snippetAr: 'Neon PostgreSQL، تجزئة البيانات بالمؤسسة organization_id، النسخ الاحتياطي وسجل التدقيق', snippetEn: 'Neon PostgreSQL, tenant isolation via organization_id, backups and audit trail' },
    { id: 'm01', tab: 'manual', titleAr: 'الدخول والبحث الشامل', titleEn: 'Login & Universal Search', snippetAr: 'الدخول بالبريد المعتمد واستخدام بحث ERP الشامل للوصول لأي مشروع أو مستفيد أو قيد فوراً', snippetEn: 'Log in with assigned credentials; use universal search to locate any record instantly' },
    { id: 'm02', tab: 'manual', titleAr: 'البرامج والمشاريع وحزم WBS', titleEn: 'Programs, Projects & WBS', snippetAr: 'إنشاء البرامج أولاً ثم المشاريع وحزم العمل WBS لتأطير الميزانيات وحجز الاعتمادات', snippetEn: 'Create programs first, then projects and WBS work packages for budget control' },
    { id: 'm03', tab: 'manual', titleAr: 'المالية بـ IPSAS والماسح الذكي AI', titleEn: 'IPSAS Finance & Gemini OCR', snippetAr: 'رفع صور الفواتير للماسح الذكي لإنشاء القيد المحاسبي المزدوج آلياً', snippetEn: 'Upload invoice photos; Gemini AI constructs double-entry journal vouchers automatically' },
    { id: 'm04', tab: 'manual', titleAr: 'المشتريات ومصفوفة العروض الثلاثية', titleEn: 'Procurement & 3-Way Quote Matrix', snippetAr: 'إصدار طلبات الشراء PR وطرح المناقصات RFQ وتحليل العروض عبر مصفوفة المقارنة', snippetEn: 'Issue PRs, launch RFQs and analyze vendor quotes via the standard matrix' },
    { id: 'm05', tab: 'manual', titleAr: 'بوابات التبرع الإلكترونية والإيصالات QR', titleEn: 'Multi-Gateway E-Donations & Webhooks', snippetAr: 'استقبال التبرعات عبر الكريمي وجوال بي وStripe وPayPal مع توليد إيصالات QR فورية', snippetEn: 'Process donations via Kuraimi, Jawali, Stripe, PayPal with instant QR receipts' },
    { id: 'm06', tab: 'manual', titleAr: 'التنبؤ المالي واستدامة التمويل', titleEn: 'AI Predictive BI & Sustainability', snippetAr: 'توقع التدفقات 12 شهراً وحساب فترة أمان السيولة وتحوط مخاطر التضخم YER', snippetEn: '12-month cashflow forecasting, liquidity runway and YER inflation hedging' }
  ];

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return DOC_SEARCH_INDEX.filter(e =>
      e.titleAr.toLowerCase().includes(q) ||
      e.titleEn.toLowerCase().includes(q) ||
      e.snippetAr.toLowerCase().includes(q) ||
      e.snippetEn.toLowerCase().includes(q)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const jumpToResult = (entry: typeof DOC_SEARCH_INDEX[number]) => {
    setActiveDoc(entry.tab);
    if (entry.section) {
      setExpandedSections(prev => ({ ...prev, [entry.section!]: true }));
    }
    setSearchQuery('');
  };

  // Render the comprehensive specifications based on the updated SYSTEM_SPECIFICATIONS.md
  const renderSpecifications = () => (
    <div className="space-y-8 text-slate-800 dark:text-zinc-200 leading-relaxed text-sm">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-950 via-zinc-900 to-amber-950 text-white rounded-xl shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <EnterpriseLogo className="h-16 w-auto object-contain bg-white p-2 rounded-xl shadow-lg border border-emerald-400" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-black text-emerald-300">NexoraOS™</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md text-xs font-bold">
                Intelligent Enterprise Operating System
              </span>
            </div>
            <p className="text-xs text-amber-400 font-extrabold">
              {orgName}
              <span className="text-zinc-300 dark:text-zinc-400 font-normal px-2">| One Platform. One Organization. One Vision.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold font-mono">
            15 NEB Domains
          </span>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold font-mono">
            Neon + Gemini 2.5
          </span>
        </div>
      </div>

      {/* Product Philosophy Pipeline */}
      <section className="space-y-3">
        <button
          onClick={() => toggleSection('philosophy')}
          className="w-full text-base font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {expandedSections.philosophy ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          <Sparkles className="w-5 h-5 text-emerald-600" />
          {lang === 'ar' ? 'أولاً: فلسفة المنتج وسلسلة القيمة والأثر (Nexora Product Philosophy™)' : '1. Product Philosophy & Value Pipeline'}
        </button>
        
        {expandedSections.philosophy && (
        
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
          <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
            {lang === 'ar' 
              ? 'نظام NexoraOS™ لا يدير معاملات منفصلة، بل يدير خط الرؤية والأثر المؤسسي المتكامل في منصة موحدة واحدة:' 
              : 'NexoraOS™ manages the end-to-end vision to impact pipeline in one unified intelligent operating system:'}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl font-mono text-[10px] text-slate-700 dark:text-zinc-200 font-extrabold">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">Vision</span>
            <span className="text-amber-500">➔</span>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">Strategy</span>
            <span className="text-amber-500">➔</span>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">Portfolio</span>
            <span className="text-amber-500">➔</span>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">Programs</span>
            <span className="text-amber-500">➔</span>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">Projects</span>
            <span className="text-amber-500">➔</span>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">Operations</span>
            <span className="text-amber-500">➔</span>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">Resources</span>
            <span className="text-amber-500">➔</span>
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">Stakeholders</span>
            <span className="text-amber-500">➔</span>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">Results</span>
            <span className="text-amber-500">➔</span>
            <span className="px-3 py-1 bg-emerald-600 text-white font-bold rounded shadow-lg">Impact</span>
          </div>
        </div>
        )}
      </section>

      {/* The 15 Nexora Enterprise Domains */}
      <section className="space-y-3">
        <button
          onClick={() => toggleSection('domains')}
          className="w-full text-base font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {expandedSections.domains ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          <Layers className="w-5 h-5 text-emerald-600" />
          {lang === 'ar' ? 'ثانياً: الأنظمة المؤسسية الـ 15 (Nexora Enterprise Domains™)' : '2. The 15 Nexora Enterprise Domains™'}
        </button>

        {expandedSections.domains && (
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">NEB-01</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Strategy & Performance OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام الاستراتيجية والأداء: يدير الرؤية والرسالة والأهداف والمؤشرات (KPIs).' : 'Strategy & Performance OS: Vision, mission, goals, and KPIs.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">NEB-02</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Portfolio Management OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام إدارة المحافظ: يدير المحافظ الاستثمارية والمبادرات الكبرى.' : 'Portfolio Management OS: Portfolios, initiatives, and capital programs.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">NEB-03</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Program Management OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام إدارة البرامج: يدير البرامج التنموية والمجتمعية والإستثمارية.' : 'Program Management OS: Developmental, social, and educational programs.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">NEB-04</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Project Management OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام إدارة المشاريع: يدير المشاريع والعقود والميزانيات والمخاطر.' : 'Project Management OS: Projects, contracts, budgets, timelines, and risks.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">NEB-05</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Operations OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام التشغيل الميداني: يدير الأنشطة الميدانية تفصيلياً (WBS) والحملات والفعاليات.' : 'Operations OS: Field operations, detailed activities, WBS, campaigns.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">NEB-06</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Service Delivery OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام تقديم الخدمات: يدير الخدمات، الطلبات، المستفيدين، وحالات التسليم.' : 'Service Delivery OS: Services, beneficiary requests, biometric delivery.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">NEB-07</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Community & Membership OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام المجتمع والأعضاء: يدير الأعضاء، المنتسبين، والمتطوعين الميدانيين.' : 'Community & Membership OS: Members, affiliates, volunteers.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">NEB-08</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Partnership & Funding OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام الشراكات والتمويل: يدير المانحين، اتفاقيات التمويل، وكفالات الأيتام.' : 'Partnership & Funding OS: Donors, grant agreements, orphan sponsorships.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">NEB-09</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Resource & Asset OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام الموارد والأصول: يدير العقارات، الأراضي الوقفية، والأصول التشغيلية.' : 'Resource & Asset OS: Real estate, waqf lands, fixed assets, HR.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">NEB-10</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Finance & Compliance OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'النظام المالي والامتثال: المحاسبة IPSAS، القيود، الحوكمة والتدقيق.' : 'Finance & Compliance OS: IPSAS double-entry, auditing, governance.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">NEB-11</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Knowledge & Document OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام المعرفة والوثائق: يدير المستندات والأرشيف والسياسات المؤسسية.' : 'Knowledge & Document OS: Documents, policy archive, institutional memory.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">NEB-12</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Integration & Digital Services OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'الخدمات الرقمية والتكامل: يدير Neon PostgreSQL وAPIs ومعايير IATI.' : 'Integration & Digital Services OS: Neon PostgreSQL, APIs, IATI standards.'}
            </p>
          </div>

          <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-amber-950/40 rounded-xl border border-emerald-500/30 space-y-1 col-span-1 md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/40">NEB-13</span>
              <span className="text-xs font-black text-emerald-400">AI Intelligence & Impact OS</span>
            </div>
            <p className="text-[11px] text-zinc-300">
              {lang === 'ar' ? 'الذكاء المؤسسي وقياس الأثر: محرك Gemini 2.5 للتحليلات التنبؤية، تقارير قياس الأثر، ومعايير Sphere & CHS.' : 'AI Intelligence & Impact OS: Gemini 2.5 predictive analytics, Sphere/CHS humanitarian impact.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">NEB-14</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Procurement & Tenders OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام المشتريات والمناقصات: طلبات الشراء، RFQs، تحليل العروض، و循证 vendor management.' : 'Procurement & Tenders OS: Purchase requisitions, RFQs, quote analysis, vendor management.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">NEB-15</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Sales, Revenue & Fundraising OS</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              {lang === 'ar' ? 'نظام المبيعات والإيرادات: التبرعات، الفواتير، إيرادات التمويل، وبوابات الدفع الإلكترونية.' : 'Sales, Revenue & Fundraising OS: Donations, invoicing, revenue streams, and payment gateways.'}
            </p>
          </div>
        </div>
        )}
      </section>

      {/* Program Classifications & Project Lifecycle */}
      <section className="space-y-3">
        <button
          onClick={() => toggleSection('lifecycle')}
          className="w-full text-base font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {expandedSections.lifecycle ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          <Compass className="w-5 h-5 text-emerald-600" />
          {lang === 'ar' ? 'رابعاً وخامساً: تصنيف البرامج ودورة حياة المشروع (8 مراحل)' : '4 & 5. Program Types & 8-Stage Lifecycle'}
        </button>

        {expandedSections.lifecycle && (
        <div className="space-y-3">

        {/* Categories */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="font-bold text-xs text-slate-900 dark:text-zinc-100">
            {lang === 'ar' ? 'التصنيف المعتمد للبرامج:' : 'Official Program Categories:'}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-lg">البرامج التعليمية (تحفيظ، علوم شرعية)</span>
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-lg">البرامج الدعوية (توعية، مبادرات)</span>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-lg">البرامج الإغاثية (مساعدات، سلال غذائية)</span>
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-lg">برامج المياه (سقيا، آبار)</span>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-lg">المطابخ الخيرية (وجبات، إطعام)</span>
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-lg">البرامج الموسمية (رمضان، أضاحي، شتاء)</span>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-lg">البرامج المجتمعية (أسرية، شبابية)</span>
          </div>
        </div>

        {/* 8 Stage Lifecycle flow */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
            {lang === 'ar' ? 'دورة حياة المشروع المعتمدة (Project Lifecycle):' : 'Official Project Lifecycle:'}
          </div>
          <div className="flex items-center justify-between overflow-x-auto py-2 gap-2 text-[10px] font-bold">
            <span className="px-2.5 py-1.5 bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-emerald-700 dark:text-emerald-400 shrink-0">1. فكرة</span>
            <span className="text-slate-400 dark:text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-amber-700 dark:text-amber-400 shrink-0">2. دراسة</span>
            <span className="text-slate-400 dark:text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-emerald-700 dark:text-emerald-400 shrink-0">3. اعتماد</span>
            <span className="text-slate-400 dark:text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-amber-700 dark:text-amber-400 shrink-0">4. تخطيط</span>
            <span className="text-slate-400 dark:text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-emerald-700 dark:text-emerald-400 shrink-0">5. تنفيذ</span>
            <span className="text-slate-400 dark:text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-amber-700 dark:text-amber-400 shrink-0">6. متابعة</span>
            <span className="text-slate-400 dark:text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-emerald-700 dark:text-emerald-400 shrink-0">7. إغلاق</span>
            <span className="text-slate-400 dark:text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg shrink-0">8. قياس أثر</span>
          </div>
        </div>

        </div>
        )}
      </section>

      {/* Aid Cycle & Procurement Workflows */}
      <section className="space-y-3">
        <button
          onClick={() => toggleSection('data')}
          className="w-full text-base font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {expandedSections.data ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          <Database className="w-5 h-5 text-emerald-600" />
          {lang === 'ar' ? 'سادساً وسابعاً وثامناً: دوائر الصرف والتعليم والمشتريات' : '6, 7 & 8. Aid Disbursement, Education & Procurement Cycles'}
        </button>

        {expandedSections.data && (

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
            <h4 className="font-bold text-xs text-emerald-700 dark:text-emerald-400">دورة الصرف والمساعدات</h4>
            <p className="text-[11px] text-slate-600 dark:text-zinc-300">
              طلب ➔ دراسة حالة ➔ اعتماد مالي ➔ صرف مستحقات ➔ توثيق ميداني ➔ إغلاق المعاملة.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
            <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400">دورة المشتريات والتوريد</h4>
            <p className="text-[11px] text-slate-600 dark:text-zinc-300">
              طلب شراء ➔ اعتماد ➔ عروض أسعار ➔ اختيار المورد ➔ أمر شراء ➔ استلام ➔ سداد.
            </p>
          </div>
        </div>
        )}
      </section>
    </div>
  );

  // اسئلة المزيد مع مبسط + Accordion
  const renderManual = () => {
    const manualSections = [
      {
        id: 'manual-login',
        icon: '🔐',
        titleAr: 'تسجيل الدخول والوصول للنظام',
        titleEn: 'Sign In & Access',
        summaryAr: 'افتح المتصفح، أدخل بريدك الرسمي وكلمة المرور، واضغط زر "دخول" للوصول للوحة التحكم.',
        summaryEn: 'Open browser, enter official email & password, click "Login" to reach the dashboard.',
        detailAr: [
          'افتح المتصفح (Chrome أو Edge أحدث إصدار) وانتقل إلى رابط النظام المعتمد.',
          'مظهر الشاشة سريعاً: تدخل بريدك الإلكتروني الرسمي ثم كلمة المرور.',
          'اضغط الزر الأخضر "دخول" وسيتم نقلك تلقائياً للوحة المعلومات الرئيسية.',
          'هناك خيار "تذكر هذا الجهاز" — استخدمه فقط على أجهزتك الشخصية.',
          'إذا أخطأت بنص كلمة المرور أو تفعيل Caps Lock سيظهر لك تنبيه تحذيري قبل الإرسال.',
          'نسيت كلمة المرور؟ اضغط "نسيت كلمة المرور؟" ويتم إرسال طلب إعادة التعيين إلى إدارة تقنية المعلومات.'
        ],
        detailEn: [
          'Open browser at the official system URL.',
          'Enter your official email and password.',
          'Click green "Sign In" button — you\'ll be taken to the dashboard.',
          'Use "Remember this device" only on personal trusted machines.',
          'Caps Lock alerts appear before submitting wrong passwords.',
          'Forgot password? Click "Forgot Password?" to route a secure reset request.'
        ]
      },
      {
        id: 'manual-nav',
        icon: '🗺️',
        titleAr: 'التنقل بين الأنظمة والبحث',
        titleEn: 'Navigation & Search',
        summaryAr: 'استخدم القائمة الجانبية للانتقال بين الأنظمة، أو اضغط Ctrl+K للبحث السريع عن أي شاشة أو سجل.',
        summaryEn: 'Use the side menu to switch systems, or press Ctrl+K for instant search of any screen or record.',
        detailAr: [
          'من الشريط الجانبي الأيسر تُعرض جميع الأنظمة مقسمة إلى مجموعات: (الاستراتيجية، العمليات، الخدمات، المالية، الحوكمة، التقنية، الذكاء).',
          'اضغط على اسم النظام المطلوب للدخول إلى شاشته الرئيسية.',
          'داخل كل نظام توجد علامات تبويب فرعية للتنقل بين الشاشات (مثال: البرامج، المشاريع، الأنشطة، التقارير).',
          'البحث السريع: اضغط Ctrl+K (أو استخدم شريط البحث أعلى الصفحة) واكتب اسم أي سجل أو نظام أو مستفيد.',
          'ستظهر النتائج فوراً عبر جميع المجالات مع إمكانية النقر عليها للانتقال المباشر.'
        ],
        detailEn: [
          'Left sidebar groups all systems into logical bundles.',
          'Click a system name to open its workspace.',
          'Each system has sub-tabs for detailed screens.',
          'Press Ctrl+K for universal search across all data.',
          'Click any result to jump instantly to the record.'
        ]
      },
      {
        id: 'manual-programs',
        icon: '📦',
        titleAr: 'إضافة برنامج أو مشروع جديد',
        titleEn: 'Add Program or Project',
        summaryAr: 'من نظام "البرامج" اضغط "+ إضافة جديد"، أدخل الاسم والرمز والميزانية والجهة الممولة، ثم احفظ — وأضف المشاريع أسفل البرنامج.',
        summaryEn: 'Open Programs module, click "+ New", fill name/code/budget/donor, save, then add projects beneath.',
        detailAr: [
          'افتح نظام "البرامج" من القائمة الجانبية (أو Ctrl+K واكتب "البرامج").',
          'اضغط الزر الأخضر "+ برنامج جديد".',
          'املأ الحقول: اسم البرنامج (عربي)، الاسم بالإنجليزية إن وجد، رقم تسلسلي (مثل PRG-2026-001)، نوع البرنامج (إغاثي، تنموي، تعليمي، صحي...).',
          'أدخل الميزانية الإجمالية والفترة الزمنية (تاريخ البدء والنهاية) والجهة الممولة.',
          'اضغط "حفظ". سيظهر البرنامج فوراً في قائمة البرامج النشطة.',
          'لإضافة مشروع داخل البرنامج: افتح بطاقة البرنامج واضغط "إضافة مشروع" واملأ نفس النوع من البيانات مع ربط البرنامج.'
        ],
        detailEn: [
          'Open Programs module and click "New Program".',
          'Fill Arabic name, optional English name, code, category, budget, dates.',
          'Assign funding source (donor/fund).',
          'Save — program appears immediately in grid.',
          'Add projects by opening the program card and clicking "Add Project".'
        ]
      },
      {
        id: 'manual-beneficiary',
        icon: '🤝',
        titleAr: 'تسجيل مستفيد جديد وتقديم المساعدة',
        titleEn: 'Register Beneficiaries & Services',
        summaryAr: 'من نظام "المستفيدين" اضغط "+ مستفيد جديد"، أدخل البيانات الشخصية بما فيها الحالة والدرجة، ثم احفظه ليكون جاهزاً للربط بالمساعدات.',
        summaryEn: 'In Beneficiaries, click "+ New Beneficiary", fill personal data & vulnerability score, save.',
        detailAr: [
          'افتح نظام "المستفيدين" (تقديم الخدمات).',
          'اضغط "+ مستفيد جديد".',
          'أدخل: رمز المستفيد (مثل BN-2026-00042)، الاسم الكامل، رقم الهوية أو كود التعريف، نوع الأسرة وعدد أفرادها.',
          'اختر المحافظة والمديرية واكتب العنوان والقرية.',
          'حدد درجة الاحتياج أو الضعف (متقدم / متوسط / خفيف) من التقييم الاجتماعي.',
          'حدد الحالة ("مسجل" أو "قيد التقييم") واضغط "حفظ" — يصبح المستفيد متاحاً في كامل النظام ليُربط بالبرامج والكفالات والخدمات.'
        ],
        detailEn: [
          'Open Beneficiaries module.',
          'Click Add Beneficiary, enter details & vulnerability score.',
          'Select governorate, district, and case status.',
          'Save to make the beneficiary available across programs and services.'
        ]
      },
      {
        id: 'manual-finance',
        icon: '💰',
        titleAr: 'إدخال معاملة مالية وقيد محاسبي',
        titleEn: 'Record Financial Transactions',
        summaryAr: 'في النظام المالي، اضغط "قيد جديد"، أدخل المبلغ والوصف، أضف الحركة (من حساب إلى حساب)، والموازنة تُفحص تلقائياً ثم تُرحل.',
        summaryEn: 'In Finance, create voucher, enter amount and description, add journal lines; balance is auto-checked.',
        detailAr: [
          'افتح نظام "المالية والحسابات" (يمكن الوصول له من القائمة المالية والحوكمة).',
          'اختر "قيود اليومية" من القائمة الفرعية.',
          'اضغط "قيد جديد". يُنشأ رقم مرجعي تلقائياً.',
          'حدد التاريخ المالي واكتب وصفاً للإع operation.',
          'أضف سطراً (مدين) إلى حساب مصادر الأموال + سطراً (دائن) إلى حساب الوجهة — أو العكس.',
          'يعيّن النظام تلقائياً أرقام الحسابات وفقاً لتصنيف الحسابات القياسي.',
          'اضغط "ترحيل القيد" — يجب أن يكون إجمالي المدين مساوياً لإجمالي الدائن وإلا لن يسمح الحفظ.',
          'بعد الترحيل يُسجل القيد فوراً في الأستاذ العام ومركز التكلفة المرتبط.'
        ],
        detailEn: [
          'Heyboard: Finance module → Daybook Vouchers.',
          'Create new entry: pick date, write description.',
          'Add at least 2 lines (debit and credit).',
          'System validates total debits = total credits.',
          'Post voucher to update the general ledger immediately.'
        ]
      },
      {
        id: 'manual-purchase',
        icon: '📋',
        titleAr: 'شراء مستلزمات واعتماد توريد',
        titleEn: 'Purchase & Approve Supplies',
        summaryAr: 'اكتب طلب شراء، اعتمده، اطلب عروض أسعار من موردين، اختر الأفضل، ثم أرسل أمر شراء واستلم البضاعة وسجّل الإيصال.',
        summaryEn: 'Create purchase request → approve → request quotes → select best → approve PO → receive & record.',
        detailAr: [
          'افتح نظام "المشتريات والتوريد".',
          'أنشئ "طلب شراء" بأصناف وكميات وحدد المستندات والميزانية المتاحة.',
          'أرسل الطلب للموافقة (أو وافق عليه أنت إذا كانت صلاحياتك كافية).',
          'بعد الموافقة، أرسل "طلب عروض أسعار" إلى ثلاثة موردين محتملين على الأقل.',
          'أدخل العروض الواردة في مصفوفة المقارنة — النظام يقيم السعر والأقل تكلفة.',
          'اختر المورد الأنسب واضغط "اعتماد أمر شراء".',
          'بعد الاستلام، افتح "استلام" وسجل الأصناف المستلمة — يُحدَّث المخزون تلقائياً.',
          'أرفق الفاتورة وسند التوريد الخارجي وترحّل الدفعة للمالية.'
        ],
        detailEn: [
          'Procurement module.',
          'Create request for goods.',
          'Get approval, issue 3-Request',
          'Enter quotes into comparison matrix, choose best.',
          'Approve purchase order.',
          'On delivery, record receiving against PO and pay invoice.'
        ]
      },
      {
        id: 'manual-reports',
        icon: '📊',
        titleAr: 'عرض التقارير وطباعتها وتصديرها',
        titleEn: 'Reports, Print & Export',
        summaryAr: 'افتح مركز التقارير، اختر التقرير المطلوب ونطاقه (فترة/محافظة/حالة)، اضغط توليد، ثم اطبع أو صدّر PDF أو Excel.',
        summaryEn: 'Reports center: pick report, filters, generate, print/PDF or Excel export.',
        detailAr: [
          'انتقل إلى مركز التقارير والتقارير المالية أو المتابعة أو الأثر.',
          'حدد نوع التقرير المطلوب (مثال: ملخص الأنشطة، كشف مالي، سجل مستفيدين).',
          'اضبط الفلاتر: الفترة الزمنية، المحافظة، مرحلة المشروع أو حالته.',
          'اضغط "توليد التقرير" — يُعرض الجداول والرسوم البيانية فوراً.',
          'لطباعة / لتصدير PDF: اضغط أيقونة الطابعة أو زر التصدير أعلى التقرير.',
          'يخرج التقرير بغلاف رسمي بهوية جمعية رُحماء وشعارها ورمز QR ورقم تتبع تدقيق.'
        ],
        detailEn: [
          'Open Reports Center.',
          'Choose report type & filters.',
          'Click Generate.',
          'Print or export PDF/Excel with official branding and QR audit code.'
        ]
      },
      {
        id: 'manual-settings',
        icon: '⚙️',
        titleAr: 'الإعدادات الشخصية والحساب',
        titleEn: 'Personal Settings & Profile',
        summaryAr: 'اضغط على صورتك أعلى يمين الشاشة لتغيير كلمة المرور واللغة والوضع الليلي، وقفل الجلسة بـ Ctrl+L.',
        summaryEn: 'Click profile avatar for password, language, dark mode and session lock.',
        detailAr: [
          'اضغط على اسمك أو صورتك أعلى يسار الصفحة لفتح قائمة الحساب.',
          'تغيير كلمة المرور: أدخل الحالية والجديدة ثم اضغط "حفظ".',
          'اللغة: اضغط زر EN/ع في الشريط العلوي للتبديل بين العربية والإنجليزية في أي وقت.',
          'الوضع الليلي/النهاري: اضغط زر الشمس/القمر للتغيير فوراً (أو يتبع النظام تفضيل جهازك).',
          'قفل الجلسة: اضغط Ctrl+L أو زر القفل لقفل الجلسة فوراً عند المغادرة.',
          'تثبيت النظام كتطبيق على هاتفك: من إعدادات المتصفح اختر "تثبيت التطبيق" ويصبح على سطح المكتب.'
        ]
      }
    ];

    const [activeManualId, setActiveManualId] = useState<string | null>(null);

    return (
      <div className="space-y-6 text-slate-800 dark:text-zinc-200 leading-relaxed text-sm">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-900/10 via-amber-800/5 to-emerald-500/10 rounded-xl border border-amber-500/20 dark:border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <EnterpriseLogo className="h-12 w-auto object-contain bg-white/90 p-1.5 rounded-xl shadow-md border border-amber-200 dark:border-amber-800" />
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-100">
                {lang === 'ar' ? `دليل المستخدم - ${orgName}` : `User Manual - ${orgName}`}
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                {lang === 'ar' ? 'شرح مبسط لمعظم المهام — بسيطة ببداية كل قسم ثم تفصيل عند اشتاً أنت بالضغط' : 'Simple task guide — summaries shown; click a card for full steps.'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold shrink-0">
            {lang === 'ar' ? '🇬 دليل تفاعلي مبسط' : '🇬 Simple Interactive Guide'}
          </span>
        </div>

        {/* Accordion Cards */}
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-1 space-y-3">
          {manualSections.map((sec, idx) => {
            const isOpen = activeManualId === sec.id;
            return (
              <div
                key={sec.id}
                className={`bg-slate-50 dark:bg-zinc-900/70 border ${
                  isOpen ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-slate-200 dark:border-zinc-800'
                } rounded-xl overflow-hidden transition-all`}
              >
                {/* Summary / Header */}
                <button
                  onClick={() => setActiveManualId(isOpen ? null : sec.id)}
                  className="w-full flex items-center gap-3 p-4 text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-emerald-500/20 to-amber-500/20 flex items-center justify-center text-lg shadow-inner">
                    {sec.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                      {lang === 'ar' ? sec.titleAr : sec.titleEn}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed line-clamp-2 mt-0.5">
                      {lang === 'ar' ? sec.summaryAr : sec.summaryEn}
                    </p>
                  </div>
                  <div className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-amber-500' : 'text-slate-400'}`} />
                  </div>
                </button>

                {/* Expanded Detail */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-zinc-800/60 max-h-[40vh] overflow-y-auto custom-scrollbar">
                    <ol className="space-y-2.5 mt-3">
                      {((lang === 'ar' ? sec.detailAr : sec.detailEn) || []).map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                          <span className="shrink-0 w-5 h-5 mt-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  return (
    <ModuleShell
      titleAr="مركز الوثائق"
      titleEn="Documentation Center"
      domainCode="NEB-11"
      icon={BookOpen}
      lang={lang}
    >
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 p-0.5 shadow-md shrink-0">
              <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-[14px] flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-zinc-100">
                  {lang === 'ar' ? 'مركز الوثائق التشغيلية' : 'Documentation & System Directives'}
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold rounded-full">
                  /docs
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                {lang === 'ar' 
                  ? 'المستندات الرسمية المعتمدة لجمعية رُحماء بينهم: مواصفات النظام، دليل المستخدم، ' 
                  : 'Official documentation suite for Rohamā\'a Baynahum Charity Foundation ERP.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleCopy(`Documentation files stored in /docs:\n1. /docs/SYSTEM_SPECIFICATIONS.md\n2. /docs/USER_MANUAL.md`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ المسارات' : 'Copy Paths')}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Search Bar for Documentation */}
        {activeDoc !== 'scenarios' && (
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? '🔍 ابحث في الوثائق...' : '🔍 Search documentation...'}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation Buttons */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-100 dark:border-zinc-800 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveDoc('scenarios')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeDoc === 'scenarios'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <PlayCircle className="w-4 h-4 text-amber-300" />
            <span>{docTitles.scenarios}</span>
          </button>

          <button
            onClick={() => setActiveDoc('specifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeDoc === 'specifications'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{docTitles.specifications}</span>
          </button>

          <button
            onClick={() => setActiveDoc('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeDoc === 'manual'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{docTitles.manual}</span>
          </button>
        </div>
      </div>

      {/* Document Content Box */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="mb-4 pb-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              {docTitles[activeDoc]}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {docDescriptions[activeDoc]}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400">
            <FolderArchive className="w-4 h-4 text-amber-500" />
            <span>
              {activeDoc === 'scenarios' 
                ? '/src/components/OperationalScenariosView.tsx' 
                : `/docs/${activeDoc === 'specifications' ? 'SYSTEM_SPECIFICATIONS.md' : 'USER_MANUAL.md'}`}
            </span>
          </div>
        </div>

        {activeDoc === 'scenarios' && <OperationalScenariosView lang={lang} onNavigate={onNavigate} />}
        {searchQuery.trim() && activeDoc !== 'scenarios' ? (
          searchResults.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                {lang === 'ar'
                  ? `تم العثور على ${searchResults.length} نتيجة مطابقة في الوثائق:`
                  : `${searchResults.length} matching documentation entries found:`}
              </p>
              {searchResults.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => jumpToResult(entry)}
                  className="w-full text-right p-3.5 bg-slate-50 dark:bg-zinc-800/60 hover:bg-emerald-500/10 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {lang === 'ar' ? entry.titleAr : entry.titleEn}
                    </h4>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold shrink-0">
                      {docTitles[entry.tab]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    {lang === 'ar' ? entry.snippetAr : entry.snippetEn}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                {lang === 'ar' ? 'لا توجد نتائج مطابقة لبحثك في الوثائق.' : 'No documentation matches your query.'}
              </p>
            </div>
          )
        ) : (
          <>
            {activeDoc === 'specifications' && renderSpecifications()}
            {activeDoc === 'manual' && renderManual()}
          </>
        )}
      </div>
    </div>
    </ModuleShell>
  );
}
