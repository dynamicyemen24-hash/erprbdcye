import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp } from 'lucide-react';

const mockData = [
  { year: '2023', spending: 4000, retention: 80, completion: 75 },
  { year: '2024', spending: 5500, retention: 85, completion: 82 },
  { year: '2025', spending: 6200, retention: 92, completion: 88 },
];

export default function YoYPerformanceView({ lang }: { lang: 'ar' | 'en' }) {
  const [fiscalYear, setFiscalYear] = useState('2025');

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          {lang === 'ar' ? 'مقارنة الأداء السنوي (YoY)' : 'YoY Performance Comparison'}
        </h3>
        <select 
            value={fiscalYear} 
            onChange={(e) => setFiscalYear(e.target.value)}
            className="text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg"
        >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
        </select>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="spending" fill="#059669" name={lang === 'ar' ? 'الإنفاق' : 'Spending'} />
            <Bar dataKey="retention" fill="#d97706" name={lang === 'ar' ? 'الاحتفاظ' : 'Retention'} />
            <Bar dataKey="completion" fill="#6366f1" name={lang === 'ar' ? 'الإنجاز' : 'Completion'} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
