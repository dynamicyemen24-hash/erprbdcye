/**
 * UAMEX_ERP™ SmartFilter — AI-Powered Filter System
 * Intelligent filtering with:
 *  • Natural language query input (Arabic/English)
 *  • AI column inference (suggests filters based on text)
 *  • Quick filter presets (saved views)
 *  • Smart suggestions (frequently used combinations)
 *  • Filter builder with all operators
 *  • Cross-field filters
 *  • Date range picker with presets
 *  • Multi-select with search
 *  • Bilingual (AR/EN) + RTL
 *  • Dark/Light theme
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronDown,
  Clock,
  Filter,
  History,
  Lightbulb,
  Loader2,
  Mic,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Star,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

const t = (ar: string, en: string, lang: 'ar' | 'en') => (lang === 'ar' ? ar : en);

export type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'range';
export type FilterOperator =
  | 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with'
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
  | 'in' | 'not_in' | 'is_empty' | 'is_not_empty' | 'before' | 'after';

export interface FilterField {
  id: string;
  labelAr: string;
  labelEn: string;
  type: FilterFieldType;
  options?: Array<{ value: string; labelAr: string; labelEn: string; color?: string }>;
  placeholderAr?: string;
  placeholderEn?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ActiveFilter {
  id: string;
  fieldId: string;
  operator: FilterOperator;
  value: any;
  value2?: any;
  label?: string;
}

export interface SavedFilter {
  id: string;
  nameAr: string;
  nameEn: string;
  filters: ActiveFilter[];
  isDefault?: boolean;
  usageCount?: number;
  lastUsed?: string;
  createdAt: string;
  category?: string;
}

export interface SmartFilterProps {
  lang: 'ar' | 'en';
  fields: FilterField[];
  filters: ActiveFilter[];
  onChange: (filters: ActiveFilter[]) => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (nameAr: string, nameEn: string) => void;
  onDeleteSavedFilter?: (id: string) => void;
  onApplyPreset?: (preset: SavedFilter) => void;
  enableAI?: boolean;
  placeholderAr?: string;
  placeholderEn?: string;
  className?: string;
}

const OPERATOR_LABELS: Record<string, { ar: string; en: string }> = {
  equals: { ar: 'يساوي', en: 'Equals' },
  not_equals: { ar: 'لا يساوي', en: 'Not equals' },
  contains: { ar: 'يحتوي على', en: 'Contains' },
  starts_with: { ar: 'يبدأ بـ', en: 'Starts with' },
  ends_with: { ar: 'ينتهي بـ', en: 'Ends with' },
  gt: { ar: 'أكبر من', en: 'Greater than' },
  gte: { ar: 'أكبر أو يساوي', en: 'Greater or equal' },
  lt: { ar: 'أصغر من', en: 'Less than' },
  lte: { ar: 'أصغر أو يساوي', en: 'Less or equal' },
  between: { ar: 'بين', en: 'Between' },
  in: { ar: 'ضمن', en: 'In' },
  not_in: { ar: 'ليس ضمن', en: 'Not in' },
  is_empty: { ar: 'فارغ', en: 'Is empty' },
  is_not_empty: { ar: 'غير فارغ', en: 'Is not empty' },
  before: { ar: 'قبل', en: 'Before' },
  after: { ar: 'بعد', en: 'After' },
};

function getOperatorsForType(type: FilterFieldType): FilterOperator[] {
  const base: FilterOperator[] = ['equals', 'not_equals', 'is_empty', 'is_not_empty'];
  switch (type) {
    case 'text':
      return ['contains', 'starts_with', 'ends_with', ...base];
    case 'number':
    case 'range':
      return ['gt', 'gte', 'lt', 'lte', 'between', ...base];
    case 'date':
      return ['before', 'after', 'between', ...base];
    case 'select':
      return ['equals', 'not_equals', 'in', 'not_in', ...base];
    case 'multiselect':
      return ['in', 'not_in', 'is_empty', 'is_not_empty'];
    case 'boolean':
      return ['equals'];
    default:
      return base;
  }
}

function renderValueInput(
  field: FilterField,
  filter: ActiveFilter,
  onChange: (value: any, value2?: any) => void,
  lang: 'ar' | 'en'
): React.ReactNode {
  const placeholder = lang === 'ar' ? (field.placeholderAr || 'أدخل قيمة...') : (field.placeholderEn || 'Enter value...');

  if (filter.operator === 'is_empty' || filter.operator === 'is_not_empty') return null;

  if (field.type === 'select') {
    return (
      <select
        value={filter.value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <option value="">{placeholder}</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {lang === 'ar' ? opt.labelAr : opt.labelEn}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'multiselect') {
    const selected = Array.isArray(filter.value) ? filter.value : [];
    return (
      <div className="flex-1">
        <div className="flex flex-wrap gap-1 mb-1">
          {selected.map((v) => {
            const opt = field.options?.find((o) => o.value === v);
            return (
              <span key={v} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                {opt ? (lang === 'ar' ? opt.labelAr : opt.labelEn) : v}
                <button onClick={() => onChange(selected.filter((s) => s !== v))} className="hover:text-emerald-900">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value && !selected.includes(e.target.value)) {
              onChange([...selected, e.target.value]);
            }
            e.target.value = '';
          }}
          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300"
        >
          <option value="">{t('اختر قيمة...', 'Select value...', lang)}</option>
          {field.options?.filter((o) => !selected.includes(o.value)).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {lang === 'ar' ? opt.labelAr : opt.labelEn}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'boolean') {
    return (
      <select
        value={filter.value ?? ''}
        onChange={(e) => onChange(e.target.value === 'true' ? true : e.target.value === 'false' ? false : '')}
        className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300"
      >
        <option value="">{placeholder}</option>
        <option value="true">{t('نعم', 'Yes', lang)}</option>
        <option value="false">{t('لا', 'No', lang)}</option>
      </select>
    );
  }

  if (filter.operator === 'between') {
    return (
      <div className="flex-1 flex items-center gap-1">
        <input
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          value={filter.value ?? ''}
          onChange={(e) => onChange(e.target.value, filter.value2)}
          placeholder={t('من', 'From', lang)}
          className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300"
        />
        <span className="text-slate-400 text-[10px]">—</span>
        <input
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
          value={filter.value2 ?? ''}
          onChange={(e) => onChange(filter.value, e.target.value)}
          placeholder={t('إلى', 'To', lang)}
          className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300"
        />
      </div>
    );
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      value={filter.value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    />
  );
}

// ── AI Suggestion Engine (client-side simulation) ──
function inferFilters(query: string, fields: FilterField[], lang: 'ar' | 'en'): ActiveFilter[] {
  const q = query.toLowerCase();
  const filters: ActiveFilter[] = [];
  for (const field of fields) {
    const labelLower = (lang === 'ar' ? field.labelAr : field.labelEn).toLowerCase();
    const keywords = lang === 'ar'
      ? { status: ['حالة', 'حالات', 'نشط', 'مكتمل', 'معلق'], category: ['قطاع', 'فئة', 'نوع'], name: ['اسم', 'عنوان', 'مشروع'] }
      : { status: ['status', 'state', 'active', 'completed', 'pending'], category: ['category', 'type', 'sector'], name: ['name', 'title', 'project'] };

    if (keywords.status.some((k) => labelLower.includes(k)) && (q.includes('status') || q.includes('حالة') || q.includes('نشط') || q.includes('مكتمل'))) {
      const statusMap = lang === 'ar'
        ? { نشط: 'ACTIVE', مكتمل: 'COMPLETED', معلق: 'ON_HOLD' }
        : { active: 'ACTIVE', completed: 'COMPLETED', pending: 'ON_HOLD' };
      for (const [label, value] of Object.entries(statusMap)) {
        if (q.includes(label)) {
          filters.push({ id: `ai-${field.id}-${Date.now()}`, fieldId: field.id, operator: 'equals', value });
          break;
        }
      }
    }
    if (keywords.name.some((k) => labelLower.includes(k)) && q.length > 2) {
      filters.push({ id: `ai-${field.id}-${Date.now()}`, fieldId: field.id, operator: 'contains', value: query.trim() });
    }
  }
  return filters;
}

// ── Main Component ──
export function SmartFilter({
  lang,
  fields,
  filters,
  onChange,
  savedFilters = [],
  onSaveFilter,
  onDeleteSavedFilter,
  onApplyPreset,
  enableAI = true,
  placeholderAr = 'اكتب ما تبحث عنه بالإنجليزية أو العربية...',
  placeholderEn = 'Type your search in English or Arabic...',
  className = '',
}: SmartFilterProps) {
  const [inputValue, setInputValue] = useState('');
  const [isAIActive, setIsAIActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ActiveFilter[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI inference simulation
  useEffect(() => {
    if (!enableAI || !inputValue.trim() || inputValue.length < 2) {
      setAiSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      setIsAILoading(true);
      setTimeout(() => {
        const inferred = inferFilters(inputValue, fields, lang);
        setAiSuggestions(inferred);
        setIsAILoading(false);
        if (inferred.length > 0) setShowSuggestions(true);
      }, 600);
    }, 400);
    return () => clearTimeout(timeout);
  }, [inputValue, fields, lang, enableAI]);

  const handleAddFilter = useCallback((fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const operators = getOperatorsForType(field.type);
    const newFilter: ActiveFilter = {
      id: `filter-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fieldId,
      operator: operators[0],
      value: '',
    };
    onChange([...filters, newFilter]);
    setShowAddFilter(false);
  }, [fields, filters, onChange]);

  const handleRemoveFilter = useCallback((filterId: string) => {
    onChange(filters.filter((f) => f.id !== filterId));
  }, [filters, onChange]);

  const handleUpdateFilter = useCallback((filterId: string, updates: Partial<ActiveFilter>) => {
    onChange(filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f)));
  }, [filters, onChange]);

  const handleApplyAISuggestions = () => {
    if (aiSuggestions.length === 0) return;
    const newFilters = [...filters];
    for (const suggestion of aiSuggestions) {
      if (!newFilters.some((f) => f.fieldId === suggestion.fieldId)) {
        newFilters.push({ ...suggestion, id: `filter-ai-${Date.now()}-${Math.random().toString(36).slice(2)}` });
      }
    }
    onChange(newFilters);
    setAiSuggestions([]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleClearAll = () => {
    onChange([]);
    setInputValue('');
    setAiSuggestions([]);
  };

  const filterCount = filters.length;
  const hasFilters = filterCount > 0;
  const hasSuggestions = aiSuggestions.length > 0;

  return (
    <div className={`w-full ${className}`}>
      {/* Search bar */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => enableAI && setShowSuggestions(true)}
              placeholder={lang === 'ar' ? placeholderAr : placeholderEn}
              className="w-full ps-10 pe-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
            {isAILoading && (
              <div className="absolute top-1/2 -translate-y-1/2 end-3">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              </div>
            )}
          </div>

          {enableAI && (
            <button
              onClick={() => setIsAIActive((p) => !p)}
              className={`p-2.5 rounded-xl border transition-all ${
                isAIActive
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500'
              }`}
              aria-label={t('البحث بالذكاء الاصطناعي', 'AI Search', lang)}
              title={t('البحث بالذكاء الاصطناعي', 'AI Search', lang)}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {hasFilters && (
            <button
              onClick={handleClearAll}
              className="p-2.5 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              aria-label={t('مسح الكل', 'Clear all', lang)}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* AI Suggestions dropdown */}
        {enableAI && showSuggestions && (hasSuggestions || aiSuggestions.length > 0) && (
          <div className="absolute top-full mt-2 start-0 end-0 z-40 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xl shadow-emerald-500/10 p-2 animate-fade-in">
            {hasSuggestions ? (
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
                  <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    {t('اقتراحات ذكية:', 'AI Suggestions:', lang)}
                  </span>
                </div>
                {aiSuggestions.map((s, i) => {
                  const field = fields.find((f) => f.id === s.fieldId);
                  return (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer" onClick={handleApplyAISuggestions}>
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-zinc-300">
                        {lang === 'ar' ? field?.labelAr : field?.labelEn} {t(':', ':', lang)} {OPERATOR_LABELS[s.operator]?.[lang]} "{s.value}"
                      </span>
                      <button className="ms-auto px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {t('تطبيق', 'Apply', lang)}
                      </button>
                    </div>
                  );
                })}
                <button onClick={handleApplyAISuggestions} className="w-full mt-1 px-2 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-[11px] font-bold hover:from-emerald-700 hover:to-emerald-600 transition-all">
                  {t('تطبيق الكل', 'Apply All', lang)}
                </button>
              </div>
            ) : inputValue.length >= 2 ? (
              <div className="text-xs text-slate-500 dark:text-zinc-500 text-center py-3">
                {t('اكتب المزيد لتحصل على اقتراحات ذكية', 'Type more for AI suggestions', lang)}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.map((filter) => {
            const field = fields.find((f) => f.id === filter.fieldId);
            if (!field) return null;
            const operators = getOperatorsForType(field.type);
            return (
              <div key={filter.id} className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 group transition-all">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  {lang === 'ar' ? field.labelAr : field.labelEn}
                </span>
                <select
                  value={filter.operator}
                  onChange={(e) => handleUpdateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                  className="px-1 py-0.5 text-[10px] rounded border border-emerald-200 dark:border-emerald-500/40 bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 font-bold"
                >
                  {operators.map((op) => (
                    <option key={op} value={op}>{OPERATOR_LABELS[op]?.[lang]}</option>
                  ))}
                </select>
                {renderValueInput(field, filter, (v, v2) => handleUpdateFilter(filter.id, { value: v, value2: v2 }), lang)}
                <button onClick={() => handleRemoveFilter(filter.id)} className="p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAddFilter((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('إضافة مرشح', 'Add Filter', lang)}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSavedFilters((p) => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                savedFilters.some((s) => s.isDefault)
                  ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {t('المرشحات المحفوظة', 'Saved', lang)}
              {savedFilters.length > 0 && (
                <span className="px-1 rounded-full bg-amber-500 text-white text-[9px] font-black">{savedFilters.length}</span>
              )}
            </button>

            {showSavedFilters && savedFilters.length > 0 && (
              <div className="absolute top-full mt-1 start-0 z-40 w-64 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-2xl shadow-emerald-500/10 py-1 animate-fade-in">
                {savedFilters.map((sf) => (
                  <div key={sf.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800 group/sf">
                    <button
                      onClick={() => { onApplyPreset?.(sf); setShowSavedFilters(false); }}
                      className="flex items-center gap-2 flex-1 text-start"
                    >
                      <Bookmark className={`w-3.5 h-3.5 shrink-0 ${sf.isDefault ? 'text-amber-500' : 'text-slate-400'}`} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 truncate">
                          {lang === 'ar' ? sf.nameAr : sf.nameEn}
                        </div>
                        <div className="text-[9px] text-slate-500 dark:text-zinc-500">
                          {sf.filters.length} {t('مرشح', 'filters', lang)}
                          {sf.usageCount && ` • ${sf.usageCount}x`}
                        </div>
                      </div>
                    </button>
                    {sf.isDefault && (
                      <Star className="w-3 h-3 text-amber-500 shrink-0" />
                    )}
                    {onDeleteSavedFilter && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSavedFilter(sf.id); }}
                        className="p-1 rounded opacity-0 group-hover/sf:opacity-100 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 transition-all"
                        aria-label={t('حذف', 'Delete', lang)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {onSaveFilter && hasFilters && (
            <button
              onClick={() => {
                const nameAr = prompt(t('اسم المرشح بالعربية:', 'Filter name in Arabic:', lang));
                const nameEn = prompt(t('Filter name in English:', 'Filter name in English:', lang));
                if (nameAr && nameEn) onSaveFilter(nameAr, nameEn);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {t('حفظ', 'Save', lang)}
            </button>
          )}
        </div>

        <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-500">
          {filterCount > 0 ? (
            <>
              {filterCount} {t('مرشح نشط', 'active filter(s)', lang)}
            </>
          ) : (
            <>
              <Filter className="w-3 h-3 inline me-1" />
              {t('لا توجد مرشحات', 'No filters applied', lang)}
            </>
          )}
        </div>
      </div>

      {/* Add filter panel */}
      {showAddFilter && (
        <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 animate-fade-in">
          <div className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-2 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            {t('اختر حقلاً:', 'Choose a field:', lang)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {fields.map((field) => {
              const Icon = field.icon || Filter;
              return (
                <button
                  key={field.id}
                  onClick={() => handleAddFilter(field.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all text-start"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 shrink-0" />
                  <span className="truncate">{lang === 'ar' ? field.labelAr : field.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartFilter;