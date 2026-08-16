import React from 'react';
import { Building2 } from 'lucide-react';

interface HROrgPositionsViewProps {
  lang: 'ar' | 'en';
}

export default function HROrgPositionsView({ lang }: HROrgPositionsViewProps) {
  const isRtl = lang === 'ar';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>{isRtl ? 'الهيكل التنظيمي وموازنة الوظائف (Position Budgeting)' : 'Org Hierarchy & Position Budgeting'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {isRtl ? 'ربط الوحدات الإدارية والمناصب الهيكلية بخطة الموازنة التقديرية (Headcount Budget)' : 'Mapping business units, positions, and approved headcount budgets.'}
          </p>
        </div>

        <button className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
          {isRtl ? 'إضافة منصب جديد' : 'Add Position'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { dept: 'إدارة البرامج والمشاريع الإغاثية', code: 'DEP-PROJ', headcount: 14, budgeted: 16, lead: 'م. أحمد المعمري' },
          { dept: 'إدارة المالية والامتثال IPSAS', code: 'DEP-FIN', headcount: 6, budgeted: 6, lead: 'أ. ياسر باوزير' },
          { dept: 'إدارة العمليات الميدانية WBS', code: 'DEP-OPS', headcount: 22, budgeted: 25, lead: 'د. خالد العماري' },
        ].map((item, idx) => (
          <div key={idx} className="p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-black rounded">{item.code}</span>
              <span className="text-xs text-slate-400">{item.headcount} / {item.budgeted} {isRtl ? 'شاغر' : 'FTE'}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">{item.dept}</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">{isRtl ? `مدير الإدارة: ${item.lead}` : `Director: ${item.lead}`}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
