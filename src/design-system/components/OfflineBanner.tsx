/**
 * UAMEX ERP™ – Offline banner
 * Shown when the device has no network.
 */
import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';

export interface OfflineBannerProps {
  /** Called when the user clicks “Resume online” */
  onResume?: () => void;
  /** Optional title */
  title?: string;
  /** Optional children (CTA button etc.) */
  children?: React.ReactNode;
  className?: string;
}

/** Default title + CTA */
const defaultTitle = 'أنت خارج الخطّ – Working Offline';
const defaultCTA = 'استئناف العمل';

export function OfflineBanner({ onResume, title = defaultTitle, children, className }: OfflineBannerProps) {
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handler = () => setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, []);

  if (online) return null; // hide when back online

  return (
    <div
      className={cn(
        'fixed bottom-0 inset-x-0 z-critical p-4 bg-zinc-900/90 text-zinc-100 text-sm font-medium',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span>{title}</span>
        {children || (
          <button
            onClick={onResume}
            className="underline text-zinc-300 hover:text-zinc-200"
            aria-label="استئناف العمل online"
          >
            {defaultCTA}
          </button>
        )}
      </div>
    </div>
  );
}