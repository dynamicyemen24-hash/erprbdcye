import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Check, Sparkles, ChevronDown, CornerDownLeft, X } from 'lucide-react';
import { rankAutocompleteSuggestions, AutocompleteSuggestion, AutocompleteContext } from '../../core/services/smartAutocomplete';
import { triggerHaptic } from '../../helpers/hapticSwipe';

interface SmartAutocompleteInputProps<T> {
  lang: 'ar' | 'en';
  placeholder?: string;
  items: T[];
  extractors: {
    getId: (item: T) => string;
    getLabelAr: (item: T) => string;
    getLabelEn: (item: T) => string;
    getSubLabelAr?: (item: T) => string;
    getSubLabelEn?: (item: T) => string;
    getCategory?: (item: T) => string;
    getProjectId?: (item: T) => string | undefined;
    getGovernorate?: (item: T) => string | undefined;
  };
  context?: AutocompleteContext;
  value?: string;
  onSelect: (item: T, suggestion: AutocompleteSuggestion<T>) => void;
  className?: string;
}

export function SmartAutocompleteInput<T extends Record<string, any>>({
  lang,
  placeholder,
  items,
  extractors,
  context = {},
  value = '',
  onSelect,
  className = ''
}: SmartAutocompleteInputProps<T>) {
  const isRtl = lang === 'ar';
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const suggestions = useMemo(() => {
    return rankAutocompleteSuggestions(query, items, extractors, context, 6);
  }, [query, items, extractors, context]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, suggestions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % Math.max(1, suggestions.length));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions[selectedIndex]) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        triggerHaptic('light');
        setQuery(isRtl ? selected.labelAr : selected.labelEn);
        onSelect(selected.data, selected);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || (isRtl ? 'اكتب للبحث أو اختر من الاقتراحات الذكية...' : 'Type to search or select smart suggestion...')}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />

        <div className="absolute left-3 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-1.5 space-y-1 animate-in fade-in duration-100">
          <div className="px-2 py-1 text-[10px] font-black text-zinc-400 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 mb-1">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3 h-3" />
              <span>{isRtl ? 'اقتراحات ذكية بحسب السياق' : 'Context-Aware Suggestions'}</span>
            </span>
            <span className="font-mono text-[9px]">Tab / Enter</span>
          </div>

          {suggestions.map((sug, idx) => {
            const isSelected = idx === selectedIndex;

            return (
              <div
                key={sug.id}
                onClick={() => {
                  triggerHaptic('light');
                  setQuery(isRtl ? sug.labelAr : sug.labelEn);
                  onSelect(sug.data, sug);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 border border-transparent'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{isRtl ? sug.labelAr : sug.labelEn}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold">
                      {sug.category}
                    </span>
                  </div>

                  {(sug.subLabelAr || sug.reasonAr) && (
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5 truncate">
                      {sug.subLabelAr && <span className="font-mono">{isRtl ? sug.subLabelAr : sug.subLabelEn}</span>}
                      {sug.subLabelAr && <span>•</span>}
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate">
                        {isRtl ? sug.reasonAr : sug.reasonEn}
                      </span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {isSelected && <CornerDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SmartAutocompleteInput;
