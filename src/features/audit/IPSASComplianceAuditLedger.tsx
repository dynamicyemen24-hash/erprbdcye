import React, { useState } from 'react';
import { ShieldCheck, FileText, Loader2, Zap } from 'lucide-react';

interface IPSASTransaction {
  id: string;
  amount: number;
  ipsasRef: string; // e.g., IPSAS 1, IPSAS 9
  status: 'Compliant' | 'Non-Compliant' | 'Review';
}

export default function IPSASComplianceAuditLedger({ lang }: { lang: 'ar' | 'en' }) {
  const [ledger, setLedger] = useState<IPSASTransaction[]>([
    { id: 'TX-901', amount: 5000, ipsasRef: 'IPSAS 1', status: 'Compliant' },
    { id: 'TX-902', amount: 12000, ipsasRef: 'IPSAS 9', status: 'Review' },
    { id: 'TX-903', amount: 3500, ipsasRef: 'IPSAS 17', status: 'Non-Compliant' },
  ]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-purple-600" />
        {lang === 'ar' ? 'سجل تدقيق الامتثال لمعايير (IPSAS)' : 'IPSAS Compliance Audit Ledger'}
      </h3>
      
      <div className="space-y-3">
        {ledger.map((tx) => (
          <div key={tx.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-zinc-400" />
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{tx.id}</p>
                <p className="text-[10px] text-zinc-500">{tx.ipsasRef}</p>
              </div>
            </div>
            <div className="text-right">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">${tx.amount}</p>
                <p className={`text-[10px] font-bold ${
                    tx.status === 'Compliant' ? 'text-emerald-500' : 
                    tx.status === 'Review' ? 'text-amber-500' : 'text-rose-500'
                }`}>
                    {tx.status}
                </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
