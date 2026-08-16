// Currency & Number Formatters for NexoraOS™

export function formatCurrency(
  amount: number | string, 
  currency: 'YER' | 'SAR' | 'USD' = 'YER', 
  locale: string = 'ar-YE'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  
  const currencySymbols: Record<string, { ar: string; en: string }> = {
    YER: { ar: 'ر.ي', en: 'YER' },
    SAR: { ar: 'ر.س', en: 'SAR' },
    USD: { ar: '$', en: 'USD' }
  };

  const formattedNum = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);

  const symbol = locale.startsWith('ar') 
    ? currencySymbols[currency]?.ar || currency 
    : currencySymbols[currency]?.en || currency;

  return `${formattedNum} ${symbol}`;
}

export function formatNumber(num: number | string, locale: string = 'ar-YE'): string {
  const parsed = typeof num === 'string' ? parseFloat(num) || 0 : num;
  return new Intl.NumberFormat(locale).format(parsed);
}

export function formatDate(
  dateInput: string | Date | number, 
  locale: string = 'ar-YE', 
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';

  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
}
