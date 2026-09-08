/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Avatar Component v3.0
 * User avatar with initials fallback, online status, group stacking
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { cn } from '../utils/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  nameAr?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  lang?: 'ar' | 'en';
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[9px]', status: 'w-2 h-2 -bottom-0 -end-0' },
  sm: { container: 'w-8 h-8', text: 'text-[10px]', status: 'w-2.5 h-2.5 -bottom-0 -end-0' },
  md: { container: 'w-10 h-10', text: 'text-xs', status: 'w-3 h-3 -bottom-0.5 -end-0.5' },
  lg: { container: 'w-12 h-12', text: 'text-sm', status: 'w-3.5 h-3.5 -bottom-0.5 -end-0.5' },
  xl: { container: 'w-16 h-16', text: 'text-base', status: 'w-4 h-4 -bottom-0.5 -end-0.5' },
  '2xl': { container: 'w-20 h-20', text: 'text-lg', status: 'w-5 h-5 -bottom-0.5 -end-0.5' },
};

const STATUS_COLORS: Record<string, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-zinc-400',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
};

const AVATAR_COLORS = [
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Avatar({
  src,
  alt = '',
  name,
  nameAr,
  size = 'md',
  status,
  showStatus = false,
  lang = 'ar',
  className,
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const sizeConfig = SIZE_CLASSES[size];
  const displayName = lang === 'ar' ? (nameAr || name || '') : (name || '');
  const showImage = src && !imgError;

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt || displayName}
          onError={() => setImgError(true)}
          className={cn(sizeConfig.container, 'rounded-full object-cover ring-2 ring-white dark:ring-zinc-900')}
        />
      ) : (
        <div
          className={cn(
            sizeConfig.container,
            'rounded-full flex items-center justify-center font-semibold ring-2 ring-white dark:ring-zinc-900',
            getColorFromName(displayName || 'U'),
            sizeConfig.text
          )}
          aria-label={displayName}
        >
          {displayName ? getInitials(displayName) : (
            <svg className="w-1/2 h-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          )}
        </div>
      )}
      {showStatus && status && (
        <span className={cn('absolute rounded-full border-2 border-white dark:border-zinc-900', STATUS_COLORS[status], sizeConfig.status)} />
      )}
    </div>
  );
}

// ─── AvatarGroup ──────────────────────────────────────────────

export interface AvatarGroupItem {
  src?: string;
  name?: string;
  nameAr?: string;
}

export interface AvatarGroupProps {
  items: AvatarGroupItem[];
  max?: number;
  size?: AvatarSize;
  lang?: 'ar' | 'en';
  className?: string;
}

export function AvatarGroup({ items, max = 5, size = 'md', lang = 'ar', className }: AvatarGroupProps) {
  const visible = items.slice(0, max);
  const remaining = items.length - max;
  const overlapClasses = '-me-2 rtl:-me-0 rtl:-ml-2';

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((item, i) => (
        <div key={i} className={overlapClasses}>
          <Avatar {...item} size={size} lang={lang} />
        </div>
      ))}
      {remaining > 0 && (
        <div className={overlapClasses}>
          <div className={cn(
            SIZE_CLASSES[size].container,
            'rounded-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium ring-2 ring-white dark:ring-zinc-900',
            SIZE_CLASSES[size].text
          )}>
            +{remaining}
          </div>
        </div>
      )}
    </div>
  );
}
