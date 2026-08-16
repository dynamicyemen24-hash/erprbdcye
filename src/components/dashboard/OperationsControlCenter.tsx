import React from 'react';
import { Target, BarChart3, Briefcase, ClipboardList, Package, Users, HandHeart, Database, ShieldCheck, Plus, FileText, Settings, LucideIcon, LayoutDashboard, Handshake, BookOpen, Cable, Sparkles, Coins, Compass } from 'lucide-react';
import { OperationalModuleCard } from './OperationalModuleCard';
import { QuickActionCard } from './QuickActionCard';
import { designTokens } from '../../lib/designTokens';

interface OperationsControlCenterProps {
  lang: 'ar' | 'en';
  onNavigate: (tabId: string) => void;
  counts?: {
    programs?: number;
    projects?: number;
    beneficiaries?: number;
    sponsorships?: number;
  };
}

export function OperationsControlCenter({ lang, onNavigate, counts }: OperationsControlCenterProps) {
  const groups = [
    {
      title: lang === 'ar' ? 'الإدارة والتخطيط' : 'Management & Planning',
      domains: [
        { label: lang === 'ar' ? 'الأهداف والمؤشرات' : 'Goals & KPIs', icon: Target, tab: 'strategic_planning' },
        { label: lang === 'ar' ? 'المشاريع الاستثمارية' : 'Endowments', icon: LayoutDashboard, tab: 'investments' },
        { label: lang === 'ar' ? 'البرامج التنموية' : 'Development Programs', icon: BarChart3, tab: 'programs', badge: counts?.programs || 10 },
        { label: lang === 'ar' ? 'المشاريع الميدانية' : 'Field Projects', icon: Briefcase, tab: 'projects', badge: counts?.projects || 18 },
      ]
    },
    {
      title: lang === 'ar' ? 'الخدمات والميدان' : 'Services & Field Operations',
      domains: [
        { label: lang === 'ar' ? 'الأنشطة الميدانية' : 'Field Activities', icon: ClipboardList, tab: 'activities', badge: 269 },
        { label: lang === 'ar' ? 'سجل المستفيدين' : 'Beneficiaries Registry', icon: HandHeart, tab: 'beneficiaries', badge: counts?.beneficiaries || 418 },
        { label: lang === 'ar' ? 'الكفالات والرعاية' : 'Sponsorships & Care', icon: Users, tab: 'sponsorships', badge: counts?.sponsorships || 418 },
        { label: lang === 'ar' ? 'الشراكات والمانحون' : 'Partnerships & Donors', icon: Handshake, tab: 'contracts' },
      ]
    },
    {
      title: lang === 'ar' ? 'المالية والموارد' : 'Finance & Resources',
      domains: [
        { label: lang === 'ar' ? 'الموارد البشرية' : 'Human Resources', icon: Package, tab: 'users' },
        { label: lang === 'ar' ? 'المالية والحسابات' : 'Finance & Accounts', icon: Database, tab: 'finance' },
        { label: lang === 'ar' ? 'الوثائق والسياسات' : 'Documents & Policies', icon: BookOpen, tab: 'docs' },
        { label: lang === 'ar' ? 'العملات والصرف' : 'Currency & Exchange', icon: Cable, tab: 'currencies' },
      ]
    },
    {
      title: lang === 'ar' ? 'التقارير والمتابعة' : 'Reports & Follow-up',
      domains: [
        { label: lang === 'ar' ? 'تقارير الأثر والنتائج' : 'Impact & Results', icon: Sparkles, tab: 'reports' },
        { label: lang === 'ar' ? 'سيناريوهات العمل' : 'Standard Procedures', icon: FileText, tab: 'scenarios' },
      ]
    }
  ];

  const actions = [
    { label: lang === 'ar' ? 'إضافة مستفيد' : 'Add Beneficiary', icon: Plus, tab: 'beneficiaries' },
    { label: lang === 'ar' ? 'سند صرف / قيد' : 'New Voucher', icon: Coins, tab: 'finance' },
    { label: lang === 'ar' ? 'نشاط ميداني' : 'Field Activity', icon: Compass, tab: 'activities' },
    { label: lang === 'ar' ? 'الموافقات المعلقة' : 'Approvals', icon: ShieldCheck, tab: 'approvals' },
    { label: lang === 'ar' ? 'كفالة جديدة' : 'Sponsorship', icon: HandHeart, tab: 'sponsorships' },
    { label: lang === 'ar' ? 'تقرير معتمد' : 'Print Report', icon: FileText, tab: 'reports' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-6">
        {groups.map((group, gi) => (
            <div key={gi}>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">{group.title}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {group.domains.map((dom, di) => (
                      <React.Fragment key={di}>
                        <OperationalModuleCard 
                          label={dom.label} 
                          icon={dom.icon} 
                          badge={dom.badge}
                          onClick={() => onNavigate(dom.tab)} 
                        />
                      </React.Fragment>
                    ))}
                </div>
            </div>
        ))}
      </div>

      <div className={`bg-zinc-950 ${designTokens.borderRadius.md} p-6 text-white shadow-xl flex flex-col gap-4`}>
        <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest text-center">
            {lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
            {actions.map((action, i) => (
                <React.Fragment key={i}>
                    <QuickActionCard 
                        label={action.label} 
                        icon={action.icon} 
                        onClick={() => action.tab === 'manual' ? window.open('/docs/USER_MANUAL.md', '_blank') : onNavigate(action.tab)}
                    />
                </React.Fragment>
            ))}
        </div>
      </div>
    </div>
  );
}
