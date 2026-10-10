/**
 * UAMEX ERP™ – TopBar (persistent header)
 */
import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { UpdateBanner } from '../../components/UpdateBanner'; // reusable update-banner component
import {
  Briefcase,
  Search,
  User,
  Bell,
  LogOut,
} from 'lucide-react';

type TopBarProps = {
  brand: string;
  onSearch: (query: string) => void;
  onLogout: () => void;
  showUpdateBanner?: boolean;
};

export function TopBar({ brand, onSearch, onLogout, showUpdateBanner = true }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-sticky bg-zinc-900/95 border-b border-zinc-800/60 h-16 flex items-center justify-between px-6 py-1',
        'shadow-sm'
      )}
      aria-label="شريط العلوي"
    >
      {/* Brand / Logo */}
      <button
        onClick={() => window.location.href = '/'}
        className="flex items-center gap-2"
        aria-label="العودة إلى الصفحة الرئيسية"
      >
        {/* placeholder logo */}
        <svg
          className="w-6 h-6 text-emerald-400"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
        </svg>
        <span className="self-center text-zinc-200 font-bold text-lg">{brand}</span>
      </button>

      {/* Global Search */}
      <div className="flex items-center gap-2 w-64">
        <Search className="w-4 h-4 text-zinc-400" aria-hidden="true" />
        <input
          type="text"
          placeholder={undefined} // will be set per RTL
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch(searchQuery)}
          className="flex-1 rounded-md border border-zinc-700 dark:border-zinc-400 px-3 py-2 text-sm text-zinc-100 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-label={undefined} // will be set per RTL
        />
      </div>

      {/* User / Notifications */}
      <div className="flex items-center gap-3">
        <User
          className="w-6 h-6 text-zinc-400 cursor-pointer"
          aria-label="ملف المستخدم"
        />
        <Bell
          className="w-6 h-6 text-zinc-400"
          aria-label="إشعارات"
        />
        {showUpdateBanner && (
          <UpdateBanner autoCheck={true} onDismiss={() => {}} />
        )}
        <LogOut
          className="w-6 h-6 text-zinc-400 cursor-pointer"
          onClick={onLogout}
          aria-label="تسجيل الخروج"
        />
      </div>
    </header>
  );
}