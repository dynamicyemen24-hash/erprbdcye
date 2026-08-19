import React, { useState } from 'react';
import { 
  GraduationCap, Shield, ArrowLeftRight, Info, AlertTriangle, 
  Clock, CheckCircle2, Database, Users, FileText, RefreshCw,
  BookOpen, PlayCircle
} from 'lucide-react';
import { useEnvironmentMode, ENVIRONMENT_MODES, EnvironmentMode } from '../../core/context/EnvironmentModeContext';

interface EnvironmentModeSettingsSectionProps {
  lang: 'ar' | 'en';
}

export const EnvironmentModeSettingsSection: React.FC<EnvironmentModeSettingsSectionProps> = ({ lang }) => {
  const {
    environmentMode,
    setEnvironmentMode,
    isTrainingMode,
    isProductionMode,
    currentConfig,
    trainingSessionDuration,
    trainingSessionStartedAt,
    resetTrainingSession,
    lastModeSwitchAt,
  } = useEnvironmentMode();
  const isRtl = lang === 'ar';

  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const onboardingSteps = [
    {
      titleAr: 'مرحباً بك في بيئة التدريب',
      titleEn: 'Welcome to Training Mode',
      descAr: 'بيئة تدريبية آمنة لتعلم النظام دون المخاطرة بالبيانات الحقيقية',
      descEn: 'A safe sandbox environment to learn the system without risking live data',
      icon: GraduationCap,
      color: 'amber',
    },
    {
      titleAr: 'بيانات تجريبية جاهزة',
      titleEn: 'Sample Data Ready',
      descAr: 'يحتوي على مشاريع وبرامج ومستفيدين تجريبيين يمكنك التعامل معهم',
      descEn: 'Contains sample projects, programs, and beneficiaries you can work with',
      icon: Database,
      color: 'blue',
    },
    {
      titleAr: 'تعلم بالفعل',
      titleEn: 'Learn by Doing',
      descAr: 'جرب إنشاء التقارير، إدارة المشاريع، وال المالية — كل التغييرات آمنة',
      descEn: 'Try creating reports, managing projects, and finance — all changes are safe',
      icon: PlayCircle,
      color: 'emerald',
    },
    {
      titleAr: 'انتقل للإنتاج عند الجاهزية',
      titleEn: 'Switch to Production When Ready',
      descAr: 'عندما تشعر بالثقة، انتقل إلى بيئة الإنتاج للعمل مع البيانات الحقيقية',
      descEn: 'When confident, switch to Production to work with real organizational data',
      icon: Shield,
      color: 'emerald',
    },
  ];

  const startOnboarding = () => {
    setShowOnboardingFlow(true);
    setOnboardingStep(0);
  };

  const nextOnboardingStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboardingFlow(false);
      setOnboardingStep(0);
      setEnvironmentMode('training');
    }
  };

  const colorMap: Record<string, { bg: string; text: string; border: string; ring: string }> = {
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', ring: 'ring-amber-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', ring: 'ring-blue-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', ring: 'ring-emerald-500/20' },
  };

  // Onboarding flow modal
  if (showOnboardingFlow) {
    const step = onboardingSteps[onboardingStep];
    const StepIcon = step.icon;
    const colors = colorMap[step.color] || colorMap.amber;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-8 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {onboardingSteps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === onboardingStep ? 'bg-amber-500 w-6' : i < onboardingStep ? 'bg-amber-300' : 'bg-slate-200 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className={`p-6 rounded-2xl ${colors.bg} border ${colors.border} mb-6 text-center`}>
            <div className={`inline-flex p-4 rounded-2xl ${colors.bg} ${colors.text} mb-4`}>
              <StepIcon className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              {isRtl ? step.titleAr : step.titleEn}
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
              {isRtl ? step.descAr : step.descEn}
            </p>
          </div>

          {/* Actions */}
          <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => { setShowOnboardingFlow(false); setOnboardingStep(0); }}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {isRtl ? 'تخطي' : 'Skip'}
            </button>
            <button
              onClick={nextOnboardingStep}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2`}
            >
              {onboardingStep === onboardingSteps.length - 1 ? (
                <>
                  <PlayCircle className="w-4 h-4" />
                  {isRtl ? 'ابدأ التدريب الآن' : 'Start Training Now'}
                </>
              ) : (
                <>
                  {isRtl ? 'التالي' : 'Next'}
                  <ArrowLeftRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Environment Status */}
      <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-500 ${
        isTrainingMode
          ? 'border-amber-400/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20'
          : 'border-emerald-400/30 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/10'
      }`}>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${
              isTrainingMode ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'
            }`}>
              {isTrainingMode ? (
                <GraduationCap className="w-8 h-8" />
              ) : (
                <Shield className="w-8 h-8" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {isRtl ? currentConfig.labelAr : currentConfig.labelEn}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                  isTrainingMode ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}>
                  {isTrainingMode ? 'TRAINING' : 'PRODUCTION'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-3">
                {isRtl ? currentConfig.descriptionAr : currentConfig.descriptionEn}
              </p>

              {/* Session info */}
              {isTrainingMode && trainingSessionDuration && (
                <div className="flex items-center gap-4 flex-wrap mb-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300/80">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-semibold">
                      {isRtl ? 'مدة الجلسة:' : 'Session:'} {trainingSessionDuration}
                    </span>
                  </div>
                  {trainingSessionStartedAt && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-600/70 dark:text-amber-400/70">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-semibold">
                        {isRtl ? 'بداية:' : 'Started:'} {new Date(trainingSessionStartedAt).toLocaleTimeString(isRtl ? 'ar-YE' : 'en-US')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {lastModeSwitchAt && (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {isRtl ? 'آخر تبديل:' : 'Last switch:'} {new Date(lastModeSwitchAt).toLocaleString(isRtl ? 'ar-YE' : 'en-US')}
                  </span>
                </div>
              )}
            </div>

            {/* Toggle button */}
            <button
              onClick={() => setEnvironmentMode(isTrainingMode ? 'production' : 'training')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer flex items-center gap-2 ${
                isTrainingMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/25'
                  : 'bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/25'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              {isTrainingMode
                ? (isRtl ? 'ال切换 إلى الإنتاج' : 'Switch to Production')
                : (isRtl ? 'ابدأ التدريب' : 'Start Training')
              }
            </button>
          </div>
        </div>
      </div>

      {/* Environment Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['production', 'training'] as EnvironmentMode[]).map((mode) => {
          const config = ENVIRONMENT_MODES[mode];
          const isActive = environmentMode === mode;
          return (
            <div
              key={mode}
              className={`rounded-xl border-2 p-5 transition-all duration-300 ${
                isActive
                  ? 'border-amber-400/50 bg-white dark:bg-zinc-900 shadow-lg shadow-amber-500/10'
                  : 'border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl ${isActive ? config.bgColor : 'bg-slate-100 dark:bg-zinc-800'}`}>
                  {mode === 'training' ? (
                    <GraduationCap className={`w-5 h-5 ${isActive ? config.color : 'text-zinc-400'}`} />
                  ) : (
                    <Shield className={`w-5 h-5 ${isActive ? config.color : 'text-zinc-400'}`} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {isRtl ? config.labelAr : config.labelEn}
                  </h4>
                  {isActive && (
                    <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400">
                      {isRtl ? 'نشط حالياً' : 'ACTIVE'}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-4">
                {isRtl ? config.descriptionAr : config.descriptionEn}
              </p>

              {/* Features list */}
              <div className="space-y-2">
                {mode === 'production' ? (
                  <>
                    <FeatureItem icon={CheckCircle2} text={isRtl ? 'بيانات حقيقية للمؤسسة' : 'Live organizational data'} lang={lang} />
                    <FeatureItem icon={AlertTriangle} text={isRtl ? 'جميع التغييرات مباشرة' : 'All changes are live'} lang={lang} />
                    <FeatureItem icon={FileText} text={isRtl ? 'سجلات التدقيق نشطة' : 'Audit logging active'} lang={lang} />
                  </>
                ) : (
                  <>
                    <FeatureItem icon={CheckCircle2} text={isRtl ? 'بيانات تدريبية آمنة' : 'Safe training data'} lang={lang} />
                    <FeatureItem icon={AlertTriangle} text={isRtl ? 'لا تؤثر على الإنتاج' : 'No impact on production'} lang={lang} />
                    <FeatureItem icon={Users} text={isRtl ? 'مثالي للموظفين الجدد' : 'Ideal for new staff'} lang={lang} />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Training Quick Start Guide */}
      {isProductionMode && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isRtl ? 'دليل البدء السريع للتدريب' : 'Training Quick Start Guide'}
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-300 mb-4">
            {isRtl
              ? 'استكشف النظام بأمان في بيئة تدريبية محاكية. بيانات تجريبية جاهزة يمكنك التعامل معها.'
              : 'Explore the system safely in a simulated training environment. Sample data is ready for you to work with.'
            }
          </p>
          <button
            onClick={startOnboarding}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            {isRtl ? 'ابدأ جولة التدريب التفاعلية' : 'Start Interactive Training Tour'}
          </button>
        </div>
      )}

      {/* Reset Training Session */}
      {isTrainingMode && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                {isRtl ? 'إعادة تعيين جلسة التدريب' : 'Reset Training Session'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isRtl ? 'سيتم بدء جلسة تدريب جديدة مع بيانات تجريبية' : 'Start a fresh training session with sample data'}
              </p>
            </div>
            <button
              onClick={resetTrainingSession}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {isRtl ? 'إعادة تعيين' : 'Reset Session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Small feature item component
const FeatureItem: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  lang: 'ar' | 'en';
}> = ({ icon: Icon, text, lang }) => (
  <div className={`flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
    <Icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
    <span>{text}</span>
  </div>
);

export default EnvironmentModeSettingsSection;
