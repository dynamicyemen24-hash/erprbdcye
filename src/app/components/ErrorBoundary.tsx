import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy, Check, FileText } from 'lucide-react';

interface Props {
  children: ReactNode;
  domainName?: string;
  fallback?: ReactNode;
  lang?: 'ar' | 'en';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("NexoraOS™ Domain Error Captured:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyError = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const errorDetails = `
NexoraOS™ Domain Error Report
============================
Domain: ${this.props.domainName || 'General Application'}
Timestamp: ${new Date().toISOString()}
Error Message: ${error.message}
Error Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack || 'N/A'}
    `.trim();

    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Detect language from props, context or localStorage
      const currentLang = this.props.lang || (typeof localStorage !== 'undefined' ? (localStorage.getItem('language') as 'ar' | 'en') : 'ar') || 'ar';
      const isRtl = currentLang === 'ar';

      // Localized terms
      const text = {
        title: isRtl ? 'عزل خطأ تشغيلي غير متوقع' : 'Unexpected Domain Error Isolated',
        description: isRtl 
          ? 'تم الكشف عن خلل في هذا النطاق التشغيلي. تضمن هندسة NexoraOS™ الذكية عزل الأخطاء لضمان استمرارية عمل باقي الخدمات والأنظمة دون انقطاع.' 
          : 'An error occurred in this operational domain. NexoraOS™ intelligent design isolates the issue to ensure other platform services run uninterrupted.',
        domain: isRtl ? 'النطاق التشغيلي الحالي:' : 'Current Operational Domain:',
        resetBtn: isRtl ? 'إعادة تشغيل النطاق' : 'Reset Domain State',
        reloadBtn: isRtl ? 'إعادة تحميل النظام' : 'Reload Full System',
        copyBtn: isRtl ? 'نسخ تقرير الخطأ' : 'Copy Error Details',
        copiedBtn: isRtl ? 'تم النسخ!' : 'Copied!',
        showDetails: isRtl ? 'عرض التفاصيل الفنية للخطأ' : 'Show Technical Details',
        hideDetails: isRtl ? 'إخفاء التفاصيل الفنية' : 'Hide Technical Details',
        diagnosticInfo: isRtl ? 'معلومات التشخيص والتحليل' : 'Diagnostic & Stack Trace Information',
        errorMessage: isRtl ? 'رسالة الخطأ:' : 'Error Message:',
        recommendationTitle: isRtl ? 'الخطوات التشغيلية الموصى بها:' : 'Recommended Operational Steps:',
        step1: isRtl ? 'اضغط على "إعادة تشغيل النطاق" لمحاولة إعادة تهيئة حالة المكون.' : 'Click "Reset Domain State" to attempt hot-reloading the component.',
        step2: isRtl ? 'إذا استمرت المشكلة، يرجى إعادة تحميل النظام أو إبلاغ فريق الدعم الفني بالنظام.' : 'If the issue persists, reload the platform or copy the error report to technical support.',
      };

      return (
        <div 
          id="nexora-error-boundary-view"
          dir={isRtl ? 'rtl' : 'ltr'} 
          className="w-full min-h-[400px] flex items-center justify-center p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950/20 rounded-xl border border-slate-200 dark:border-zinc-800 transition-colors"
        >
          <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-md p-6 md:p-8 space-y-6">
            
            {/* Warning Icon & Domain Information */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right rtl:sm:text-right">
              <div className="p-4 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl shrink-0 animate-pulse border border-amber-500/20">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-500">
                  {text.domain} <span className="underline decoration-wavy">{this.props.domainName || (isRtl ? 'النظام العام' : 'General Core')}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {text.title}
                </h2>
              </div>
            </div>

            {/* Description Card */}
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              {text.description}
            </p>

            {/* Recommendations List */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-500" />
                {text.recommendationTitle}
              </h3>
              <ul className="text-xs text-slate-600 dark:text-zinc-400 list-disc list-inside space-y-1 pl-1 rtl:pr-1">
                <li>{text.step1}</li>
                <li>{text.step2}</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="reset-domain-btn"
                onClick={this.handleReset}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {text.resetBtn}
              </button>
              
              <button
                id="reload-system-btn"
                onClick={this.handleReload}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 rotate-180" />
                {text.reloadBtn}
              </button>

              <button
                id="copy-error-btn"
                onClick={this.handleCopyError}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">{text.copiedBtn}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {text.copyBtn}
                  </>
                )}
              </button>
            </div>

            {/* Collapsible Technical Details */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
              <button
                id="toggle-error-details-btn"
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="flex items-center justify-between w-full py-1 text-xs text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {this.state.showDetails ? text.hideDetails : text.showDetails}
                </span>
                {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 space-y-2 animate-fadeIn">
                  <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {text.diagnosticInfo}
                  </div>
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-60 custom-scrollbar whitespace-pre-wrap select-text">
                    <div className="text-amber-400 font-bold mb-1">
                      {text.errorMessage} {this.state.error?.message}
                    </div>
                    <div className="opacity-80">
                      {this.state.error?.stack || 'No stack trace available.'}
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <div className="mt-3 pt-3 border-t border-slate-800 opacity-60">
                        <div className="font-bold text-slate-400 mb-1">Component Stack:</div>
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
