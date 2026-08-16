import React from 'react';
import { Users, BarChart2, Zap } from 'lucide-react';
import { EmployeeContributionView, AIWorkloadBalancerView } from './';

export default function HRDashboardView({ lang }: { lang: 'ar' | 'en' }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-emerald-600" />
          {lang === 'ar' ? 'لوحة تحكم الموارد البشرية' : 'HR Management Dashboard'}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmployeeContributionView employeeId="current-user" lang={lang} />
          <AIWorkloadBalancerView lang={lang} />
        </div>
      </div>
      
      {/* Add more HR specific widgets here in the future as needed */}
    </div>
  );
}
