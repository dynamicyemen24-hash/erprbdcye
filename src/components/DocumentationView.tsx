import React, { useState } from 'react';
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
  PlayCircle
} from 'lucide-react';
import OperationalScenariosView from './OperationalScenariosView';
import { EnterpriseLogo } from './EnterpriseLogo';

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
              <span className="text-zinc-400 font-normal px-2">| One Platform. One Organization. One Vision.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold font-mono">
            13 NEB Domains
          </span>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold font-mono">
            Neon + Gemini 2.5
          </span>
        </div>
      </div>

      {/* Product Philosophy Pipeline */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          {lang === 'ar' ? 'أولاً: فلسفة المنتج وسلسلة القيمة والأثر (Nexora Product Philosophy™)' : '1. Product Philosophy & Value Pipeline'}
        </h3>
        
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
          <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
            {lang === 'ar' 
              ? 'نظام NexoraOS™ لا يدير معاملات منفصلة، بل يدير خط الرؤية والأثر المؤسسي المتكامل في منصة موحدة واحدة:' 
              : 'NexoraOS™ manages the end-to-end vision to impact pipeline in one unified intelligent operating system:'}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-[10px] text-zinc-200 font-extrabold">
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
      </section>

      {/* The 13 Nexora Enterprise Domains */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          {lang === 'ar' ? 'ثانياً: الأنظمة المؤسسية الـ 13 (Nexora Enterprise Domains™)' : '2. The 13 Nexora Enterprise Domains™'}
        </h3>
        
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
        </div>
      </section>

      {/* Program Classifications & Project Lifecycle */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <Compass className="w-5 h-5 text-emerald-600" />
          {lang === 'ar' ? 'رابعاً وخامساً: تصنيف البرامج ودورة حياة المشروع (8 مراحل)' : '4 & 5. Program Types & 8-Stage Lifecycle'}
        </h3>

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
        <div className="p-4 bg-zinc-900 text-white rounded-xl border border-zinc-800 space-y-2">
          <div className="font-bold text-xs text-emerald-400">
            {lang === 'ar' ? 'دورة حياة المشروع المعتمدة (Project Lifecycle):' : 'Official Project Lifecycle:'}
          </div>
          <div className="flex items-center justify-between overflow-x-auto py-2 gap-2 text-[10px] font-bold">
            <span className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-emerald-400 shrink-0">1. فكرة</span>
            <span className="text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-amber-400 shrink-0">2. دراسة</span>
            <span className="text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-emerald-400 shrink-0">3. اعتماد</span>
            <span className="text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-amber-400 shrink-0">4. تخطيط</span>
            <span className="text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-emerald-400 shrink-0">5. تنفيذ</span>
            <span className="text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-amber-400 shrink-0">6. متابعة</span>
            <span className="text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-emerald-400 shrink-0">7. إغلاق</span>
            <span className="text-slate-600">➔</span>
            <span className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg shrink-0">8. قياس أثر</span>
          </div>
        </div>
      </section>

      {/* Aid Cycle & Procurement Workflows */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <Database className="w-5 h-5 text-emerald-600" />
          {lang === 'ar' ? 'سادساً وسابعاً وثامناً: دوائر الصرف والتعليم والمشتريات' : '6, 7 & 8. Aid Disbursement, Education & Procurement Cycles'}
        </h3>

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
      </section>
    </div>
  );

  const renderManual = () => (
    <div className="space-y-8 text-slate-800 dark:text-zinc-200 leading-relaxed text-sm">
      <div className="p-6 bg-gradient-to-r from-amber-900/10 via-amber-800/5 to-emerald-500/10 rounded-xl border border-amber-500/20 dark:border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <EnterpriseLogo className="h-14 w-auto object-contain bg-white/90 p-1.5 rounded-xl shadow-md border border-amber-200 dark:border-amber-800" />
          <div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-100">
              {lang === 'ar' ? `دليل المستخدم الشامل - ${orgName}` : `Comprehensive User Manual - ${orgName}`}
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
              {lang === 'ar' ? 'المجلد الرسمي: /docs/USER_MANUAL.md' : 'Official Path: /docs/USER_MANUAL.md'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
            {lang === 'ar' ? 'تنسيق تفاعلي' : 'Interactive Guide'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            01
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
            {lang === 'ar' ? 'الدخول والبحث الشامل' : 'Login & Universal Search'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            {lang === 'ar' ? 'استخدم بريدك المعتمد للوصول. استخدم بحث ERP الشامل أعلى الشاشة للوصول لأي مشروع أو مستفيد أو قيد فوراً.' : 'Log in using assigned credentials. Use header universal search to locate any record instantly.'}
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
            02
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
            {lang === 'ar' ? 'البرامج والمشاريع وحزم WBS' : 'Programs, Projects & WBS'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            {lang === 'ar' ? 'إنشاء البرامج الميدانية أولاً، ثم إدراج المشاريع وحزم العمل WBS تحتها لتأطير الميزانيات وحجز الاعتمادات.' : 'Create parent humanitarian programs, then assign sub-projects and WBS work packages for budget control.'}
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
            03
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
            {lang === 'ar' ? 'المالية بـ IPSAS والماكينة بـ AI' : 'IPSAS Finance & Gemini OCR'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            {lang === 'ar' ? 'ارفع صور الفواتير أو السندات للماسح الذكي لإنشاء القيد المحاسبي المزدوج آلياً بدقة متناهية.' : 'Upload invoice photos; Gemini AI extracts vendor line items and constructs double-entry journal vouchers.'}
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
            04
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
            {lang === 'ar' ? 'المشتريات وتحليل العروض الثلاثية' : 'Procurement & 3-Way Quote Matrix'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            {lang === 'ar' ? 'إصدار طلبات الشراء PR، طرح المناقصات RFQ، وتحليل العروض السعرية عبر مصفوفة المقارنة المعتمدة.' : 'Issue purchase requisitions PRs, launch RFQs, and analyze vendor quotes via standard 3-way matrix.'}
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
            05
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
            {lang === 'ar' ? 'بوابات التبرع الإلكترونية والـ Webhook' : 'Multi-Gateway E-Donations & Webhooks'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            {lang === 'ar' ? 'استقبال التبرعات عبر (خدمة، الكريمي، جوال بي، Stripe، PayPal) والتوليد الفوري لإيصالات القبض الـ QR.' : 'Process online donations with instant webhooks and QR digital receipt auto-generation.'}
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
            06
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
            {lang === 'ar' ? 'التنبؤ المالي واستدامة التمويل' : 'AI Predictive BI & Sustainability'}
          </h4>
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            {lang === 'ar' ? 'توقع التدفقات لـ 12 شهراً مستقبلياً، حساب فترة أمان السيولة، وتحوط مخاطر التضخم المحلي YER.' : '12-month forward cashflow forecasting, donor retention index, and YER currency hedging models.'}
          </p>
        </div>
      </div>

      <section className="space-y-3 pt-2">
        <h3 className="text-base font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <HelpCircle className="w-5 h-5 text-amber-600" />
          {lang === 'ar' ? 'التعليمات والإرشادات السريعة' : 'Quick Operational Instructions'}
        </h3>
        <ul className="space-y-2 text-xs text-slate-700 dark:text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold mt-0.5">•</span>
            <span><strong>بحث ERP الشامل:</strong> يمكنك الضغط على شريط البحث الرئيسي أعلى الشاشة لإيجاد أي سجل فوراً.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold mt-0.5">•</span>
            <span><strong>سلسلة الاعتمادات:</strong> المعاملات المرفوعة تمر بمراحل التحقق المالي وتتغير حالتها من "معلق" إلى "معتمد".</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold mt-0.5">•</span>
            <span><strong>حماية البيانات والنسخ الاحتياطي:</strong> يمكن لمدير النظام تصدير وتصحيح قاعدة البيانات من قائمة "النسخ الاحتياطي".</span>
          </li>
        </ul>
      </section>
    </div>
  );


  return (
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
        {activeDoc === 'specifications' && renderSpecifications()}
        {activeDoc === 'manual' && renderManual()}
      </div>
    </div>
  );
}
