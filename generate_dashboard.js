const fs = require('fs');

const content = `import React, { useState } from 'react';
import { 
  Building2, Users, Briefcase, TrendingUp, ShieldCheck, 
  Database, Activity, CheckCircle2, AlertTriangle, Printer
} from 'lucide-react';
import { 
  Workspace, WidgetFrame, ChartContainer, EnterpriseDataGrid 
} from './enterprise';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardViewProps {
  stats: any;
  loading: boolean;
  onNavigate: (tabId: string) => void;
  lang: 'ar' | 'en';
  onRefresh?: () => void;
  programs?: any[];
  projects?: any[];
  beneficiaries?: any[];
  sponsorships?: any[];
  approvalRequests?: any[];
  users?: any[];
  currencies?: any[];
  systemAlerts?: any[];
  currentUser?: any;
}

export default function DashboardView({
  stats,
  loading,
  onNavigate,
  lang,
  onRefresh,
  projects = [],
  beneficiaries = [],
  approvalRequests = [],
  currentUser = null
}: DashboardViewProps) {
  const [activeBranch, setActiveBranch] = useState('hq');

  // Dummy data for charts based on the real architecture
  const beneficiaryGrowthData = [
    { month: 'Jan', cases: 1200 },
    { month: 'Feb', cases: 1900 },
    { month: 'Mar', cases: 3000 },
    { month: 'Apr', cases: 4100 },
    { month: 'May', cases: 5800 },
    { month: 'Jun', cases: 7200 }
  ];

  const budgetDistributionData = [
    { name: 'Water', value: 40000000, color: '#0ea5e9' },
    { name: 'Education', value: 30000000, color: '#8b5cf6' },
    { name: 'Health', value: 20000000, color: '#ec4899' },
    { name: 'Orphans', value: 50000000, color: '#f59e0b' }
  ];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-YE' : 'en-US').format(num);
  };

  const headerContent = (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
      <div className="space-y-2 flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold tracking-wider uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{lang === 'ar' ? 'نظام التشغيل المؤسسي الذكي • NEXORAOS™ ENTERPRISE OS' : 'NEXORAOS™ INTELLIGENT ENTERPRISE OPERATING SYSTEM'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-slate-900 dark:text-white flex items-center gap-3">
          {lang === 'ar' ? 'مركز قيادة العمليات والتحليلات المتكاملة' : 'Enterprise Command Center'}
        </h1>
      </div>
      
      <div className="flex flex-col bg-slate-50 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800/80 p-4 rounded-xl space-y-2 text-right min-w-[240px] font-mono text-[10px] font-bold">
        <div className="flex justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-1.5">
          <span className="text-slate-500">{lang === 'ar' ? 'الجاهزية:' : 'Health:'}</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 96% SECURE
          </span>
        </div>
        <div className="flex justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-1.5">
          <span className="text-slate-500">{lang === 'ar' ? 'قاعدة البيانات:' : 'Database:'}</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Database className="w-3 h-3 text-emerald-500" /> Neon Pool Live
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Workspace 
      header={headerContent}
      statusBar={
        <>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {lang === 'ar' ? 'جميع الأنظمة تعمل بكفاءة' : 'All systems operational'}
          </span>
          <button className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors">
            <Printer className="w-3 h-3" />
            <span>{lang === 'ar' ? 'طباعة التقرير' : 'Print Report'}</span>
          </button>
        </>
      }
    >
      <div className="space-y-6 animate-fade-in pb-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: lang === 'ar' ? 'إجمالي المستفيدين' : 'Total Beneficiaries', value: stats?.totalBeneficiaries || beneficiaries.length || 0, icon: Users, color: 'text-blue-600' },
            { label: lang === 'ar' ? 'المشاريع النشطة' : 'Active Projects', value: stats?.activeProjects || projects.length || 0, icon: Briefcase, color: 'text-emerald-600' },
            { label: lang === 'ar' ? 'حجم الموازنة' : 'Total Budget', value: 'YER 1.4B', icon: Activity, color: 'text-amber-600' },
            { label: lang === 'ar' ? 'الموافقات المعلقة' : 'Pending Approvals', value: approvalRequests.filter((r:any) => r.status === 'pending').length || 0, icon: AlertTriangle, color: 'text-red-600' }
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-xl font-black text-slate-800 dark:text-zinc-100 font-mono">{kpi.value.toLocaleString()}</p>
              </div>
              <div className={\`w-10 h-10 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center \${kpi.color}\`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WidgetFrame
            id="beneficiary_growth"
            title={lang === 'ar' ? 'منحنى الرعاية والتدفق' : 'Beneficiary Growth'}
            icon={TrendingUp}
            defaultHeight={300}
          >
            {({ width, height }) => (
              <ChartContainer height={height}>
                <AreaChart data={beneficiaryGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <ReTooltip />
                  <Area type="monotone" dataKey="cases" stroke="#10b981" strokeWidth={2.5} fill="#10b981" fillOpacity={0.2} />
                </AreaChart>
              </ChartContainer>
            )}
          </WidgetFrame>

          <WidgetFrame
            id="budget_dist"
            title={lang === 'ar' ? 'توزيع الموازنات' : 'Budget Distribution'}
            icon={Building2}
            defaultHeight={300}
          >
            {({ width, height }) => (
              <ChartContainer height={height}>
                <PieChart>
                  <Pie data={budgetDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                    {budgetDistributionData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ChartContainer>
            )}
          </WidgetFrame>
        </div>

      </div>
    </Workspace>
  );
}
`;
fs.writeFileSync('src/components/DashboardView.tsx', content);
