import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MapPin } from 'lucide-react';

const branchData = [
  { branch: 'MENA', budget: 85, impact: 90, efficiency: 80 },
  { branch: 'Europe', budget: 95, impact: 85, efficiency: 90 },
  { branch: 'Asia', budget: 80, impact: 95, efficiency: 85 },
  { branch: 'Americas', budget: 90, impact: 88, efficiency: 88 },
];

export default function GlobalBranchKPIComparisonView({ lang }: { lang: 'ar' | 'en' }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <MapPin className="w-5 h-5 text-purple-600" />
        {lang === 'ar' ? 'مقارنة مؤشرات أداء الفروع العالمية' : 'Global Branch KPI Comparison'}
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={branchData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="branch" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name={lang === 'ar' ? 'الميزانية' : 'Budget'} dataKey="budget" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Radar name={lang === 'ar' ? 'الأثر' : 'Impact'} dataKey="impact" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
            <Radar name={lang === 'ar' ? 'الكفاءة' : 'Efficiency'} dataKey="efficiency" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
