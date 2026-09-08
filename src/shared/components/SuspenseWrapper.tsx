import React, { Suspense } from 'react';
import { Spinner } from '../../design-system/components/Spinner';

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SuspenseWrapper({ children, fallback }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback || (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" variant="primary" />
      </div>
    )}>
      {children}
    </Suspense>
  );
}
