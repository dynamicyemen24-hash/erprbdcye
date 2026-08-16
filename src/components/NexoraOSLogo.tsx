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
    <div className={`relative flex items-center justify-center ${containerPadding} rounded-xl bg-gradient-to-br from-emerald-950 via-teal-950 to-emerald-950 border border-emerald-500/40 shadow-lg shadow-emerald-950/50 group-hover:border-amber-500/60 transition-all duration-300 shrink-0`}>
      {/* Glowing background ring */}
      <div className="absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm group-hover:bg-amber-500/20 transition-all duration-300"></div>

      {/* SVG Custom High-Tech Enterprise Emblem Icon */}
      <svg
        className={`${iconPixelSize} relative z-10 text-emerald-400 group-hover:text-amber-400 transition-colors duration-300`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7v7c0 5.25 3.75 10.15 10 12.5 6.25-2.35 10-7.25 10-12.5V7l-10-5z" fill="rgba(5, 150, 105, 0.15)" />
        <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <circle cx="12" cy="12" r="3" fill="#d97706" stroke="none" />
        <path d="M12 2L17 7L12 12L7 7Z" fill="rgba(217, 119, 6, 0.3)" />
      </svg>

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
            Nexora<span className="text-amber-400 font-extrabold">OS</span>
          </span>
          <span className="px-1 py-0.5 text-[8px] font-black uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded font-mono">
            Enterprise v2.6
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] text-emerald-400/90 font-semibold tracking-wider mt-0.5 font-mono">
            {lang === 'ar' ? 'نظام التشغيل المؤسسي الذكي' : 'Intelligent Enterprise OS'}
          </span>
        )}
      </div>
    </div>
  );
};

export default NexoraOSLogo;
