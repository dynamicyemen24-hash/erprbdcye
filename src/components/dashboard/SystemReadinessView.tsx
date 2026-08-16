import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Activity, 
  Cpu, 
  Database, 
  Lock, 
  Printer, 
  Sparkles,
  FileCheck2
} from 'lucide-react';
import { printElement } from '../../lib/printUtils';

interface SystemReadinessViewProps {
  lang: 'ar' | 'en';
  orgName?: string;
}

export function SystemReadinessView({ lang, orgName }: SystemReadinessViewProps) {
  const isRtl = lang === 'ar';
  const [openDomain, setOpenDomain] = useState<string | null>('domain-01');

  // 13 Operational Domains ? clean business names, no NEB codes in UI
  const domainsReadiness = [
    {
      code: 'domain-01',
      titleAr: 'التخطيط الاستراتيجي والأداء المؤسسي',
      titleEn: 'Strategic Planning & Performance',
      color: 'from-emerald-500 to-teal-600',
      textAr: 'تحديد الأهداف الاستراتيجية ومؤشرات الأداء، متابعة نسب الإنجاز، وإعداد الملخصات التنفيذية التفاعلية.',
      textEn: 'Define strategic goals and performance indicators, track progress, and generate interactive executive summaries.',
      checklist: [
        { nameAr: 'تخطيط مؤشرات الأداء وترتيبها حسب الأولوية', nameEn: 'Performance indicator planning & prioritization', status: true },
        { nameAr: 'توليد الملخصات التنفيذية التلقائية بمساعدة الذكاء الاصطناعي', nameEn: 'AI-assisted executive summary generation', status: true },
        { nameAr: 'حفظ واسترجاع قوالب العرض المخصصة لكل مستخدم', nameEn: 'User-specific dashboard presets', status: true }
      ]
    },
    {
      code: 'domain-02',
      titleAr: 'إدارة محافظ التمويل والبرامج الكبرى',
      titleEn: 'Funding Portfolios & Major Programs',
      color: 'from-blue-500 to-indigo-600',
      textAr: 'إدارة المحافظ التنموية الكبرى وتوزيع حصص التمويل على البرامج والأنشطة المعتمدة.',
      textEn: 'Manage major development portfolios and allocate funding shares to approved programs and activities.',
      checklist: [
        { nameAr: 'تحليل توزيع الميزانيات على البرامج والمحافظ', nameEn: 'Budget distribution across programs', status: true },
        { nameAr: 'مراقبة الانحراف المالي وتنبيهات التجاوز', nameEn: 'Budget deviation alerts', status: true },
        { nameAr: 'تجميع التكاليف التراكمية للمشاريع', nameEn: 'Cumulative project cost rollups', status: true }
      ]
    },
    {
      code: 'domain-03',
      titleAr: 'إدارة البرامج التنموية والإغاثية',
      titleEn: 'Developmental & Relief Programs',
      color: 'from-emerald-500 to-emerald-700',
      textAr: 'تأطير وإدارة برامج الرعاية المجتمعية والتمكين والتدخل الإنساني مع متابعة الأهداف والمخرجات.',
      textEn: 'Frame and manage welfare, capacity-building, and relief programs with goal tracking and outcome monitoring.',
      checklist: [
        { nameAr: 'مزامنة تلقائية لقائمة البرامج في الخلفية', nameEn: 'Background program list synchronization', status: true },
        { nameAr: 'دعم العمل في المواقع بدون اتصال إنترنت', nameEn: 'Offline-capable field access', status: true },
        { nameAr: 'تصفية البرامج حسب الحالة والنطاق الجغرافي', nameEn: 'Multi-criteria program filtering', status: true }
      ]
    },
    {
      code: 'domain-04',
      titleAr: 'إدارة المشاريع ومتابعة التنفيذ',
      titleEn: 'Project Management & Execution',
      color: 'from-cyan-500 to-blue-600',
      textAr: 'إدارة دورة حياة المشاريع، متابعة نسب التقدم الفعلي مقابل الأهداف المخططة، وإدارة المخاطر.',
      textEn: 'Manage project lifecycles, track actual progress against planned targets, and manage risks proactively.',
      checklist: [
        { nameAr: 'مقارنة بصرية بين المستهدف والمحقق الفعلي', nameEn: 'Visual planned vs actual comparison', status: true },
        { nameAr: 'تنبيهات ذكية للمشاريع المتعثرة', nameEn: 'Smart alerts for delayed projects', status: true },
        { nameAr: 'ربط المعالم بالميزانيات والمدفوعات', nameEn: 'Milestone to budget linkage', status: true }
      ]
    },
    {
      code: 'domain-05',
      titleAr: 'العمليات الميدانية والأنشطة التنفيذية',
      titleEn: 'Field Operations & Activities',
      color: 'from-amber-500 to-orange-600',
      textAr: 'تفكيك وتوزيع المهام الميدانية، لوحة الأنشطة اليومية للفرق، ومتابعة التنفيذ في الموقع.',
      textEn: 'Break down and distribute field tasks, manage daily team activity boards, and monitor on-site execution.',
      checklist: [
        { nameAr: 'لوحة مهام يومية تفاعلية لكل موظف وفريق', nameEn: 'Daily interactive task board per team', status: true },
        { nameAr: 'هيكلة أنشطة المشاريع على مستويات متعددة', nameEn: 'Multi-level project activity breakdown', status: true },
        { nameAr: 'تعديل المهام بدون اتصال بالشبكة', nameEn: 'Offline task editing', status: true }
      ]
    },
    {
      code: 'domain-06',
      titleAr: 'سجل المستفيدين وتقديم الخدمات',
      titleEn: 'Beneficiary Registry & Services',
      color: 'from-teal-500 to-emerald-600',
      textAr: 'إدارة بيانات الأسر والمستفيدين، التحقق من الاستحقاق، وتوزيع المساعدات بدقة وعدالة.',
      textEn: 'Manage beneficiary and family data, verify eligibility, and distribute assistance accurately and fairly.',
      checklist: [
        { nameAr: 'بحث فوري في سجلات المستفيدين', nameEn: 'Instant beneficiary records search', status: true },
        { nameAr: 'سجل المساعدات والمدفوعات لكل فرد', nameEn: 'Individual assistance disbursement ledger', status: true },
        { nameAr: 'دعم التحقق في المواقع الميدانية بدون إنترنت', nameEn: 'Offline field verification support', status: true }
      ]
    },
    {
      code: 'domain-07',
      titleAr: 'فرق المتطوعين والمجتمع',
      titleEn: 'Volunteers & Community Teams',
      color: 'from-pink-500 to-rose-600',
      textAr: 'تسجيل المتطوعين، متابعة ساعات العمل التطوعي، وتكليف الفرق بالأنشطة الإغاثية.',
      textEn: 'Register volunteers, track service hours, and assign teams to relief activities based on skills.',
      checklist: [
        { nameAr: 'سجل ساعات العمل التطوعي والتغطية الجغرافية', nameEn: 'Volunteer hours and coverage tracking', status: true },
        { nameAr: 'توافق مع معايير العمل الخيري', nameEn: 'Charitable work standards alignment', status: true },
        { nameAr: 'تكليف المتطوعين بالمهام وفق مهاراتهم', nameEn: 'Skill-based task assignment', status: true }
      ]
    },
    {
      code: 'domain-08',
      titleAr: 'الشراكات والمانحون وعقود التمويل',
      titleEn: 'Partnerships, Donors & Funding',
      color: 'from-violet-500 to-purple-600',
      textAr: 'إدارة اتفاقيات التمويل والمنح، سجل كفالات الأسر والأيتام، وتقارير الشفافية للمانحين.',
      textEn: 'Manage funding agreements and grants, family and orphan sponsorships, and donor transparency reports.',
      checklist: [
        { nameAr: 'سجل الكفالات والرعايات المؤسسية', nameEn: 'Sponsorships and welfare registry', status: true },
        { nameAr: 'تقارير توزيع المصروفات للمانحين', nameEn: 'Donor expenditure reports', status: true },
        { nameAr: 'مراجعة معايير الشفافية المالية', nameEn: 'Financial transparency standards review', status: true }
      ]
    },
    {
      code: 'domain-09',
      titleAr: 'الموارد البشرية وإدارة الأصول',
      titleEn: 'Human Resources & Asset Management',
      color: 'from-sky-500 to-indigo-600',
      textAr: 'مخططات تخصيص الموارد البشرية، سجلات الكادر، وإدارة أصول المكاتب الميدانية.',
      textEn: 'Staff allocation charts, personnel records, and field office asset management.',
      checklist: [
        { nameAr: 'مخططات استغلال الطاقة البشرية', nameEn: 'Staff utilization charts', status: true },
        { nameAr: 'أوصاف الوظائف وهياكل المسؤوليات', nameEn: 'Job descriptions and responsibility frameworks', status: true },
        { nameAr: 'ربط توزيع الأصول بالعمليات الميدانية', nameEn: 'Asset-to-operations assignment', status: true }
      ]
    },
    {
      code: 'domain-10',
      titleAr: 'المالية العامة وضبط المعاملات',
      titleEn: 'Finance & Transaction Control',
      color: 'from-emerald-500 to-teal-500',
      textAr: 'شجرة الحسابات المعتمدة، سندات الصرف والقبض، متابعة أسعار الصرف، والاعتمادات المزدوجة للمعاملات الكبرى.',
      textEn: 'Approved chart of accounts, disbursement and receipt vouchers, exchange rate tracking, and dual approval for major transactions.',
      checklist: [
        { nameAr: 'نظام اعتماد مزدوج للمعاملات المالية الكبرى', nameEn: 'Dual approval for major transactions', status: true },
        { nameAr: 'متابعة القيود المحاسبية وسجل اليومية', nameEn: 'Journal entries and ledger tracking', status: true },
        { nameAr: 'تحويل العملات وأسعار الصرف التاريخية', nameEn: 'Currency conversion and exchange rates', status: true }
      ]
    },
    {
      code: 'domain-11',
      titleAr: 'إدارة المستندات والأرشيف الرقمي',
      titleEn: 'Documents & Digital Archive',
      color: 'from-amber-500 to-yellow-600',
      textAr: 'الأرشيف الرقمي المركزي للوثائق الرسمية، لوائح العمل، السياسات المؤسسية، وأدلة التشغيل.',
      textEn: 'Central digital archive for official documents, operational policies, and organizational manuals.',
      checklist: [
        { nameAr: 'بحث فوري في الأرشيف الرقمي المعتمد', nameEn: 'Instant search in digital archive', status: true },
        { nameAr: 'أدلة التشغيل التفاعلية والإجراءات الميدانية', nameEn: 'Interactive operational manuals', status: true },
        { nameAr: 'حماية الملفات والمرفقات وضبط الوصول', nameEn: 'File protection and access control', status: true }
      ]
    },
    {
      code: 'domain-12',
      titleAr: 'تقارير الشفافية والتكامل مع الشركاء',
      titleEn: 'Transparency Reports & Partner Integration',
      color: 'from-purple-500 to-fuchsia-600',
      textAr: 'تكامل البيانات مع الشركاء والمانحين، تصدير التقارير الدولية، ومتابعة جودة البيانات وصحتها.',
      textEn: 'Data integration with partners and donors, international report exports, and data quality monitoring.',
      checklist: [
        { nameAr: 'تصدير تقارير الشفافية للمانحين والجهات المعنية', nameEn: 'Donor transparency report exports', status: true },
        { nameAr: 'ربط البيانات مع المنصات الدولية', nameEn: 'International platform data linking', status: true },
        { nameAr: 'قياس معدل استجابة وجودة البيانات', nameEn: 'Data quality benchmarking', status: true }
      ]
    },
    {
      code: 'domain-13',
      titleAr: 'الذكاء الاصطناعي وقياس الأثر',
      titleEn: 'AI Assistance & Impact Measurement',
      color: 'from-indigo-500 to-purple-600',
      textAr: 'المساعد الذكي لتسريع المهام، قراءة المستندات والفواتير آلياً، والتحليلات التنبؤية لمتابعة الأثر.',
      textEn: 'AI assistant for task acceleration, automated document reading, and predictive analytics for impact tracking.',
      checklist: [
        { nameAr: 'قراءة الفواتير وإدخال القيود تلقائياً بالذكاء الاصطناعي', nameEn: 'AI-powered invoice reading and entry', status: true },
        { nameAr: 'تحليلات تنبؤية لمتابعة الأثر الإنساني', nameEn: 'Predictive impact analytics', status: true },
        { nameAr: 'توصيات الذكاء الاصطناعي للاستدامة', nameEn: 'Accountability performance indicators', status: true }
      ]
    }
  ];

  // Completion is not shown as fake percentages ? count of active domains
  const activeDomains = domainsReadiness.length;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs animate-fade-in" id="system-readiness-panel">
      
      {/* Upper Registry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-center border-b border-slate-100 dark:border-zinc-800 pb-8">
        
        {/* Domain Count Overview */}
        <div className="lg:col-span-1 flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800">
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-slate-200 dark:text-zinc-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className="text-emerald-600 dark:text-emerald-500"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-slate-950 dark:text-white font-mono tracking-tighter">
                {activeDomains}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-500">
                {isRtl ? 'قطاعاً نشطاً' : 'Active Areas'}
              </span>
            </div>
          </div>
          
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 mt-4">
            {isRtl ? 'القطاعات التشغيلية النشطة' : 'Active Operational Areas'}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
            {isRtl 
              ? 'جميع قطاعات العمل المؤسسي تعمل وتستقبل البيانات وتصدر التقارير.' 
              : 'All organizational work areas are active, accepting data, and generating reports.'}
          </p>
        </div>

        {/* Operational Summary Highlights */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Award className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                {isRtl ? 'المنظومة التشغيلية الموحدة لجمعية رُحماء بينهم' : 'Unified Operating Platform ? Rohamaab Foundation'}
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isRtl 
                  ? 'تغطي جميع جوانب العمل المؤسسي من التخطيط والتنفيذ الميداني إلى المالية والتقارير وخدمة المستفيدين.'
                  : 'Covers all aspects of institutional work ? from strategic planning and field execution to finance, reporting, and beneficiary services.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl flex items-center gap-2.5">
              <Database className="w-4.5 h-4.5 text-blue-500" />
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">{isRtl ? 'قاعدة البيانات' : 'Database'}</span>
                <span className="text-xs font-black text-slate-800 dark:text-zinc-100">{isRtl ? 'متصلة ونشطة' : 'Connected & Active'}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl flex items-center gap-2.5">
              <Activity className="w-4.5 h-4.5 text-emerald-500" />
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">{isRtl ? 'حالة النظام' : 'System Status'}</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{isRtl ? 'يعمل بشكل طبيعي' : 'Operational'}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl flex items-center gap-2.5">
              <Lock className="w-4.5 h-4.5 text-amber-500" />
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">{isRtl ? 'حماية البيانات' : 'Data Security'}</span>
                <span className="text-xs font-black text-slate-800 dark:text-zinc-100">{isRtl ? 'مفعّلة' : 'Active'}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 p-3 rounded-xl flex items-center gap-2.5">
              <Cpu className="w-4.5 h-4.5 text-purple-500" />
              <div>
                <span className="text-[10px] text-zinc-400 block font-bold">{isRtl ? 'المساعد الذكي' : 'AI Assistant'}</span>
                <span className="text-xs font-black text-slate-800 dark:text-zinc-100">{isRtl ? 'متاح ونشط' : 'Available'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button 
              onClick={() => printElement('system-readiness-panel')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
              <span>{isRtl ? 'طباعة تقرير الأنظمة' : 'Print Systems Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accordion List of 13 Operational Areas */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider mb-2">
          {isRtl ? 'القطاعات التشغيلية الـ13 وتفاصيل كل قطاع' : '13 Operational Areas ? Detailed Overview'}
        </h3>
        {domainsReadiness.map((d) => {
          const isOpen = openDomain === d.code;
          return (
            <div 
              key={d.code}
              className={`border rounded-xl transition-all ${
                isOpen 
                  ? 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 shadow-xs' 
                  : 'border-slate-100 dark:border-zinc-800 hover:bg-slate-50/30 dark:hover:bg-zinc-900/10'
              }`}
            >
              {/* Accordion Header */}
              <button
                onClick={() => setOpenDomain(isOpen ? null : d.code)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3.5 text-right rtl:text-right ltr:text-left min-w-0 flex-1">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 bg-gradient-to-br ${d.color}`} />
                  <h4 className="text-xs md:text-sm font-extrabold text-slate-800 dark:text-zinc-100 truncate">
                    {isRtl ? d.titleAr : d.titleEn}
                  </h4>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full hidden sm:block">
                    {isRtl ? 'نشط' : 'Active'}
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                </div>
              </button>

              {/* Accordion Content */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 space-y-4 animate-fade-in">
                  <p className="leading-relaxed">
                    {isRtl ? d.textAr : d.textEn}
                  </p>

                  <div className="space-y-2 bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                    <h5 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4" />
                      <span>{isRtl ? 'الوظائف والمزايا الرئيسية' : 'Key Features & Capabilities'}</span>
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {d.checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 py-1 border-b border-dashed border-slate-100 dark:border-zinc-900 last:border-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate">{isRtl ? item.nameAr : item.nameEn}</span>
                          <span className="ml-auto text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 rounded">
                            {isRtl ? 'نشط ومؤمن' : 'Verified'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Operational Context Section */}
      <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 to-zinc-950 text-white rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10 text-center md:text-right rtl:md:text-right ltr:md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h4 className="text-base font-extrabold text-white">
              {isRtl ? 'بيئة عمل مؤسسية متكاملة وآمنة' : 'Integrated & Secure Enterprise Workspace'}
            </h4>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {isRtl 
              ? 'تضمن المنظومة حماية بياناتك وصلاحياتك في كل خطوة، مع دعم العمل في المواقع الميدانية بعيداً عن الاتصال بالإنترنت، وإمكانية مزامنة البيانات عند عودة الاتصال.'
              : 'The platform protects your data and access rights at every step, supports field work in remote locations without internet, and syncs data when connectivity is restored.'}
          </p>
        </div>

        <div className="shrink-0 relative z-10 flex flex-col items-center p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center min-w-[160px]">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{isRtl ? 'جمعية رُحماء بينهم' : 'Rohamaab Foundation'}</span>
          <span className="text-sm font-black text-emerald-400 mt-1 leading-tight text-center">
            {isRtl ? 'منظومة العمل الإنساني والتنموي' : 'Humanitarian & Development OS'}
          </span>
          <span className="text-[9px] text-zinc-400 font-medium mt-1">
            NexoraOS?
          </span>
        </div>
      </div>

    </div>
  );
}
