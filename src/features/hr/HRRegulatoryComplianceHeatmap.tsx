import React, { useState } from 'react';
import { AlertTriangle, Shield, CheckCircle, Clock, ShieldCheck, FileCheck } from 'lucide-react';

interface ComplianceItem {
  id: string;
  type: string;
  employee: string;
  daysToExpiration: number;
  status: 'critical' | 'warning' | 'compliant';
}

export default function HRRegulatoryComplianceHeatmap({ lang }: { lang: 'ar' | 'en' }) {
  const isRtl = lang === 'ar';
  const [items] = useState<ComplianceItem[]>([
    { id: 'CERT-001', type: 'شهادة السلامة والإغاثة الميدانية الإلزامية', employee: 'م. علي الجائفي', daysToExpiration: 5, status: 'critical' },
    { id: 'CONT-002', type: 'تجديد عقد التوظيف الميداني', employee: 'د. خالد العماري', daysToExpiration: 22, status: 'warning' },
    { id: 'CERT-003', type: 'ترخيص مزاولة المحاسبة IPSAS', employee: 'أ. ياسر باوزير', daysToExpiration: 45, status: 'compliant' },
    { id: 'ID-004', type: 'تجديد البطاقة الوطنية والهوية الذكية', employee: 'سارة العريقي', daysToExpiration: 90, status: 'compliant' },
  ]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500" />
            <span>{isRtl ? 'خريطة الامتثال التنظيمي والأرشيف القانوني' : 'HR Regulatory Compliance & Document Heatmap'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {isRtl ? 'مراقبة صلاحية العقود الوظيفية، تراخيص الممارسة، والهويات القانونية لمنع أي مخاطر نظامية' : 'Monitoring contract expiry dates, safety certifications & legal policy compliance.'}
          </p>
        </div>

        <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-mono font-bold">
          {isRtl ? 'مؤشر الامتثال 94.5%' : '94.5% Compliance Index'}
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`p-3.5 border rounded-xl flex items-center justify-between transition-all ${
              item.daysToExpiration < 10 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200' 
                : item.daysToExpiration < 30
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.daysToExpiration < 10 ? (
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
              ) : item.daysToExpiration < 30 ? (
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold">{item.type}</p>
                <p className="text-[10px] text-slate-400 font-mono">{item.id} • {item.employee}</p>
              </div>
            </div>

            <div className="text-left rtl:text-right">
              <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg ${
                item.daysToExpiration < 10 ? 'bg-rose-600 text-white' : item.daysToExpiration < 30 ? 'bg-amber-600 text-white' : 'bg-emerald-600/20 text-emerald-500'
              }`}>
                {item.daysToExpiration} {isRtl ? 'يوم متبقي' : 'days left'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
