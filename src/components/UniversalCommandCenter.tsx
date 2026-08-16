import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Command, 
  Search, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  Users, 
  Briefcase, 
  Layers, 
  Heart, 
  Coins, 
  Settings, 
  Database, 
  FileText, 
  ShieldCheck, 
  Globe, 
  Compass, 
  Moon, 
  Sun, 
  RefreshCw, 
  Download, 
  Sliders, 
  Mic, 
  MicOff, 
  Sparkles, 
  Zap, 
  CornerDownLeft, 
  Keyboard,
  FileCheck
} from 'lucide-react';

import { Project, User as UserType, TabId } from '../types';
import { triggerHaptic } from '../helpers/hapticSwipe';

interface UniversalCommandCenterProps {
  lang: 'ar' | 'en';
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabId) => void;
  projects?: Project[];
  beneficiaries?: any[];
  users?: UserType[];
  density?: 'compact' | 'comfortable' | 'spacious';
  setDensity?: (density: 'compact' | 'comfortable' | 'spacious') => void;
  theme?: 'light' | 'dark' | 'system';
  setTheme?: (theme: 'light' | 'dark' | 'system') => void;
  setLang?: (fn: (prev: 'ar' | 'en') => 'ar' | 'en') => void;
  onRefreshData?: () => void;
  onOpenShortcutsModal?: () => void;
}

type CategoryType = 'ALL' | 'NAVIGATION' | 'RECORDS' | 'ACTIONS' | 'SETTINGS' | 'TOOLS';

export const UniversalCommandCenter: React.FC<UniversalCommandCenterProps> = ({
  lang,
  isOpen,
  onClose,
  onNavigate,
  projects = [],
  beneficiaries = [],
  users = [],
  density = 'comfortable',
  setDensity,
  theme = 'dark',
  setTheme,
  setLang,
  onRefreshData,
  onOpenShortcutsModal
}) => {
  if (!isOpen) return null;
  const isRtl = lang === 'ar';

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Voice Search Handler
  const toggleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isRtl ? 'خاصية التعرف الصوتي غير مدعومة في متصفحك الحالي' : 'Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isRtl ? 'ar-SA' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  // Base System Navigation Items
  const navCommands = useMemo(() => [
    { id: 'nav-dashboard', category: 'NAVIGATION', titleAr: 'اللوحة القيادية الاستراتيجية والأداء', titleEn: 'Strategy & Performance Dashboard', icon: Sparkles, action: () => onNavigate('dashboard') },
    { id: 'nav-programs', category: 'NAVIGATION', titleAr: 'إدارة البرامج التنموية', titleEn: 'Program Management', icon: Layers, action: () => onNavigate('programs') },
    { id: 'nav-projects', category: 'NAVIGATION', titleAr: 'إدارة المشاريع الميدانية', titleEn: 'Project Management', icon: Briefcase, action: () => onNavigate('projects') },
    { id: 'nav-activities', category: 'NAVIGATION', titleAr: 'الأنشطة والمهام الميدانية', titleEn: 'Field Operations & Activities', icon: Compass, action: () => onNavigate('activities') },
    { id: 'nav-geospatial', category: 'NAVIGATION', titleAr: 'خريطة الأثر الجغرافي والمواقع', titleEn: 'Geospatial Field Map', icon: Globe, action: () => onNavigate('geospatial') },
    { id: 'nav-beneficiaries', category: 'NAVIGATION', titleAr: 'سجل المستفيدين والخدمات', titleEn: 'Beneficiaries Registry', icon: Users, action: () => onNavigate('beneficiaries') },
    { id: 'nav-sponsorships', category: 'NAVIGATION', titleAr: 'كفالات الأيتام والرعاية الاجتماعية', titleEn: 'Orphan Care & Sponsorships', icon: Heart, action: () => onNavigate('sponsorships') },
    { id: 'nav-contracts', category: 'NAVIGATION', titleAr: 'إدارة العقود والمشتريات والشراكات', titleEn: 'Contracts, Procurement & Partnerships', icon: FileCheck, action: () => onNavigate('contracts' as any) },
    { id: 'nav-finance', category: 'NAVIGATION', titleAr: 'النظام المالي ودفتر الأستاذ', titleEn: 'Financial Ledger & Accounts', icon: Coins, action: () => onNavigate('finance') },
    { id: 'nav-reports', category: 'NAVIGATION', titleAr: 'مؤشرات الأثر والتقارير الشاملة', titleEn: 'Impact & Reports', icon: FileText, action: () => onNavigate('reports') },
    { id: 'nav-settings', category: 'NAVIGATION', titleAr: 'إعدادات المؤسسة والنظام', titleEn: 'System Settings', icon: Settings, action: () => onNavigate('settings') },
  ], [onNavigate]);

  // System Action Commands
  const actionCommands = useMemo(() => [
    {
      id: 'act-density-compact',
      category: 'ACTIONS',
      titleAr: 'تغيير كثافة الواجهة: مدمج (Compact Density)',
      titleEn: 'Set Layout Density: Compact',
      icon: Sliders,
      action: () => { setDensity?.('compact'); onClose(); }
    },
    {
      id: 'act-density-comfortable',
      category: 'ACTIONS',
      titleAr: 'تغيير كثافة الواجهة: مريح (Comfortable Density)',
      titleEn: 'Set Layout Density: Comfortable',
      icon: Sliders,
      action: () => { setDensity?.('comfortable'); onClose(); }
    },
    {
      id: 'act-density-spacious',
      category: 'ACTIONS',
      titleAr: 'تغيير كثافة الواجهة: واسع (Spacious Density)',
      titleEn: 'Set Layout Density: Spacious',
      icon: Sliders,
      action: () => { setDensity?.('spacious'); onClose(); }
    },
    {
      id: 'act-toggle-lang',
      category: 'ACTIONS',
      titleAr: 'التبديل بين العربية والإنجليزية',
      titleEn: 'Toggle Language (AR/EN)',
      icon: Globe,
      action: () => { setLang?.(l => l === 'ar' ? 'en' : 'ar'); onClose(); }
    },
    {
      id: 'act-toggle-theme',
      category: 'ACTIONS',
      titleAr: 'التبديل بين الوضع الداكن والنهاري',
      titleEn: 'Toggle Theme (Dark/Light)',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => { setTheme?.(theme === 'dark' ? 'light' : 'dark'); onClose(); }
    },
    {
      id: 'act-refresh-data',
      category: 'ACTIONS',
      titleAr: 'تحديث كافة بيانات الخادم والـCache',
      titleEn: 'Refresh Live Server & Cache Data',
      icon: RefreshCw,
      action: () => { onRefreshData?.(); onClose(); }
    },
    {
      id: 'act-keyboard-shortcuts',
      category: 'TOOLS',
      titleAr: 'عرض دليل اختصارات لوحة التحكم',
      titleEn: 'View Keyboard Shortcuts Reference',
      icon: Keyboard,
      action: () => { onClose(); onOpenShortcutsModal?.(); }
    }
  ], [setDensity, setLang, setTheme, theme, onRefreshData, onOpenShortcutsModal, onClose]);

  // Records Commands (Projects, Beneficiaries, Users)
  const recordCommands = useMemo(() => {
    const pCmds = projects.map(p => ({
      id: `proj-${p.id}`,
      category: 'RECORDS',
      titleAr: `مشروع: ${p.name_ar} [${p.code}]`,
      titleEn: `Project: ${p.name_en || p.name_ar} [${p.code}]`,
      icon: Briefcase,
      action: () => { onNavigate('projects'); onClose(); }
    }));

    const bCmds = beneficiaries.slice(0, 15).map((b, idx) => ({
      id: `benef-${b.id || idx}`,
      category: 'RECORDS',
      titleAr: `مستفيد: ${b.full_name || b.name_ar || b.name} [${b.file_number || b.id}]`,
      titleEn: `Beneficiary: ${b.full_name || b.name_en || b.name} [${b.file_number || b.id}]`,
      icon: Users,
      action: () => { onNavigate('beneficiaries'); onClose(); }
    }));

    return [...pCmds, ...bCmds];
  }, [projects, beneficiaries, onNavigate, onClose]);

  // Combined & Filtered Commands List
  const allCommands = useMemo(() => {
    const combined = [...navCommands, ...actionCommands, ...recordCommands];

    return combined.filter(item => {
      const matchCategory = activeCategory === 'ALL' || item.category === activeCategory;
      const q = query.toLowerCase().trim();
      if (!q) return matchCategory;

      const matchText = item.titleAr.toLowerCase().includes(q) || item.titleEn.toLowerCase().includes(q);
      return matchCategory && matchText;
    });
  }, [navCommands, actionCommands, recordCommands, activeCategory, query]);

  // Keyboard Arrow Key Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allCommands.length) % Math.max(1, allCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allCommands[selectedIndex]) {
        triggerHaptic('success');
        allCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col relative"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3 bg-slate-50/50 dark:bg-zinc-950/50">
          <Command className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder={isRtl ? 'ابحث عن أي شاشة، مشروع، مستفيد، أو أمر تنفيذي (Ctrl + K)...' : 'Type a command, search project, screen, beneficiary (Ctrl + K)...'}
            className="w-full bg-transparent border-none text-sm font-bold text-slate-900 dark:text-white focus:outline-none placeholder-zinc-400"
          />

          {/* Voice Search Button */}
          <button
            onClick={toggleVoiceSearch}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={isRtl ? 'البحث الصوتي الذكي' : 'Voice Command Search'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar bg-white dark:bg-zinc-900 text-xs font-bold">
          {[
            { id: 'ALL', ar: 'الكل', en: 'All' },
            { id: 'NAVIGATION', ar: 'الشاشات', en: 'Navigation' },
            { id: 'RECORDS', ar: 'السجلات', en: 'Records' },
            { id: 'ACTIONS', ar: 'الإجراءات', en: 'Actions' },
            { id: 'TOOLS', ar: 'الأدوات', en: 'Tools' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveCategory(cat.id as CategoryType);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              {isRtl ? cat.ar : cat.en}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-2 space-y-1">
          {allCommands.length > 0 ? (
            allCommands.map((item, idx) => {
              const IconComp = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    triggerHaptic('success');
                    item.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="truncate">{isRtl ? item.titleAr : item.titleEn}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                {isRtl ? 'لم يتم العثور على أي نتائج مطابقة للبحث' : 'No matching commands or records found'}
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border rounded text-[9px] font-mono font-bold">↑↓</kbd>
              <span>{isRtl ? 'للتنقل' : 'Navigate'}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border rounded text-[9px] font-mono font-bold">↵</kbd>
              <span>{isRtl ? 'للاختيار' : 'Select'}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border rounded text-[9px] font-mono font-bold">Esc</kbd>
              <span>{isRtl ? 'للإغلاق' : 'Close'}</span>
            </span>
          </div>

          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            NexoraOS Command Hub
          </span>
        </div>
      </div>
    </div>
  );
};

export default UniversalCommandCenter;
