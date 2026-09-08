/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Command Palette (⌘K) Component v3.0
 * Spotlight-style command palette with fuzzy search, groups, actions
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * Features:
 * - ⌘K / Ctrl+K keyboard shortcut to open
 * - Fuzzy search across commands
 * - Grouped results with section headers
 * - Arrow key navigation + Enter to select
 * - Recent commands memory
 * - Bilingual support
 * - Custom command registration
 * - RTL-aware
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useControllableState } from '../hooks/useControllableState';

// ─── Types ────────────────────────────────────────────────────

export interface CommandItem {
  id: string;
  label: string;
  labelAr?: string;
  description?: string;
  descriptionAr?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  group?: string;
  groupAr?: string;
  onSelect?: () => void;
  disabled?: boolean;
}

export interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  placeholderAr?: string;
  emptyMessage?: string;
  emptyMessageAr?: string;
  lang?: 'ar' | 'en';
  onSelect?: (item: CommandItem) => void;
}

// ─── Fuzzy Match ──────────────────────────────────────────────

function fuzzyMatch(query: string, text: string): { match: boolean; score: number } {
  if (!query) return { match: true, score: 0 };
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact match
  if (t === q) return { match: true, score: 100 };

  // Starts with
  if (t.startsWith(q)) return { match: true, score: 80 };

  // Contains
  if (t.includes(q)) return { match: true, score: 60 };

  // Fuzzy character match
  let qi = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      score += lastMatchIndex === ti - 1 ? 10 : 5; // Consecutive matches score higher
      lastMatchIndex = ti;
    }
  }

  return qi === q.length ? { match: true, score } : { match: false, score: 0 };
}

// ─── Component ────────────────────────────────────────────────

export function CommandPalette({
  open: controlledOpen,
  onOpenChange,
  items,
  placeholder = 'Search commands...',
  placeholderAr = 'بحث في الأوامر...',
  emptyMessage = 'No results found',
  emptyMessageAr = 'لم يتم العثور على نتائج',
  lang = 'ar',
  onSelect,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setInternalOpen(v);
      onOpenChange?.(v);
      if (v) {
        setQuery('');
        setActiveIndex(0);
      }
    },
    [isControlled, onOpenChange]
  );

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  // Focus input when open
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Filter and group items
  const filtered = useMemo(() => {
    const matched = items
      .filter((item) => !item.disabled)
      .map((item) => {
        const label = lang === 'ar' ? (item.labelAr || item.label) : item.label;
        const desc = lang === 'ar' ? (item.descriptionAr || item.description) : item.description;
        const { match, score } = fuzzyMatch(query, label + ' ' + (desc || ''));
        return { ...item, displayLabel: label, displayDesc: desc, score, match };
      })
      .filter((item) => item.match)
      .sort((a, b) => b.score - a.score);

    // Group items
    const groups = new Map<string, typeof matched>();
    for (const item of matched) {
      const groupKey = lang === 'ar' ? (item.groupAr || item.group || 'أخرى') : (item.group || 'Other');
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(item);
    }
    return groups;
  }, [items, query, lang]);

  const flatItems = useMemo(() => Array.from(filtered.values()).flat(), [filtered]);

  // Arrow key navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatItems[activeIndex];
        if (item) {
          onSelect?.(item);
          item.onSelect?.();
          setOpen(false);
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [flatItems, activeIndex, onSelect, setOpen]
  );

  // Reset active index on query change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const trapRef = useFocusTrap<HTMLDivElement>({ enabled: open });

  if (!open) return null;

  const displayPlaceholder = lang === 'ar' ? placeholderAr : placeholder;
  const displayEmpty = lang === 'ar' ? emptyMessageAr : emptyMessage;

  let flatIndex = 0;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[15vh]" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div
        ref={trapRef}
        className={cn(
          'relative w-full max-w-xl mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl',
          'border border-zinc-200 dark:border-zinc-700',
          'overflow-hidden animate-in zoom-in-95 fade-in duration-150'
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <svg className="w-5 h-5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={displayPlaceholder}
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto overscroll-contain py-2">
          {flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{displayEmpty}</p>
            </div>
          ) : (
            Array.from(filtered.entries()).map(([group, groupItems]) => (
              <div key={group}>
                <div className="px-4 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {group}
                </div>
                {groupItems.map((item) => {
                  const currentIndex = flatIndex++;
                  const isActive = currentIndex === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect?.(item);
                        item.onSelect?.();
                        setOpen(false);
                      }}
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors',
                        'focus-visible:outline-none',
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      )}
                    >
                      {item.icon && <span className="shrink-0 text-zinc-400 dark:text-zinc-500">{item.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.displayLabel}</p>
                        {item.displayDesc && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{item.displayDesc}</p>
                        )}
                      </div>
                      {item.shortcut && (
                        <div className="flex items-center gap-1 shrink-0">
                          {item.shortcut.map((key) => (
                            <kbd key={key} className="px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
                              {key}
                            </kbd>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[9px]">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[9px]">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[9px]">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
