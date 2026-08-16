import React, { useState } from 'react';
import { 
  Sparkles, TrendingUp, AlertTriangle, CheckCircle2, ArrowUpRight, 
  RefreshCw, ShieldAlert, Zap, Layers, BarChart2, Lightbulb, FileSpreadsheet 
} from 'lucide-react';
import { WidgetFrame } from '../enterprise/widgets/WidgetFrame';

interface AIInsightsWidgetProps {
  lang: 'ar' | 'en';
}

interface InsightItem {
  id: string;
  category: 'predictive' | 'sector' | 'opportunity';
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  metric: string;
  confidence: number;
  impact: 'HIGH' | 'MEDIUM' | 'OPTIMIZATION';
  action_ar: string;
  action_en: string;
}

export function AIInsightsWidget({ lang }: AIInsightsWidgetProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'predictive' | 'sector' | 'opportunity'>('all');
  const [appliedActions, setAppliedActions] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState<string | null>(null);

  const insights: InsightItem[] = [
    {
      id: 'ins-1',
      category: 'predictive',
      title_ar: 'تأثير إعادة توزيع موازنة قطاع التعليم',
      title_en: 'Education Sector Budget Optimization',
      description_ar: 'تظهر البيانات أن المشاريع التعليمية تحقق كفاءة أداء تتجاوز التوقعات بـ 15%. يُنصح بإعادة توجيه 5% من الوفر المالي لتعزيز برامج كفالة الطلاب.',
      description_en: 'Data shows education projects outperform targets by 15%. Reallocating 5% of surplus will boost student sponsorship programs.',
      metric: '+15% Efficiency',
      confidence: 96,
      impact: 'HIGH',
      action_ar: 'تطبيق التوجيه المالي الذكي',
      action_en: 'Apply Smart Reallocation'
    },
    {
      id: 'ins-2',
      category: 'sector',
      title_ar: 'توقعات اختناق توريدات السلال الغذائية - تعز',
      title_en: 'Supply Chain SLA Bottleneck Risk - Taiz',
      description_ar: 'يرصد نموذج الذكاء الاصطناعي احتمال تأخير بنسبة 22% في جدول تسليم السلال الغذائية بسبب الموسمية المناخية. يوصى بتقديم طلبات التوريد بـ 5 أيام.',
      description_en: 'AI model detects a 22% risk of delivery delay in food basket dispatch. Advise advancing procurement orders by 5 days.',
      metric: '22% SLA Risk',
      confidence: 92,
      impact: 'HIGH',
      action_ar: 'تقديم جدول التوريد',
      action_en: 'Advance Procurement Order'
    },
    {
      id: 'ins-3',
      category: 'opportunity',
      title_ar: 'فرصة توسيع نطاق الوصول في محافظة المهرة',
      title_en: 'Beneficiary Reach Expansion Opportunity - Al-Mahrah',
      description_ar: 'بناءً على الكثافة السكنية وبيانات المستفيدين الجدد، يمكن زيادة نسبة تغطية خدمات المياه النظيفة بنسبة 35% باستثمار إضافي محدود.',
      description_en: 'Based on beneficiary density, clean water coverage in Al-Mahrah can expand by 35% with targeted incremental funding.',
      metric: '+35% Reach',
      confidence: 89,
      impact: 'OPTIMIZATION',
      action_ar: 'اعتماد الخطة الميدانية',
      action_en: 'Approve Field Expansion'
    }
  ];

  const handleApplyAction = (id: string, title: string) => {
    if (appliedActions.includes(id)) return;
    setAppliedActions(prev => [...prev, id]);
    setRefreshToast(
      lang === 'ar' 
        ? `تم تنفيذ توصية: "${title}" بنجاح وتحديث خطة العمل` 
        : `Successfully applied recommendation: "${title}"`
    );
    setTimeout(() => setRefreshToast(null), 4000);
  };

  const handleRefreshAI = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshToast(
        lang === 'ar' 
          ? 'تم تحديث خوارزميات التحليل الذكي وتحديث المؤشرات بنجاح' 
          : 'AI models re-analyzed operational data successfully'
      );
      setTimeout(() => setRefreshToast(null), 3000);
    }, 800);
  };

  const filteredInsights = activeTab === 'all' 
    ? insights 
    : insights.filter(i => i.category === activeTab);

  return (
    <WidgetFrame
      id="ai-insights-widget"
      title={lang === 'ar' ? 'ذكاء Nexora AI التشغيلي' : 'Nexora AI Operational Intelligence'}
      icon={Sparkles}
      subtitle={lang === 'ar' ? 'توصيات وتنبوءات مدعومة بالذكاء الاصطناعي لتحسين الأثر والنجاعة' : 'AI-driven forecasts and actionable impact optimizations'}
      headerActions={
        <button
          onClick={handleRefreshAI}
          disabled={isRefreshing}
          className="text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{lang === 'ar' ? 'إعادة التحليل' : 'Re-Analyze'}</span>
        </button>
      }
    >
      {() => (
        <div className="space-y-4 overflow-y-auto h-full">
          {/* Toast Notification */}
          {refreshToast && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fade-in shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{refreshToast}</span>
              </div>
            </div>
          )}

          {/* Tab Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-zinc-800/80">
            {[
              { id: 'all', label_ar: 'جميع التوصيات', label_en: 'All Insights', count: insights.length },
              { id: 'predictive', label_ar: 'التوقعات الماليات', label_en: 'Financial Forecasts', count: 1 },
              { id: 'sector', label_ar: 'مخاطر القطاعات', label_en: 'Sector Risks', count: 1 },
              { id: 'opportunity', label_ar: 'فرص التوسع', label_en: 'Expansion Opportunities', count: 1 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white dark:bg-emerald-600 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{lang === 'ar' ? tab.label_ar : tab.label_en}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === tab.id ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* List of Insights */}
          <div className="space-y-3">
            {filteredInsights.map(item => {
              const isApplied = appliedActions.includes(item.id);
              const title = lang === 'ar' ? item.title_ar : item.title_en;
              const desc = lang === 'ar' ? item.description_ar : item.description_en;
              const actionText = lang === 'ar' ? item.action_ar : item.action_en;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isApplied
                      ? 'bg-slate-50/80 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800 opacity-75'
                      : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-emerald-500/40 shadow-3xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${
                        item.impact === 'HIGH' 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        <Zap className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                        {item.metric}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                        {lang === 'ar' ? `ثقة ${item.confidence}%` : `${item.confidence}% Confidence`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-3">
                    {desc}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                      {lang === 'ar' ? 'محرك التوصيات التنفيذي لـ Nexora OS' : 'Nexora AI Executive Recommender'}
                    </span>
                    <button
                      onClick={() => handleApplyAction(item.id, title)}
                      disabled={isApplied}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        isApplied
                          ? 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-98'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{lang === 'ar' ? 'تم التطبيق' : 'Applied'}</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>{actionText}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </WidgetFrame>
  );
}
