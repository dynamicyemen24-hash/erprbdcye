/**
 * UAMEX ERP™ — Localization Provider & i18n Infrastructure
 * Adapted from NICYE design-system localization/ with NexoraOS conventions
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useTheme } from '../theme/ThemeContext';

export type Locale = 'ar' | 'en';

export interface LocalizationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isRtl: boolean;
  dir: 'ltr' | 'rtl';
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

// ─── Translation dictionaries ───────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  ar: {
    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.loading': 'جاري التحميل...',
    'common.noData': 'لا توجد بيانات',
    'common.confirm': 'تأكيد',
    'common.close': 'إغلاق',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.submit': 'إرسال',
    'common.reset': 'إعادة تعيين',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.import': 'استيراد',
    'common.print': 'طباعة',
    'common.refresh': 'تحديث',
    'common.retry': 'إعادة المحاولة',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.ok': 'موافق',
    'common.error': 'خطأ',
    'common.success': 'نجاح',
    'common.warning': 'تحذير',
    'common.info': 'معلومات',
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.changePassword': 'تغيير كلمة المرور',
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.settings': 'الإعدادات',
    'nav.profile': 'الملف الشخصي',
    // Forms
    'form.required': 'هذا الحقل مطلوب',
    'form.invalidEmail': 'البريد الإلكتروني غير صالح',
    'form.passwordMismatch': 'كلمتا المرور غير متطابقتين',
    // Time
    'time.today': 'اليوم',
    'time.yesterday': 'أمس',
    'time.ago': 'منذ {value}',
    // Pagination
    'pagination.showing': 'عرض {from}-{to} من {total}',
    'pagination.next': 'التالي',
    'pagination.previous': 'السابق',
    // Empty states
    'empty.title': 'لا توجد بيانات',
    'empty.description': 'لم يتم العثور على أي نتائج',
    'empty.action': 'إضافة عنصر جديد',
  },
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.noData': 'No data',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.reset': 'Reset',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.print': 'Print',
    'common.refresh': 'Refresh',
    'common.retry': 'Retry',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Info',
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.changePassword': 'Change Password',
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    // Forms
    'form.required': 'This field is required',
    'form.invalidEmail': 'Invalid email',
    'form.passwordMismatch': 'Passwords do not match',
    // Time
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.ago': '{value} ago',
    // Pagination
    'pagination.showing': 'Showing {from}-{to} of {total}',
    'pagination.next': 'Next',
    'pagination.previous': 'Previous',
    // Empty states
    'empty.title': 'No data',
    'empty.description': 'No results found',
    'empty.action': 'Add new item',
  },
};

export interface LocalizationProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}

const STORAGE_KEY = 'nexora-locale';

function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') return stored;
  } catch {}
  return 'ar';
}

export function LocalizationProvider({ children, defaultLocale, locale: controlledLocale, onLocaleChange }: LocalizationProviderProps) {
  const [internalLocale, setInternalLocale] = React.useState<Locale>(() => defaultLocale ?? getStoredLocale());
  const isControlled = controlledLocale !== undefined;
  const locale = isControlled ? controlledLocale : internalLocale;

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (!isControlled) {
        setInternalLocale(newLocale);
        try { localStorage.setItem(STORAGE_KEY, newLocale); } catch {}
      }
      onLocaleChange?.(newLocale);
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;
    },
    [isControlled, onLocaleChange]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = translations[locale][key] || translations.en[key] || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return value;
    },
    [locale]
  );

  const value = useMemo<LocalizationContextValue>(
    () => ({ locale, setLocale, isRtl: locale === 'ar', dir: locale === 'ar' ? 'rtl' : 'ltr', t }),
    [locale, setLocale, t]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization(): LocalizationContextValue {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error('useLocalization must be used within a LocalizationProvider');
  return ctx;
}

/** Convenience shorthand for useLocalization().t */
export function useTranslation() {
  return useLocalization().t;
}
