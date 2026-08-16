import React from 'react';
import { ShieldAlert } from 'lucide-react';

type Role = 'executive' | 'manager' | 'field';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  currentRole: Role;
  lang?: 'ar' | 'en';
  fallback?: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  allowedRoles,
  currentRole,
  lang = 'ar',
  fallback
}) => {
  if (allowedRoles.includes(currentRole)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/50 text-center animate-fade-in">
      <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center text-rose-500 mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-black text-rose-900 dark:text-rose-100 mb-2">
        {lang === 'ar' ? 'صلاحيات غير كافية' : 'Insufficient Permissions'}
      </h3>
      <p className="text-sm font-medium text-rose-600/80 dark:text-rose-300/80 max-w-sm">
        {lang === 'ar' 
          ? 'عذراً، مستوى الصلاحية الحالي لا يتيح لك الوصول إلى هذه الوحدة التشغيلية.' 
          : 'Sorry, your current access level does not permit viewing this operational module.'}
      </p>
    </div>
  );
};
