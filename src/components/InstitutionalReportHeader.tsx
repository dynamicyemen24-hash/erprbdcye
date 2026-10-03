import React from 'react';

export interface InstitutionalHeaderData {
  orgNameAr: string;
  orgNameEn: string;
  licenseNo?: string;
  hqCity?: string;
  branchCode?: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface InstitutionalReportHeaderProps {
  title: string;
  titleSecondary?: string;
  lang: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
  header: InstitutionalHeaderData;
}

export function InstitutionalReportHeader({ title, titleSecondary, lang, dir, header }: InstitutionalReportHeaderProps) {
  const accent = header.primaryColor || '#0B5C3F';
  const monogram = (lang === 'ar' ? header.orgNameAr : header.orgNameEn).trim().charAt(0) || 'N';
  const meta = [
    header.licenseNo ? (lang === 'ar' ? `ترخيص: ${header.licenseNo}` : `License: ${header.licenseNo}`) : null,
    header.hqCity || null,
    header.branchCode ? (lang === 'ar' ? `الفرع: ${header.branchCode}` : `Branch: ${header.branchCode}`) : null,
  ].filter(Boolean);

  return (
    <header
      dir={dir}
      lang={lang}
      className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm"
      style={{ borderTop: `4px solid ${accent}` }}
    >
      <div className="flex items-center gap-4">
        {header.logoUrl ? (
          <img src={header.logoUrl} alt={header.orgNameAr} className="w-14 h-14 rounded-xl object-contain bg-slate-50 dark:bg-zinc-800" />
        ) : (
          <div
            aria-hidden="true"
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black text-white shrink-0"
            style={{ backgroundColor: accent }}
          >
            {monogram}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-base font-black text-slate-900 dark:text-zinc-100 truncate">
            {lang === 'ar' ? header.orgNameAr : header.orgNameEn}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
            {lang === 'ar' ? header.orgNameEn : header.orgNameAr}
          </p>
          {meta.length > 0 && (
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 truncate">{meta.join(' • ')}</p>
          )}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
        <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100">{title}</h2>
        {titleSecondary && <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{titleSecondary}</p>}
      </div>
    </header>
  );
}

export default InstitutionalReportHeader;
