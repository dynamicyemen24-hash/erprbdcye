import React, { useState } from 'react';
import { 
  X, Search, Star, ExternalLink, ShieldCheck, Sparkles, Sliders,
  Briefcase, FolderKanban, Activity, Users, Heart, Handshake,
  DollarSign, Coins, CheckCircle2, Shield, FileText, Database,
  Settings, Layers, Brain, BookOpen, PlayCircle, Lock, Calendar, Compass, Globe
} from 'lucide-react';
import { TabId } from '../types';

interface AppMatrixLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabId) => void;
  lang: 'ar' | 'en';
  onOpenCopilot?: () => void;
  onOpenDocs?: () => void;
  onOpenScenarios?: () => void;
  counts?: {
    programs: number;
    projects: number;
    beneficiaries: number;
    sponsorships: number;
    users: number;
    currencies: number;
    pendingApprovals: number;
  };
}

export default function AppMatrixLauncherModal({
  isOpen,
  onClose,
  onNavigate,
  lang,
  onOpenCopilot,
  onOpenDocs,
  onOpenScenarios,
  counts
}: AppMatrixLauncherModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [favorites, setFavorites] = useState<string[]>(['NEB-04', 'NEB-06', 'NEB-10', 'NEB-13']);

  if (!isOpen) return null;

  const toggleFavorite = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const apps = [
    // Suite 1: Strategy & Intelligence
    {
      code: 'NEB-01',
      category: 'STRATEGY',
      icon: Briefcase,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      title_ar: 'استراتيجية الرؤية والأداء',
      title_en: 'Strategy & Performance',
      subtitle_ar: 'صياغة الغايات ومؤشرات الأداء KPI',
      subtitle_en: 'Institutional goals and KPI tracking',
      tab: 'domains' as TabId,
      stat: `${counts?.programs || 0} ${lang === 'ar' ? 'برنامج' : 'Programs'}`
    },
    {
      code: 'NEB-02',
      category: 'STRATEGY',
      icon: Layers,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      title_ar: 'محافظ التمويل المجمع',
      title_en: 'Portfolio Management',
      subtitle_ar: 'إدارة المحافظ الاستثمارية والمنح',
      subtitle_en: 'Donor portfolio allocation & caps',
      tab: 'domains' as TabId,
      stat: lang === 'ar' ? 'محافظ التمويل' : 'Funding Portfolios'
    },
    {
      code: 'NEB-13',
      category: 'STRATEGY',
      icon: Brain,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
      title_ar: 'ذكاء الأعمال قياس الأثر CHS',
      title_en: 'AI Impact & CHS Standards',
      subtitle_ar: 'تحليلات AI المعيارية لمستوى الأثر',
      subtitle_en: 'Sphere & CHS humanitarian metrics',
      tab: 'reports' as TabId,
      action: onOpenCopilot,
      stat: lang === 'ar' ? 'مساعد ذكي' : 'AI Assistant'
    },

    // Suite 2: Programs & Operations
    {
      code: 'NEB-03',
      category: 'OPERATIONS',
      icon: FolderKanban,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      title_ar: 'إدارة البرامج التنموية',
      title_en: 'Program Management',
      subtitle_ar: 'تأطير التدخلات والأسقف المالية',
      subtitle_en: 'Program framing & financial limits',
      tab: 'programs' as TabId,
      stat: `${counts?.programs || 0} ${lang === 'ar' ? 'برامج' : 'Programs'}`
    },
    {
      code: 'NEB-04',
      category: 'OPERATIONS',
      icon: Activity,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      title_ar: 'المشاريع الميدانية التنفيذية',
      title_en: 'Project Management',
      subtitle_ar: 'تتبع أكواد المشاريع ونسب الإنجاز',
      subtitle_en: 'Track active project execution',
      tab: 'projects' as TabId,
      stat: `${counts?.projects || 0} ${lang === 'ar' ? 'مشروع' : 'Projects'}`
    },
    {
      code: 'NEB-05',
      category: 'OPERATIONS',
      icon: PlayCircle,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      title_ar: 'العمليات الميدانية والأنشطة',
      title_en: 'Field Operations & Activities',
      subtitle_ar: 'هيكلة المهام والأنشطة الميدانية',
      subtitle_en: 'Field tasks and activity planning',
      tab: 'activities' as TabId,
      stat: lang === 'ar' ? 'أنشطة ميدانية' : 'Field Activities'
    },
    {
      code: 'NEB-05-GIS',
      category: 'OPERATIONS',
      icon: Compass,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      title_ar: 'الخريطة المكانية GIS للميدان',
      title_en: 'Field Geospatial GIS Map',
      subtitle_ar: 'رصد جغرافي لمواقع المشاريع وتكثيف المستفيدين',
      subtitle_en: 'Project mapping & beneficiary hotspots',
      tab: 'geospatial' as TabId,
      stat: lang === 'ar' ? 'خريطة تفاعلية' : 'Interactive Map'
    },

    // Suite 3: Beneficiaries & Social Care
    {
      code: 'NEB-06',
      category: 'BENEFICIARIES',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
      title_ar: 'سجل المستفيدين والخدمات',
      title_en: 'Service Delivery & Registry',
      subtitle_ar: 'تسجيل الحالات والتحقق من الاستحقاق',
      subtitle_en: 'Beneficiary eligibility & service registry',
      tab: 'beneficiaries' as TabId,
      stat: `${counts?.beneficiaries || 0} ${lang === 'ar' ? 'مستفيد' : 'Cases'}`
    },
    {
      code: 'NEB-07',
      category: 'BENEFICIARIES',
      icon: Heart,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
      title_ar: 'كفالات الأيتام والرعاية',
      title_en: 'Sponsorships & Welfare',
      subtitle_ar: 'متابعة كفالات الأيتام والأسر والمدفوعات',
      subtitle_en: 'Orphan stipends & family care',
      tab: 'sponsorships' as TabId,
      stat: `${counts?.sponsorships || 0} ${lang === 'ar' ? 'مكفول' : 'Sponsors'}`
    },
    {
      code: 'NEB-08',
      category: 'BENEFICIARIES',
      icon: Handshake,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
      title_ar: 'شراكات المانحين والعقود',
      title_en: 'Partnership & Funding',
      subtitle_ar: 'تتبع المانحين والمنح وعقود التمويل',
      subtitle_en: 'Donor relations & agreement pledges',
      tab: 'sponsorships' as TabId,
      stat: lang === 'ar' ? 'تقارير شفافية' : 'Transparency Reports'
    },

    // Suite 4: Finance & Assets
    {
      code: 'NEB-09',
      category: 'FINANCE',
      icon: Shield,
      color: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20',
      badgeColor: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-200',
      title_ar: 'إدارة الكادر والأصول',
      title_en: 'Resource & Asset OS',
      subtitle_ar: 'إدارة المستخدمين والأدوار والأصول',
      subtitle_en: 'Staff profiles & equipment assets',
      tab: 'users' as TabId,
      stat: `${counts?.users || 0} ${lang === 'ar' ? 'كادر' : 'Staff'}`
    },
    {
      code: 'NEB-09-B',
      category: 'FINANCE',
      icon: Calendar,
      color: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20',
      badgeColor: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-200',
      title_ar: 'تخصيص الموارد وجدولة Gantt',
      title_en: 'Resource Allocation & Gantt',
      subtitle_ar: 'تخطيط توزيع الكادر الميداني والأصول على المشاريع',
      subtitle_en: 'Visual staff and equipment assignment',
      tab: 'allocations' as TabId,
      stat: lang === 'ar' ? 'جدول زمني' : 'Timeline View'
    },
    {
      code: 'NEB-10',
      category: 'FINANCE',
      icon: DollarSign,
      color: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20',
      badgeColor: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-200',
      title_ar: 'المالية العامة والحسابات IPSAS',
      title_en: 'Finance & IPSAS Ledger',
      subtitle_ar: 'شجرة الحسابات والقيود والترحيل',
      subtitle_en: 'Double-entry audit ledger statement',
      tab: 'finance' as TabId,
      stat: lang === 'ar' ? 'قيود ومعاملات' : 'Financial Records'
    },
    {
      code: 'NEB-12',
      category: 'FINANCE',
      icon: Coins,
      color: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20',
      badgeColor: 'bg-emerald-600/15 text-emerald-800 dark:text-emerald-200',
      title_ar: 'أسعار الصرف والعملات',
      title_en: 'Multi-Currency & Exchange Rates',
      subtitle_ar: 'تتبع عملات المعاملات والربط الآلي',
      subtitle_en: 'Real-time exchange conversion pool',
      tab: 'currencies' as TabId,
      stat: `${counts?.currencies || 0} ${lang === 'ar' ? 'عملات' : 'Currencies'}`
    },

    // Suite 5: Governance & Platform
    {
      code: 'NEB-11',
      category: 'GOVERNANCE',
      icon: BookOpen,
      color: 'bg-zinc-500/10 text-slate-700 dark:text-zinc-300 border-zinc-500/20',
      badgeColor: 'bg-zinc-500/15 text-slate-800 dark:text-zinc-200',
      title_ar: 'المعرفة والأرشيف الرسمي A4',
      title_en: 'Knowledge & Document OS',
      subtitle_ar: 'طباعة التصدير الرسمي والسياسات',
      subtitle_en: 'Official PDF printing & policy manuals',
      tab: 'reports' as TabId,
      action: onOpenDocs,
      stat: lang === 'ar' ? 'وثائق ومستندات' : 'Documents & Policies'
    },
    {
      code: 'APPROVALS',
      category: 'GOVERNANCE',
      icon: CheckCircle2,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      title_ar: 'مركز الصلاحيات والموافقات',
      title_en: 'Approvals & Governance Workflow',
      subtitle_ar: 'سلسلة الاعتماد والطلبات المعلقة',
      subtitle_en: 'Pending approvals & sign-off queue',
      tab: 'approvals' as TabId,
      stat: `${counts?.pendingApprovals || 2} ${lang === 'ar' ? 'طلبات' : 'Pending'}`
    },
    {
      code: 'CONTROL_PANEL',
      category: 'GOVERNANCE',
      icon: Sliders,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      title_ar: 'لوحة التحكم والعمليات',
      title_en: 'Control Panel & Console',
      subtitle_ar: 'إعدادات النظام ومفاتيح التشغيل',
      subtitle_en: 'System settings and operational switches',
      tab: 'control_panel' as TabId,
      stat: lang === 'ar' ? 'لوحة تحكم' : 'Control Console'
    },
    {
      code: 'SETTINGS',
      category: 'GOVERNANCE',
      icon: Settings,
      color: 'bg-zinc-500/10 text-slate-700 dark:text-zinc-300 border-zinc-500/20',
      badgeColor: 'bg-zinc-500/15 text-slate-800 dark:text-zinc-200',
      title_ar: 'إعدادات النظام والأمان',
      title_en: 'Platform Settings & Config',
      subtitle_ar: 'الإعدادات والنسخ الاحتياطي وسجلات النظام',
      subtitle_en: 'Configuration, backups & audit logs',
      tab: 'settings' as TabId,
      stat: lang === 'ar' ? 'إعدادات النظام' : 'System Settings'
    }
  ];

  const categories = [
    { id: 'ALL', label_ar: 'جميع الأقسام', label_en: 'All Sections' },
    { id: 'FAVORITES', label_ar: 'المفضلة ★', label_en: 'Favorites ★' },
    { id: 'STRATEGY', label_ar: 'الاستراتيجية والرؤية', label_en: 'Strategy' },
    { id: 'OPERATIONS', label_ar: 'البرامج والميدان', label_en: 'Operations' },
    { id: 'BENEFICIARIES', label_ar: 'المستفيدون والرعاية', label_en: 'Beneficiaries' },
    { id: 'FINANCE', label_ar: 'المالية والأصول', label_en: 'Finance' },
    { id: 'GOVERNANCE', label_ar: 'الحوكمة والأمان', label_en: 'Governance' }
  ];

  const filteredApps = apps.filter(app => {
    const matchesSearch = 
      app.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'FAVORITES') return matchesSearch && favorites.includes(app.code);
    if (activeCategory === 'ALL') return matchesSearch;
    return matchesSearch && app.category === activeCategory;
  });

  const handleLaunch = (app: typeof apps[0]) => {
    if (app.action) {
      app.action();
    } else {
      onNavigate(app.tab);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/30 shadow-sm">
              <Layers className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                  {lang === 'ar' ? 'الأنظمة والوحدات التشغيلية' : 'Operational Systems & Modules'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {lang === 'ar' 
                  ? 'اختر القسم أو الوحدة التي تريد العمل فيها'
                  : 'Select the section or module you want to work in.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer self-end sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute top-3 right-3 text-zinc-400 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث سريع في الأنظمة والوحدات المؤسسية (مثال: المالية، الكفالات، المشاريع)...' : 'Search enterprise systems & modules (e.g. Finance, Projects, Welfare)...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl py-2.5 px-10 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-bold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute top-3 left-3 text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 text-xs font-bold rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Horizontal Category Scrollbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {lang === 'ar' ? cat.label_ar : cat.label_en}
              </button>
            ))}
          </div>
        </div>

        {/* App Tiles Grid (Enterprise Matrix Style) */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/40 dark:bg-zinc-950/40">
          {filteredApps.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Search className="w-10 h-10 mx-auto text-zinc-400 opacity-50" />
              <p className="text-sm font-bold text-slate-500">
                {lang === 'ar' ? 'لم يتم العثور على تطبيق يطابق كلمة البحث' : 'No enterprise app modules match your filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => {
                const IconComponent = app.icon;
                const isFav = favorites.includes(app.code);

                return (
                  <div
                    key={app.code}
                    onClick={() => handleLaunch(app)}
                    className="group bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden transform hover:-translate-y-1"
                  >
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="space-y-3">
                      {/* App Header Row */}
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl border ${app.color} shadow-inner`}>
                          <IconComponent className="w-6 h-6" />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${app.badgeColor} opacity-0`}>
                            &nbsp;
                          </span>
                          <button
                            onClick={(e) => toggleFavorite(app.code, e)}
                            className={`p-1 rounded-lg transition-colors cursor-pointer ${
                              isFav ? 'text-amber-500' : 'text-zinc-300 dark:text-slate-600 hover:text-amber-400'
                            }`}
                            title={lang === 'ar' ? 'تفضيل التطبيق' : 'Favorite app'}
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* App Title & Details */}
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {lang === 'ar' ? app.title_ar : app.title_en}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 font-medium">
                          {lang === 'ar' ? app.subtitle_ar : app.subtitle_en}
                        </p>
                      </div>
                    </div>

                    {/* App Footer Launch Bar */}
                    <div className="pt-3 mt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-slate-500">
                        {app.stat}
                      </span>

                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:underline">
                        <span>{lang === 'ar' ? 'تشغيل' : 'Launch'}</span>
                        <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-bold">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{lang === 'ar' ? 'NexoraOS™ • جمعية رُحماء بينهم للعمل الإنساني والتنمية' : 'NexoraOS™ • Rohamaab Charity Foundation'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNavigate('dashboard');
                onClose();
              }}
              className="px-4 py-1.5 bg-zinc-900 text-white dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-xs font-black transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'العودة لمركز القيادة' : 'Back to Command Center'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
