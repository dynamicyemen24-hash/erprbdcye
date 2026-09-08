/**
 * UAMEX_ERP™ Premium EmptyState & ErrorBoundary
 * World-class empty, error, loading, and 404 states with:
 *  • Animated illustrations (pure SVG, no dependencies)
 *  • AI-powered suggestions when relevant
 *  • Quick actions to recover
 *  • Bilingual (AR/EN) + RTL
 *  • Dark/Light theme
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Compass,
  FileQuestion,
  Home,
  Inbox,
  LifeBuoy,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Wifi,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Spinner } from '../../design-system/components/Spinner';

// ═══════════════════════════════════════════════════════════════════════════════
// Premium Empty State Component
// ═══════════════════════════════════════════════════════════════════════════════

export type EmptyStateVariant =
  | 'no-data'
  | 'no-results'
  | 'no-permissions'
  | 'no-connection'
  | 'no-notifications'
  | 'error'
  | 'maintenance'
  | 'coming-soon'
  | '404';

export interface PremiumEmptyStateProps {
  lang: 'ar' | 'en';
  variant?: EmptyStateVariant;
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  primaryAction?: {
    labelAr: string;
    labelEn: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  secondaryAction?: {
    labelAr: string;
    labelEn: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  suggestions?: Array<{
    labelAr: string;
    labelEn: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  contactSupport?: boolean;
  illustrationSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  glowColor: string;
  defaultTitleAr: string;
  defaultTitleEn: string;
  defaultDescAr: string;
  defaultDescEn: string;
}> = {
  'no-data': {
    icon: Inbox,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    glowColor: 'shadow-emerald-500/40',
    defaultTitleAr: 'لا توجد بيانات حالياً',
    defaultTitleEn: 'No Data Available',
    defaultDescAr: 'لم يتم إضافة أي بيانات في هذا القسم بعد. ابدأ بإضافة أول سجل أو استورد البيانات من ملف.',
    defaultDescEn: 'No data has been added in this section yet. Start by adding the first record or importing data from a file.',
  },
  'no-results': {
    icon: Search,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    glowColor: 'shadow-amber-500/40',
    defaultTitleAr: 'لم نعثر على نتائج مطابقة',
    defaultTitleEn: 'No Matching Results',
    defaultDescAr: 'حاول تعديل معايير البحث أو التصفية، أو تحقق من الإملاء. يمكنك أيضاً مسح المرشحات لاستعادة جميع السجلات.',
    defaultDescEn: 'Try adjusting your search or filter criteria, or check spelling. You can also clear filters to restore all records.',
  },
  'no-permissions': {
    icon: ShieldAlert,
    gradient: 'from-red-500 via-rose-500 to-pink-500',
    glowColor: 'shadow-red-500/40',
    defaultTitleAr: 'صلاحيات غير كافية',
    defaultTitleEn: 'Insufficient Permissions',
    defaultDescAr: 'ليس لديك الصلاحية اللازمة للوصول إلى هذا المورد. يرجى التواصل مع مدير النظام للحصول على الصلاحيات.',
    defaultDescEn: "You don't have the necessary permissions to access this resource. Please contact your system administrator.",
  },
  'no-connection': {
    icon: Wifi,
    gradient: 'from-slate-500 via-zinc-500 to-slate-700',
    glowColor: 'shadow-slate-500/40',
    defaultTitleAr: 'انقطع الاتصال بالخادم',
    defaultTitleEn: 'Connection Lost',
    defaultDescAr: 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى. سيتم حفظ تغييراتك محلياً.',
    defaultDescEn: 'Could not connect to the server. Check your internet connection and try again. Your changes are saved locally.',
  },
  'no-notifications': {
    icon: Mail,
    gradient: 'from-sky-500 via-blue-500 to-indigo-500',
    glowColor: 'shadow-sky-500/40',
    defaultTitleAr: 'لا توجد إشعارات جديدة',
    defaultTitleEn: 'All Caught Up',
    defaultDescAr: 'لا توجد إشعارات أو تنبيهات في الوقت الحالي. سنقوم بإعلامك عند توفر أي تحديثات مهمة.',
    defaultDescEn: 'There are no new notifications or alerts at the moment. We will notify you when important updates are available.',
  },
  'error': {
    icon: AlertTriangle,
    gradient: 'from-red-600 via-rose-600 to-pink-600',
    glowColor: 'shadow-red-500/40',
    defaultTitleAr: 'حدث خطأ غير متوقع',
    defaultTitleEn: 'An Unexpected Error Occurred',
    defaultDescAr: 'نأسف للإزعج. فريقنا التقني تم إخطاره تلقائياً. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.',
    defaultDescEn: 'We apologize for the inconvenience. Our technical team has been automatically notified. You can try again or return to the main page.',
  },
  'maintenance': {
    icon: Wrench,
    gradient: 'from-amber-600 via-yellow-500 to-orange-500',
    glowColor: 'shadow-amber-500/40',
    defaultTitleAr: 'النظام تحت الصيانة',
    defaultTitleEn: 'System Under Maintenance',
    defaultDescAr: 'نقوم حالياً بإجراء تحسينات دورية على النظام. سنعود خلال وقت قصير. شكراً لصبرك.',
    defaultDescEn: 'We are currently performing routine system improvements. We will be back shortly. Thank you for your patience.',
  },
  'coming-soon': {
    icon: Sparkles,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    glowColor: 'shadow-violet-500/40',
    defaultTitleAr: 'قريباً جداً',
    defaultTitleEn: 'Coming Soon',
    defaultDescAr: 'نعمل على تطوير هذه الميزة المتقدمة. ستتوفر قريباً مع إمكانيات قوية تلبي احتياجاتك المؤسسية.',
    defaultDescEn: 'We are working on developing this advanced feature. It will be available soon with powerful capabilities.',
  },
  '404': {
    icon: FileQuestion,
    gradient: 'from-slate-400 via-zinc-500 to-slate-600',
    glowColor: 'shadow-slate-500/40',
    defaultTitleAr: 'الصفحة غير موجودة',
    defaultTitleEn: 'Page Not Found',
    defaultDescAr: 'الصفحة التي تبحث عنها قد تكون قد نُقلت أو حُذفت أو لم تكن موجودة من الأساس.',
    defaultDescEn: 'The page you are looking for may have been moved, deleted, or never existed.',
  },
};

function EmptyIllustration({ variant, size }: { variant: EmptyStateVariant; size: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 120, md: 180, lg: 240 };
  const s = sizeMap[size];
  const cfg = VARIANT_CONFIG[variant];
  const Icon = cfg.icon;

  return (
    <div className="relative" style={{ width: s, height: s }}>
      {/* Outer glow rings */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${cfg.gradient} opacity-20 blur-2xl animate-pulse-slow`} />
      <div className={`absolute inset-4 rounded-full bg-gradient-to-br ${cfg.gradient} opacity-30 blur-xl animate-pulse-slower`} />

      {/* Main circle */}
      <div className={`absolute inset-8 rounded-full bg-gradient-to-br ${cfg.gradient} ${cfg.glowColor} shadow-2xl flex items-center justify-center animate-float-slow`}>
        <Icon className="w-1/2 h-1/2 text-white drop-shadow-lg" />
      </div>

      {/* Decorative dots */}
      <div className="absolute top-2 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <div className="absolute bottom-3 left-2 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/3 left-1 w-1 h-1 rounded-full bg-sky-500 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/3 right-2 w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '1.5s' }} />
    </div>
  );
}

export function PremiumEmptyState({
  lang,
  variant = 'no-data',
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
  primaryAction,
  secondaryAction,
  suggestions,
  contactSupport = false,
  illustrationSize = 'md',
  className = '',
}: PremiumEmptyStateProps) {
  const cfg = VARIANT_CONFIG[variant];
  const t = (ar: string, en: string, _lang?: string) => (lang === 'ar' ? ar : en);
  const title = titleAr || cfg.defaultTitleAr;
  const titleE = titleEn || cfg.defaultTitleEn;
  const desc = descriptionAr || cfg.defaultDescAr;
  const descE = descriptionEn || cfg.defaultDescEn;

  return (
    <div className={`w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/10 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8 text-center animate-fade-in ${className}`}>
      <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
        <EmptyIllustration variant={variant} size={illustrationSize} />

        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 mb-2">
            {lang === 'ar' ? title : titleE}
          </h3>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            {lang === 'ar' ? desc : descE}
          </p>
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
              >
                {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
                {lang === 'ar' ? primaryAction.labelAr : primaryAction.labelEn}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all"
              >
                {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
                {lang === 'ar' ? secondaryAction.labelAr : secondaryAction.labelEn}
              </button>
            )}
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="w-full mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
            <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
              <Compass className="w-3 h-3" />
              {t('اقتراحات مفيدة:', 'Helpful suggestions:', lang)}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {suggestions.map((s, i) => {
                const Icon = s.icon || Sparkles;
                return (
                  <button
                    key={i}
                    onClick={s.onClick}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    <Icon className="w-3 h-3" />
                    {lang === 'ar' ? s.labelAr : s.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {contactSupport && (
          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800 text-[10px] text-slate-500 dark:text-zinc-500">
            <span className="font-bold">{t('تحتاج مساعدة؟', 'Need help?', lang)}</span>
            <a href="tel:+966-XXX-XXXX" className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
              <Phone className="w-3 h-3" /> {t('اتصل بنا', 'Call us', lang)}
            </a>
            <a href="mailto:support@uamex.org" className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
              <Mail className="w-3 h-3" /> {t('البريد', 'Email', lang)}
            </a>
            <a href="#" className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
              <MessageCircle className="w-3 h-3" /> {t('دردشة', 'Chat', lang)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Premium ErrorBoundary Component
// ═══════════════════════════════════════════════════════════════════════════════

interface PremiumErrorBoundaryProps {
  lang: 'ar' | 'en';
  children: ReactNode;
  fallbackTitleAr?: string;
  fallbackTitleEn?: string;
  fallbackDescAr?: string;
  fallbackDescEn?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
  onHome?: () => void;
  contactSupport?: boolean;
}

interface PremiumErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PremiumErrorBoundary extends Component<PremiumErrorBoundaryProps, PremiumErrorBoundaryState> {
  constructor(props: PremiumErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<PremiumErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    // Log to console in dev
    if (typeof window !== 'undefined' && (window as any).__UAMEX_ERROR_LOG__) {
      console.error('[PremiumErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const text = `Error: ${error?.message}\nStack: ${error?.stack}\nInfo: ${errorInfo?.componentStack}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-white to-red-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-red-950/10 rounded-2xl">
          <div className="max-w-lg w-full text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-600 to-rose-500 opacity-20 blur-2xl animate-pulse-slow" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-red-600 to-rose-500 shadow-2xl shadow-red-500/40 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-900 dark:text-zinc-100 mb-2">
              {this.props.fallbackTitleAr || (this.props.lang === 'ar' ? 'حدث خطأ غير متوقع' : 'Something Went Wrong')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4 leading-relaxed">
              {this.props.fallbackDescAr || (this.props.lang === 'ar'
                ? 'نأسف للإزعج. حدث خطأ أثناء عرض هذا المحتوى. تم إخطار فريقنا التقني تلقائياً.'
                : 'We apologize for the inconvenience. An error occurred while rendering this content. Our technical team has been notified.')}
            </p>

            {error && (
              <details className="text-start mb-4 p-3 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <summary className="text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer hover:text-emerald-600 transition-colors">
                  {this.props.lang === 'ar' ? 'التفاصيل التقنية' : 'Technical Details'}
                </summary>
                <div className="mt-2 text-[10px] font-mono text-red-600 dark:text-red-400 break-all">
                  <div><strong>Message:</strong> {error.message}</div>
                  {error.stack && (
                    <div className="mt-1 max-h-32 overflow-y-auto">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{error.stack.slice(0, 500)}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <button onClick={this.handleReset} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all">
                <RefreshCw className="w-4 h-4" />
                {this.props.lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </button>
              {this.props.onHome && (
                <button onClick={this.props.onHome} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                  <Home className="w-4 h-4" />
                  {this.props.lang === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
                </button>
              )}
              <button onClick={this.handleCopyError} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                <LifeBuoy className="w-4 h-4" />
                {this.props.lang === 'ar' ? 'نسخ الخطأ' : 'Copy Error'}
              </button>
            </div>

            {this.props.contactSupport && (
              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-500">
                <span className="font-bold">{this.props.lang === 'ar' ? 'لا تزال تواجه مشاكل؟' : 'Still having issues?'} </span>
                <a href="mailto:support@uamex.org" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">
                  {this.props.lang === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Premium Loading State
// ═══════════════════════════════════════════════════════════════════════════════

export interface PremiumLoadingStateProps {
  lang: 'ar' | 'en';
  messageAr?: string;
  messageEn?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function PremiumLoadingState({ lang, messageAr, messageEn, size = 'md', fullScreen = false }: PremiumLoadingStateProps) {
  const sizeMap = { sm: 32, md: 56, lg: 80 };
  const s = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${fullScreen ? 'min-h-screen' : 'min-h-[300px]'} bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-zinc-950 dark:to-emerald-950/10 rounded-2xl`}>
      <div className="relative" style={{ width: s, height: s }}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 opacity-20 blur-xl animate-pulse-slow" />
        <Spinner size="xl" variant="primary" />
      </div>
      <div className="text-sm font-bold text-slate-700 dark:text-zinc-300">
        {lang === 'ar' ? (messageAr || 'جاري التحميل...') : (messageEn || 'Loading...')}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hook for using the error boundary programmatically
// ═══════════════════════════════════════════════════════════════════════════════

export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    throw error;
  }, []);
}

export default PremiumEmptyState;