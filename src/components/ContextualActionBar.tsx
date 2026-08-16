import React from 'react';
import { 
  Briefcase, 
  Users, 
  Coins, 
  FileText, 
  Compass, 
  Share2, 
  CheckCircle2, 
  ArrowUpRight, 
  Shield, 
  Sparkles,
  Heart,
  Globe
} from 'lucide-react';
import { TabId } from '../types';
import { triggerHaptic } from '../helpers/hapticSwipe';

interface ContextualActionBarProps {
  lang: 'ar' | 'en';
  activeTab: TabId;
  onNavigate: (tab: TabId) => void;
  selectedEntityName?: string;
  selectedEntityCode?: string;
}

export const ContextualActionBar: React.FC<ContextualActionBarProps> = ({
  lang,
  activeTab,
  onNavigate,
  selectedEntityName,
  selectedEntityCode
}) => {
  const isRtl = lang === 'ar';

  // Build contextual shortcuts based on activeTab
  const getContextualLinks = () => {
    switch (activeTab) {
      case 'projects':
        return [
          { labelAr: 'الأنشطة والمهام الميدانية', labelEn: 'Field Activities', tab: 'activities' as TabId, icon: Compass },
          { labelAr: 'موازنة وحسابات المشروع', labelEn: 'Project Finance & Budget', tab: 'finance' as TabId, icon: Coins },
          { labelAr: 'خريطة المواقع الجغرافية', labelEn: 'GIS Field Locations', tab: 'geospatial' as TabId, icon: Globe },
          { labelAr: 'مستفيدو المشروع', labelEn: 'Project Beneficiaries', tab: 'beneficiaries' as TabId, icon: Users },
          { labelAr: 'تقرير الأثر النهائي', labelEn: 'Impact & Reports', tab: 'reports' as TabId, icon: FileText },
        ];

      case 'programs':
        return [
          { labelAr: 'المشاريع المرتبطة', labelEn: 'Linked Projects', tab: 'projects' as TabId, icon: Briefcase },
          { labelAr: 'موازنة البرنامج والمالية', labelEn: 'Program Finance', tab: 'finance' as TabId, icon: Coins },
          { labelAr: 'كفالات الأيتام والرعاية', labelEn: 'Orphan Care & Welfare', tab: 'sponsorships' as TabId, icon: Heart },
        ];

      case 'beneficiaries':
        return [
          { labelAr: 'كفالات الأيتام المباشرة', labelEn: 'Direct Orphan Care', tab: 'sponsorships' as TabId, icon: Heart },
          { labelAr: 'الخريطة المكانية للتوزيع', labelEn: 'Spatial Distribution Map', tab: 'geospatial' as TabId, icon: Globe },
          { labelAr: 'سجل المساعدات والمالية', labelEn: 'Financial Assistance', tab: 'finance' as TabId, icon: Coins },
        ];

      case 'activities':
        return [
          { labelAr: 'إدارة المشروع الرئيسي', labelEn: 'Parent Project Details', tab: 'projects' as TabId, icon: Briefcase },
          { labelAr: 'تخصيص الموارد وجدول Gantt', labelEn: 'Resource Allocation', tab: 'allocations' as TabId, icon: Compass },
          { labelAr: 'الموافقة والاعتماد', labelEn: 'Approval Workflow', tab: 'approvals' as TabId, icon: Shield },
        ];

      case 'finance':
        return [
          { labelAr: 'شجرة المشاريع المتموّلة', labelEn: 'Funded Projects', tab: 'projects' as TabId, icon: Briefcase },
          { labelAr: 'الموافقات المالية', labelEn: 'Financial Approvals', tab: 'approvals' as TabId, icon: Shield },
          { labelAr: 'العملات وسعر الصرف', labelEn: 'Currencies & Rates', tab: 'currencies' as TabId, icon: Coins },
        ];

      default:
        return [
          { labelAr: 'المشاريع الميدانية', labelEn: 'Field Projects', tab: 'projects' as TabId, icon: Briefcase },
          { labelAr: 'الخريطة المكانية', labelEn: 'Geospatial Map', tab: 'geospatial' as TabId, icon: Globe },
          { labelAr: 'سجل المستفيدين', labelEn: 'Beneficiaries', tab: 'beneficiaries' as TabId, icon: Users },
        ];
    }
  };

  const links = getContextualLinks();

  return (
    <div 
      className="bg-slate-100/80 dark:bg-zinc-950/80 border-b border-slate-200 dark:border-zinc-800/80 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar text-xs"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-2 shrink-0">
        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px] border border-emerald-500/20 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>{isRtl ? 'الإجراءات السياقية السريعة' : 'Contextual Actions'}</span>
        </span>

        {selectedEntityName && (
          <span className="font-extrabold text-slate-800 dark:text-zinc-200 truncate max-w-xs">
            {selectedEntityCode && <span className="font-mono text-amber-500 mr-1 rtl:ml-1">[{selectedEntityCode}]</span>}
            {selectedEntityName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {links.map((link, idx) => {
          const IconComp = link.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                triggerHaptic('light');
                onNavigate(link.tab);
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 font-extrabold text-[11px] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
            >
              <IconComp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{isRtl ? link.labelAr : link.labelEn}</span>
              <ArrowUpRight className="w-3 h-3 opacity-50" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContextualActionBar;
