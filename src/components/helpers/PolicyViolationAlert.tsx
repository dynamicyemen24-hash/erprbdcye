/**
 * NexoraOS™ — Policy Violation Alert Component
 * Displays structured policy violation responses with severity badges, limit values, and bilingual messages.
 */

import React from 'react';
import { AlertTriangle, Ban, Info, X, Shield } from 'lucide-react';

interface PolicyViolation {
  code: string;
  severity: 'BLOCK' | 'WARN' | 'INFO';
  messageAr: string;
  messageEn: string;
  policyKey: string;
  limit?: number;
  currentValue?: number;
}

interface PolicyViolationAlertProps {
  violations: PolicyViolation[];
  environmentMode?: string;
  onDismiss?: () => void;
  lang?: 'ar' | 'en';
}

const SEVERITY_CONFIG = {
  BLOCK: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800/40',
    icon: Ban,
    iconColor: 'text-red-500',
    badge: 'bg-red-500 text-white',
    labelAr: 'محظور',
    labelEn: 'BLOCKED',
  },
  WARN: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/40',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    badge: 'bg-amber-500 text-white',
    labelAr: 'تحذير',
    labelEn: 'WARNING',
  },
  INFO: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800/40',
    icon: Info,
    iconColor: 'text-blue-500',
    badge: 'bg-blue-500 text-white',
    labelAr: 'معلومات',
    labelEn: 'INFO',
  },
};

export function PolicyViolationAlert({
  violations,
  environmentMode,
  onDismiss,
  lang = 'ar',
}: PolicyViolationAlertProps) {
  const isRtl = lang === 'ar';

  if (!violations || violations.length === 0) return null;

  const blockViolations = violations.filter(v => v.severity === 'BLOCK');
  const warnViolations = violations.filter(v => v.severity === 'WARN' || v.severity === 'INFO');

  const hasBlocks = blockViolations.length > 0;
  const primaryConfig = hasBlocks ? SEVERITY_CONFIG.BLOCK : SEVERITY_CONFIG.WARN;
  const PrimaryIcon = primaryConfig.icon;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`rounded-xl border ${primaryConfig.bg} ${primaryConfig.border} overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-inherit">
        <div className="flex items-center gap-2">
          <PrimaryIcon className={`w-4 h-4 ${primaryConfig.iconColor}`} />
          <span className="text-xs font-extrabold text-slate-800 dark:text-white">
            {isRtl ? 'مخالفة سياسة' : 'Policy Violation'}
          </span>
          {environmentMode && (
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
              environmentMode === 'training'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300'
            }`}>
              {environmentMode === 'training' ? 'TRAINING' : 'PRODUCTION'}
            </span>
          )}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Violation List */}
      <div className="p-3 space-y-2">
        {violations.map((v, idx) => {
          const config = SEVERITY_CONFIG[v.severity] || SEVERITY_CONFIG.INFO;
          const Icon = config.icon;

          return (
            <div key={idx} className="flex items-start gap-2.5">
              <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-extrabold ${config.badge} shrink-0`}>
                {config.labelEn}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 leading-relaxed">
                  {isRtl ? v.messageAr : v.messageEn}
                </p>
                {v.limit !== undefined && v.currentValue !== undefined && (
                  <p className="text-[9px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {isRtl ? 'القيمة الحالية' : 'Value'}: {v.currentValue.toLocaleString()} → {isRtl ? 'الحد' : 'Limit'}: {v.limit.toLocaleString()}
                  </p>
                )}
                <p className="text-[8px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                  {v.code}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {hasBlocks && (
        <div className="px-3 py-2 bg-red-100/50 dark:bg-red-900/10 border-t border-red-200/50 dark:border-red-800/20">
          <p className="text-[10px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            {isRtl
              ? 'تم إجراء العملية — يرجى مراجعة المخالفات أعلاه'
              : 'Operation blocked — please review the violations above'}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Inline toast-style warning for non-blocking policy warnings.
 * Use when X-Policy-Warnings header is present on a successful response.
 */
export function PolicyWarningToast({
  warnings,
  lang = 'ar',
  onDismiss,
}: {
  warnings: PolicyViolation[];
  lang?: 'ar' | 'en';
  onDismiss?: () => void;
}) {
  const isRtl = lang === 'ar';
  if (!warnings || warnings.length === 0) return null;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {warnings.map((w, idx) => (
          <p key={idx} className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
            {isRtl ? w.messageAr : w.messageEn}
          </p>
        ))}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30">
          <X className="w-3 h-3 text-amber-400" />
        </button>
      )}
    </div>
  );
}
