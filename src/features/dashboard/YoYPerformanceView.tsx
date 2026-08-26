import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  total_amount?: number;
  amount?: number;
  status?: string;
  type?: string;
}

export default function YoYPerformanceView({ lang }: { lang: 'ar' | 'en' }) {
  const [fiscalYear, setFiscalYear] = useState('2025');
  const [data, setData] = useState<{ year: string; spending: number; retention: number; completion: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/tables/transactions')
      .then(res => res.json())
      .then((rows: Transaction[]) => {
        if (!Array.isArray(rows) || rows.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }
        const grouped: Record<string, { spending: number; retention: number; completion: number; count: number }> = {};
        rows.forEach(tx => {
          const year = tx.date?.slice(0, 4);
          if (!year) return;
          if (!grouped[year]) grouped[year] = { spending: 0, retention: 0, completion: 0, count: 0 };
          const amount = tx.total_amount ?? tx.amount ?? 0;
          grouped[year].spending += amount;
          grouped[year].count += 1;
          if (tx.status === 'approved' || tx.status === 'completed') {
            grouped[year].completion += 1;
          }
        });
        const result = Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([year, g]) => ({
            year,
            spending: g.spending,
            retention: g.count > 0 ? Math.round((g.count / rows.length) * 100) : 0,
            completion: g.count > 0 ? Math.round((g.completion / g.count) * 100) : 0,
          }));
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setData([]);
        setLoading(false);
      });
  }, []);

  const years = data.map(d => d.year);

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
            {years.length > 0 ? years.map(y => <option key={y} value={y}>{y}</option>) : <option value="2025">2025</option>}
        </select>
      </div>
      
      {loading ? (
        <div className="h-64 flex items-center justify-center text-zinc-400 text-xs font-bold">
          {lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}
        </div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-zinc-400 text-xs font-bold">
          {lang === 'ar' ? 'لا توجد بيانات متاحة' : 'No transaction data available'}
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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
      )}
    </div>
  );
}
