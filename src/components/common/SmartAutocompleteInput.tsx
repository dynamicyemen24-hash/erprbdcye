import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { normalizeArabicText } from '../../core/utils/dataIntegrityEngine';

interface SmartAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  isRtl?: boolean;
  badgeText?: string;
  onSelectOption?: (val: string) => void;
}

export default function SmartAutocompleteInput({
  value,
  onChange,
  options,
  placeholder = 'اختر أو اكتب...',
  label,
  required = false,
  disabled = false,
  className = '',
  isRtl = true,
  badgeText,
  onSelectOption
}: SmartAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options with Arabic normalization
  const filteredOptions = useMemo(() => {
    const query = normalizeArabicText(value);
    if (!query) return options.slice(0, 15);

    const matches = options.filter(opt => {
      const norm = normalizeArabicText(opt);
      return norm.includes(query);
    });

    return matches.slice(0, 20);
  }, [options, value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter' && isOpen && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = filteredOptions[highlightedIndex];
      if (selected) {
        onChange(selected);
        if (onSelectOption) onSelectOption(selected);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectOption = (opt: string) => {
    onChange(opt);
    if (onSelectOption) onSelectOption(opt);
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div ref={containerRef} className={`relative space-y-1 ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-zinc-400">
          <label>
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {badgeText && (
            <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              {badgeText}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={value}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full py-2 px-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all ${
            isRtl ? 'pl-8' : 'pr-8'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 ${isRtl ? 'left-2.5' : 'right-2.5'}`}>
          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(true);
              }}
              className="p-0.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && !disabled && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 animate-in fade-in duration-100">
          {filteredOptions.map((opt, idx) => {
            const isSelected = opt === value;
            const isHighlighted = idx === highlightedIndex;

            return (
              <div
                key={idx}
                onMouseDown={() => selectOption(opt)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-3 py-2 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black'
                    : isHighlighted
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <span>{opt}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
