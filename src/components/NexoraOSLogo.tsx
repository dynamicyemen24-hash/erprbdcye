import React from 'react';
import { Cpu, Globe2, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { ORGANIZATION_CONFIG } from '../core/config';

interface NexoraOSLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  iconOnly?: boolean;
  lang?: 'ar' | 'en';
}

export const NexoraOSLogo: React.FC<NexoraOSLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
  iconOnly = false,
  lang = 'ar'
}) => {
  const containerPadding = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-2.5' : size === 'xl' ? 'p-3.5' : 'p-2';
  const iconPixelSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : size === 'xl' ? 'w-8 h-8' : 'w-5 h-5';

  const emblemVisual = (
    <div className={`relative flex items-center justify-center ${containerPadding} rounded-xl bg-gradient-to-br from-emerald-950 via-zinc-900 to-emerald-950 border border-emerald-500/40 shadow-lg shadow-emerald-950/50 group-hover:border-amber-500/60 transition-all duration-300 shrink-0`}>
      <img
        src="/UAMEX_ERPLOGO.png"
        alt="UAMEX ERP"
        className={`${iconPixelSize} object-contain`}
      />

      {/* Live operational status dot */}
      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-emerald-950"></span>
      </span>
    </div>
  );

  if (iconOnly) {
    return (
      <div className={`group cursor-pointer select-none ${className}`} title={`${ORGANIZATION_CONFIG.systemName} - ${ORGANIZATION_CONFIG.systemIdentity.version}`}>
        {emblemVisual}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 group select-none shrink-0 ${className}`}>
      {emblemVisual}

      {/* Typography & Version */}
      <div className="flex flex-col text-right rtl:text-right leading-none">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
            UAMEX <span className="text-amber-400 font-extrabold">ERP™</span>
          </span>
          <span className="px-1 py-0.5 text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded font-mono">
            NexoraOS™
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] text-emerald-400/90 font-semibold tracking-wider mt-0.5 font-mono">
            {lang === 'ar' ? 'نظام يو امكس المؤسسي الشامل' : 'Intelligent Enterprise OS'}
          </span>
        )}
      </div>
    </div>
  );
};

export default NexoraOSLogo;
