import React from 'react';

export interface GlobalOperationalFooterProps {
  lang: 'ar' | 'en';
  dbConnected: boolean;
  totalRecordsCount: number;
  orgName: string;
}

export const GlobalOperationalFooter: React.FC<GlobalOperationalFooterProps> = ({
  lang,
  dbConnected,
  totalRecordsCount,
  orgName
}) => {
  return (
    <footer className="h-7 bg-zinc-950 border-t border-zinc-800 text-zinc-400 flex items-center justify-between px-3 shrink-0 text-[10px] font-bold z-40 relative select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <span className={dbConnected ? 'text-emerald-400' : 'text-rose-400'}>
            {dbConnected 
              ? (lang === 'ar' ? 'الرابطة التشغيلية الموحدة: نشطة وآمنة 🛡️' : 'Unified Operating System: Active & Secure 🛡️') 
              : (lang === 'ar' ? 'نمط الاتصال المستقل' : 'Standby Mode Active')}
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-2 border-l rtl:border-l-0 rtl:border-r border-zinc-800 px-3 py-0.5 font-mono text-zinc-300">
          <span>{lang === 'ar' ? 'السجلات المعتمدة:' : 'Total Records:'}</span>
          <span className="text-amber-400 font-bold">{totalRecordsCount}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-emerald-400 font-mono">v2.4.0-Enterprise</span>
        <span className="text-zinc-700">|</span>
        <span className="font-mono text-zinc-400">
          © 2026 {orgName}
        </span>
      </div>
    </footer>
  );
};

export default GlobalOperationalFooter;
