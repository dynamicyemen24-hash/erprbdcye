import React, { useState } from 'react';
import { ShieldCheck, Loader2, Search, AlertTriangle } from 'lucide-react';

export default function ForensicAuditView({ lang }: { lang: 'ar' | 'en' }) {
  const [scanning, setScanning] = useState(false);
  const [findings, setFindings] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runAudit = async () => {
    setScanning(true);
    try {
      const response = await fetch('/api/security/forensic-audit', { method: 'POST' });
      const data = await response.json();
      setFindings(data.findings);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Forensic audit failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-rose-500" />
        {lang === 'ar' ? 'أداة التدقيق الجنائي الذكية (AI Forensic)' : 'AI Forensic Audit Tool'}
      </h3>
      
      <button 
        onClick={runAudit}
        disabled={scanning}
        className="w-full py-3 bg-rose-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        {lang === 'ar' ? 'بدء فحص النظام' : 'Initiate System Scan'}
      </button>

      {scanning && findings.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {lang === 'ar' ? 'جارٍ فحص النظام...' : 'Scanning system...'}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg flex items-center justify-between">
          <span className="text-xs text-red-700 dark:text-red-300">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
        </div>
      )}

      {findings.length > 0 && (
        <div className="mt-6 space-y-2">
          {findings.map((f, i) => (
            <div key={i} className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg flex items-start gap-3 border border-rose-200 dark:border-rose-900/30">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <p className="text-xs text-rose-900 dark:text-rose-200">{f.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
