import React, { useState, useEffect } from 'react';
import {
  Shield, Settings, FileText, Users, Coins, Database,
  CheckCircle2, AlertTriangle, Info, RefreshCw, Save,
  Lock, Unlock, ChevronDown, ChevronRight, Eye, EyeOff,
  Globe, Clock, Percent, Hash, ToggleLeft, ToggleRight,
  Building, Briefcase, HandHeart, Target, Activity
} from 'lucide-react';

interface OperationalPoliciesProps {
  lang: 'ar' | 'en';
  sysSettings: Record<string, any>;
  orgSettings: Record<string, any>;
  onSaveSettings?: (settings: Record<string, any>) => Promise<void>;
}

interface PolicyCategory {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  policies: PolicyItem[];
}

interface PolicyItem {
  key: string;
  orgKey?: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: { value: string; labelAr: string; labelEn: string }[];
  unit?: string;
  min?: number;
  max?: number;
  securityLevel?: number;
  category: 'system' | 'org';
}

const POLICY_CATEGORIES: PolicyCategory[] = [
  {
    id: 'strategy',
    titleAr: 'الاستراتيجية والأداء',
    titleEn: 'Strategy & Performance',
    icon: Target,
    color: 'emerald',
    policies: [
      { key: 'strat_kpi_review_cycle', titleAr: 'دورة مراجعة مؤشرات الأداء', titleEn: 'KPI Review Cycle', descAr: 'فترة مراجعة مؤشرات الأداء الاستراتيجي', descEn: 'Strategic KPI review frequency', type: 'select', options: [{ value: 'MONTHLY', labelAr: 'شهري', labelEn: 'Monthly' }, { value: 'QUARTERLY', labelAr: 'ربع سنوي', labelEn: 'Quarterly' }, { value: 'SEMI_ANNUAL', labelAr: 'نصف سنوي', labelEn: 'Semi-Annual' }, { value: 'ANNUAL', labelAr: 'سنوي', labelEn: 'Annual' }], category: 'system' },
      { key: 'strat_warning_threshold_pct', titleAr: 'نسبة تحذير انحراف المؤشرات', titleEn: 'KPI Deviation Warning %', descAr: 'نسبة الانحراف التي تفشل عندها المؤشرات', descEn: 'Deviation percentage that triggers KPI alerts', type: 'number', unit: '%', min: 50, max: 100, category: 'system' },
      { key: 'strat_plan_span_years', titleAr: 'مدة الخطة الاستراتيجية', titleEn: 'Strategic Plan Span', descAr: 'عدد سنوات الخطة الاستراتيجية', descEn: 'Number of years for the strategic plan', type: 'number', unit: 'سنوات', min: 1, max: 10, category: 'system' },
    ],
  },
  {
    id: 'projects',
    titleAr: 'إدارة المشاريع',
    titleEn: 'Project Management',
    icon: Briefcase,
    color: 'blue',
    policies: [
      { key: 'proj_overbudget_warning_pct', titleAr: 'نسبة تحذير تجاوز الميزانية', titleEn: 'Budget Overrun Warning %', descAr: 'النسبة التي يُصدر فيها تحذير تجاوز الميزانية', descEn: 'Percentage that triggers budget overrun alert', type: 'number', unit: '%', min: 50, max: 100, category: 'system' },
      { key: 'proj_wbs_auto_code_enabled', titleAr: 'توليد تلقائي لأكواد هيكل العمل', titleEn: 'Auto WBS Code Generation', descAr: 'تفعيل التوليد التلقائي لأكواد هيكل العمل (WBS)', descEn: 'Enable automatic Work Breakdown Structure code generation', type: 'boolean', category: 'system' },
      { key: 'proj_daily_field_log_mandatory', titleAr: 'سجل يومي ميداني إلزامي', titleEn: 'Daily Field Log Mandatory', descAr: 'إلزام الميدانيين بتعبئة السجل اليومي', descEn: 'Require field staff to submit daily activity logs', type: 'boolean', category: 'system' },
      { key: 'proj_gps_geofence_radius_meters', titleAr: 'نصف قطر السياج الجغرافي', titleEn: 'GPS Geofence Radius', descAr: 'نصف قطر المنطقة الجغرافية للمتابعة الميدانية', descEn: 'GPS geofence radius for field tracking', type: 'number', unit: 'متر', min: 100, max: 5000, category: 'system' },
    ],
  },
  {
    id: 'beneficiaries',
    titleAr: 'خدمة المستفيدين',
    titleEn: 'Service Delivery',
    icon: HandHeart,
    color: 'amber',
    policies: [
      { key: 'serv_sphere_standards_enforced', titleAr: 'تطبيق معايير Sphere', titleEn: 'Enforce Sphere Standards', descAr: 'فرض معايير Sphere الإنسانية على خدمة المستفيدين', descEn: 'Enforce Sphere humanitarian standards on beneficiary services', type: 'boolean', category: 'system' },
      { key: 'serv_national_id_dedup_check', titleAr: 'فحص تكرار الهوية الوطنية', titleEn: 'National ID Dedup Check', descAr: 'فحص تلقائي لتكرار أرقام الهويات الوطنية', descEn: 'Automatic duplicate check for national ID numbers', type: 'boolean', category: 'system' },
      { key: 'serv_vulnerability_reassess_days', titleAr: 'فترة إعادة تقييم الحساسية', titleEn: 'Vulnerability Reassessment Days', descAr: 'عدد الأيام لإعادة تقييم حالة الحساسية', descEn: 'Days between vulnerability reassessments', type: 'number', unit: 'يوم', min: 30, max: 365, category: 'system' },
      { key: 'serv_aid_receipt_biometric_enabled', titleAr: 'إيصال المساعدات بالبصمة', titleEn: 'Biometric Aid Receipt', descAr: 'تفعيل التحقق بالبصمة عند استلام المساعدات', descEn: 'Enable biometric verification for aid receipt', type: 'boolean', category: 'system' },
    ],
  },
  {
    id: 'finance',
    titleAr: 'المالية والمحاسبة',
    titleEn: 'Finance & Accounting',
    icon: Coins,
    color: 'purple',
    policies: [
      { key: 'fin_accounting_standard', titleAr: 'المعايير المحاسبية', titleEn: 'Accounting Standard', descAr: 'المعايير المحاسبية المعتمدة', descEn: 'Approved accounting standards', type: 'select', options: [{ value: 'IPSAS_ACCRUAL', labelAr: 'IPSAS 조회 원가', labelEn: 'IPSAS Accrual' }, { value: 'IPSAS_CASH', labelAr: 'IPSAS نقدي', labelEn: 'IPSAS Cash' }, { value: 'IFRS', labelAr: 'IFRS', labelEn: 'IFRS' }], category: 'system' },
      { key: 'fin_unbalanced_journals_allowed', titleAr: 'السماح بقيود غير متوازنة', titleEn: 'Allow Unbalanced Journals', descAr: 'السماح بإنشاء قيود محاسبية غير متوازنة', descEn: 'Allow creation of unbalanced journal entries', type: 'boolean', category: 'system' },
      { key: 'fin_petty_cash_max_limit_yer', titleAr: 'حد صندوق المصروفات النثرية', titleEn: 'Petty Cash Max Limit', descAr: 'الحد الأقصى لصندوق المصروفات النثرية', descEn: 'Maximum petty cash fund limit', type: 'number', unit: 'ريال يمني', min: 100000, max: 50000000, category: 'system' },
      { key: 'fin_fx_rate_daily_refresh', titleAr: 'تحديث أسعار الصرف يومياً', titleEn: 'Daily FX Rate Refresh', descAr: 'تحديث تلقائي لأسعار الصرف يومياً', descEn: 'Automatically refresh exchange rates daily', type: 'boolean', category: 'system' },
      { key: 'org:FIN_BASE_CURRENCY', titleAr: 'العملة الأساسية', titleEn: 'Base Currency', descAr: 'العملة الأساسية للنظام المحاسبي', descEn: 'Base currency for the accounting system', type: 'select', options: [{ value: 'YER', labelAr: 'ريال يمني (YER)', labelEn: 'Yemeni Rial (YER)' }, { value: 'USD', labelAr: 'دولار أمريكي (USD)', labelEn: 'US Dollar (USD)' }, { value: 'SAR', labelAr: 'ريال سعودي (SAR)', labelEn: 'Saudi Riyal (SAR)' }], category: 'org' },
      { key: 'org:FIN_FISCAL_YEAR_START_MONTH', titleAr: 'بداية السنة المالية', titleEn: 'Fiscal Year Start', descAr: 'شهر بداية السنة المالية', descEn: 'Month when the fiscal year starts', type: 'select', options: Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), labelAr: new Date(2024, i).toLocaleDateString('ar', { month: 'long' }), labelEn: new Date(2024, i).toLocaleDateString('en', { month: 'long' }) })), category: 'org' },
    ],
  },
  {
    id: 'procurement',
    titleAr: 'المشتريات والمناقصات',
    titleEn: 'Procurement & Tenders',
    icon: Database,
    color: 'cyan',
    policies: [
      { key: 'proc_three_way_match_tolerance_pct', titleAr: 'نسبة تolerance المطابقة الثلاثية', titleEn: 'Three-Way Match Tolerance %', descAr: 'نسبة الفرق المسموح بها بين الفاتورة والاستلام', descEn: 'Allowed variance percentage between invoice and receipt', type: 'number', unit: '%', min: 0, max: 10, category: 'system' },
      { key: 'proc_min_rfq_vendor_bids', titleAr: 'الحد الأدنى لعروض الموردين', titleEn: 'Minimum RFQ Vendor Bids', descAr: 'الحد الأدنى لعدد عروض الموردين المطلوبة', descEn: 'Minimum number of vendor bids required', type: 'number', unit: 'عرض', min: 1, max: 10, category: 'system' },
      { key: 'proc_tender_opening_quorum', titleAr: 'نصيب فتح المناقصة', titleEn: 'Tender Opening Quorum', descAr: 'العدد الأدنى لأعضاء لجنة فتح المناقصة', descEn: 'Minimum committee members for tender opening', type: 'number', unit: 'أعضاء', min: 2, max: 10, category: 'system' },
      { key: 'org:PROC_APPROVAL_TIER_1_LIMIT_YER', titleAr: 'حد الموافقة المستوى 1', titleEn: 'Tier 1 Approval Limit', descAr: 'الحد الأقصى للموافقة بدون تصعيد', descEn: 'Maximum approval without escalation', type: 'number', unit: 'ريال يمني', min: 100000, max: 50000000, category: 'org' },
      { key: 'org:PROC_APPROVAL_TIER_2_LIMIT_YER', titleAr: 'حد الموافقة المستوى 2', titleEn: 'Tier 2 Approval Limit', descAr: 'الحد الأقصى للموافقة الإدارية', descEn: 'Maximum manager-level approval', type: 'number', unit: 'ريال يمني', min: 1000000, max: 100000000, category: 'org' },
      { key: 'org:PROC_APPROVAL_TIER_3_LIMIT_YER', titleAr: 'حد الموافقة المستوى 3', titleEn: 'Tier 3 Approval Limit', descAr: 'الحد الأقصى للموافقة التنفيذية', descEn: 'Maximum executive-level approval', type: 'number', unit: 'ريال يمني', min: 10000000, max: 500000000, category: 'org' },
    ],
  },
  {
    id: 'hr',
    titleAr: 'الموارد البشرية',
    titleEn: 'Human Resources',
    icon: Users,
    color: 'indigo',
    policies: [
      { key: 'hr_probation_period_months', titleAr: 'فترة التجربة', titleEn: 'Probation Period', descAr: 'مدة فترة التجربة للموظفين الجدد (أشهر)', descEn: 'New employee probation period (months)', type: 'number', unit: 'شهر', min: 1, max: 12, category: 'system' },
      { key: 'hr_appraisal_interval_months', titleAr: 'دورة تقييم الأداء', titleEn: 'Appraisal Interval', descAr: 'فترة بين تقييمات الأداء الدورية', descEn: 'Period between performance appraisals', type: 'number', unit: 'شهر', min: 3, max: 12, category: 'system' },
      { key: 'org:HR_STANDARD_WEEKLY_HOURS', titleAr: 'ساعات العمل الأسبوعية', titleEn: 'Standard Weekly Hours', descAr: 'العدد المحدد لساعات العمل في الأسبوع', descEn: 'Standard working hours per week', type: 'number', unit: 'ساعة', min: 20, max: 60, category: 'org' },
      { key: 'org:HR_ANNUAL_PAID_LEAVE_DAYS', titleAr: 'أيام الإجازة السنوية', titleEn: 'Annual Paid Leave Days', descAr: 'عدد أيام الإجازة المدفوعة سنوياً', descEn: 'Number of paid leave days per year', type: 'number', unit: 'يوم', min: 10, max: 60, category: 'org' },
    ],
  },
  {
    id: 'security',
    titleAr: 'الأمن والحماية',
    titleEn: 'Security & Protection',
    icon: Shield,
    color: 'rose',
    policies: [
      { key: 'sec_password_min_length', titleAr: 'الحد الأدنى لطول كلمة المرور', titleEn: 'Minimum Password Length', descAr: 'الحد الأدنى لعدد أحرف كلمة المرور', descEn: 'Minimum number of characters for passwords', type: 'number', unit: 'حرف', min: 6, max: 32, category: 'system' },
      { key: 'sec_session_timeout_minutes', titleAr: 'مهلة انتهاء الجلسة', titleEn: 'Session Timeout', descAr: 'فترة انتهاء الجلسة بسبب عدم النشاط', descEn: 'Session timeout due to inactivity', type: 'number', unit: 'دقيقة', min: 5, max: 480, category: 'system' },
      { key: 'sec_max_failed_attempts', titleAr: 'الحد الأقصى لمحاولات الدخول الفاشلة', titleEn: 'Max Failed Login Attempts', descAr: 'عدد محاولات الدخول الفاشلة قبل القفل', descEn: 'Failed login attempts before account lockout', type: 'number', unit: 'محاولة', min: 3, max: 20, category: 'system' },
      { key: 'sec_audit_trail_immutable', titleAr: 'سجل التدقيق غير القابل للتعديل', titleEn: 'Immutable Audit Trail', descAr: 'جعل سجلات التدقيق غير قابلة للحذف أو التعديل', descEn: 'Make audit logs immutable and non-deletable', type: 'boolean', category: 'system' },
      { key: 'org:OPS_BENEFICIARY_DATA_PROTECTION', titleAr: 'حماية بيانات المستفيدين', titleEn: 'Beneficiary Data Protection', descAr: 'معيار حماية بيانات المستفيدين', descEn: 'Beneficiary data protection standard', type: 'select', options: [{ value: 'GDPR_HUMANITARIAN_COMPLIANT', labelAr: 'متوافق مع GDPR الإنساني', labelEn: 'GDPR Humanitarian Compliant' }, { value: 'BASIC_ENCRYPTION', labelAr: 'تشفير أساسي', labelEn: 'Basic Encryption' }, { value: 'CUSTOM_POLICY', labelAr: 'سياسة مخصصة', labelEn: 'Custom Policy' }], category: 'org' },
    ],
  },
  {
    id: 'volunteers',
    titleAr: 'التطوع والمجتمع',
    titleEn: 'Volunteers & Community',
    icon: Activity,
    color: 'teal',
    policies: [
      { key: 'vol_minimum_age_years', titleAr: 'الحد الأدنى للعمر', titleEn: 'Minimum Volunteer Age', descAr: 'الحد الأدنى لعمر المتطوعين', descEn: 'Minimum age for volunteers', type: 'number', unit: 'سنة', min: 14, max: 25, category: 'system' },
      { key: 'vol_hourly_credit_value_yer', titleAr: 'قيمة ساعة التطويع', titleEn: 'Hourly Volunteer Credit Value', descAr: 'القيمة المالية لكل ساعة تطوع بالريال', descEn: 'Monetary value per volunteer hour in YER', type: 'number', unit: 'ريال/ساعة', min: 500, max: 50000, category: 'system' },
      { key: 'comm_committee_min_members', titleAr: 'الحد الأدنى لأعضاء اللجان', titleEn: 'Min Committee Members', descAr: 'الحد الأدنى لعدد أعضاء اللجنة المجتمعية', descEn: 'Minimum community committee members', type: 'number', unit: 'عضو', min: 3, max: 15, category: 'system' },
    ],
  },
  {
    id: 'documents',
    titleAr: 'التوثيق والأرشفة',
    titleEn: 'Documentation & Archival',
    icon: FileText,
    color: 'slate',
    policies: [
      { key: 'doc_retention_policy_years', titleAr: 'فترة الاحتفاظ بالمستندات', titleEn: 'Document Retention Years', descAr: 'فترة الاحتفاظ بالمستندات قبل الأرشفة', descEn: 'Years to retain documents before archival', type: 'number', unit: 'سنة', min: 1, max: 30, category: 'system' },
      { key: 'doc_watermark_sensitive_enabled', titleAr: 'علامة مائية على المستندات الحساسة', titleEn: 'Sensitive Document Watermark', descAr: 'إضافة علامة مائية تلقائية للمستندات الحساسة', descEn: 'Auto-watermark sensitive documents', type: 'boolean', category: 'system' },
    ],
  },
  {
    id: 'grants',
    titleAr: 'المنح والتمويل',
    titleEn: 'Grants & Funding',
    icon: Coins,
    color: 'orange',
    policies: [
      { key: 'grant_closeout_notice_days', titleAr: 'أيام إشعار انتهاء المنحة', titleEn: 'Grant Closeout Notice Days', descAr: 'عدد أيام الإشعار قبل انتهاء المنحة', descEn: 'Days notice before grant closeout', type: 'number', unit: 'يوم', min: 7, max: 90, category: 'system' },
      { key: 'grant_donor_report_lead_days', titleAr: 'أيام تذكير تقرير الجهة الممولة', titleEn: 'Donor Report Reminder Days', descAr: 'أيام التذكير قبل موعد تقرير الجهة الممولة', descEn: 'Days reminder before donor report deadline', type: 'number', unit: 'يوم', min: 3, max: 30, category: 'system' },
      { key: 'grant_iati_standard_export', titleAr: 'تصدير معيار IATI', titleEn: 'IATI Standard Export', descAr: 'تفعيل التصدير بمعيار IATI للشفافية', descEn: 'Enable IATI standard export for transparency', type: 'boolean', category: 'system' },
    ],
  },
  {
    id: 'ai',
    titleAr: 'الذكاء الاصطناعي والabwehr',
    titleEn: 'AI & Anomaly Detection',
    icon: Activity,
    color: 'violet',
    policies: [
      { key: 'ai_anomaly_detection_level', titleAr: 'مستوى كشف الشذوذ', titleEn: 'Anomaly Detection Level', descAr: 'حساسية نظام كشف الشذوذ بالذكاء الاصطناعي', descEn: 'AI-powered anomaly detection sensitivity', type: 'select', options: [{ value: 'STRICT', labelAr: 'صارم', labelEn: 'Strict' }, { value: 'MODERATE', labelAr: 'متوسط', labelEn: 'Moderate' }, { value: 'RELAXED', labelAr: 'مرن', labelEn: 'Relaxed' }], category: 'system' },
      { key: 'ai_chs_compliance_tracking', titleAr: 'تتبع مطابقة CHS', titleEn: 'CHS Compliance Tracking', descAr: 'تفعيل تتبع المطابقة مع معايير CHS', descEn: 'Enable CHS compliance tracking via AI', type: 'boolean', category: 'system' },
    ],
  },
  {
    id: 'fundraising',
    titleAr: 'الحملات والتبرعات',
    titleEn: 'Campaigns & Donations',
    icon: HandHeart,
    color: 'pink',
    policies: [
      { key: 'fund_campaign_deduction_rate_pct', titleAr: 'نسبة خصم الحملة الإدارية', titleEn: 'Campaign Admin Deduction %', descAr: 'نسبة الخصم الإداري من حملات التبرعات', descEn: 'Administrative deduction rate from donation campaigns', type: 'number', unit: '%', min: 0, max: 15, category: 'system' },
      { key: 'fund_donor_auto_acknowledgment', titleAr: 'إشعار تلقائي للجهات الممولة', titleEn: 'Auto Donor Acknowledgment', descAr: 'إرسال إشعار تلقائي للمتبرعين عند استلام التبرع', descEn: 'Auto-notify donors upon donation receipt', type: 'boolean', category: 'system' },
      { key: 'fund_zakat_nisab_standard', titleAr: 'معيار نصاب الزكاة', titleEn: 'Zakat Nisab Standard', descAr: 'المعيار المعتمد لحساب نصاب الزكاة', descEn: 'Standard for calculating Zakat nisab threshold', type: 'select', options: [{ value: 'SILVER_595G', labelAr: 'فضة 595 جرام', labelEn: 'Silver 595g' }, { value: 'GOLD_85G', labelAr: 'ذهب 85 جرام', labelEn: 'Gold 85g' }], category: 'system' },
    ],
  },
  {
    id: 'operations',
    titleAr: 'العمليات الميدانية',
    titleEn: 'Field Operations',
    icon: Globe,
    color: 'sky',
    policies: [
      { key: 'org:OPS_EMERGENCY_RESPONSE_PROTOCOL', titleAr: 'بروتوكول الاستجابة للطوارئ', titleEn: 'Emergency Response Protocol', descAr: 'مستوى بروتوكول الاستجابة للطوارئ', descEn: 'Emergency response protocol level', type: 'select', options: [{ value: 'LEVEL_1_MINIMAL', labelAr: 'المستوى 1 — الحد الأدنى', labelEn: 'Level 1 — Minimal' }, { value: 'LEVEL_2_ELEVATED', labelAr: 'المستوى 2 — مرتفع', labelEn: 'Level 2 — Elevated' }, { value: 'LEVEL_3_STANDARD', labelAr: 'المستوى 3 — قياسي', labelEn: 'Level 3 — Standard' }, { value: 'LEVEL_4_MAXIMUM', labelAr: 'المستوى 4 — أقصى', labelEn: 'Level 4 — Maximum' }], category: 'org' },
    ],
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40', icon: 'bg-emerald-500/10 text-emerald-600' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/40', icon: 'bg-blue-500/10 text-blue-600' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/40', icon: 'bg-amber-500/10 text-amber-600' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/40', icon: 'bg-purple-500/10 text-purple-600' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800/40', icon: 'bg-cyan-500/10 text-cyan-600' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/40', icon: 'bg-indigo-500/10 text-indigo-600' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/40', icon: 'bg-rose-500/10 text-rose-600' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-950/20', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800/40', icon: 'bg-teal-500/10 text-teal-600' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-950/20', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-800/40', icon: 'bg-slate-500/10 text-slate-600' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/40', icon: 'bg-orange-500/10 text-orange-600' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800/40', icon: 'bg-violet-500/10 text-violet-600' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800/40', icon: 'bg-pink-500/10 text-pink-600' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-950/20', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800/40', icon: 'bg-sky-500/10 text-sky-600' },
};

export const OperationalPoliciesSettings: React.FC<OperationalPoliciesProps> = ({
  lang,
  sysSettings,
  orgSettings,
  onSaveSettings,
}) => {
  const isRtl = lang === 'ar';
  const [expandedCategory, setExpandedCategory] = useState<string | null>('strategy');
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const getPolicyValue = (policy: PolicyItem): any => {
    if (editedValues[policy.key] !== undefined) return editedValues[policy.key];
    const source = policy.category === 'org' ? orgSettings : sysSettings;
    const key = policy.key.replace('org:', '');
    return source[key] ?? source[policy.key] ?? '';
  };

  const setPolicyValue = (policy: PolicyItem, value: any) => {
    setEditedValues(prev => ({ ...prev, [policy.key]: value }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!onSaveSettings) return;
    setSaving(true);
    try {
      await onSaveSettings(editedValues);
      setEditedValues({});
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save policies:', err);
    } finally {
      setSaving(false);
    }
  };

  const totalPolicies = POLICY_CATEGORIES.reduce((sum, cat) => sum + cat.policies.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {isRtl ? 'السياسات التشغيلية وال:endantic Governance' : 'Operational Policies & Governance'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {isRtl ? `${totalPolicies} سياسة نشطة — تُفرض تلقائياً على جميع العمليات` : `${totalPolicies} active policies — automatically enforced across all operations`}
            </p>
          </div>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
          </button>
        )}

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isRtl ? 'تم الحفظ بنجاح' : 'Saved Successfully'}
          </div>
        )}
      </div>

      {/* Policy Categories */}
      <div className="space-y-3">
        {POLICY_CATEGORIES.map((category) => {
          const colors = colorMap[category.color] || colorMap.emerald;
          const isExpanded = expandedCategory === category.id;
          const CategoryIcon = category.icon;

          return (
            <div
              key={category.id}
              className={`rounded-xl border overflow-hidden transition-all duration-300 ${
                isExpanded
                  ? `${colors.border} ${colors.bg} shadow-sm`
                  : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full flex items-center gap-3 p-4 text-right rtl:text-right transition-colors cursor-pointer"
              >
                <div className={`p-2 rounded-xl ${colors.icon}`}>
                  <CategoryIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left rtl:text-right">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {isRtl ? category.titleAr : category.titleEn}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    {category.policies.length} {isRtl ? 'سياسة' : 'policies'}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Policy Items */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {category.policies.map((policy) => {
                    const value = getPolicyValue(policy);
                    const isEdited = editedValues[policy.key] !== undefined;

                    return (
                      <div
                        key={policy.key}
                        className={`p-3 rounded-lg border transition-all ${
                          isEdited
                            ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
                            : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-white">
                                {isRtl ? policy.titleAr : policy.titleEn}
                              </span>
                              {policy.category === 'org' && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                  {isRtl ? 'المؤسسة' : 'ORG'}
                                </span>
                              )}
                              {isEdited && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                  {isRtl ? 'متعديل' : 'EDITED'}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                              {isRtl ? policy.descAr : policy.descEn}
                            </p>
                          </div>

                          <div className="shrink-0 w-48">
                            {policy.type === 'boolean' ? (
                              <button
                                onClick={() => setPolicyValue(policy, !value)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  value
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 border border-slate-200 dark:border-zinc-700'
                                }`}
                              >
                                {value ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                {value ? (isRtl ? 'مفعّل' : 'Enabled') : (isRtl ? 'معطّل' : 'Disabled')}
                              </button>
                            ) : policy.type === 'select' ? (
                              <select
                                value={value || ''}
                                onChange={(e) => setPolicyValue(policy, e.target.value)}
                                className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-1.5 px-2 text-xs text-slate-800 dark:text-white focus:border-emerald-500 outline-none"
                              >
                                {policy.options?.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {isRtl ? opt.labelAr : opt.labelEn}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={value ?? ''}
                                  onChange={(e) => setPolicyValue(policy, Number(e.target.value))}
                                  min={policy.min}
                                  max={policy.max}
                                  className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg py-1.5 px-2 text-xs text-slate-800 dark:text-white font-mono focus:border-emerald-500 outline-none"
                                />
                                {policy.unit && (
                                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{policy.unit}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300/80">
            <p className="font-bold mb-1">
              {isRtl ? 'كيف تعمل السياسات التشغيلية؟' : 'How do operational policies work?'}
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>{isRtl ? 'تُفرض تلقائياً على جميع المعاملات المالية والإدارية' : 'Automatically enforced on all financial and administrative transactions'}</li>
              <li>{isRtl ? 'تخزن في قاعدة البيانات وتُقرأ من الخادم عند كل طلب' : 'Stored in the database and read by the server on every request'}</li>
              <li>{isRtl ? 'مدة صلاحية الكاش: 5 دقائق — يُحدث تلقائياً' : 'Cache TTL: 5 minutes — auto-refreshed'}</li>
              <li>{isRtl ? 'يمكن تجاوز السياسات بموافقةanager المستوى 5 فقط' : 'Policy overrides require Level 5 admin approval only'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalPoliciesSettings;
