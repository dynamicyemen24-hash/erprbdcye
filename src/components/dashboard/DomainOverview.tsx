import React from 'react';
import { 
  Target, 
  PieChart, 
  Layers, 
  Briefcase, 
  Compass, 
  Users, 
  Heart, 
  Handshake, 
  Award, 
  Coins, 
  FileText, 
  Database, 
  Brain,
  ShoppingCart,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

interface DomainOverviewProps {
  lang: 'ar' | 'en';
  onNavigate?: (tabId: string) => void;
  orgName?: string;
}

export function DomainOverview({ lang, onNavigate, orgName }: DomainOverviewProps) {
  const isRtl = lang === 'ar';

  const domains = [
    { code: 'NEB-01', titleAr: 'الاستراتيجية والأداء', titleEn: 'Strategy & Performance', tab: 'strategic_planning', icon: Target, color: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { code: 'NEB-02', titleAr: 'المحافظ الاستثمارية', titleEn: 'Portfolio Management', tab: 'investments', icon: PieChart, color: 'text-indigo-600 dark:text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
    { code: 'NEB-03', titleAr: 'البرامج التنموية', titleEn: 'Program Management', tab: 'programs', icon: Layers, color: 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5' },
    { code: 'NEB-04', titleAr: 'المشاريع الميدانية', titleEn: 'Project Management', tab: 'projects', icon: Briefcase, color: 'text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5' },
    { code: 'NEB-05', titleAr: 'العمليات والأنشطة', titleEn: 'Field Operations & WBS', tab: 'activities', icon: Compass, color: 'text-cyan-600 dark:text-cyan-400 border-cyan-500/20 bg-cyan-500/5' },
    { code: 'NEB-06', titleAr: 'المستفيدون والخدمات', titleEn: 'Service Delivery', tab: 'beneficiaries', icon: Users, color: 'text-teal-600 dark:text-teal-400 border-teal-500/20 bg-teal-500/5' },
    { code: 'NEB-07', titleAr: 'الكفالات والمجتمع', titleEn: 'Community & Sponsorships', tab: 'sponsorships', icon: Heart, color: 'text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-500/5' },
    { code: 'NEB-08', titleAr: 'الشراكات والتمويل', titleEn: 'Partnership & Funding', tab: 'third_party_network', icon: Handshake, color: 'text-violet-600 dark:text-violet-400 border-violet-500/20 bg-violet-500/5' },
    { code: 'NEB-09', titleAr: 'الكادر والأصول', titleEn: 'HR & Asset Management', tab: 'resources_assets', icon: Award, color: 'text-sky-600 dark:text-sky-400 border-sky-500/20 bg-sky-500/5' },
    { code: 'NEB-10', titleAr: 'المالية والحوكمة IPSAS', titleEn: 'Finance & Compliance', tab: 'finance', icon: Coins, color: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { code: 'NEB-11', titleAr: 'المعرفة والأرشيف', titleEn: 'Knowledge & Documents', tab: 'docs', icon: FileText, color: 'text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5' },
    { code: 'NEB-12', titleAr: 'التكامل والخدمات الرقمية', titleEn: 'Integration & Digital Services', tab: 'currencies', icon: Database, color: 'text-purple-600 dark:text-purple-400 border-purple-500/20 bg-purple-500/5' },
    { code: 'NEB-13', titleAr: 'ذكاء الأثر والتقارير', titleEn: 'AI & Impact Analytics', tab: 'reports', icon: Brain, color: 'text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/5' },
    { code: 'NEB-14', titleAr: 'المشتريات والمناقصات', titleEn: 'Procurement & Tenders', tab: 'contracts', icon: ShoppingCart, color: 'text-orange-600 dark:text-orange-400 border-orange-500/20 bg-orange-500/5' },
    { code: 'NEB-15', titleAr: 'التبرعات والإيرادات', titleEn: 'Fundraising & Revenue', tab: 'finance', icon: TrendingUp, color: 'text-lime-600 dark:text-lime-400 border-lime-500/20 bg-lime-500/5' }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <span>{isRtl ? 'المجالات المؤسسية الـ 15 المعتمدة (Nexora Enterprise Domains™)' : '15 Enterprise Domains (NEB-01 to NEB-15)'}</span>
          </h2>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed font-medium">
          {isRtl 
            ? `المجالات المؤسسية المتكاملة لـ ${orgName || 'جمعية رُحماء بينهم'}. اضغط على أي مجال للانتقال إلى شاشته وبيئته الحية مباشرة.`
            : `Integrated enterprise domains for ${orgName || "Rohamā'a Baynahum"}. Click any domain to open its live workspace.`}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {domains.map((domain) => {
            const IconComponent = domain.icon;
            return (
              <button
                key={domain.code}
                onClick={() => onNavigate && onNavigate(domain.tab)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-emerald-500 hover:shadow-md transition-all duration-200 text-center relative group cursor-pointer ${domain.color}`}
                title={isRtl ? `${domain.code} - ${domain.titleAr}` : `${domain.code} - ${domain.titleEn}`}
              >
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 shadow-xs mb-1.5 group-hover:scale-105 transition-transform duration-200">
                  <IconComponent className="w-4 h-4 shrink-0" />
                </div>

                <span className="text-[9px] font-black text-slate-500 dark:text-zinc-400 mb-0.5">
                  {domain.code}
                </span>

                <span className="text-[10px] font-black tracking-tight block truncate w-full text-slate-800 dark:text-zinc-200">
                  {isRtl ? domain.titleAr : domain.titleEn}
                </span>
                
                <span className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {isRtl ? 'نشط ومباشر' : 'Active'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isRtl ? 'جميع المجالات الـ 15 مفعلة ومربوطة بقاعدة البيانات' : 'All 15 domains live & connected to DB'}</span>
        </span>
        <span className="font-mono bg-slate-50 dark:bg-zinc-950 px-2 py-0.5 rounded text-zinc-400">
          NEB-01 : NEB-15
        </span>
      </div>
    </div>
  );
}
