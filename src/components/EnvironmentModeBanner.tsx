import React, { useState } from 'react';
import { GraduationCap, Shield, ArrowLeftRight, X, Info, Clock, AlertTriangle } from 'lucide-react';
import { useEnvironmentMode, ENVIRONMENT_MODES, EnvironmentMode } from '../core/context/EnvironmentModeContext';

interface EnvironmentModeBannerProps {
  lang: 'ar' | 'en';
  variant?: 'full' | 'compact' | 'minimal';
  showToggle?: boolean;
}

const EnvironmentModeBannerInner: React.FC<EnvironmentModeBannerProps> = ({
  lang,
  variant = 'full',
  showToggle = true,
}) => {
  const {
    environmentMode,
    setEnvironmentMode,
    isTrainingMode,
    currentConfig,
    trainingSessionDuration,
    lastModeSwitchAt,
  } = useEnvironmentMode();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingMode, setPendingMode] = useState<EnvironmentMode | null>(null);

  if (isDismissed && !isTrainingMode) return null;

  const isRtl = lang === 'ar';

  const handleModeSwitch = (targetMode: EnvironmentMode) => {
    if (targetMode === environmentMode) return;
    setPendingMode(targetMode);
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

  // Minimal variant: just a small inline badge
  if (variant === 'minimal') {
    return (
      <>
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${currentConfig.bgColor} ${currentConfig.color} ${currentConfig.borderColor}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {isRtl ? currentConfig.labelAr : currentConfig.labelEn}
        </div>
        {showConfirmModal && pendingMode && (
          <EnvironmentModeConfirmModal
            lang={lang}
            targetMode={pendingMode}
            onConfirm={confirmSwitch}
            onCancel={cancelSwitch}
          />
        )}
      </>
    );
  }

  // Compact variant: horizontal bar
  if (variant === 'compact') {
    return (
      <>
        <div
          className={`flex items-center justify-between gap-3 px-4 py-2 rounded-xl border ${currentConfig.bgColor} ${currentConfig.borderColor} ${isDismissed ? 'opacity-50' : ''}`}
        >
          <div className="flex items-center gap-2">
            {isTrainingMode ? (
              <GraduationCap className="w-4 h-4 text-amber-500" />
            ) : (
              <Shield className="w-4 h-4 text-emerald-500" />
            )}
            <span className={`text-xs font-bold ${currentConfig.color}`}>
              {isRtl ? currentConfig.labelAr : currentConfig.labelEn}
            </span>
            {isTrainingMode && trainingSessionDuration && (
              <span className="flex items-center gap-1 text-[10px] text-amber-600/70 dark:text-amber-400/70">
                <Clock className="w-3 h-3" />
                {trainingSessionDuration}
              </span>
            )}
          </div>
          {showToggle && (
            <button
              onClick={() => handleModeSwitch(isTrainingMode ? 'production' : 'training')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all cursor-pointer"
            >
              <ArrowLeftRight className="w-3 h-3" />
              {isTrainingMode
                ? (isRtl ? 'ال切换 إلى الإنتاج' : 'Switch to Production')
                : (isRtl ? 'ال切换 إلى التدريب' : 'Switch to Training')
              }
            </button>
          )}
        </div>
        {showConfirmModal && pendingMode && (
          <EnvironmentModeConfirmModal
            lang={lang}
            targetMode={pendingMode}
            onConfirm={confirmSwitch}
            onCancel={cancelSwitch}
          />
        )}
      </>
    );
  }

  // Full variant: prominent banner with details
  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
          isTrainingMode
            ? 'border-amber-400/50 bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 shadow-lg shadow-amber-500/10'
            : 'border-emerald-400/30 bg-gradient-to-l from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/10'
        } ${isDismissed ? 'opacity-40 scale-95' : ''}`}
      >
        {/* Animated background pattern for training mode */}
        {isTrainingMode && (
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(245,158,11,0.3) 35px, rgba(245,158,11,0.3) 36px)`,
            }} />
          </div>
        )}

        <div className={`relative px-5 py-4 ${isRtl ? 'flex flex-row-reverse' : 'flex'} items-start gap-4`}>
          {/* Icon */}
          <div className={`shrink-0 p-3 rounded-2xl ${
            isTrainingMode
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          }`}>
            {isTrainingMode ? (
              <GraduationCap className="w-7 h-7" />
            ) : (
              <Shield className="w-7 h-7" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className={`text-sm font-black ${currentConfig.color}`}>
                {isRtl ? currentConfig.labelAr : currentConfig.labelEn}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${currentConfig.bgColor} ${currentConfig.color} ${currentConfig.borderColor} border`}>
                {isTrainingMode ? 'TRAINING' : 'PRODUCTION'}
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isTrainingMode ? 'text-amber-700 dark:text-amber-300/80' : 'text-emerald-700 dark:text-emerald-300/80'}`}>
              {isRtl ? currentConfig.descriptionAr : currentConfig.descriptionEn}
            </p>

            {isTrainingMode && (
              <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                {trainingSessionDuration && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600/80 dark:text-amber-400/80">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-semibold">
                      {isRtl ? 'مدة جلسة التدريب:' : 'Session:'} {trainingSessionDuration}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600/80 dark:text-amber-400/80">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="font-semibold">
                    {isRtl ? 'لا تؤثر على البيانات الحقيقية' : 'No impact on live data'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-2 shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {showToggle && (
              <button
                onClick={() => handleModeSwitch(isTrainingMode ? 'production' : 'training')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isTrainingMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/25'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                {isTrainingMode
                  ? (isRtl ? 'ال切换 إلى الإنتاج' : 'Go to Production')
                  : (isRtl ? 'ابدأ التدريب' : 'Start Training')
                }
              </button>
            )}
            {!isTrainingMode && (
              <button
                onClick={() => setIsDismissed(true)}
                className="p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-700/50 text-slate-400 transition-colors cursor-pointer"
                title={isRtl ? 'إخفاء' : 'Dismiss'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showConfirmModal && pendingMode && (
        <EnvironmentModeConfirmModal
          lang={lang}
          targetMode={pendingMode}
          onConfirm={confirmSwitch}
          onCancel={cancelSwitch}
        />
      )}
    </>
  );
};

// Confirmation modal when switching environments
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${targetConfig.bgColor}`}>
            {targetMode === 'training' ? (
              <GraduationCap className={`w-6 h-6 ${targetConfig.color}`} />
            ) : (
              <Shield className={`w-6 h-6 ${targetConfig.color}`} />
            )}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {isRtl ? 'تغيير بيئة العمل' : 'Switch Environment'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isRtl ? 'تأكيد التبديل' : 'Confirm switch'}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${targetConfig.bgColor} ${targetConfig.borderColor} mb-5`}>
          <p className={`text-sm font-bold ${targetConfig.color} mb-1`}>
            {isRtl ? targetConfig.labelAr : targetConfig.labelEn}
          </p>
          <p className={`text-xs ${targetMode === 'training' ? 'text-amber-700 dark:text-amber-300/80' : 'text-emerald-700 dark:text-emerald-300/80'}`}>
            {isRtl ? targetConfig.descriptionAr : targetConfig.descriptionEn}
          </p>
        </div>

        {targetMode === 'training' && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 mb-5">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-700 dark:text-amber-300/80">
              <p className="font-bold mb-1">
                {isRtl ? 'ماذا يحدث عند التبديل؟' : 'What happens when you switch?'}
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>{isRtl ? 'سيتم عرض بيانات تدريبية آمنة' : 'Safe training data will be displayed'}</li>
                <li>{isRtl ? 'لن تؤثر أي تغييرات على البيانات الحقيقية' : 'No changes will affect live data'}</li>
                <li>{isRtl ? 'يمكنك التبديل في أي وقت' : 'You can switch back at any time'}</li>
              </ul>
            </div>
          </div>
        )}

        <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer ${
              targetMode === 'training'
                ? 'bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/25'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/25'
            }`}
          >
            {isRtl ? 'تأكيد التبديل' : 'Confirm Switch'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
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
