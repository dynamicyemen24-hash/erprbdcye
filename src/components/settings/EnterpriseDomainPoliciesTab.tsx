import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Settings2, 
  Sliders, 
  Coins, 
  Layers, 
  Users, 
  HandHeart, 
  FileCheck, 
  Cpu, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  Search,
  Lock,
  Globe,
  DollarSign,
  Compass,
  HeartHandshake
} from 'lucide-react';
import { useEnterprisePolicies } from '../../core/hooks/useEnterprisePolicies';

interface EnterpriseDomainPoliciesTabProps {
  lang: 'ar' | 'en';
}

interface DomainGroup {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  icon: any;
  color: string;
  settings: Array<{
    key: string;
    labelAr: string;
    labelEn: string;
    type: 'boolean' | 'number' | 'string' | 'select';
    options?: Array<{ label: string; value: any }>;
    descAr: string;
    descEn: string;
    unit?: string;
  }>;
}

export default function EnterpriseDomainPoliciesTab({ lang }: EnterpriseDomainPoliciesTabProps) {
  const { systemSettings, orgSettings, loading, refresh, updateSettingInDB } = useEnterprisePolicies();
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, any>>({});

  const domainGroups: DomainGroup[] = [
    {
      id: 'NEB-01',
      code: 'NEB-01 / NEB-02',
      nameAr: 'الأداء والاستراتيجية والحوكمة',
      nameEn: 'Strategy & Performance OS',
      icon: Compass,
      color: 'from-amber-500 to-amber-600',
      settings: [
        {
          key: 'strat_kpi_review_cycle',
          labelAr: 'دورية مراجعة مؤشرات الأداء',
          labelEn: 'KPI Review Frequency',
          type: 'select',
          options: [
            { label: 'شهرية (Monthly)', value: 'MONTHLY' },
            { label: 'ربع سنوية (Quarterly)', value: 'QUARTERLY' },
            { label: 'نصف سنوية (Semi-Annual)', value: 'SEMI_ANNUAL' }
          ],
          descAr: 'الجدول الزمني الإلزامي لتقييم مؤشرات الأداء والمستهدفات',
          descEn: 'Mandatory evaluation cycle for strategic KPI benchmarks'
        },
        {
          key: 'strat_warning_threshold_pct',
          labelAr: 'نسبة التنبيه لانحراف المؤشرات (%)',
          labelEn: 'Strategic Warning Threshold (%)',
          type: 'number',
          unit: '%',
          descAr: 'نسبة تحقيق الهدف التي تُطلق تنبيهاً بالانحراف',
          descEn: 'Achievement percentage that triggers an anomaly alert'
        },
        {
          key: 'strat_plan_span_years',
          labelAr: 'المدى الزمني للخطة الاستراتيجية',
          labelEn: 'Strategic Plan Horizon',
          type: 'number',
          unit: 'سنوات / Years',
          descAr: 'مدة دورة التخطيط الاستراتيجي الكبرى',
          descEn: 'Strategic plan macro lifecycle duration'
        }
      ]
    },
    {
      id: 'NEB-04',
      code: 'NEB-04 / NEB-05',
      nameAr: 'المشاريع والعمليات الميدانية',
      nameEn: 'Projects & Field Operations OS',
      icon: Layers,
      color: 'from-blue-500 to-blue-600',
      settings: [
        {
          key: 'proj_overbudget_warning_pct',
          labelAr: 'سقف تنبيه تجاوز الموازنة (%)',
          labelEn: 'Overbudget Warning Threshold (%)',
          type: 'number',
          unit: '%',
          descAr: 'النسبة المئوية التي تطلق إنذاراً مبكراً لاقتراب استنفاد الموازنة',
          descEn: 'Percentage that triggers budget exhaustion pre-warning'
        },
        {
          key: 'proj_wbs_auto_code_enabled',
          labelAr: 'التوليد الآلي لأكواد تفكيك العمل (WBS)',
          labelEn: 'Auto-Generate WBS Codes',
          type: 'boolean',
          descAr: 'ترقيم قياسي تسلسلي تلقائي لعناصر ومحطات المشروع',
          descEn: 'Automatic standardized hierarchical numbering for project tasks'
        },
        {
          key: 'proj_daily_field_log_mandatory',
          labelAr: 'إلزامية السجل الميداني اليومي',
          labelEn: 'Mandatory Daily Field Log',
          type: 'boolean',
          descAr: 'إلزام المشرفين الميدانيين برفع تقرير إنجاز يومي',
          descEn: 'Requires field coordinators to submit daily progress reports'
        },
        {
          key: 'proj_gps_geofence_radius_meters',
          labelAr: 'نطاق التحقق الجغرافي الميداني (GPS)',
          labelEn: 'GPS Geofencing Radius (Meters)',
          type: 'number',
          unit: 'متر / Meters',
          descAr: 'المسافة المسموحة لتطابق موقع التوزيع الفعلي مع الإحداثيات',
          descEn: 'Maximum allowed deviation between field location and target'
        }
      ]
    },
    {
      id: 'NEB-06',
      code: 'NEB-06',
      nameAr: 'الخدمات الإنسانية ومعايير Sphere',
      nameEn: 'Humanitarian Service & Sphere OS',
      icon: HandHeart,
      color: 'from-rose-500 to-rose-600',
      settings: [
        {
          key: 'serv_sphere_standards_enforced',
          labelAr: 'تطبيق المعايير الإنسانية الدولية (Sphere)',
          labelEn: 'Enforce International Sphere Standards',
          type: 'boolean',
          descAr: 'التحقق الآلي من الحصص الغذائية والمياه والمأوى وفق المعيار العالمي',
          descEn: 'Automated compliance check for food, WASH and shelter ratios'
        },
        {
          key: 'serv_national_id_dedup_check',
          labelAr: 'منع تكرار الرقم الوطني للمستفيد',
          labelEn: 'National ID Deduplication Lock',
          type: 'boolean',
          descAr: 'حظر ازدواجية الاستفادة والتحقق الفوري من الهوية الوطنية',
          descEn: 'Prevents duplicate aid claims by validating national ID records'
        },
        {
          key: 'serv_vulnerability_reassess_days',
          labelAr: 'دورية إعادة تقييم الاحتياج والهmapping',
          labelEn: 'Vulnerability Reassessment Interval',
          type: 'number',
          unit: 'يوم / Days',
          descAr: 'الفترة الزمنية الإلزامية لتحديث المسح الميداني للأسرة',
          descEn: 'Mandatory days before family vulnerability status must be updated'
        },
        {
          key: 'serv_aid_receipt_biometric_enabled',
          labelAr: 'التسليم بالبصمة الرقمية',
          labelEn: 'Biometric Aid Handover',
          type: 'boolean',
          descAr: 'توثيق استلام المساعدات بالبصمة الإلكترونية لضمان الشفافية',
          descEn: 'Verifies beneficiary identity via biometric scan upon receipt'
        }
      ]
    },
    {
      id: 'NEB-08',
      code: 'NEB-08',
      nameAr: 'المنح والتمويل والشفافية IATI',
      nameEn: 'Grants, Donors & IATI Standard',
      icon: HeartHandshake,
      color: 'from-emerald-500 to-emerald-600',
      settings: [
        {
          key: 'grant_closeout_notice_days',
          labelAr: 'تنبيه إغلاق وتصفية المنحة',
          labelEn: 'Grant Closeout Early Warning',
          type: 'number',
          unit: 'يوم / Days',
          descAr: 'مهلة الإشعار المالي والقانوني قبل انتهاء تاريخ سريان المنحة',
          descEn: 'Lead days to prepare financial liquidation and donor closure'
        },
        {
          key: 'grant_donor_report_lead_days',
          labelAr: 'مهلة التذكير بتقارير المانحين',
          labelEn: 'Donor Reporting Lead Reminder',
          type: 'number',
          unit: 'يوم / Days',
          descAr: 'تنبيه الفرق الفنية والمالية لإعداد التقرير المرفوع للمانح',
          descEn: 'Advance notice for technical and financial report submission'
        },
        {
          key: 'grant_iati_standard_export',
          labelAr: 'التوافق مع معيار الشفافية الدولية IATI',
          labelEn: 'IATI Standard Compliant Export',
          type: 'boolean',
          descAr: 'تصدير بيانات التدخلات بصيغة XML المعتمدة لمنظمة IATI الدولية',
          descEn: 'Enables instant XML publication according to international standards'
        }
      ]
    },
    {
      id: 'NEB-10',
      code: 'NEB-10',
      nameAr: 'المالية والحوكمة ومعايير IPSAS',
      nameEn: 'Finance, IPSAS & Ledger OS',
      icon: Coins,
      color: 'from-teal-500 to-teal-600',
      settings: [
        {
          key: 'fin_accounting_standard',
          labelAr: 'المعيار المحاسبي المعتمد',
          labelEn: 'Accounting Governance Framework',
          type: 'select',
          options: [
            { label: 'IPSAS Accrual (أساس الاستحقاق الدولي)', value: 'IPSAS_ACCRUAL' },
            { label: 'IPSAS Cash (الأساس النقدي المعدل)', value: 'IPSAS_CASH' }
          ],
          descAr: 'المعيار المحاسبي الحاكم للدفاتر والقوائم المالية للمنظمات',
          descEn: 'Public sector accounting standard governing general ledger operations'
        },
        {
          key: 'fin_unbalanced_journals_allowed',
          labelAr: 'السماح بقيود غير متوازنة',
          labelEn: 'Allow Unbalanced Journals',
          type: 'boolean',
          descAr: 'الحظر الصارم لتمرير أي قيد يكون فيه المدين لا يساوي الدائن',
          descEn: 'Strictly blocks posting any voucher where Debit != Credit'
        },
        {
          key: 'fin_petty_cash_max_limit_yer',
          labelAr: 'سقف العهدة النقدية المؤقتة (ريال)',
          labelEn: 'Max Petty Cash Disbursal Limit (YER)',
          type: 'number',
          unit: 'YER',
          descAr: 'الحد الأقصى المصرح به للعهدة النقدية السريعة قبل التسوية',
          descEn: 'Maximum ceiling for petty cash advance before liquidation'
        },
        {
          key: 'fin_journal_code_prefix',
          labelAr: 'بادئة ترقيم قيود اليومية',
          labelEn: 'Journal Entry Number Prefix',
          type: 'string',
          descAr: 'الرمز المرجعي التلقائي في بداية رقم القيد المحاسبي',
          descEn: 'Standard prefix prepended to all auto-generated vouchers'
        }
      ]
    },
    {
      id: 'NEB-14',
      code: 'NEB-14',
      nameAr: 'المشتريات والمطابقة الثلاثية',
      nameEn: 'Procurement & 3-Way Match OS',
      icon: FileCheck,
      color: 'from-indigo-500 to-indigo-600',
      settings: [
        {
          key: 'proc_three_way_match_tolerance_pct',
          labelAr: 'هامش التسامح في المطابقة الثلاثية (%)',
          labelEn: '3-Way Matching Tolerance (%)',
          type: 'number',
          unit: '%',
          descAr: 'نسبة التباين المسموح بها بين الفاتورة وأمر الشراء ومحضر الاستلام',
          descEn: 'Acceptable discrepancy between PO, GRN and Vendor Invoice'
        },
        {
          key: 'proc_min_rfq_vendor_bids',
          labelAr: 'الحد الأدنى لعروض الأسعار (RFQ)',
          labelEn: 'Minimum Vendor Quotes Required',
          type: 'number',
          unit: 'عروض / Quotes',
          descAr: 'العدد الإلزامي لعروض الأسعار المطلوبة قبل الترسية للشراء',
          descEn: 'Mandatory quote count required before procurement award'
        },
        {
          key: 'proc_tender_opening_quorum',
          labelAr: 'نصاب لجنة فتح المظاريف',
          labelEn: 'Tender Committee Quorum',
          type: 'number',
          unit: 'أعضاء / Members',
          descAr: 'الحد الأدنى لحضور أعضاء لجنة المناقصات المعتمدة',
          descEn: 'Minimum members required to open formal tender bids'
        }
      ]
    },
    {
      id: 'NEB-13',
      code: 'NEB-13',
      nameAr: 'الذكاء الاصطناعي وكشف الشذوذ',
      nameEn: 'AI Intelligence & CHS Engine',
      icon: Cpu,
      color: 'from-purple-500 to-purple-600',
      settings: [
        {
          key: 'ai_anomaly_detection_level',
          labelAr: 'حساسية كشف الشذوذ والانحرافات',
          labelEn: 'AI Anomaly Detection Sensitivity',
          type: 'select',
          options: [
            { label: 'صارمة جداً (STRICT)', value: 'STRICT' },
            { label: 'متوسطة (MODERATE)', value: 'MODERATE' },
            { label: 'مرنة (RELAXED)', value: 'RELAXED' }
          ],
          descAr: 'مستوى تدقيق الخوارزمية في المعاملات المالية والمشتريات',
          descEn: 'Algorithmic sensitivity for detecting fraud, duplication & drift'
        },
        {
          key: 'ai_chs_compliance_tracking',
          labelAr: 'التتبع التلقائي لمعايير CHS التسعة',
          labelEn: 'Automated CHS 1-9 Compliance Scoring',
          type: 'boolean',
          descAr: 'التقييم الذكي الفوري لالتزام الأنشطة بالمعيار الإنساني الأساسي',
          descEn: 'Real-time scoring against the 9 Core Humanitarian Commitments'
        }
      ]
    }
  ];

  const handleSave = async (key: string, value: any, desc: string) => {
    setSavingKey(key);
    setSaveSuccess(null);
    try {
      const ok = await updateSettingInDB(key, value, desc);
      if (ok) {
        setSaveSuccess(key);
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    } finally {
      setSavingKey(null);
    }
  };

  const filteredGroups = domainGroups.filter(g => {
    if (selectedDomain !== 'all' && g.id !== selectedDomain) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return g.nameAr.toLowerCase().includes(q) || 
           g.nameEn.toLowerCase().includes(q) ||
           g.settings.some(s => s.labelAr.toLowerCase().includes(q) || s.key.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 p-6 rounded-2xl border border-zinc-800 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-black">
            <ShieldCheck className="w-4 h-4" />
            <span>{lang === 'ar' ? 'السياسات والمعايير التشغيلية المباشرة' : 'Standardized Enterprise Policies'}</span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-white">
            {lang === 'ar' ? 'ضبط المعايير والسياسات للوحدات التشغيلية الـ 15' : 'Operating Policies & Standards across 15 NEB Domains'}
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            {lang === 'ar'
              ? 'تتحكم هذه الإعدادات مباشرة في قواعد العمل والتحقق المحاسبي والميداني والامتثال الدولي في قاعدة البيانات السحابية الحقيقية.'
              : 'These settings enforce real-time business rules, accounting limits, and international humanitarian compliance directly in the database.'}
          </p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={loading}
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black flex items-center gap-2 border border-zinc-700 transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          <span>{lang === 'ar' ? 'تحديث من السحابة' : 'Refresh from DB'}</span>
        </button>
      </div>

      {/* Domain Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDomain('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              selectedDomain === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
            }`}
          >
            {lang === 'ar' ? 'جميع الوحدات التشغيلية' : 'All Domains'}
          </button>
          {domainGroups.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDomain(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                selectedDomain === d.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              {lang === 'ar' ? d.nameAr : d.nameEn}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3 rtl:right-3 ltr:left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في السياسات...' : 'Search policies...'}
            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {/* Domain Policy Cards Grid */}
      <div className="space-y-6">
        {filteredGroups.map(group => {
          const IconComp = group.icon;
          return (
            <div key={group.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              {/* Group Header */}
              <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${group.color} text-white shadow-md`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black font-mono px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                        {group.code}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {lang === 'ar' ? group.nameAr : group.nameEn}
                      </h3>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {lang === 'ar' ? `سياسات وضوابط وحدة ${group.nameAr}` : `Governance rules for ${group.nameEn}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group Settings Rows */}
              <div className="p-4 divide-y divide-slate-100 dark:divide-zinc-800">
                {group.settings.map(setting => {
                  const currentValue = localValues[setting.key] !== undefined 
                    ? localValues[setting.key] 
                    : (systemSettings[setting.key] ?? (setting.type === 'boolean' ? false : ''));
                  const isSaving = savingKey === setting.key;
                  const isSuccess = saveSuccess === setting.key;

                  return (
                    <div key={setting.key} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {lang === 'ar' ? setting.labelAr : setting.labelEn}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {setting.key}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {lang === 'ar' ? setting.descAr : setting.descEn}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {setting.type === 'boolean' && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !currentValue;
                              setLocalValues(prev => ({ ...prev, [setting.key]: nextVal }));
                              handleSave(setting.key, nextVal, setting.descAr);
                            }}
                            disabled={isSaving}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              currentValue ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-zinc-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                currentValue ? (lang === 'ar' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                              }`}
                            />
                          </button>
                        )}

                        {setting.type === 'number' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={currentValue}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                setLocalValues(prev => ({ ...prev, [setting.key]: val }));
                              }}
                              className="w-32 px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-black text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                            {setting.unit && (
                              <span className="text-[11px] font-bold text-zinc-400">{setting.unit}</span>
                            )}
                            <button
                              onClick={() => handleSave(setting.key, currentValue, setting.descAr)}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'حفظ' : 'Save'}</span>
                            </button>
                          </div>
                        )}

                        {setting.type === 'select' && setting.options && (
                          <div className="flex items-center gap-2">
                            <select
                              value={currentValue}
                              onChange={e => {
                                const val = e.target.value;
                                setLocalValues(prev => ({ ...prev, [setting.key]: val }));
                                handleSave(setting.key, val, setting.descAr);
                              }}
                              className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                            >
                              {setting.options.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {setting.type === 'string' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={currentValue}
                              onChange={e => setLocalValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                              className="w-36 px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                            <button
                              onClick={() => handleSave(setting.key, currentValue, setting.descAr)}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'حفظ' : 'Save'}</span>
                            </button>
                          </div>
                        )}

                        {isSuccess && (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{lang === 'ar' ? 'تم الحفظ في قاعدة البيانات' : 'Saved to DB'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
