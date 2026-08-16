import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertTriangle, ShieldCheck, Building2, Star } from 'lucide-react';

interface VendorPerformance {
  code: string;
  name: string;
  category: string;
  qualityScore: number;
  timelinessScore: number;
  contractCompliance: number;
  status: 'ACTIVE' | 'WARNING' | 'SUSPENDED';
}

export default function VendorPerformanceAnalyticsView({ lang }: { lang: 'ar' | 'en' }) {
  const isRtl = lang === 'ar';
  const [vendors] = useState<VendorPerformance[]>([
    { code: 'VND-001', name: 'مؤسسة البركة للتوريدات الإغاثية', category: 'سلال غذائية وطوارئ', qualityScore: 96, timelinessScore: 92, contractCompliance: 98, status: 'ACTIVE' },
    { code: 'VND-002', name: 'شركة الخليج للمعدات وحفر الآبار', category: 'معدات مياه وحفر آبار', qualityScore: 90, timelinessScore: 88, contractCompliance: 94, status: 'ACTIVE' },
    { code: 'VND-003', name: 'مجموعة الأمل اللوجستية والشحن', category: 'نقل وشحن إقليمي', qualityScore: 78, timelinessScore: 68, contractCompliance: 82, status: 'WARNING' },
  ]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-500" />
          <span>{isRtl ? 'تحليل ومؤشرات أداء الموردين' : 'Vendor Performance Analytics'}</span>
        </h3>
        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold rounded">
          {isRtl ? 'معتمد IPSAS' : 'IPSAS Verified'}
        </span>
      </div>

      <div className="space-y-3">
        {vendors.map((v, i) => (
          <div key={i} className="p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{v.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{v.code} • {v.category}</p>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                v.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
              }`}>
                {v.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1 border-t border-slate-200/60 dark:border-zinc-800/60">
              <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[9px] text-slate-400 block">{isRtl ? 'الجودة' : 'Quality'}</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{v.qualityScore}%</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[9px] text-slate-400 block">{isRtl ? 'التسليم' : 'Speed'}</span>
                <span className={`text-xs font-black ${v.timelinessScore < 75 ? 'text-amber-600' : 'text-emerald-600'}`}>{v.timelinessScore}%</span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                <span className="text-[9px] text-slate-400 block">{isRtl ? 'الالتزام' : 'SLA'}</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">{v.contractCompliance}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
