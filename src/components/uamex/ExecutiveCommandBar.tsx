// ═══════════════════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Executive Command Bar
// Global search, AI Copilot, command palette (Cmd+K)
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search, Sparkles, Zap, X, ChevronRight, CornerDownLeft,
  Hash, AtSign, FileText, Users, Briefcase, Heart, DollarSign,
  Activity, Shield, Database, ArrowUp, ArrowDown, Command,
  Mic, Image, Filter, Clock, Star, TrendingUp, Lightbulb,
  Cpu, BarChart3, PieChart, Layers, Box
} from 'lucide-react';
import { Badge } from '../../shared/components';

type Lang = 'ar' | 'en';
type Theme = 'light' | 'dark';

export interface CommandItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'navigation' | 'action' | 'document' | 'person' | 'ai';
  shortcut?: string;
  badge?: string;
  onSelect: () => void;
}

export interface ExecutiveCommandBarProps {
  lang: Lang;
  theme: Theme;
  items: CommandItem[];
  onAiPrompt?: (prompt: string) => Promise<string>;
  recentItems?: CommandItem[];
  placeholder?: string;
  onToggleLang?: () => void;
  onToggleTheme?: () => void;
}

export const ExecutiveCommandBar: React.FC<ExecutiveCommandBarProps> = ({
  lang,
  theme,
  items,
  onAiPrompt,
  recentItems = [],
  placeholder,
  onToggleLang,
  onToggleTheme,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [aiMode, setAiMode] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // Open with Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setActiveIndex(0);
      setAiMode(false);
      setAiResponse('');
    }
  }, [open]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(item =>
      item.titleEn.toLowerCase().includes(q) ||
      item.titleAr.includes(query) ||
      item.descriptionEn?.toLowerCase().includes(q) ||
      item.descriptionAr?.includes(query)
    );
  }, [query, items]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filteredItems[activeIndex]) {
        e.preventDefault();
        filteredItems[activeIndex].onSelect();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filteredItems, activeIndex]);

  const handleAiPrompt = useCallback(async () => {
    if (!query || !onAiPrompt) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      const response = await onAiPrompt(query);
      setAiResponse(response);
    } catch (e) {
      setAiResponse(t('حدث خطأ في المعالجة', 'An error occurred'));
    } finally {
      setAiLoading(false);
    }
  }, [query, onAiPrompt, t, lang]);

  // Voice recording simulation
  const toggleRecording = () => {
    setRecording(!recording);
    if (!recording) {
      setTimeout(() => {
        setQuery(t('كم عدد المشاريع النشطة؟', 'How many active projects?'));
        setRecording(false);
      }, 1500);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-transparent hover:border-emerald-500 transition-all group"
        aria-label={t('فتح لوحة الأوامر', 'Open command palette')}
      >
        <Search className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400">
          {placeholder || t('بحث ذكي...', 'Smart search...')}
        </span>
        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-[9px] font-black text-slate-500 dark:text-zinc-500">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Command palette */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-brand-reveal">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
              {aiMode ? (
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              ) : (
                <Search className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              )}

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={aiMode
                  ? t('اسأل المساعد الذكي...', 'Ask the AI assistant...')
                  : t('ابحث عن أي شيء...', 'Search anything...')
                }
                className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />

              {/* Voice */}
              <button
                onClick={toggleRecording}
                className={`p-1.5 rounded-lg transition-colors ${
                  recording
                    ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 animate-pulse'
                    : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500'
                }`}
                aria-label="Voice search"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>

              {/* AI mode toggle */}
              {onAiPrompt && (
                <button
                  onClick={() => setAiMode(!aiMode)}
                  className={`px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1 transition-colors ${
                    aiMode
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  AI
                </button>
              )}

              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AI response area */}
            {aiMode && query && (
              <div className="px-4 py-3 bg-gradient-to-br from-amber-50 to-emerald-50 dark:from-amber-950/20 dark:to-emerald-950/20 border-b border-amber-200 dark:border-amber-900">
                {aiLoading ? (
                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-bold">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    {t('المعالج الذكي يفكر...', 'AI is thinking...')}
                  </div>
                ) : aiResponse ? (
                  <div className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-600" />
                      <span className="font-black text-amber-700 dark:text-amber-300">{t('المعالج الذكي', 'AI Assistant')}</span>
                    </div>
                    {aiResponse}
                  </div>
                ) : (
                  <button
                    onClick={handleAiPrompt}
                    className="text-xs font-black text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    {t('اضغط Enter للسؤال', 'Press Enter to ask')}
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            <div ref={listRef} className="max-h-96 overflow-y-auto">
              {!aiMode && filteredItems.length === 0 && recentItems.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/50">
                    <Clock className="w-3 h-3" />
                    {t('حديثاً', 'Recent')}
                  </div>
                  {recentItems.slice(0, 5).map((item, i) => (
                    <CommandRow key={item.id} item={item} active={i === activeIndex} lang={lang} onClick={() => { item.onSelect(); setOpen(false); }} />
                  ))}
                </div>
              )}

              {!aiMode && filteredItems.length > 0 && (
                <div>
                  {query && (
                    <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/50">
                      <Search className="w-3 h-3" />
                      {t('النتائج', 'Results')} ({filteredItems.length})
                    </div>
                  )}
                  {filteredItems.map((item, i) => (
                    <CommandRow
                      key={item.id}
                      item={item}
                      active={i === activeIndex}
                      lang={lang}
                      onClick={() => { item.onSelect(); setOpen(false); }}
                    />
                  ))}
                </div>
              )}

              {!aiMode && filteredItems.length === 0 && recentItems.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
                  <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold">
                    {t('لا توجد نتائج', 'No results found')}
                  </p>
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-zinc-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"><ArrowUp className="w-2.5 h-2.5 inline" /></kbd>
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"><ArrowDown className="w-2.5 h-2.5 inline" /></kbd>
                {t('للتنقل', 'to navigate')}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"><CornerDownLeft className="w-2.5 h-2.5 inline" /></kbd>
                {t('للتحديد', 'to select')}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">esc</kbd>
                {t('للإغلاق', 'to close')}
              </span>
              <div className="ms-auto flex items-center gap-1.5">
                <Badge variant="primary" size="xs" lang={lang}>
                  <Sparkles className="w-2.5 h-2.5" />
                  UAMEX AI
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const CommandRow: React.FC<{
  item: CommandItem;
  active: boolean;
  lang: Lang;
  onClick: () => void;
}> = ({ item, active, lang, onClick }) => {
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
        active ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        active
          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md'
          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
      }`}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 text-start min-w-0">
        <div className="text-xs font-black text-slate-900 dark:text-white truncate">
          {t(item.titleAr, item.titleEn)}
        </div>
        {(item.descriptionAr || item.descriptionEn) && (
          <div className="text-[10px] text-slate-500 dark:text-zinc-500 truncate font-bold">
            {t(item.descriptionAr || '', item.descriptionEn || '')}
          </div>
        )}
      </div>

      {item.shortcut && (
        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[9px] font-black text-slate-500">
          {item.shortcut}
        </kbd>
      )}

      {item.badge && (
        <Badge variant="primary" size="xs" lang={lang}>{item.badge}</Badge>
      )}

      {active && <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />}
    </button>
  );
};

export default ExecutiveCommandBar;
