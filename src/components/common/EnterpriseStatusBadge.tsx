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
import { cn } from '../../design-system/utils/cn';
import { Badge, type BadgeVariant } from '../../design-system/components/Badge';

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

/**
 * Pill-tone mapping (DEBT PAID). `Badge` owns the pill: shape, closed
 * palette, contrast pairing, dot. This map only translates the 50+ domain
 * statuses onto that closed palette — `success/warning/danger/info/neutral`
 * 1:1, `ai` (violet, no `Badge` equivalent) via an override class.
 * Never color alone: icon + text always render (WCAG 1.4.1).
 */
type StatusTone = BadgeVariant | 'ai';

type StatusConfig = {
  tone: StatusTone;
  Icon: React.ElementType;
  defaultAr: string;
  defaultEn: string;
};

const AI_OVERRIDE =
  'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800';

const SIZE: Record<string, 'sm' | 'md'> = { xs: 'sm', sm: 'sm', md: 'md', lg: 'md' };

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
    ACTIVE:      { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'نشط معتمد', defaultEn: 'Active' },
    APPROVED:    { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'معتمد رسمياً', defaultEn: 'Approved' },
    POSTED:      { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'تم الترحيل', defaultEn: 'Posted' },
    QUALIFIED:   { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'مؤهل', defaultEn: 'Qualified' },
    VERIFIED:    { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'موثق ومتحقق', defaultEn: 'Verified' },
    NORMAL:      { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'طبيعي', defaultEn: 'Normal' },
    ON_BUDGET:   { tone: 'success' as const, Icon: CreditCard, defaultAr: 'في حدود الموازنة', defaultEn: 'On Budget' },
    UNDER_BUDGET:{ tone: 'success' as const, Icon: CreditCard, defaultAr: 'دون سقف الموازنة', defaultEn: 'Under Budget' },
    RECONCILED:  { tone: 'success' as const, Icon: FileCheck, defaultAr: 'مُطابق محاسبياً', defaultEn: 'Reconciled' },

    // ── In Progress ─────────────────────────────────────────────────────
    IN_PROGRESS: { tone: 'info' as const, Icon: Sparkles, defaultAr: 'قيد التنفيذ', defaultEn: 'In Progress' },
    EXECUTING:   { tone: 'info' as const, Icon: Sparkles, defaultAr: 'قيد التنفيذ', defaultEn: 'Executing' },
    RUNNING:     { tone: 'info' as const, Icon: Sparkles, defaultAr: 'جارٍ', defaultEn: 'Running' },
    RFQ_OPEN:    { tone: 'info' as const, Icon: BookOpen, defaultAr: 'طلب عروض مفتوح', defaultEn: 'RFQ Open' },
    PO_ISSUED:   { tone: 'info' as const, Icon: FileCheck, defaultAr: 'أمر شراء صادر', defaultEn: 'PO Issued' },
    GRANT_ACTIVE:   { tone: 'info' as const, Icon: Leaf, defaultAr: 'منحة نشطة', defaultEn: 'Grant Active' },
    SPONSOR_ACTIVE: { tone: 'info' as const, Icon: HeartHandshake, defaultAr: 'رعاية فعّالة', defaultEn: 'Sponsor Active' },
    UNLOCKED:    { tone: 'info' as const, Icon: Unlock, defaultAr: 'غير مقفل', defaultEn: 'Unlocked' },

    // ── Pending / Planning ───────────────────────────────────────────────
    PLANNING:     { tone: 'warning' as const, Icon: Clock, defaultAr: 'قيد التخطيط', defaultEn: 'Planning' },
    PENDING:      { tone: 'warning' as const, Icon: Clock, defaultAr: 'قيد الانتظار', defaultEn: 'Pending' },
    UNDER_REVIEW: { tone: 'warning' as const, Icon: Clock, defaultAr: 'قيد المراجعة', defaultEn: 'Under Review' },
    DRAFT:        { tone: 'warning' as const, Icon: Clock, defaultAr: 'مسودة', defaultEn: 'Draft' },
    GRANT_PENDING:  { tone: 'warning' as const, Icon: Clock, defaultAr: 'منحة معلقة', defaultEn: 'Grant Pending' },
    UNRECONCILED:   { tone: 'warning' as const, Icon: RefreshCw, defaultAr: 'غير مطابق بعد', defaultEn: 'Unreconciled' },

    // ── Suspended ────────────────────────────────────────────────────────
    SUSPENDED:   { tone: 'warning' as const, Icon: PauseCircle, defaultAr: 'موقوف مؤقتاً', defaultEn: 'Suspended' },
    ON_HOLD:     { tone: 'warning' as const, Icon: PauseCircle, defaultAr: 'قيد التعليق', defaultEn: 'On Hold' },
    PAUSED:      { tone: 'warning' as const, Icon: PauseCircle, defaultAr: 'متوقف', defaultEn: 'Paused' },

    // ── Completed ────────────────────────────────────────────────────────
    COMPLETED:   { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'مكتمل ومسلّم', defaultEn: 'Completed' },
    DELIVERED:   { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'تم التسليم', defaultEn: 'Delivered' },
    CLOSED:      { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'مغلق', defaultEn: 'Closed' },
    PO_RECEIVED:    { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'تم استلام المشتريات', defaultEn: 'PO Received' },
    RFQ_CLOSED:     { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'طلب عروض مغلق', defaultEn: 'RFQ Closed' },
    GRANT_CLOSED:   { tone: 'success' as const, Icon: CheckCircle2, defaultAr: 'منحة منتهية', defaultEn: 'Grant Closed' },
    SPONSOR_EXPIRED:{ tone: 'neutral' as const, Icon: XCircle, defaultAr: 'رعاية منتهية', defaultEn: 'Sponsor Expired' },

    // ── Rejected / Failed ────────────────────────────────────────────────
    REJECTED:    { tone: 'danger' as const, Icon: XCircle, defaultAr: 'مرفوض', defaultEn: 'Rejected' },
    FAILED:      { tone: 'danger' as const, Icon: XCircle, defaultAr: 'فشل', defaultEn: 'Failed' },
    CANCELLED:   { tone: 'danger' as const, Icon: XCircle, defaultAr: 'ملغى', defaultEn: 'Cancelled' },

    // ── Critical ─────────────────────────────────────────────────────────
    HIGH_RISK:   { tone: 'danger' as const, Icon: ShieldAlert, defaultAr: 'مخاطر مرتفعة', defaultEn: 'High Risk' },
    CRITICAL:    { tone: 'danger' as const, Icon: ShieldAlert, defaultAr: 'حرج', defaultEn: 'Critical' },
    EMERGENCY:   { tone: 'danger' as const, Icon: AlertTriangle, defaultAr: 'طارئ / أزمة', defaultEn: 'Emergency' },
    BUDGET_EXCEEDED: { tone: 'danger' as const, Icon: AlertTriangle, defaultAr: 'تجاوز موازنة', defaultEn: 'Over Budget' },
    LOCKED:      { tone: 'danger' as const, Icon: Lock, defaultAr: 'مقفل (لا يسمح التعديل)', defaultEn: 'Locked' },

    // ── Beneficiary Types ────────────────────────────────────────────────
    INDIVIDUAL:        { tone: 'info' as const,    Icon: User,         defaultAr: 'فرد مستقل',      defaultEn: 'Individual' },
    FAMILY:            { tone: 'success' as const,  Icon: Users,        defaultAr: 'أسرة مستفيدة',   defaultEn: 'Family' },
    COMMUNITY_ENTITY:  { tone: 'warning' as const,  Icon: Building2,    defaultAr: 'مرفق مجتمعي',    defaultEn: 'Community Entity' },
    ORPHAN:            { tone: 'success' as const,  Icon: HeartHandshake, defaultAr: 'كفالة يتيم',  defaultEn: 'Orphan' },

    // ── Volunteer ────────────────────────────────────────────────────────
    VOLUNTEER_ACTIVE:   { tone: 'success' as const, Icon: HeartHandshake, defaultAr: 'متطوع نشط',    defaultEn: 'Volunteer Active' },
    VOLUNTEER_INACTIVE: { tone: 'neutral' as const, Icon: HeartHandshake, defaultAr: 'متطوع غير نشط', defaultEn: 'Volunteer Inactive' },

    // ── AI / Intelligence ────────────────────────────────────────────────
    AI_GENERATED: { tone: 'ai' as const, Icon: Brain,     defaultAr: 'مُنتج بالذكاء الاصطناعي', defaultEn: 'AI Generated' },
    AI_VERIFIED:  { tone: 'ai' as const, Icon: Sparkles,  defaultAr: 'موثق بالذكاء الاصطناعي', defaultEn: 'AI Verified' },
  };

  const config: StatusConfig = STATUS_MAP[normalized] ?? {
    tone: 'neutral' as const,
    Icon: HelpCircle,
    defaultAr: status || 'غير محدد',
    defaultEn:  status || 'Undefined',
  };

  const { tone, Icon, defaultAr, defaultEn } = config;
  const label = isRtl ? (labelAr || defaultAr) : (labelEn || defaultEn);
  const isAi = tone === 'ai';

  return (
    <Badge
      variant={isAi ? 'info' : tone}
      size={SIZE[size] ?? 'sm'}
      dot={showDot && !isAi}
      className={cn(isAi && AI_OVERRIDE, className)}
      title={label}
      aria-label={label}
    >
      {showDot && isAi && (
        <span className="rounded-full shrink-0 w-1.5 h-1.5 bg-violet-500" aria-hidden="true" />
      )}
      <Icon className={cn(SIZE_ICON[size] ?? SIZE_ICON.sm, 'shrink-0')} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Badge>
  );
};

export default EnterpriseStatusBadge;
