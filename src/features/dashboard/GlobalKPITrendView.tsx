import React, { useState } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Globe } from 'lucide-react';

const mockRegionalData = [
  { region: 'MENA', kpi: 85, spending: 4500 },
  { region: 'Europe', kpi: 92, spending: 6200 },
  { region: 'Asia', kpi: 88, spending: 5800 },
  { region: 'Americas', kpi: 90, spending: 6000 },
];

export default function GlobalKPITrendView({ lang }: { lang: 'ar' | 'en' }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <Globe className="w-5 h-5 text-purple-500" />
        {lang === 'ar' ? 'اتجاهات مؤشرات الأداء الرئيسية العالمية' : 'Global Strategic KPI Trend'}
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockRegionalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="right" dataKey="spending" fill="#8884d8" name={lang === 'ar' ? 'الإنفاق' : 'Spending'} />
            <Line yAxisId="left" type="monotone" dataKey="kpi" stroke="#82ca9d" name={lang === 'ar' ? 'مؤشر الأداء' : 'KPI'} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
