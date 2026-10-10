/**
 * UAMEX ERP™ – Footer
 */
import React from 'react';
import { cn } from '../utils/cn';
import { OfflineBanner } from './OfflineBanner';

export interface FooterProps {
  /** Shown when the user is offline */
  showOffline?: boolean;
  onResume?: () => void;
  className?: string;
}

/** Simple footer with version and quick‑links */
export function Footer({ showOffline = false, onResume, className }: FooterProps) {
  return (
    <footer
      className={cn(
        'fixed bottom-0 inset-x-0 z-sticky bg-zinc-900/95 border-t border-zinc-800/60 p-4 text-sm text-zinc-400',
        className
      )}
      aria-label=" Fußzeile"
    >
      <div className="flex flex-col sm:flex-row justify-between align-items-center">
        <span>
          {/* Version – you can pull from package.json if you wish */}
          UAMEX ERP v1.0.0
        </span>
        <nav className="hidden sm:block">
          <a href="/programs" className="me-4 hover:underline text-zinc-300">
            برامج
          </a>
          <a href="/finance" className="me-4 hover:underline text-zinc-300">
            المالية
          </a>
          <a href="/settings" className="hover:underline text-zinc-300">إعدادات</a>
        </nav>
        {/* Offline banner – appears only when `showOffline` is true */}
        {showOffline && <OfflineBanner onResume={onResume} />}
      </div>
    </footer>
  );
}