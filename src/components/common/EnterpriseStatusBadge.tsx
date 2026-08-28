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
  HelpCircle
} from 'lucide-react';
import { enterpriseTokens } from '../../core/theme/enterpriseDesignTokens';

export type EnterpriseStatusType = 
  | 'ACTIVE' 
  | 'IN_PROGRESS' 
  | 'PLANNING' 
  | 'COMPLETED' 
  | 'SUSPENDED' 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'HIGH_RISK' 
  | 'CRITICAL' 
  | 'NORMAL' 
  | 'INDIVIDUAL' 
  | 'FAMILY' 
  | 'COMMUNITY_ENTITY'
  | 'ORPHAN'
  | string;

interface EnterpriseStatusBadgeProps {
  status: EnterpriseStatusType;
  labelAr?: string;
  labelEn?: string;
  lang?: 'ar' | 'en';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const EnterpriseStatusBadge: React.FC<EnterpriseStatusBadgeProps> = ({
  status,
  labelAr,
  labelEn,
  lang = 'ar',
  size = 'sm',
  className = ''
}) => {
  const normalized = (status || '').toUpperCase().trim();
  const isRtl = lang === 'ar';

  let config = {
    theme: enterpriseTokens.status.neutral,
    Icon: HelpCircle,
    defaultAr: status || 'غير محدد',
    defaultEn: status || 'Undefined',
  };

  switch (normalized) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'POSTED':
    case 'QUALIFIED':
    case 'VERIFIED':
      config = {
        theme: enterpriseTokens.status.success,
        Icon: CheckCircle2,
        defaultAr: 'نشط معتمد',
        defaultEn: 'Active',
      };
      break;

    case 'IN_PROGRESS':
    case 'EXECUTING':
    case 'RUNNING':
      config = {
        theme: enterpriseTokens.status.info,
        Icon: Sparkles,
        defaultAr: 'قيد التنفيذ',
        defaultEn: 'In Progress',
      };
      break;

    case 'PLANNING':
    case 'PENDING':
    case 'UNDER_REVIEW':
    case 'DRAFT':
      config = {
        theme: enterpriseTokens.status.warning,
        Icon: Clock,
        defaultAr: 'قيد التجهيز والمراجعة',
        defaultEn: 'Pending / Planning',
      };
      break;

    case 'COMPLETED':
    case 'DELIVERED':
    case 'CLOSED':
      config = {
        theme: enterpriseTokens.status.success,
        Icon: CheckCircle2,
        defaultAr: 'مكتمل ومسلّم',
        defaultEn: 'Completed',
      };
      break;

    case 'SUSPENDED':
    case 'ON_HOLD':
    case 'PAUSED':
      config = {
        theme: enterpriseTokens.status.warning,
        Icon: PauseCircle,
        defaultAr: 'موقوف مؤقتاً',
        defaultEn: 'Suspended',
      };
      break;

    case 'REJECTED':
    case 'FAILED':
    case 'CANCELLED':
      config = {
        theme: enterpriseTokens.status.danger,
        Icon: XCircle,
        defaultAr: 'مرفوض / ملغى',
        defaultEn: 'Rejected',
      };
      break;

    case 'HIGH_RISK':
    case 'CRITICAL':
    case 'EMERGENCY':
      config = {
        theme: enterpriseTokens.status.danger,
        Icon: ShieldAlert,
        defaultAr: 'حرج / طارئ',
        defaultEn: 'Critical Risk',
      };
      break;

    case 'INDIVIDUAL':
      config = {
        theme: enterpriseTokens.status.info,
        Icon: User,
        defaultAr: 'فرد مستقل',
        defaultEn: 'Individual',
      };
      break;

    case 'FAMILY':
      config = {
        theme: enterpriseTokens.status.success,
        Icon: Users,
        defaultAr: 'أسرة مستفيدة',
        defaultEn: 'Family',
      };
      break;

    case 'COMMUNITY_ENTITY':
      config = {
        theme: enterpriseTokens.status.warning,
        Icon: Building2,
        defaultAr: 'مرفق مجتمعي عام',
        defaultEn: 'Community Entity',
      };
      break;

    case 'ORPHAN':
      config = {
        theme: enterpriseTokens.status.success,
        Icon: HeartHandshake,
        defaultAr: 'كفالة يتيم',
        defaultEn: 'Orphan',
      };
      break;

    default:
      config = {
        theme: enterpriseTokens.status.neutral,
        Icon: HelpCircle,
        defaultAr: status,
        defaultEn: status,
      };
      break;
  }

  const { theme, Icon, defaultAr, defaultEn } = config;
  const label = isRtl ? (labelAr || defaultAr) : (labelEn || defaultEn);

  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-2 py-0.5 gap-1' 
    : size === 'lg' 
    ? 'text-xs px-3 py-1 gap-1.5 font-bold' 
    : 'text-[11px] px-2.5 py-0.5 gap-1.5 font-bold';

  const iconSize = size === 'xs' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <span 
      className={`inline-flex items-center rounded-full border shadow-2xs font-semibold select-none ${theme.bg} ${theme.border} ${theme.text} ${sizeClasses} ${className}`}
      title={label}
    >
      <Icon className={`${iconSize} ${theme.iconClass} shrink-0`} />
      <span className="truncate">{label}</span>
    </span>
  );
};

export default EnterpriseStatusBadge;
