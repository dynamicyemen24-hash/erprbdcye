import React, { useState, useMemo } from 'react';
import { 
  History, ShieldCheck, AlertCircle, Search, Filter, Download, 
  User, CheckCircle2, Clock, FileText, Database, Lock, Check 
} from 'lucide-react';
import { WidgetFrame } from '../enterprise/widgets/WidgetFrame';

interface ActivityLogWidgetProps {
  lang: 'ar' | 'en';
}

interface ActivityItem {
  id: string;
  user: string;
  role_ar: string;
  role_en: string;
  action_ar: string;
  action_en: string;
  module: 'FINANCE' | 'FIELD' | 'SYSTEM' | 'SECURITY';
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

export function ActivityLogWidget({ lang }: ActivityLogWidgetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<'ALL' | 'FINANCE' | 'FIELD' | 'SYSTEM' | 'SECURITY'>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const initialActivities: ActivityItem[] = [
    {
      id: 'act-101',
      user: 'أحمد سعيد با وزير',
      role_ar: 'المشرف المالي',
      role_en: 'Financial Supervisor',
      action_ar: 'اعتماد صرف الموازنة التشغيلية لمشروع المياه - المهرة (#982)',
      action_en: 'Approved operational budget for Water Project - Al-Mahrah (#982)',
      module: 'FINANCE',
      timestamp: 'قبل 10 دقائق',
      status: 'SUCCESS'
    },
    {
      id: 'act-102',
      user: 'خالد عبدالله العمودي',
      role_ar: 'مدير العمليات الميدانية',
      role_en: 'Field Operations Manager',
      action_ar: 'تأكيد اكتمال زيارة المتابعة الميدانية - تعز (#F-402)',
      action_en: 'Confirmed field follow-up visit completion - Taiz (#F-402)',
      module: 'FIELD',
      timestamp: 'قبل 45 دقيقة',
      status: 'SUCCESS'
    },
    {
      id: 'act-103',
      user: 'نظام Nexora Automated Sync',
      role_ar: 'خدمة التزامن الآلي',
      role_en: 'Auto-Sync Service',
      action_ar: 'تحديث قواعد بيانات المستفيدين وحساب مؤشرات IPSAS',
      action_en: 'Updated beneficiary databases and computed IPSAS ledger metrics',
      module: 'SYSTEM',
      timestamp: 'قبل ساعتين',
      status: 'SUCCESS'
    },
    {
      id: 'act-104',
      user: 'م. مريم بن محفوظ',
      role_ar: 'مسؤولة الجودة والسلامة',
      role_en: 'QA & Compliance Officer',
      action_ar: 'مراجعة وتوثيق تقرير مخاطر التوريدات للربع الثالث',
      action_en: 'Reviewed Q3 supply chain risk compliance report',
      module: 'SECURITY',
      timestamp: 'قبل 3 ساعات',
      status: 'WARNING'
    },
    {
      id: 'act-105',
      user: 'عمر القعيطي',
      role_ar: 'منسق كفالات الأيتام',
      role_en: 'Sponsorship Coordinator',
      action_ar: 'تسجيل 24 حالة مستفيدة جديدة في قاعدة البيانات الموحدة',
      action_en: 'Registered 24 new beneficiary cases in the unified DB',
      module: 'FIELD',
      timestamp: 'قبل 5 ساعات',
      status: 'SUCCESS'
    }
  ];

  const filteredActivities = useMemo(() => {
    return initialActivities.filter(item => {
      const matchesModule = selectedModule === 'ALL' || item.module === selectedModule;
      const textToSearch = `${item.user} ${item.action_ar} ${item.action_en} ${item.role_ar} ${item.role_en}`.toLowerCase();
      const matchesSearch = !searchQuery || textToSearch.includes(searchQuery.toLowerCase());
      return matchesModule && matchesSearch;
    });
  }, [selectedModule, searchQuery]);

  const handleExportLogs = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      const headers = ["ID", "User", "Role", "Action", "Module", "Timestamp"];
      const rows = filteredActivities.map(a => [
        a.id, 
        a.user, 
        a.role_ar, 
        `"${a.action_ar.replace(/"/g, '""')}"`, 
        a.module, 
        a.timestamp
      ]);
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Nexora_Activity_Audit_Log_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 500);
  };

  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case 'FINANCE':
        return { label_ar: 'مالية', label_en: 'Finance', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60' };
      case 'FIELD':
        return { label_ar: 'ميداني', label_en: 'Field', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60' };
      case 'SECURITY':
        return { label_ar: 'امتثال', label_en: 'Security', bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60' };
      default:
        return { label_ar: 'نظام', label_en: 'System', bg: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700' };
    }
  };

  return (
    <WidgetFrame
      id="activity-log-widget"
      title={lang === 'ar' ? 'سجل العمليات والتدقيق' : 'Enterprise Audit Log'}
      icon={History}
      subtitle={lang === 'ar' ? 'متابعة لحظية لكافة الاعتمادات والإجراءات الميدانية والمالية' : 'Real-time audit trail of operational approvals and field activities'}
      headerActions={
        <button
          onClick={handleExportLogs}
          disabled={isExporting}
          className="text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
        </button>
      }
    >
      {() => (
        <div className="space-y-3 overflow-y-auto h-full">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'البحث في سجل الإجراءات والمستخدمين...' : 'Search activity log or users...'}
                className="w-full pl-3 pr-8 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-zinc-200"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto">
              {[
                { id: 'ALL', ar: 'الكل', en: 'All' },
                { id: 'FINANCE', ar: 'المالية', en: 'Finance' },
                { id: 'FIELD', ar: 'الميدان', en: 'Field' },
                { id: 'SYSTEM', ar: 'النظام', en: 'System' },
              ].map(mod => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedModule === mod.id
                      ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400'
                  }`}
                >
                  {lang === 'ar' ? mod.ar : mod.en}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Stream List */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {filteredActivities.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                {lang === 'ar' ? 'لا توجد سجلات تطابق البحث' : 'No activity records found'}
              </div>
            ) : (
              filteredActivities.map((act) => {
                const badge = getModuleBadge(act.module);
                return (
                  <div
                    key={act.id}
                    className="p-3 bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/80 rounded-xl flex items-start justify-between gap-3 hover:border-emerald-500/30 transition-all shadow-3xs"
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {act.user}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                            ({lang === 'ar' ? act.role_ar : act.role_en})
                          </span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border ${badge.bg}`}>
                            {lang === 'ar' ? badge.label_ar : badge.label_en}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-normal">
                          {lang === 'ar' ? act.action_ar : act.action_en}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-zinc-500 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{act.timestamp}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </WidgetFrame>
  );
}
