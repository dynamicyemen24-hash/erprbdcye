/**
 * UAMEX ERP™ – Collapsible vertical navigation sidebar.
 * Keys correspond to route IDs used by `onNavigate` in the workspace.
 */
import React from 'react';
import { cn } from '../utils/cn';
import {
  Briefcase,
  FolderKanban,
  DollarSign,
  BarChart,
  Users,
  HeartHandshake,
  Settings,
  LogOut,
} from 'lucide-react';

type NavEntry =
  | { key: string; label: string; labelAr: string; icon: React.ComponentType<{ className?: string }> }
  | { divider: true };

const navItems: NavEntry[] = [
  { key: 'programs', label: 'البرامج', labelAr: 'برامج', icon: Briefcase },
  { key: 'projects', label: 'المشاريع', labelAr: 'مشروعات', icon: FolderKanban },
  { key: 'finance', label: 'المالية', labelAr: 'المالية', icon: DollarSign },
  { key: 'reports', label: 'التقارير', labelAr: 'تقارير', icon: BarChart },
  { key: 'beneficiaries', label: 'المستفيدون', labelAr: 'المستفيدون', icon: Users },
  { key: 'sponsorships', label: 'الكفالات', labelAr: 'الكفالات', icon: HeartHandshake },
  { key: 'settings', label: 'الإعدادات', labelAr: 'إعدادات', icon: Settings },
  { divider: true },
  { key: 'logout', label: 'تسجيل الخروج', labelAr: 'تسجيل الخروج', icon: LogOut },
];

export interface SidebarProps {
  /** Controlled open/close state */
  isOpen: boolean;
  onToggle: () => void;
  /** Currently selected key – the sidebar will highlight it */
  selectedKey: string;
  onSelect: (key: string) => void;
  /** Optional className for the outer container */
  className?: string;
}

export function Sidebar({
  isOpen,
  onToggle,
  selectedKey,
  onSelect,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed start-0 top-0 h-screen w-72 bg-zinc-900/95 border-e border-zinc-800/60 flex flex-col overflow-y-auto z-drawer',
        !isOpen && 'w-16', // minimal mode – icons only
        className
      )}
      aria-label="القائمة الرئيسية"
    >
      <div className="flex h-14 items-center justify-center border-b border-zinc-800/60 px-3">
        <span className="text-zinc-200 font-bold text-lg">
          {isOpen ? 'UAMEX ERP' : ''}
        </span>
      </div>

      {isOpen && (
        <nav className="flex flex-col space-y-1 px-2 py-2">
          {navItems.map((item, i) => {
            if ('divider' in item) return <hr key={`div-${i}`} className="h-px border-t border-zinc-700/30 my-2" />;
            const isSelected = item.key === selectedKey;
            const ItemIcon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-600 transition-colors',
                  isSelected && 'bg-emerald-600 dark:bg-emerald-400 text-white'
                )}
                aria-current={isSelected ? 'page' : undefined}
                title={item.labelAr}
                role="menuitem"
              >
                <ItemIcon className="w-4 h-4 me-2" aria-hidden="true" />
                <span className="hidden sm:block">{isOpen ? item.label : item.labelAr}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Minimal mode – just the UAMEX logo that toggles the panel */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="flex-1 self-center text-zinc-400 hover:text-zinc-200 p-2"
          aria-label="فتح القائمة"
        >
          <span className="absolute start-1/2 -translate-x-1/2 rtl:translate-x-1/2 text-2xl">🟦</span>
        </button>
      )}
    </aside>
  );
}