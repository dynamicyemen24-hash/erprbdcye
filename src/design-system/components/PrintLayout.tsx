/**
 * UAMEX ERP™ — Print Layout Component v3.0
 * Professional print-optimized layout with UAMEX branding, page numbers, and RTL support
 */

import React from 'react';
import { cn } from '../utils/cn';

export interface PrintLayoutProps {
  title: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  logoSrc?: string;
  organizationName?: string;
  organizationNameAr?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showPageNumbers?: boolean;
  showTimestamp?: boolean;
  lang?: 'ar' | 'en';
  className?: string;
}

export function PrintLayout({
  title,
  titleAr,
  subtitle,
  subtitleAr,
  logoSrc = '/UAMEX_ERPLOGO.png',
  organizationName = 'Rohama\'a Baynahum Charity Foundation',
  organizationNameAr = 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
  children,
  footer,
  showPageNumbers = true,
  showTimestamp = true,
  lang = 'ar',
  className,
}: PrintLayoutProps) {
  const isRtl = lang === 'ar';
  const displayTitle = isRtl ? (titleAr || title) : title;
  const displaySubtitle = isRtl ? (subtitleAr || subtitle) : subtitle;
  const displayOrg = isRtl ? organizationNameAr : organizationName;

  return (
    <div className={cn('print-layout', className)} dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{`
        @media print {
          .print-layout { font-family: 'Inter', 'Noto Sans Arabic', sans-serif; color: #000; }
          .print-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 2px solid #059669; margin-bottom: 24px; }
          .print-logo { height: 48px; }
          .print-title { font-size: 18px; font-weight: 800; color: #059669; }
          .print-subtitle { font-size: 12px; color: #666; margin-top: 2px; }
          .print-org { font-size: 10px; color: #999; text-align: ${isRtl ? 'left' : 'right'}; }
          .print-body { min-height: 400px; }
          .print-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #e5e7eb; margin-top: 24px; font-size: 10px; color: #999; }
          .print-page-num::after { content: counter(page); }
          .no-print { display: none !important; }
          @page { margin: 2cm; size: A4; }
        }
      `}</style>

      {/* Header */}
      <div className="print-header flex items-center justify-between pb-4 border-b-2 border-emerald-600 mb-6">
        <div className="flex items-center gap-4">
          <img src={logoSrc} alt="UAMEX ERP" className="print-logo h-12" />
          <div>
            <div className="print-title text-lg font-extrabold text-emerald-700">{displayTitle}</div>
            {displaySubtitle && <div className="print-subtitle text-xs text-zinc-500 mt-0.5">{displaySubtitle}</div>}
          </div>
        </div>
        <div className="print-org text-[10px] text-zinc-400 text-end">
          <div className="font-bold text-zinc-600">{displayOrg}</div>
          <div>UAMEX ERP™ v3.0</div>
          {showTimestamp && <div>{new Date().toLocaleDateString(isRtl ? 'ar-YE' : 'en-GB')}</div>}
        </div>
      </div>

      {/* Body */}
      <div className="print-body">
        {children}
      </div>

      {/* Footer */}
      <div className="print-footer flex items-center justify-between pt-3 border-t border-zinc-200 mt-6 text-[10px] text-zinc-400">
        <div>
          {footer || (
            <span>
              {isRtl ? 'نظام يو امكس المؤسسي الشامل' : 'UAMEX ERP™ Intelligent Enterprise Operating System'}
              {' — '}
              {isRtl ? 'ساري حتى تاريخه' : 'Valid as of'} {new Date().toLocaleDateString(isRtl ? 'ar-YE' : 'en-GB')}
            </span>
          )}
        </div>
        {showPageNumbers && (
          <div className="print-page-num">
            {isRtl ? 'صفحة ' : 'Page '}
          </div>
        )}
      </div>
    </div>
  );
}
