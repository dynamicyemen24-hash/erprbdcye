import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, 
  Shield, 
  ArrowLeftRight, 
  X, 
  Info, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown,
  Sparkles,
  Database
} from 'lucide-react';
import { useEnvironmentMode, ENVIRONMENT_MODES, EnvironmentMode } from '../core/context/EnvironmentModeContext';

// =========================================================================
// 1. HEADER PILL & INTERACTIVE POPOVER (Global Navigation Bar)
// =========================================================================
export interface EnvironmentModeHeaderButtonProps {
  lang: 'ar' | 'en';
}

export const EnvironmentModeHeaderButton: React.FC<EnvironmentModeHeaderButtonProps> = ({ lang }) => {
  const {
    environmentMode,
    setEnvironmentMode,
    isTrainingMode,
    currentConfig,
    trainingSessionDuration,
  } = useEnvironmentMode();

  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingMode, setPendingMode] = useState<EnvironmentMode | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectMode = (mode: EnvironmentMode) => {
    if (mode === environmentMode) {
      setIsOpen(false);
      return;
    }
    setPendingMode(mode);
    setIsOpen(false);
    setShowConfirmModal(true);
  };

  const confirmSwitch = () => {
    if (pendingMode) {
      setEnvironmentMode(pendingMode);
    }
    setShowConfirmModal(false);
    setPendingMode(null);
  };

  const cancelSwitch = () => {
    setShowConfirmModal(false);
    setPendingMode(null);
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Sleek Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer shadow-xs ${
          isTrainingMode
            ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/80 text-amber-300 shadow-amber-500/10'
            : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-700/60 text-emerald-300 shadow-emerald-500/10'
        }`}
        title={isRtl ? 'بيئة تشغيل النظام: انقر للتبديل' : 'System Environment: Click to switch'}
      >
        {isTrainingMode ? (
          <GraduationCap className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
        ) : (
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}
        <span className="hidden sm:inline font-sans">
          {isTrainingMode
            ? (isRtl ? 'بيئة التدريب' : 'Training')
            : (isRtl ? 'بيئة الإنتاج' : 'Production')
          }
        </span>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isTrainingMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
        }`} />
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 text-slate-400 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div 
          className={`absolute top-full mt-2 w-80 md:w-96 rounded-2xl bg-zinc-950/95 backdrop-blur-md border border-zinc-800 shadow-2xl p-4 z-[999] text-right animate-in fade-in zoom-in-95 duration-150 ${
            isRtl ? 'left-0 md:left-auto md:right-0' : 'right-0 md:right-auto md:left-0'
          }`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="font-extrabold text-xs text-white">
                {isRtl ? 'بيئة تشغيل النظام المؤسسي' : 'Enterprise Environment'}
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase font-mono ${
              isTrainingMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isTrainingMode ? 'SANDBOX' : 'LIVE'}
            </span>
          </div>

          {/* Cards for Selection */}
          <div className="space-y-2.5">
            {/* 1. Production Mode Option */}
            <button
              type="button"
              onClick={() => handleSelectMode('production')}
              className={`w-full text-right p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                !isTrainingMode
                  ? 'bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/30'
                  : 'bg-zinc-900/60 hover:bg-zinc-800/60 border-zinc-800 hover:border-zinc-700'
              }`}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-black text-xs text-white">
                    {isRtl ? 'بيئة الإنتاج المباشرة (Production)' : 'Live Production'}
                  </span>
                  {!isTrainingMode && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      {isRtl ? 'النشطة' : 'Active'}
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  {isRtl
                    ? 'البيئة التشغيلية الرسمية المعتمدة - مرتبطة بقاعدة بيانات Neon السحابية المشفرة وتسري فيها كافة العمليات الميدانية والمالية الحقيقية.'
                    : 'Certified operational environment connected to encrypted live databases. All transactions are permanent.'}
                </p>
              </div>
            </button>

            {/* 2. Training Mode Option */}
            <button
              type="button"
              onClick={() => handleSelectMode('training')}
              className={`w-full text-right p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                isTrainingMode
                  ? 'bg-amber-950/40 border-amber-500/50 ring-1 ring-amber-500/30'
                  : 'bg-zinc-900/60 hover:bg-zinc-800/60 border-zinc-800 hover:border-zinc-700'
              }`}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-black text-xs text-white">
                    {isRtl ? 'بيئة التدريب والمحاكاة (Training Sandbox)' : 'Training Sandbox'}
                  </span>
                  {isTrainingMode && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      {isRtl ? 'النشطة' : 'Active'}
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                  {isRtl
                    ? 'بيئة آمنة ومعزولة 100% لتأهيل وتدريب الكوادر وتجربة دورات العمل وإدخال القيود دون أي مساس بالبيانات الحقيقية.'
                    : '100% isolated sandbox for personnel onboarding and practice without touching live data.'}
                </p>
                {isTrainingMode && trainingSessionDuration && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-400 font-mono">
                    <Clock className="w-3 h-3" />
                    {isRtl ? 'مدة الجلسة:' : 'Session:'} {trainingSessionDuration}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {isRtl ? 'فصل تام بين قواعد البيانات' : 'Strict Database Isolation'}
            </span>
            <span className="font-bold text-amber-500/80">
              {isRtl ? 'حماية تامة للبيانات' : 'Zero-Risk Testing'}
            </span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && pendingMode && (
        <EnvironmentModeConfirmModal
          lang={lang}
          targetMode={pendingMode}
          onConfirm={confirmSwitch}
          onCancel={cancelSwitch}
        />
      )}
    </div>
  );
};

// =========================================================================
// 2. PAGE-LEVEL WARNING BANNER (Only displayed when in Training/Sandbox Mode)
// =========================================================================
interface EnvironmentModeBannerProps {
  lang: 'ar' | 'en';
  variant?: 'full' | 'compact' | 'minimal';
  showToggle?: boolean;
}

const EnvironmentModeBannerInner: React.FC<EnvironmentModeBannerProps> = ({
  lang,
  showToggle = true,
}) => {
  const {
    setEnvironmentMode,
    isTrainingMode,
    trainingSessionDuration,
  } = useEnvironmentMode();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // CRITICAL UX ENHANCEMENT:
  // In normal Production mode, NEVER show an annoying banner in the workspace!
  // Production is the standard state, so workspace stays 100% clean and spacious.
  if (!isTrainingMode || isDismissed) {
    return null;
  }

  const isRtl = lang === 'ar';

  const handleReturnToProduction = () => {
    setShowConfirmModal(true);
  };

  const confirmSwitch = () => {
    setEnvironmentMode('production');
    setShowConfirmModal(false);
  };

  return (
    <>
      <div 
        className="bg-amber-500/10 dark:bg-amber-950/30 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-200"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300 font-bold flex-1 min-w-0">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-500 shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <p className="truncate">
            {isRtl 
              ? 'أنت الآن في بيئة التدريب والمحاكاة (Sandbox) — جميع العمليات والبيانات المدخلة تجريبية وآمنة.'
              : 'You are in the Training Sandbox — all operations and data are simulated and safe.'}
          </p>
          {trainingSessionDuration && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-mono shrink-0">
              <Clock className="w-3 h-3" />
              {trainingSessionDuration}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showToggle && (
            <button
              type="button"
              onClick={handleReturnToProduction}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black transition-all shadow-xs cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isRtl ? 'العودة إلى بيئة الإنتاج' : 'Return to Production'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-md transition cursor-pointer"
            title={isRtl ? 'إخفاء الشريط' : 'Dismiss'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <EnvironmentModeConfirmModal
          lang={lang}
          targetMode="production"
          onConfirm={confirmSwitch}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </>
  );
};

// =========================================================================
// 3. CONFIRMATION DIALOG MODAL
// =========================================================================
interface EnvironmentModeConfirmModalProps {
  lang: 'ar' | 'en';
  targetMode: EnvironmentMode;
  onConfirm: () => void;
  onCancel: () => void;
}

const EnvironmentModeConfirmModal: React.FC<EnvironmentModeConfirmModalProps> = ({
  lang,
  targetMode,
  onConfirm,
  onCancel,
}) => {
  const isRtl = lang === 'ar';
  const targetConfig = ENVIRONMENT_MODES[targetMode];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={onCancel}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 max-w-md w-full animate-in zoom-in-95 duration-200 text-right"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-2xl ${targetConfig.bgColor}`}>
            {targetMode === 'training' ? (
              <GraduationCap className={`w-6 h-6 ${targetConfig.color}`} />
            ) : (
              <Shield className={`w-6 h-6 ${targetConfig.color}`} />
            )}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {isRtl ? 'تغيير بيئة العمل المؤسسية' : 'Switch Enterprise Environment'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
              {isRtl ? 'تأكيد التبديل بين البيئات' : 'Confirm Environment Switch'}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${targetConfig.bgColor} ${targetConfig.borderColor} mb-5`}>
          <p className={`text-sm font-black ${targetConfig.color} mb-1`}>
            {isRtl ? targetConfig.labelAr : targetConfig.labelEn}
          </p>
          <p className={`text-xs leading-relaxed ${targetMode === 'training' ? 'text-amber-700 dark:text-amber-300/80' : 'text-emerald-700 dark:text-emerald-300/80'}`}>
            {isRtl ? targetConfig.descriptionAr : targetConfig.descriptionEn}
          </p>
        </div>

        {targetMode === 'training' ? (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 mb-5">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-700 dark:text-amber-300/80 space-y-1">
              <p className="font-bold">
                {isRtl ? 'ما الذي سيحدث في بيئة التدريب؟' : 'What happens in training mode?'}
              </p>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 font-sans">
                <li>{isRtl ? 'سيتم تحميل بيانات تجريبية معزولة' : 'Isolated sandbox data is loaded'}</li>
                <li>{isRtl ? 'لن تتأثر القيود المحاسبية أو السجلات الحقيقية' : 'Live accounting ledgers remain untouched'}</li>
                <li>{isRtl ? 'يمكنك العودة إلى بيئة الإنتاج في أي لحظة' : 'You can switch back to Production anytime'}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 mb-5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-700 dark:text-emerald-300/80 space-y-1">
              <p className="font-bold">
                {isRtl ? 'العودة إلى بيئة الإنتاج الحقيقية' : 'Returning to Live Production'}
              </p>
              <p className="text-[11px] font-sans">
                {isRtl ? 'سيتم استرجاع السجلات الرسمية المعتمدة والتزامن مع قاعدة البيانات المشفرة.' : 'Official certified records will be restored and synchronized with encrypted database.'}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all cursor-pointer shadow-md ${
              targetMode === 'training'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/25'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
            }`}
          >
            {isRtl ? 'تأكيد التبديل' : 'Confirm Switch'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const EnvironmentModeBanner = React.memo(EnvironmentModeBannerInner);
export default EnvironmentModeBanner;
