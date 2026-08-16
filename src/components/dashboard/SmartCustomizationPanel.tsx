import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Check, Layout, Trash2, Save, Sparkles, RefreshCw, Eye, EyeOff,
  Sliders, Grid, Layers, Database, User, ShieldAlert, X
} from 'lucide-react';

export interface DashboardPreset {
  id: string;
  name_en: string;
  name_ar: string;
  isSystem?: boolean;
  visibleWidgets: {
    kpiCards: boolean;
    operationsCenter: boolean;
    domainOverview: boolean;
    smartAlerts: boolean;
    bottleneckAnalysis: boolean;
    charts: boolean;
    activityLog: boolean;
    aiInsights: boolean;
    calendar: boolean;
    geoMap: boolean;
    fieldEfficiency: boolean;
  };
  spacing: 'compact' | 'comfortable' | 'spacious';
  cardStyle: 'flat' | 'bordered' | 'shadowed';
}

interface SmartCustomizationPanelProps {
  lang: 'ar' | 'en';
  currentUser: any;
  currentPreset: DashboardPreset;
  onApplyPreset: (preset: DashboardPreset) => void;
  onSaveCustomPreset: (preset: DashboardPreset) => void;
  onDeletePreset: (id: string) => void;
  customPresets: DashboardPreset[];
  isOpen: boolean;
  onClose: () => void;
}

export const SYSTEM_PRESETS: DashboardPreset[] = [
  {
    id: 'sys-full',
    name_en: 'Executive Focus Dashboard',
    name_ar: 'شراكات المانحين والعقود',
    isSystem: true,
    visibleWidgets: {
      kpiCards: true,
      operationsCenter: true,
      domainOverview: false,
      smartAlerts: true,
      bottleneckAnalysis: false,
      charts: true,
      activityLog: true,
      aiInsights: true,
      calendar: false,
      geoMap: false,
      fieldEfficiency: false
    },
    spacing: 'comfortable',
    cardStyle: 'bordered'
  },
  {
    id: 'sys-operations',
    name_en: 'Field Operations & Planning',
    name_ar: 'الأنظمة والوحدات التشغيلية',
    isSystem: true,
    visibleWidgets: {
      kpiCards: true,
      operationsCenter: true,
      domainOverview: false,
      smartAlerts: true,
      bottleneckAnalysis: false,
      charts: false,
      activityLog: true,
      aiInsights: false,
      calendar: true,
      geoMap: true,
      fieldEfficiency: true
    },
    spacing: 'comfortable',
    cardStyle: 'bordered'
  },
  {
    id: 'sys-analytics',
    name_en: 'Financial & Strategic Analytics',
    name_ar: 'التحليل المالي والاستراتيجي',
    isSystem: true,
    visibleWidgets: {
      kpiCards: true,
      operationsCenter: false,
      domainOverview: true,
      smartAlerts: false,
      bottleneckAnalysis: true,
      charts: true,
      activityLog: false,
      aiInsights: true,
      calendar: false,
      geoMap: false,
      fieldEfficiency: true
    },
    spacing: 'compact',
    cardStyle: 'shadowed'
  },
  {
    id: 'sys-minimal',
    name_en: 'Minimal Actions Console',
    name_ar: 'لوحة الإجراءات البسيطة',
    isSystem: true,
    visibleWidgets: {
      kpiCards: true,
      operationsCenter: true,
      domainOverview: false,
      smartAlerts: true,
      bottleneckAnalysis: false,
      charts: false,
      activityLog: true,
      aiInsights: false,
      calendar: false,
      geoMap: false,
      fieldEfficiency: false
    },
    spacing: 'comfortable',
    cardStyle: 'flat'
  }
];

export function SmartCustomizationPanel({
  lang,
  currentUser,
  currentPreset,
  onApplyPreset,
  onSaveCustomPreset,
  onDeletePreset,
  customPresets,
  isOpen,
  onClose
}: SmartCustomizationPanelProps) {
  const [newPresetName, setNewPresetName] = useState('');
  const [tempConfig, setTempConfig] = useState<DashboardPreset>({ ...currentPreset });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Keep temporary configuration in sync with the current active preset when panel opens
  useEffect(() => {
    if (isOpen) {
      setTempConfig({ ...currentPreset });
      setSaveStatus('idle');
    }
  }, [isOpen, currentPreset]);

  const handleToggleWidget = (key: keyof DashboardPreset['visibleWidgets']) => {
    const updated = {
      ...tempConfig,
      visibleWidgets: {
        ...tempConfig.visibleWidgets,
        [key]: !tempConfig.visibleWidgets[key]
      }
    };
    setTempConfig(updated);
    onApplyPreset(updated);
  };

  const handleStyleChange = (style: DashboardPreset['cardStyle']) => {
    const updated = { ...tempConfig, cardStyle: style };
    setTempConfig(updated);
    onApplyPreset(updated);
  };

  const handleSpacingChange = (space: DashboardPreset['spacing']) => {
    const updated = { ...tempConfig, spacing: space };
    setTempConfig(updated);
    onApplyPreset(updated);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const presetId = `custom-${Date.now()}`;
    const customPreset: DashboardPreset = {
      ...tempConfig,
      id: presetId,
      name_en: `Custom: ${newPresetName}`,
      name_ar: `حالة: ${newPresetName}`,
      isSystem: false
    };

    onSaveCustomPreset(customPreset);
    setNewPresetName('');
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const activeUserLabel = currentUser 
    ? `${currentUser.name} (${currentUser.role === 'admin' ? (lang === 'ar' ? 'مسؤول النظام' : 'Administrator') : (lang === 'ar' ? 'مدقق عادي' : 'Director')})`
    : (lang === 'ar' ? 'الحالة نشطة' : 'Guest Session');

  const widgetMetadata = [
    { key: 'kpiCards' as const, label_ar: 'المدير التنفيذي والهيئة العليا', label_en: 'Top KPI Value Cards', desc_ar: 'البرامج الجارية، الموافقات المالية، والوصول الشهري للخدمات.', desc_en: 'Displays overall program counts, ledger statuses, and caseloads.' },
    { key: 'operationsCenter' as const, label_ar: 'الكونسول ومراكز التشغيل السريع', label_en: 'Operations Control & Shortcuts', desc_ar: 'لوحة الإجراءات السريعة ومسارات الموديولات التنفيذية.', desc_en: 'Quick command buttons and executive pipeline shortcuts.' },
    { key: 'domainOverview' as const, label_ar: 'لوحة توزيع نطاقات Nexora™', label_en: 'Nexora Enterprise Domains? Overview', desc_ar: 'خلاصة توزيع النطاقات الـ 13 ومستويات الاكتمال المؤسسي.', desc_en: 'Performance summaries across all 13 institutional domains.' },
    { key: 'smartAlerts' as const, label_ar: 'لوحة المخاطر والتنبيهات الذكية', label_en: 'Smart Risks & SLA Alerts', desc_ar: 'رصد فجوات التقدم ومؤشرات الإنذار المبكر للمشاريع.', desc_en: 'Automated monitoring of project progress gaps and warning states.' },
    { key: 'bottleneckAnalysis' as const, label_ar: 'تحليل الاختناقات وسرعة الاستجابة', label_en: 'SLA Bottleneck Analysis', desc_ar: 'تحليل أوقات الاستجابة لطلبات الحوكمة وموافقات المشاريع.', desc_en: 'Deep audit trail of pending approval times and workflows.' },
    { key: 'charts' as const, label_ar: 'المخططات البيانية وتوزيع الموازنات', label_en: 'Budget & Cases Analytics', desc_ar: 'توزيع الموازنات المالية ونمو المستفيدين الشهري.', desc_en: 'Data-driven visualization of capital budgets and monthly growth.' },
    { key: 'activityLog' as const, label_ar: 'سجل تدقيق العمليات الأخير', label_en: 'Recent Live Operations Audit', desc_ar: 'التدفق المباشر للعمليات والأنشطة الإدارية والميدانية.', desc_en: 'Live stream of tactical entries and operational changes.' },
    { key: 'aiInsights' as const, label_ar: 'رؤى وتنبؤات كوبر العمليات بالذكاء الاصطناعي', label_en: 'AI Copilot Strategic Insights', desc_ar: 'رؤى وتحليلات مولدة تلقائياً عبر نماذج Gemini AI.', desc_en: 'Proactive opportunities and optimizations derived from model outputs.' },
    { key: 'calendar' as const, label_ar: 'التقويم التشغيلي وجدول الميدان المشترك', label_en: 'Unified Operational Calendar', desc_ar: 'تواريخ التسليم، معالم العمليات، ومواعيد الـ WBS.', desc_en: 'Integrated project schedules and milestone timelines.' },
    { key: 'geoMap' as const, label_ar: 'الخريطة الجغرافية التفاعلية للمشاريع', label_en: 'Interactive GIS Operations Map', desc_ar: 'توزيع المشاريع، ومستويات الصرف متبوعة بالموقع الجغرافي.', desc_en: 'Visual coordinates of active interventions and field progress.' },
    { key: 'fieldEfficiency' as const, label_ar: 'لوحة قياس الكفاءة الميدانية وزيارات الاستجابة', label_en: 'Field Coverage & Visit Efficiency', desc_ar: 'التحليل المقارن لمعدلات تخطيط وتنفيذ النزولات الميدانية لفرق الاستجابة.', desc_en: 'Comparative audit of planned vs. actual operations across targeted areas.' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, x: lang === 'ar' ? -100 : 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: lang === 'ar' ? -100 : 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="bg-white dark:bg-zinc-950 w-full max-w-2xl h-full max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-zinc-800"
          >
            {/* Header */}
            <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-lg">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>{lang === 'ar' ? 'التخصيص الذكي للوحة التحكم' : 'Smart Dashboard Customization'}</span>
                    <span className="text-[9px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      NexoraOS?
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {lang === 'ar' ? 'حفظ تخطيطات مخصصة ونماذج مرئية سريعة لكل مستخدم' : 'Save tailored dashboard views and visual densities per user profile.'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* User Session Profile Badge */}
              <div className="bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-bold shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-700 dark:text-zinc-300">
                      {lang === 'ar' ? 'ملف التخصيص النشط' : 'Active Customization Profile'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                      {activeUserLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 bg-white dark:bg-zinc-900 border border-emerald-500/10 px-2 py-1 rounded-lg">
                  <Database className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'حفظ تلقائي محلي' : 'Local Storage Sync'}</span>
                </div>
              </div>

              {/* Layout Presets (System & Custom) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'قوالب تخطيط لوحة التحكم (Presets)' : 'Dashboard Layout Presets'}</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* System Presets */}
                  {SYSTEM_PRESETS.map((preset) => {
                    const isActive = currentPreset.id === preset.id;
                    const visibleCount = Object.values(preset.visibleWidgets).filter(Boolean).length;

                    return (
                      <button
                        key={preset.id}
                        onClick={() => onApplyPreset(preset)}
                        className={`text-start p-3.5 rounded-xl border transition-all relative flex flex-col justify-between h-24 cursor-pointer shadow-3xs ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
                            : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800 dark:text-zinc-200">
                              {lang === 'ar' ? preset.name_ar : preset.name_en}
                            </span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1 block">
                            {preset.id === 'sys-full' && (lang === 'ar' ? 'كافة القطاعات والمؤشرات النشطة' : 'Full system overview with all modules')}
                            {preset.id === 'sys-operations' && (lang === 'ar' ? 'الميدان، التقويم، المخاطر والخرائط' : 'Field logs, maps, and schedules')}
                            {preset.id === 'sys-analytics' && (lang === 'ar' ? 'الرسوم البيانية المتقدمة، الموازنات والذكاء الاصطناعي' : 'Charts, strategic forecasts')}
                            {preset.id === 'sys-minimal' && (lang === 'ar' ? 'الكونسول والتنبيهات المباشرة فقط' : 'Slick list view with core commands')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between w-full mt-2">
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {lang === 'ar' ? 'نظام رسمي' : 'Official Preset'}
                          </span>
                          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{visibleCount} {lang === 'ar' ? 'إلغاء' : 'widgets'}</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom Presets */}
                  {customPresets.map((preset) => {
                    const isActive = currentPreset.id === preset.id;
                    const visibleCount = Object.values(preset.visibleWidgets).filter(Boolean).length;

                    return (
                      <div
                        key={preset.id}
                        className={`p-3.5 rounded-xl border transition-all relative flex flex-col justify-between h-24 shadow-3xs ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
                            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20'
                        }`}
                      >
                        <button
                          onClick={() => onApplyPreset(preset)}
                          className="text-start flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800 dark:text-zinc-200 line-clamp-1">
                              {lang === 'ar' ? preset.name_ar : preset.name_en}
                            </span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1 block">
                            {lang === 'ar' ? 'تم الحفظ بواسطة المستخدم' : 'Saved user customization preset'}
                          </span>
                        </button>
                        
                        <div className="flex items-center justify-between w-full mt-2">
                          <button
                            onClick={() => onDeletePreset(preset.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-colors cursor-pointer"
                            title={lang === 'ar' ? 'حذف هذا القالب' : 'Delete preset'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{visibleCount} {lang === 'ar' ? 'لوحات' : 'widgets'}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Widget Visibility Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'إدارة ظهور اللوحات والأقسام' : 'Manage Section Visibility'}</span>
                </h4>

                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/80 bg-slate-50/30 dark:bg-zinc-900/10">
                  {widgetMetadata.map((meta) => {
                    const isVisible = tempConfig.visibleWidgets[meta.key];
                    return (
                      <div 
                        key={meta.key} 
                        onClick={() => handleToggleWidget(meta.key)}
                        className={`flex items-start justify-between p-3.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/30 ${
                          isVisible ? 'bg-emerald-500/[0.01]' : 'opacity-65 bg-slate-50/10'
                        }`}
                      >
                        <div className="space-y-0.5 flex-1 pr-3 pl-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold transition-colors ${isVisible ? 'text-slate-800 dark:text-zinc-100 font-extrabold' : 'text-slate-500'}`}>
                              {lang === 'ar' ? meta.label_ar : meta.label_en}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed max-w-lg">
                            {lang === 'ar' ? meta.desc_ar : meta.desc_en}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 focus:outline-hidden ${
                            isVisible ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-zinc-800'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                              isVisible 
                                ? (lang === 'ar' ? '-translate-x-4' : 'translate-x-4') 
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid density & Style adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Spacing density */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'ar' ? 'دستور الاعتماد المزدوج' : 'Spacing & Grid Density'}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800/80">
                    {(['compact', 'comfortable', 'spacious'] as const).map((space) => {
                      const isActive = tempConfig.spacing === space;
                      const labels = {
                        compact: lang === 'ar' ? 'نشطة' : 'Compact',
                        comfortable: lang === 'ar' ? 'متوسطة' : 'Balanced',
                        spacious: lang === 'ar' ? 'الجودة' : 'Spacious'
                      };
                      return (
                        <button
                          key={space}
                          onClick={() => handleSpacingChange(space)}
                          className={`text-[10px] font-bold py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                            isActive
                              ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-3xs'
                              : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                        >
                          {labels[space]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card styles */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'ar' ? 'نمط حدود بطاقات العمليات' : 'Dashboard Card Style'}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-800/80">
                    {(['flat', 'bordered', 'shadowed'] as const).map((style) => {
                      const isActive = tempConfig.cardStyle === style;
                      const labels = {
                        flat: lang === 'ar' ? 'مسطح' : 'Flat',
                        bordered: lang === 'ar' ? 'بحدود' : 'Bordered',
                        shadowed: lang === 'ar' ? 'إلغاء' : 'Shadowed'
                      };
                      return (
                        <button
                          key={style}
                          onClick={() => handleStyleChange(style)}
                          className={`text-[10px] font-bold py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                            isActive
                              ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-3xs'
                              : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                          }`}
                        >
                          {labels[style]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Create and Save Custom Preset Form */}
              <form onSubmit={handleSaveCustom} className="border border-dashed border-slate-200 dark:border-zinc-800 p-4 rounded-xl bg-slate-50/30 dark:bg-zinc-900/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    {lang === 'ar' ? 'حفظ التكوين الحالي كقالب مخصص' : 'Save Current Settings as Custom Preset'}
                  </h4>
                </div>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    required
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder={lang === 'ar' ? 'أدخل اسم القالب (مثال: لوحة التقارير الأسبوعية)...' : 'Enter preset name (e.g. Weekly Reports Layout)...'}
                    className="flex-1 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500/50"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-lg transition-colors shadow-3xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'حفظ مخصص' : 'Save Preset'}</span>
                  </button>
                </div>

                <AnimatePresence>
                  {saveStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تم حفظ القالب المخصص بنجاح في سجلات التخصيص!' : 'Custom preset successfully stored in customization database logs!'}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <button
                onClick={() => {
                  onApplyPreset(SYSTEM_PRESETS[0]);
                  setTempConfig(SYSTEM_PRESETS[0]);
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'استعادة الافتراضي الكامل' : 'Restore Full Default Layout'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-black rounded-lg transition-all shadow-3xs cursor-pointer"
              >
                {lang === 'ar' ? 'نمذجة تنبؤية' : 'Close Dashboard Layout Editor'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Minimal utility to render icon components
function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
