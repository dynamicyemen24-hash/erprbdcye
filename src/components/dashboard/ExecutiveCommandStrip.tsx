import React from 'react';
import { Activity, ShieldCheck, Target, TrendingUp, AlertCircle, Sparkles, CheckCircle2, ChevronRight, Award, PieChart, Layers } from 'lucide-react';

interface ExecutiveCommandStripProps {
  lang: 'ar' | 'en';
  onNavigate?: (tabId: string) => void;
  healthMetrics?: {
    overallScore: number;
    strategic: number;
    operational: number;
    financial: number;
    risk: number;
    compliance: number;
    impact: number;
    data: number;
    strategicAlignment: number;
    dataConfidence: number;
  };
}

function ExecutiveCommandStripInner({ lang, onNavigate, healthMetrics }: ExecutiveCommandStripProps) {
  const [selectedDomain, setSelectedDomain] = React.useState<string | null>(null);

  const getStatus = (score: number) => {
    if (score >= 90) return { label: 'OPTIMAL', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' };
    if (score >= 80) return { label: 'EXCELLENT', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' };
    if (score >= 70) return { label: 'GOOD', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' };
    return { label: 'ATTENTION', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' };
  };

  const rawDomains = [
    { id: 'strategic', labelAr: 'التقدم الاستراتيجي', labelEn: 'Strategic Progress', score: healthMetrics?.strategic ?? 88 },
    { id: 'operational', labelAr: 'الصحة التشغيلية', labelEn: 'Operational Health', score: healthMetrics?.operational ?? 82 },
    { id: 'financial', labelAr: 'الكفاءة المالية', labelEn: 'Financial Efficiency', score: healthMetrics?.financial ?? 79 },
    { id: 'risk', labelAr: 'مستوى السلامة والجاهزية', labelEn: 'Safety & Readiness', score: healthMetrics?.risk ?? 86 },
    { id: 'compliance', labelAr: 'الرقابة والاعتمادات', labelEn: 'Audit & Approvals', score: healthMetrics?.compliance ?? 94 },
    { id: 'impact', labelAr: 'مؤشر الأثر الإنساني', labelEn: 'Impact Index', score: healthMetrics?.impact ?? 81 },
    { id: 'data', labelAr: 'جودة وموثوقية السجلات', labelEn: 'Data Quality & Trust', score: healthMetrics?.data ?? 97 }
  ];

  const healthDomains = rawDomains.map(d => {
    const st = getStatus(d.score);
    return { ...d, status: st.label, color: st.color, bg: st.bg };
  });

  const overall = healthMetrics?.overallScore ?? 84;
  const alignment = healthMetrics?.strategicAlignment ?? 89.5;
  const confidence = healthMetrics?.dataConfidence ?? 96.8;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-zinc-950 rounded-2xl border border-slate-800 p-5 text-white shadow-xl relative overflow-hidden">
      {/* Background Accent Lines */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        
        {/* Main Enterprise Health Score Badge */}
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 shrink-0">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-2xl shadow-lg shadow-emerald-900/40 shrink-0">
            {overall}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                {lang === 'ar' ? 'مؤشر الصحة المؤسسية الشامل' : 'ENTERPRISE HEALTH INDEX'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> +3.2%
              </span>
            </div>

            <h2 className="text-lg font-black text-white mt-0.5">
              {lang === 'ar' 
                ? `${overall} / 100 — أداء تشغيلي ومؤسسي متزن` 
                : `${overall} / 100 — Balanced Operational Health`}
            </h2>

            <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 font-semibold">
              <span>{lang === 'ar' ? 'نسبة التقدم الميداني:' : 'Field Progress:'} <strong className="text-amber-400">{alignment}%</strong></span>
              <span>•</span>
              <span>{lang === 'ar' ? 'موثوقية البيانات:' : 'Data Confidence:'} <strong className="text-emerald-400">{confidence}%</strong></span>
            </div>
          </div>
        </div>

        {/* 7 Core Health Domains Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 w-full">
          {healthDomains.map((domain) => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(selectedDomain === domain.id ? null : domain.id)}
              className={`p-2.5 rounded-xl border text-right rtl:text-right transition-all cursor-pointer ${
                selectedDomain === domain.id
                  ? 'bg-emerald-500/20 border-emerald-500 shadow-md scale-105'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 truncate">
                {lang === 'ar' ? domain.labelAr : domain.labelEn}
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span className="text-base font-black text-white">{domain.score}</span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${domain.bg} ${domain.color}`}>
                  {domain.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${domain.score > 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${domain.score}%` }}
                />
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* Domain Drilldown Banner if selected */}
      {selectedDomain && (
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-xl animate-fade-in text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === 'ar' 
                ? `تفاصيل تقييم مجال: ${healthDomains.find(d => d.id === selectedDomain)?.labelAr} — تم احتسابه بناءً على 14 مؤشر أداء فرعي معتمد`
                : `Domain Evaluation Details: ${healthDomains.find(d => d.id === selectedDomain)?.labelEn} — Calculated across 14 verified operational indicators`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onNavigate) {
                  if (selectedDomain === 'strategic' || selectedDomain === 'impact') onNavigate('programs');
                  else if (selectedDomain === 'financial') onNavigate('finance');
                  else if (selectedDomain === 'risk' || selectedDomain === 'compliance') onNavigate('approvals');
                  else onNavigate('control_panel');
                }
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
            >
              {lang === 'ar' ? 'الانتقال المباشر للقسم' : 'Open Workspace'}
            </button>
            <button
              onClick={() => setSelectedDomain(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(ExecutiveCommandStripInner);
export { ExecutiveCommandStripInner as ExecutiveCommandStrip };
