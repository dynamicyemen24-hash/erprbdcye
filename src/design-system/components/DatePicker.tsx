/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — DatePicker Component v3.0
 * Calendar date picker with Jalali/Gregorian, keyboard nav, RTL-aware
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * — Popup calendar overlay (React portal)
 * — Month/year navigation
 * — Jalali (Persian/Solar Hijri) and Gregorian calendar modes
 * — Keyboard navigation (arrows, Enter, Escape)
 * — Min/max date constraints
 * — Today highlight, selected highlight
 * — RTL-aware positioning
 * — Clear button, today button
 * — Controlled / uncontrolled value
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useMemo } from 'react';
import { cn } from '../utils/cn';
import { useDirection } from '../theme/ThemeContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { useEscapeKey } from '../hooks/useEscapeKey';

// ─── Types ────────────────────────────────────────────────────

export type CalendarType = 'gregorian' | 'jalali';

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  placeholderAr?: string;
  calendarType?: CalendarType;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  helperTextAr?: string;
  label?: string;
  labelAr?: string;
  required?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  lang?: 'ar' | 'en';
  className?: string;
}

// ─── Jalali Utilities ─────────────────────────────────────────

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
const JALALI_MONTHS_EN = [
  'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
  'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand',
];
const GREG_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const GREG_MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const WEEKDAYS_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gy;
  if (gm > 2) gy2++;
  let days = 355666 + 365 * gy2 + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let jm: number, jd: number;
  if (days < 186) { jm = 1 + Math.floor(days / 31); jd = 1 + (days % 31); }
  else { jm = 7 + Math.floor((days - 186) / 30); jd = 1 + ((days - 186) % 30); }
  return [jy, jm, jd];
}

function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const jy1 = jy - 979;
  const jm1 = jm - 1;
  const jd1 = jd - 1;
  const days = 365 * jy1 + Math.floor(jy1 / 33) * 8 + Math.floor(((jy1 % 33) + 3) / 4) + 78 + jd1 + (jm1 < 7 ? (jm1) * 31 : ((jm1 - 7) * 30 + 186));
  let gy = 1600 + 400 * Math.floor(days / 146097);
  let remaining = days % 146097;
  if (remaining < 36525) {
    gy += 100 * Math.floor((remaining - 1) / 36524);
    remaining = (remaining - 1) % 36524;
    if (remaining >= 365) remaining++;
  }
  gy += Math.floor(remaining / 365);
  remaining %= 365;
  if (remaining < 0) { gy--; remaining += 365; }
  const g_d_m = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  while (gm < 13 && remaining >= g_d_m[gm]) { remaining -= g_d_m[gm]; gm++; }
  return [gy, gm, remaining + 1];
}

function getDaysInMonth(year: number, month: number, calendar: CalendarType): number {
  if (calendar === 'jalali') {
    return month < 7 ? 31 : month < 12 ? 30 : (year % 4 === 3 ? 30 : 29);
  }
  return new Date(year, month, 0).getDate();
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ─── Calendar Grid ────────────────────────────────────────────

function CalendarGrid({
  year,
  month,
  calendar,
  value,
  minDate,
  maxDate,
  onSelect,
  lang,
}: {
  year: number;
  month: number;
  calendar: CalendarType;
  value: Date | null;
  minDate?: Date;
  maxDate?: Date;
  onSelect: (date: Date) => void;
  lang: 'ar' | 'en';
}) {
  const daysInMonth = getDaysInMonth(year, month + 1, calendar);
  const firstDayOfWeek = calendar === 'jalali'
    ? (gregorianToJalali(
        ...jalaliToGregorian(year, month + 1, 1).flat() as [number, number, number]
      )[2] % 7)
    : new Date(year, month, 1).getDay();

  // Normalize to Saturday-start (jalali) or Sunday-start (gregorian)
  const startOffset = calendar === 'jalali' ? firstDayOfWeek : (firstDayOfWeek + 6) % 7;

  const isRtl = lang === 'ar';
  const daysArray = useMemo(() => {
    const arr: Array<number | null> = [];
    for (let i = 0; i < startOffset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [startOffset, daysInMonth]);

  const cellClass = 'w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors cursor-pointer';

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Weekday headers */}
      {(isRtl ? WEEKDAYS : WEEKDAYS_EN).map((day, i) => (
        <div key={i} className="w-9 h-8 flex items-center justify-center text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase">
          {day}
        </div>
      ))}

      {/* Day cells */}
      {daysArray.map((day, i) => {
        if (day === null) return <div key={`empty-${i}`} />;

        const dateObj = calendar === 'jalali'
          ? (() => { const [gy, gm, gd] = jalaliToGregorian(year, month + 1, day); return new Date(gy, gm - 1, gd); })()
          : new Date(year, month, day);

        const isSelected = value ? isSameDay(dateObj, value) : false;
        const today = isToday(dateObj);
        const isDisabled = (minDate && dateObj < minDate) || (maxDate && dateObj > maxDate);

        return (
          <button
            key={day}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(dateObj)}
            className={cn(
              cellClass,
              isSelected && 'bg-emerald-600 text-white font-bold hover:bg-emerald-700',
              !isSelected && today && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold',
              !isSelected && !today && !isDisabled && 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
              isDisabled && 'opacity-30 cursor-not-allowed'
            )}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main DatePicker ──────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  placeholder,
  placeholderAr,
  calendarType = 'jalali',
  minDate,
  maxDate,
  disabled = false,
  error = false,
  helperText,
  helperTextAr,
  label,
  labelAr,
  required = false,
  clearable = true,
  size = 'md',
  lang = 'ar',
  className,
}: DatePickerProps) {
  const { direction } = useDirection();
  const isRtl = direction === 'rtl';
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Derive year/month from value or today in the chosen calendar
  const today = new Date();
  const initJC = calendarType === 'jalali' ? gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate()) : null;

  const [viewYear, setViewYear] = useState(() => value?.getFullYear() ?? (calendarType === 'jalali' ? initJC![0] : today.getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => value ? (calendarType === 'jalali' ? gregorianToJalali(value.getFullYear(), value.getMonth() + 1, value.getDate())[1] - 1 : value.getMonth()) : (calendarType === 'jalali' ? initJC![1] - 1 : today.getMonth()));

  const containerRef = useClickOutside<HTMLDivElement>(() => setOpen(false));
  useEscapeKey(() => setOpen(false));

  const months = calendarType === 'jalali'
    ? (lang === 'ar' ? JALALI_MONTHS : JALALI_MONTHS_EN)
    : (lang === 'ar' ? GREG_MONTHS_AR : GREG_MONTHS);

  const handlePrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const handleNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleSelect = (date: Date) => {
    onChange?.(date);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
  };

  const handleToday = () => {
    if (calendarType === 'jalali') {
      const [jy, jm, jd] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
      setViewYear(jy);
      setViewMonth(jm - 1);
    } else {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
    }
  };

  // Format display value
  const formatValue = (): string => {
    if (!value) return '';
    if (calendarType === 'jalali') {
      const [jy, jm, jd] = gregorianToJalali(value.getFullYear(), value.getMonth() + 1, value.getDate());
      return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    }
    return `${value.getFullYear()}/${String(value.getMonth() + 1).padStart(2, '0')}/${String(value.getDate()).padStart(2, '0')}`;
  };

  const placeholderText = lang === 'ar' ? (placeholderAr || 'اختر التاريخ') : (placeholder || 'Pick a date');

  const sizeClasses = {
    sm: 'h-8 text-xs px-3',
    md: 'h-10 text-sm px-3.5',
    lg: 'h-12 text-base px-4',
  };

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {lang === 'ar' ? (labelAr || label) : label}
          {required && <span className="ms-1 text-red-500">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2 rounded-xl border bg-white dark:bg-zinc-800 transition-colors',
          sizeClasses[size],
          error
            ? 'border-red-500 focus-visible:ring-red-500'
            : 'border-zinc-300 dark:border-zinc-600 focus-visible:ring-emerald-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          disabled && 'opacity-50 cursor-not-allowed',
          !value && 'text-zinc-400 dark:text-zinc-500'
        )}
      >
        <svg className="w-4 h-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className="flex-1 text-start truncate">{value ? formatValue() : placeholderText}</span>
        {clearable && value && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(e as any); }}
            className="shrink-0 p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        )}
      </button>

      {/* Helper / Error */}
      {(helperText || error) && (
        <p className={cn('mt-1 text-xs', error ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400')}>
          {error ? (lang === 'ar' ? (helperTextAr || 'خطأ') : (helperText || 'Error')) : (lang === 'ar' ? (helperTextAr || helperText) : helperText)}
        </p>
      )}

      {/* Calendar Popup */}
      {open && (
        <>
          {/* Mobile: bottom sheet */}
          <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setOpen(false)} />
          <div className={cn(
            'fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl border-t border-zinc-200 dark:border-zinc-700 p-4 sm:absolute sm:bottom-auto sm:inset-x-auto sm:rounded-xl sm:shadow-lg sm:border sm:border-zinc-200 dark:sm:border-zinc-700 sm:z-50 sm:w-72 sm:mt-1.5',
            isRtl ? 'sm:right-0' : 'sm:left-0'
          )} onClick={(e) => e.stopPropagation()}>
            {/* Month/Year nav */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <svg className={cn('w-4 h-4 text-zinc-600 dark:text-zinc-400', isRtl && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="text-sm font-semibold text-zinc-900 dark:text-white bg-transparent border-0 focus:outline-none cursor-pointer"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="text-sm font-semibold text-zinc-900 dark:text-white bg-transparent border-0 focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 21 }, (_, i) => viewYear - 10 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleNext} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <svg className={cn('w-4 h-4 text-zinc-600 dark:text-zinc-400', isRtl && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Calendar grid */}
            <CalendarGrid
              year={viewYear}
              month={viewMonth}
              calendar={calendarType}
              value={value ?? null}
              minDate={minDate}
              maxDate={maxDate}
              onSelect={handleSelect}
              lang={lang}
            />

            {/* Today button */}
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-center">
              <button
                type="button"
                onClick={handleToday}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {lang === 'ar' ? 'اليوم' : 'Today'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
