/**
 * UAMEX ERP™ — Enterprise Status Badge 4.0
 *
 * Accessible, semantic status indicator that always pairs:
 * — Color + Lucide icon + localized text (never color alone, WCAG 1.4.1)
 *
 * Supports full UAMEX domain status vocabulary for NEB-01 through NEB-15.
 * Extended with AI, GRANT, VOLUNTEER, IPSAS, WBS statuses in v4.0.
 */

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PauseCircle,
  ShieldAlert,
  User,
  Users,
  Building2,
  HeartHandshake,
  Sparkles,
  HelpCircle,
  Brain,
  CreditCard,
  Leaf,
  Lock,
  Unlock,
  FileCheck,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { enterpriseTokens } from '../../core/theme/enterpriseDesignTokens';

export type EnterpriseStatusType =
  // Project / Activity lifecycle
  | 'ACTIVE' | 'IN_PROGRESS' | 'EXECUTING' | 'RUNNING'
  | 'PLANNING' | 'PENDING' | 'UNDER_REVIEW' | 'DRAFT'
  | 'COMPLETED' | 'DELIVERED' | 'CLOSED'
  | 'SUSPENDED' | 'ON_HOLD' | 'PAUSED'
  | 'REJECTED' | 'FAILED' | 'CANCELLED'
  | 'HIGH_RISK' | 'CRITICAL' | 'EMERGENCY'
  | 'APPROVED' | 'POSTED' | 'QUALIFIED' | 'VERIFIED' | 'NORMAL'
  // Beneficiary types
  | 'INDIVIDUAL' | 'FAMILY' | 'COMMUNITY_ENTITY' | 'ORPHAN'
  // Finance / IPSAS
  | 'LOCKED' | 'UNLOCKED' | 'RECONCILED' | 'UNRECONCILED'
  | 'BUDGET_EXCEEDED' | 'ON_BUDGET' | 'UNDER_BUDGET'
  // Funding & Grants
  | 'GRANT_ACTIVE' | 'GRANT_CLOSED' | 'GRANT_PENDING'
  | 'SPONSOR_ACTIVE' | 'SPONSOR_EXPIRED'
  // Volunteer / Community
  | 'VOLUNTEER_ACTIVE' | 'VOLUNTEER_INACTIVE'
  // AI / Intelligence
  | 'AI_GENERATED' | 'AI_VERIFIED'
  // Procurement
  | 'RFQ_OPEN' | 'RFQ_CLOSED' | 'PO_ISSUED' | 'PO_RECEIVED'
  | string;

export interface EnterpriseStatusBadgeProps {
  status: EnterpriseStatusType;
  labelAr?: string;
  labelEn?: string;
  lang?: 'ar' | 'en';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

type StatusConfig = {
  theme: typeof enterpriseTokens.status.success;
  Icon: React.ElementType;
  defaultAr: string;
  defaultEn: string;
};

const SIZE_BADGE: Record<string, string> = {
  xs: 'text-[10px] px-2 py-0.5 gap-1',
  sm: 'text-[11px] px-2.5 py-0.5 gap-1.5 font-bold',
  md: 'text-[11px] px-2.5 py-1 gap-1.5 font-bold',
  lg: 'text-xs px-3 py-1.5 gap-2 font-bold',
};

const SIZE_ICON: Record<string, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export const EnterpriseStatusBadge: React.FC<EnterpriseStatusBadgeProps> = ({
  status,
  labelAr,
  labelEn,
  lang = 'ar',
  size = 'sm',
  showDot = false,
  className = ''
}) => {
  const normalized = (status || '').toUpperCase().trim();
  const isRtl = lang === 'ar';

  const STATUS_MAP: Record<string, StatusConfig> = {
    // ── Active / Operational ────────────────────────────────────────────
    ACTIVE:      { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'نشط معتمد', defaultEn: 'Active' },
    APPROVED:    { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'معتمد رسمياً', defaultEn: 'Approved' },
    POSTED:      { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'تم الترحيل', defaultEn: 'Posted' },
    QUALIFIED:   { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'مؤهل', defaultEn: 'Qualified' },
    VERIFIED:    { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'موثق ومتحقق', defaultEn: 'Verified' },
    NORMAL:      { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'طبيعي', defaultEn: 'Normal' },
    ON_BUDGET:   { theme: enterpriseTokens.status.success, Icon: CreditCard, defaultAr: 'في حدود الموازنة', defaultEn: 'On Budget' },
    UNDER_BUDGET:{ theme: enterpriseTokens.status.success, Icon: CreditCard, defaultAr: 'دون سقف الموازنة', defaultEn: 'Under Budget' },
    RECONCILED:  { theme: enterpriseTokens.status.success, Icon: FileCheck, defaultAr: 'مُطابق محاسبياً', defaultEn: 'Reconciled' },

    // ── In Progress ─────────────────────────────────────────────────────
    IN_PROGRESS: { theme: enterpriseTokens.status.info, Icon: Sparkles, defaultAr: 'قيد التنفيذ', defaultEn: 'In Progress' },
    EXECUTING:   { theme: enterpriseTokens.status.info, Icon: Sparkles, defaultAr: 'قيد التنفيذ', defaultEn: 'Executing' },
    RUNNING:     { theme: enterpriseTokens.status.info, Icon: Sparkles, defaultAr: 'جارٍ', defaultEn: 'Running' },
    RFQ_OPEN:    { theme: enterpriseTokens.status.info, Icon: BookOpen, defaultAr: 'طلب عروض مفتوح', defaultEn: 'RFQ Open' },
    PO_ISSUED:   { theme: enterpriseTokens.status.info, Icon: FileCheck, defaultAr: 'أمر شراء صادر', defaultEn: 'PO Issued' },
    GRANT_ACTIVE:   { theme: enterpriseTokens.status.info, Icon: Leaf, defaultAr: 'منحة نشطة', defaultEn: 'Grant Active' },
    SPONSOR_ACTIVE: { theme: enterpriseTokens.status.info, Icon: HeartHandshake, defaultAr: 'رعاية فعّالة', defaultEn: 'Sponsor Active' },
    UNLOCKED:    { theme: enterpriseTokens.status.info, Icon: Unlock, defaultAr: 'غير مقفل', defaultEn: 'Unlocked' },

    // ── Pending / Planning ───────────────────────────────────────────────
    PLANNING:     { theme: enterpriseTokens.status.warning, Icon: Clock, defaultAr: 'قيد التخطيط', defaultEn: 'Planning' },
    PENDING:      { theme: enterpriseTokens.status.warning, Icon: Clock, defaultAr: 'قيد الانتظار', defaultEn: 'Pending' },
    UNDER_REVIEW: { theme: enterpriseTokens.status.warning, Icon: Clock, defaultAr: 'قيد المراجعة', defaultEn: 'Under Review' },
    DRAFT:        { theme: enterpriseTokens.status.warning, Icon: Clock, defaultAr: 'مسودة', defaultEn: 'Draft' },
    GRANT_PENDING:  { theme: enterpriseTokens.status.warning, Icon: Clock, defaultAr: 'منحة معلقة', defaultEn: 'Grant Pending' },
    UNRECONCILED:   { theme: enterpriseTokens.status.warning, Icon: RefreshCw, defaultAr: 'غير مطابق بعد', defaultEn: 'Unreconciled' },

    // ── Suspended ────────────────────────────────────────────────────────
    SUSPENDED:   { theme: enterpriseTokens.status.warning, Icon: PauseCircle, defaultAr: 'موقوف مؤقتاً', defaultEn: 'Suspended' },
    ON_HOLD:     { theme: enterpriseTokens.status.warning, Icon: PauseCircle, defaultAr: 'قيد التعليق', defaultEn: 'On Hold' },
    PAUSED:      { theme: enterpriseTokens.status.warning, Icon: PauseCircle, defaultAr: 'متوقف', defaultEn: 'Paused' },

    // ── Completed ────────────────────────────────────────────────────────
    COMPLETED:   { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'مكتمل ومسلّم', defaultEn: 'Completed' },
    DELIVERED:   { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'تم التسليم', defaultEn: 'Delivered' },
    CLOSED:      { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'مغلق', defaultEn: 'Closed' },
    PO_RECEIVED:    { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'تم استلام المشتريات', defaultEn: 'PO Received' },
    RFQ_CLOSED:     { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'طلب عروض مغلق', defaultEn: 'RFQ Closed' },
    GRANT_CLOSED:   { theme: enterpriseTokens.status.success, Icon: CheckCircle2, defaultAr: 'منحة منتهية', defaultEn: 'Grant Closed' },
    SPONSOR_EXPIRED:{ theme: enterpriseTokens.status.neutral, Icon: XCircle, defaultAr: 'رعاية منتهية', defaultEn: 'Sponsor Expired' },

    // ── Rejected / Failed ────────────────────────────────────────────────
    REJECTED:    { theme: enterpriseTokens.status.danger, Icon: XCircle, defaultAr: 'مرفوض', defaultEn: 'Rejected' },
    FAILED:      { theme: enterpriseTokens.status.danger, Icon: XCircle, defaultAr: 'فشل', defaultEn: 'Failed' },
    CANCELLED:   { theme: enterpriseTokens.status.danger, Icon: XCircle, defaultAr: 'ملغى', defaultEn: 'Cancelled' },

    // ── Critical ─────────────────────────────────────────────────────────
    HIGH_RISK:   { theme: enterpriseTokens.status.danger, Icon: ShieldAlert, defaultAr: 'مخاطر مرتفعة', defaultEn: 'High Risk' },
    CRITICAL:    { theme: enterpriseTokens.status.danger, Icon: ShieldAlert, defaultAr: 'حرج', defaultEn: 'Critical' },
    EMERGENCY:   { theme: enterpriseTokens.status.danger, Icon: AlertTriangle, defaultAr: 'طارئ / أزمة', defaultEn: 'Emergency' },
    BUDGET_EXCEEDED: { theme: enterpriseTokens.status.danger, Icon: AlertTriangle, defaultAr: 'تجاوز موازنة', defaultEn: 'Over Budget' },
    LOCKED:      { theme: enterpriseTokens.status.danger, Icon: Lock, defaultAr: 'مقفل (لا يسمح التعديل)', defaultEn: 'Locked' },

    // ── Beneficiary Types ────────────────────────────────────────────────
    INDIVIDUAL:        { theme: enterpriseTokens.status.info,    Icon: User,         defaultAr: 'فرد مستقل',      defaultEn: 'Individual' },
    FAMILY:            { theme: enterpriseTokens.status.success,  Icon: Users,        defaultAr: 'أسرة مستفيدة',   defaultEn: 'Family' },
    COMMUNITY_ENTITY:  { theme: enterpriseTokens.status.warning,  Icon: Building2,    defaultAr: 'مرفق مجتمعي',    defaultEn: 'Community Entity' },
    ORPHAN:            { theme: enterpriseTokens.status.success,  Icon: HeartHandshake, defaultAr: 'كفالة يتيم',  defaultEn: 'Orphan' },

    // ── Volunteer ────────────────────────────────────────────────────────
    VOLUNTEER_ACTIVE:   { theme: enterpriseTokens.status.success, Icon: HeartHandshake, defaultAr: 'متطوع نشط',    defaultEn: 'Volunteer Active' },
    VOLUNTEER_INACTIVE: { theme: enterpriseTokens.status.neutral, Icon: HeartHandshake, defaultAr: 'متطوع غير نشط', defaultEn: 'Volunteer Inactive' },

    // ── AI / Intelligence ────────────────────────────────────────────────
    AI_GENERATED: { theme: enterpriseTokens.status.ai, Icon: Brain,     defaultAr: 'مُنتج بالذكاء الاصطناعي', defaultEn: 'AI Generated' },
    AI_VERIFIED:  { theme: enterpriseTokens.status.ai, Icon: Sparkles,  defaultAr: 'موثق بالذكاء الاصطناعي', defaultEn: 'AI Verified' },
  };

  const config: StatusConfig = STATUS_MAP[normalized] ?? {
    theme: enterpriseTokens.status.neutral,
    Icon: HelpCircle,
    defaultAr: status || 'غير محدد',
    defaultEn:  status || 'Undefined',
  };

  const { theme, Icon, defaultAr, defaultEn } = config;
  const label = isRtl ? (labelAr || defaultAr) : (labelEn || defaultEn);

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs select-none ${theme.bg} ${theme.border} ${theme.text} ${SIZE_BADGE[size] ?? SIZE_BADGE.sm} ${className}`}
      title={label}
      aria-label={label}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} aria-hidden="true" />
      )}
      <Icon className={`${SIZE_ICON[size] ?? SIZE_ICON.sm} ${theme.iconClass} shrink-0`} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
};

export default EnterpriseStatusBadge;
