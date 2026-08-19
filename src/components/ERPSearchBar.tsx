import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Users, 
  Briefcase, 
  UserCheck, 
  ChevronRight, 
  ChevronLeft,
  Command, 
  MapPin, 
  Phone, 
  Mail, 
  TrendingUp, 
  DollarSign,
  Layers,
  Sparkles,
  Award,
  BookOpen,
  Mic,
  MicOff,
  Target,
  PieChart,
  Compass,
  Heart,
  Handshake,
  Coins,
  FileText,
  Database,
  Brain,
  Grid,
  ArrowRight,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { Project, User as UserType } from '../types';
import { fuzzyMatchArabic, normalizeArabicText } from '../core/utils/arabicSearch';

interface ERPSearchBarProps {
  lang: 'ar' | 'en';
  beneficiaries: any[];
  projects: Project[];
  users: UserType[];
  onNavigate: (tab: any) => void;
}

type SearchCategory = 'ALL' | 'BENEFICIARIES' | 'PROJECTS' | 'STAFF' | 'DOMAINS' | 'DOCUMENTS';

export interface DomainShortcut {
  code: string; // NEB-01 to NEB-13
  titleAr: string;
  titleEn: string;
  targetTab: string;
  icon: React.ComponentType<{ className?: string }>;
  prefixEn: string;
  prefixAr: string;
  badgeBg: string;
  badgeText: string;
}

export default function ERPSearchBar({ lang, beneficiaries, projects, users, onNavigate }: ERPSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('ALL');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL'); // 'ALL' or 'NEB-01'..'NEB-13'
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedType, setSelectedType] = useState<'beneficiary' | 'project' | 'user' | 'domain' | 'document' | null>(null);

  // Voice Search Web Speech API state
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Documents fetched from API
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/tables/knowledge_articles')
      .then(res => res.json())
      .then(rows => setDocuments(Array.isArray(rows) ? rows : []))
      .catch(() => setDocuments([]));
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 15 Nexora Enterprise Domains definitions
  const domains: DomainShortcut[] = [
    { code: 'NEB-01', titleAr: 'الاستراتيجية والأداء المؤسسي', titleEn: 'Strategy & Performance', targetTab: 'dashboard', icon: Target, prefixEn: 'strategy', prefixAr: 'استراتيجية', badgeBg: 'bg-emerald-500/10 border-emerald-500/30', badgeText: 'text-emerald-500' },
    { code: 'NEB-02', titleAr: 'إدارة المحافظ والمنح', titleEn: 'Portfolio Management', targetTab: 'programs', icon: PieChart, prefixEn: 'portfolios', prefixAr: 'محافظ', badgeBg: 'bg-indigo-500/10 border-indigo-500/30', badgeText: 'text-indigo-500' },
    { code: 'NEB-03', titleAr: 'إدارة البرامج التنموية', titleEn: 'Program Management', targetTab: 'programs', icon: Layers, prefixEn: 'programs', prefixAr: 'البرامج', badgeBg: 'bg-amber-500/10 border-amber-500/30', badgeText: 'text-amber-500' },
    { code: 'NEB-04', titleAr: 'إدارة المشاريع الميدانية', titleEn: 'Project Management', targetTab: 'projects', icon: Briefcase, prefixEn: 'projects', prefixAr: 'المشاريع', badgeBg: 'bg-blue-500/10 border-blue-500/30', badgeText: 'text-blue-500' },
    { code: 'NEB-05', titleAr: 'العمليات الميدانية والأنشطة', titleEn: 'Field Operations & Activities', targetTab: 'activities', icon: Compass, prefixEn: 'operations', prefixAr: 'العمليات', badgeBg: 'bg-cyan-500/10 border-cyan-500/30', badgeText: 'text-cyan-500' },
    { code: 'NEB-06', titleAr: 'تقديم الخدمات والمستفيدون', titleEn: 'Beneficiary & Service Delivery', targetTab: 'beneficiaries', icon: Users, prefixEn: 'beneficiaries', prefixAr: 'المستفيدين', badgeBg: 'bg-teal-500/10 border-teal-500/30', badgeText: 'text-teal-500' },
    { code: 'NEB-07', titleAr: 'المجتمع والعمل التطوعي', titleEn: 'Community & Volunteers', targetTab: 'sponsorships', icon: Heart, prefixEn: 'community', prefixAr: 'المجتمع', badgeBg: 'bg-rose-500/10 border-rose-500/30', badgeText: 'text-rose-500' },
    { code: 'NEB-08', titleAr: 'الشراكات والتمويل الإنساني', titleEn: 'Partnerships & Grants', targetTab: 'sponsorships', icon: Handshake, prefixEn: 'partnerships', prefixAr: 'الشراكات', badgeBg: 'bg-violet-500/10 border-violet-500/30', badgeText: 'text-violet-500' },
    { code: 'NEB-09', titleAr: 'الموارد والأصول والكادر', titleEn: 'Human Resources & Assets', targetTab: 'users', icon: Award, prefixEn: 'resources', prefixAr: 'الموارد', badgeBg: 'bg-sky-500/10 border-sky-500/30', badgeText: 'text-sky-500' },
    { code: 'NEB-09-B', titleAr: 'تخصيص الموارد والجدولة', titleEn: 'Resource Allocation & Scheduling', targetTab: 'allocations', icon: Award, prefixEn: 'allocations', prefixAr: 'تخصيص', badgeBg: 'bg-emerald-500/10 border-emerald-500/30', badgeText: 'text-emerald-500' },
    { code: 'NEB-10', titleAr: 'المالية والحوكمة المؤسسية', titleEn: 'Finance & Governance', targetTab: 'finance', icon: Coins, prefixEn: 'finance', prefixAr: 'المالية', badgeBg: 'bg-emerald-500/10 border-emerald-500/30', badgeText: 'text-emerald-500' },
    { code: 'NEB-11', titleAr: 'المعرفة والوثائق والسياسات', titleEn: 'Knowledge & Documents', targetTab: 'docs', icon: FileText, prefixEn: 'knowledge', prefixAr: 'المعرفة', badgeBg: 'bg-amber-500/10 border-amber-500/30', badgeText: 'text-amber-500' },
    { code: 'NEB-12', titleAr: 'الخدمات الرقمية والتكامل', titleEn: 'Integration & Digital Services', targetTab: 'currencies', icon: Database, prefixEn: 'integration', prefixAr: 'التكامل', badgeBg: 'bg-purple-500/10 border-purple-500/30', badgeText: 'text-purple-500' },
    { code: 'NEB-13', titleAr: 'الذكاء الاصطناعي وقياس الأثر', titleEn: 'AI & Impact Analytics', targetTab: 'reports', icon: Brain, prefixEn: 'ai reports analytics impact', prefixAr: 'الذكاء التقارير تقرير الأثر مؤشرات البيئة بي', badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/30', badgeText: 'text-fuchsia-500' },
    { code: 'NEB-14', titleAr: 'المشتريات والمناقصات والعقود', titleEn: 'Procurement & Tenders', targetTab: 'contracts', icon: FileText, prefixEn: 'procurement tenders purchasing contracts', prefixAr: 'المشتريات المناقصات العقود عقود شراء', badgeBg: 'bg-orange-500/10 border-orange-500/30', badgeText: 'text-orange-500' },
    { code: 'NEB-15', titleAr: 'المشاريع الاستثمارية والأوقاف', titleEn: 'Endowments & Investments', targetTab: 'finance', icon: Coins, prefixEn: 'fundraising sales revenue donations invoicing', prefixAr: 'المبيعات الإيرادات التبرعات فواتير تمويل', badgeBg: 'bg-emerald-500/10 border-emerald-500/30', badgeText: 'text-emerald-500' },
  ];

  // Web Speech API Voice Search Handler
  const toggleVoiceSearch = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(lang === 'ar' 
        ? 'المتصفح الحالي لا يدعم التعرف على الصوت (Web Speech API). يرجى فتح التطبيق بمتصفح Chrome أو Edge.' 
        : 'Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!isOpen) {
      setIsOpen(true);
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'ar' ? 'ar-YE' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      setSpeechError(null);
      setIsListening(true);

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setQuery(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError(lang === 'ar' 
            ? 'تم رفض صلاحية استخدام الميكروفون. يرجى السماح للمتصفح بالوصول للميكروفون.' 
            : 'Microphone permission was denied. Please allow microphone access in browser settings.');
        } else if (event.error === 'no-speech') {
          setSpeechError(lang === 'ar' 
            ? 'لم يتم التقاط صوت واضح. يرجى التحدث بوضوح للميكروفون والمحاولة ثانيةً.' 
            : 'No distinct speech detected. Please speak clearly into your microphone.');
        } else {
          setSpeechError(lang === 'ar' 
            ? `خطأ في محرك التعرف الصوتي: ${event.error}` 
            : `Voice engine error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition', err);
      setIsListening(false);
      setSpeechError(lang === 'ar' ? 'عذراً، تعذر تفعيل البحث الصوتي.' : 'Failed to initiate voice search.');
    }
  };

  // Stop listening on unmount or close
  useEffect(() => {
    if (!isOpen && isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === '/') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsOpen(true);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedDomain('ALL');
      setSelectedItem(null);
      setSelectedType(null);
    }
  }, [isOpen]);

  // Parsing query for Domain Prefix (e.g., 'Programs: Water Projects', 'Finance: 2026')
  let activeSearchTerm = query;
  let activeDomainCode = selectedDomain;

  if (query.includes(':')) {
    const parts = query.split(':');
    const rawPrefix = parts[0].trim().toLowerCase();
    const rawTerm = parts.slice(1).join(':').trim();

    const matchedDomain = domains.find(d => 
      d.code.toLowerCase() === rawPrefix ||
      d.prefixEn.toLowerCase() === rawPrefix ||
      d.prefixAr.toLowerCase() === rawPrefix ||
      d.titleEn.toLowerCase().includes(rawPrefix) ||
      d.titleAr.toLowerCase().includes(rawPrefix) ||
      (rawPrefix === 'programs' || rawPrefix === 'برامج' || rawPrefix === 'المالية') ||
      (rawPrefix === 'projects' || rawPrefix === 'الكادر' || rawPrefix === 'مستفيدون') ||
      (rawPrefix === 'finance' || rawPrefix === 'مالية' || rawPrefix === 'المالية') ||
      (rawPrefix === 'beneficiaries' || rawPrefix === 'مستفيدون' || rawPrefix === 'استراتيجية') ||
      (rawPrefix === 'staff' || rawPrefix === 'الكادر' || rawPrefix === 'الكادر') ||
      (rawPrefix === 'strategy' || rawPrefix === 'استراتيجية' || rawPrefix === 'الاستراتيجية')
    );

    if (matchedDomain) {
      activeDomainCode = matchedDomain.code;
      activeSearchTerm = rawTerm;
    }
  }

  const cleanQuery = activeSearchTerm.toLowerCase();

  // Search Domains matching query
  const searchDomains = domains.filter(d => {
    if (!query) return false;
    const q = query.trim();
    return (
      fuzzyMatchArabic(q, d.code) > 0 ||
      fuzzyMatchArabic(q, d.titleAr) > 0 ||
      fuzzyMatchArabic(q, d.titleEn) > 0 ||
      fuzzyMatchArabic(q, d.prefixEn) > 0 ||
      fuzzyMatchArabic(q, d.prefixAr) > 0
    );
  }).map(d => ({ ...d, searchType: 'domain' as const }));

  // Search Beneficiaries
  const searchBeneficiaries = beneficiaries.filter(b => {
    if (activeDomainCode !== 'ALL' && activeDomainCode !== 'NEB-06') return false;
    if (!cleanQuery) return true;
    const targetStr = `${b.full_name_ar || ''} ${b.full_name || ''} ${b.beneficiary_code || ''} ${b.phone_primary || ''} ${b.governorate || ''} ${b.district || ''} ${b.category_code || ''}`;
    return fuzzyMatchArabic(cleanQuery, targetStr) > 0;
  }).map(b => ({ ...b, searchType: 'beneficiary' as const }));

  // Search Projects
  const searchProjects = projects.filter(p => {
    if (activeDomainCode !== 'ALL' && activeDomainCode !== 'NEB-02' && activeDomainCode !== 'NEB-03' && activeDomainCode !== 'NEB-04' && activeDomainCode !== 'NEB-05' && activeDomainCode !== 'NEB-10') return false;
    if (!cleanQuery) return true;
    const targetStr = `${p.name_ar || ''} ${p.name_en || ''} ${(p as any).project_code || p.code || ''} ${p.description || ''} ${p.location_name || ''} ${(p as any).sector || ''}`;
    return fuzzyMatchArabic(cleanQuery, targetStr) > 0;
  }).map(p => ({ ...p, searchType: 'project' as const }));

  // Search Staff / Users
  const searchUsers = users.filter(u => {
    if (activeDomainCode !== 'ALL' && activeDomainCode !== 'NEB-09') return false;
    if (!cleanQuery) return true;
    const targetStr = `${u.name || ''} ${u.name_ar || ''} ${u.email || ''} ${u.phone || ''} ${(u as any).role || u.position_code || ''}`;
    return fuzzyMatchArabic(cleanQuery, targetStr) > 0;
  }).map(u => ({ ...u, searchType: 'user' as const }));

  // Search Documents
  const searchDocuments = documents.filter(d => {
    if (activeDomainCode !== 'ALL' && activeDomainCode !== d.domain) return false;
    if (!cleanQuery) return true;
    const targetStr = `${d.title_ar || ''} ${d.title_en || ''} ${d.type || ''} ${d.author || ''} ${d.name || ''}`;
    return fuzzyMatchArabic(cleanQuery, targetStr) > 0;
  }).map(d => ({ ...d, searchType: 'document' as const }));

  // Combine results according to category filter
  const allResults = [
    ...(category === 'ALL' || category === 'DOMAINS' ? searchDomains : []),
    ...(category === 'ALL' || category === 'BENEFICIARIES' ? searchBeneficiaries : []),
    ...(category === 'ALL' || category === 'PROJECTS' ? searchProjects : []),
    ...(category === 'ALL' || category === 'STAFF' ? searchUsers : []),
    ...(category === 'ALL' || category === 'DOCUMENTS' ? searchDocuments : []),
  ];

  // Auto select top result for preview
  useEffect(() => {
    if (allResults.length > 0) {
      const first = allResults[0];
      setSelectedItem(first);
      setSelectedType(first.searchType);
    } else {
      setSelectedItem(null);
      setSelectedType(null);
    }
  }, [query, category, selectedDomain]);

  // Outside click listener
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  // Helper to highlight matches
  const highlightMatch = (text: string, search: string) => {
    if (!search || !text) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() 
            ? <mark key={i} className="bg-amber-100 text-amber-900 font-bold rounded-sm px-0.5">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  // Quick Action navigation
  const handleItemClick = (item: any, type: 'beneficiary' | 'project' | 'user' | 'domain' | 'document') => {
    setIsOpen(false);
    if (type === 'domain') {
      onNavigate(item.targetTab);
    } else if (type === 'beneficiary') {
      onNavigate('beneficiaries');
    } else if (type === 'project') {
      onNavigate('projects');
    } else if (type === 'user') {
      onNavigate('users');
    }
  };

  const getCategoryBadgeColor = (type: string) => {
    switch (type) {
      case 'domain': return 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
      case 'beneficiary': return 'bg-rose-50 border-rose-100 text-rose-700';
      case 'project': return 'bg-blue-50 border-blue-100 text-blue-700';
      case 'user': return 'bg-sky-50 border-sky-100 text-sky-700';
      default: return 'bg-slate-50 border-slate-100 text-slate-700';
    }
  };

  const activeMatchedDomainObj = domains.find(d => d.code === activeDomainCode);

  return (
    <>
      {/* Top Header Search Bar Trigger */}
      <div className="relative w-full max-w-[240px] md:max-w-xs hidden sm:block" id="erp-header-search">
        <div
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-900 border border-emerald-800/60 hover:border-emerald-500/50 rounded-xl text-zinc-400 text-xs transition-all shadow-inner group text-right cursor-pointer select-none"
          title={lang === 'ar' ? 'بحث موحد ومتطور عبر كافة مجالات وبيانات NexoraOS™ المؤسسية (Ctrl+K)' : 'Advanced Unified Search across all NexoraOS? Enterprise Domains (Ctrl+K)'}
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-zinc-300 text-xs truncate max-w-[120px] sm:max-w-[150px]">
              {lang === 'ar' ? 'البحث الشامل...' : 'System Search...'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleVoiceSearch}
              className={`p-1 rounded-lg transition-all cursor-pointer ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800'
              }`}
              title={lang === 'ar' ? 'بحث صوتي ذكي' : 'Smart Voice Search'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded font-black border border-emerald-500/25">
              ?K
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Search & Voice Triggers */}
      <div className="sm:hidden flex items-center gap-1">
        <button
          onClick={toggleVoiceSearch}
          className={`p-2 rounded-lg border transition-all cursor-pointer ${
            isListening 
              ? 'bg-rose-500 border-rose-600 text-white animate-pulse' 
              : 'bg-zinc-800 hover:bg-zinc-700 text-amber-500 border-zinc-700'
          }`}
          title={lang === 'ar' ? 'مسؤول النشاط' : 'Voice Search'}
          id="erp-mobile-voice-trigger"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-all cursor-pointer"
          title={lang === 'ar' ? 'مشروع تنموي' : 'Global Search'}
          id="erp-mobile-search-trigger"
        >
          <Search className="w-4 h-4 text-amber-500" />
        </button>
      </div>

      {/* Search Modal Overlay */}
      {isOpen && (
        <div 
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-start justify-center pt-6 md:pt-14 px-4 transition-all"
          id="erp-global-search-modal"
        >
          <div 
            ref={modalRef}
            className="w-full max-w-5xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in text-slate-800 dark:text-zinc-100"
          >
            {/* Header / Input Block */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2.5 bg-slate-50 dark:bg-zinc-950">
              <Search className="w-5 h-5 text-amber-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder={lang === 'ar' ? 'ابحث بالنص أو الفلترة (مثال: "المشاريع"، "المالية 2026"، "المستفيدين")...' : 'Search or filter by domain (e.g. "Water Projects" or "Finance: 2026")...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-zinc-100 text-sm font-black placeholder-zinc-400 h-9"
              />
              
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg text-xs"
                  title={lang === 'ar' ? 'غير مدخل' : 'Clear text'}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Voice Search Mic Button */}
              <button
                type="button"
                onClick={toggleVoiceSearch}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse'
                    : 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                }`}
                title={lang === 'ar' ? 'تفعيل البحث الصوتي عبر الميكروفون' : 'Activate hands-free voice search'}
                id="erp-voice-search-button"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-500" />}
                <span className="hidden sm:inline">
                  {isListening ? (lang === 'ar' ? 'جاري الاستماع...' : 'Listening...') : (lang === 'ar' ? 'بحث صوتي' : 'Voice Search')}
                </span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Domain Launcher Strip */}
            <div className="px-4 py-2 bg-slate-100/70 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs custom-scrollbar">
              <span className="text-[10px] font-black uppercase text-zinc-400 shrink-0 flex items-center gap-1">
                <Grid className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'ar' ? 'انتقال سريع للمجال (NEB):' : 'Domain Quick Jump:'}</span>
              </span>

              <button
                onClick={() => { setSelectedDomain('ALL'); }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                  selectedDomain === 'ALL'
                    ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-amber-500'
                }`}
              >
                {lang === 'ar' ? 'جميع الأنظمة (13)' : 'All Domains (13)'}
              </button>

              {domains.map(d => (
                <button
                  key={d.code}
                  onClick={() => {
                    setSelectedDomain(d.code);
                    onNavigate(d.targetTab);
                    setIsOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border ${
                    selectedDomain === d.code
                      ? 'bg-emerald-600 text-white font-black border-emerald-500 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-amber-500'
                  }`}
                  title={`${d.code}: ${lang === 'ar' ? d.titleAr : d.titleEn}`}
                >
                  <span className="font-mono text-[10px] font-black text-amber-500">{d.code}</span>
                  <span className="truncate max-w-[120px]">{lang === 'ar' ? d.titleAr : d.titleEn}</span>
                </button>
              ))}
            </div>

            {/* Filter Pills & Prefix Examples Bar */}
            <div className="px-4 py-2 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-black">
              
              {/* Active Prefix Indicator */}
              {activeDomainCode !== 'ALL' && activeMatchedDomainObj && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20 text-xs font-bold">
                  <Filter className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تصفية حسب المجال:' : 'Filtered Domain:'}</span>
                  <span className="font-mono font-black">{activeMatchedDomainObj.code}</span>
                  <span>({lang === 'ar' ? activeMatchedDomainObj.titleAr : activeMatchedDomainObj.titleEn})</span>
                  <button onClick={() => { setSelectedDomain('ALL'); setQuery(''); }} className="hover:text-rose-400 mr-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Advanced Filter Syntax Examples */}
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 overflow-x-auto">
                <span className="shrink-0">{lang === 'ar' ? 'أمثلة الفلترة المتقدمة:' : 'Try Advanced Filters:'}</span>
                <button
                  onClick={() => setQuery('Programs: Water Projects')}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 hover:bg-amber-500/10 hover:text-amber-500 rounded border border-slate-200 dark:border-zinc-700 font-mono text-[10px] transition-colors"
                >
                  Programs: Water Projects
                </button>
                <button
                  onClick={() => setQuery('Finance: 2026')}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 hover:bg-amber-500/10 hover:text-amber-500 rounded border border-slate-200 dark:border-zinc-700 font-mono text-[10px] transition-colors"
                >
                  Finance: 2026
                </button>
                <button
                  onClick={() => setQuery('Beneficiaries: Sanaa')}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 hover:bg-amber-500/10 hover:text-amber-500 rounded border border-slate-200 dark:border-zinc-700 font-mono text-[10px] transition-colors"
                >
                  Beneficiaries: Sanaa
                </button>
                <button
                  onClick={() => setQuery(lang === 'ar' ? 'الاستراتيجية' : 'Strategy')}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 hover:bg-amber-500/10 hover:text-amber-500 rounded border border-slate-200 dark:border-zinc-700 font-bold text-[10px] transition-colors"
                >
                  {lang === 'ar' ? 'الاستراتيجية' : 'Strategy'}
                </button>
              </div>

            </div>

            {/* Split Panel Body */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row">
              
              {/* Left results ledger */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80 p-3 min-h-[250px] max-h-[50vh] md:max-h-none md:border-l md:border-slate-200 dark:md:border-zinc-800">
                {!query && activeDomainCode === 'ALL' ? (
                  <div className="p-4 space-y-6">
                    <div className="text-center space-y-1 mb-6">
                      <p className="text-sm font-black text-slate-800 dark:text-zinc-200">
                        {lang === 'ar' ? 'محرك البحث والتنقل السريع - NexoraOS™' : 'NexoraOS? Unified Quick Search & Navigation'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {lang === 'ar' ? 'اكتب للبحث السريع أو اختر مجالاً من القائمة أدناه' : 'Type to search or select a domain below'}
                      </p>
                    </div>

                    {/* Categorized Domains Grid */}
                    <div className="space-y-5">
                      {/* Category 1: Strategy & Projects */}
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-wider mb-2 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'الاستراتيجية وإدارة المشاريع' : 'Strategy & Projects'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {domains.filter(d => ['NEB-01', 'NEB-02', 'NEB-03', 'NEB-04', 'NEB-05'].includes(d.code)).map(d => (
                            <button
                              key={d.code}
                              onClick={() => {
                                onNavigate(d.targetTab);
                                setIsOpen(false);
                              }}
                              className="text-left rtl:text-right p-2.5 bg-slate-50 dark:bg-zinc-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 group"
                            >
                              <div className="p-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                {React.createElement(d.icon, { className: 'w-4 h-4' })}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono font-black text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-1 rounded">
                                    {d.code}
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors mt-0.5">
                                  {lang === 'ar' ? d.titleAr : d.titleEn}
                                </h5>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Category 2: Beneficiaries & Resources */}
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-wider mb-2 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'الخدمات والموارد والمالية' : 'Services, Finance & Resources'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {domains.filter(d => ['NEB-06', 'NEB-07', 'NEB-08', 'NEB-09', 'NEB-10'].includes(d.code)).map(d => (
                            <button
                              key={d.code}
                              onClick={() => {
                                onNavigate(d.targetTab);
                                setIsOpen(false);
                              }}
                              className="text-left rtl:text-right p-2.5 bg-slate-50 dark:bg-zinc-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-zinc-800 hover:border-blue-500/50 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 group"
                            >
                              <div className="p-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                {React.createElement(d.icon, { className: 'w-4 h-4' })}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono font-black text-blue-600 dark:text-blue-500 bg-blue-500/10 px-1 rounded">
                                    {d.code}
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors mt-0.5">
                                  {lang === 'ar' ? d.titleAr : d.titleEn}
                                </h5>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Category 3: Tech & AI */}
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-wider mb-2 flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'التقنية والذكاء والتوثيق' : 'Tech, AI & Documentation'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {domains.filter(d => ['NEB-11', 'NEB-12', 'NEB-13'].includes(d.code)).map(d => (
                            <button
                              key={d.code}
                              onClick={() => {
                                onNavigate(d.targetTab);
                                setIsOpen(false);
                              }}
                              className="text-left rtl:text-right p-2.5 bg-slate-50 dark:bg-zinc-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-zinc-800 hover:border-purple-500/50 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 group"
                            >
                              <div className="p-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                {React.createElement(d.icon, { className: 'w-4 h-4' })}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono font-black text-purple-600 dark:text-purple-500 bg-purple-500/10 px-1 rounded">
                                    {d.code}
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors mt-0.5">
                                  {lang === 'ar' ? d.titleAr : d.titleEn}
                                </h5>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                ) : allResults.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 space-y-2">
                    <X className="w-8 h-8 text-rose-300 mx-auto bg-rose-50 dark:bg-rose-950/30 rounded-full p-1.5 border border-rose-100 dark:border-rose-900" />
                    <p className="text-xs font-black text-slate-600 dark:text-zinc-300">
                      {lang === 'ar' ? 'لم يتم العثور على أي نتائج مطابقة.' : 'No matching records detected.'}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {lang === 'ar' ? 'يرجى مراجعة التهجئة أو استخدام كلمات بديلة.' : 'Ensure correct filters are selected and spelling conforms to registry records.'}
                    </p>
                  </div>
                ) : (
                  allResults.map((item, idx) => {
                    const isSelected = selectedItem?.id === item.id || (selectedItem?.code === item.code && item.searchType === 'domain');
                    const bType = item.searchType;
                    return (
                      <div
                        key={item.id || item.code || idx}
                        onClick={() => {
                          setSelectedItem(item);
                          setSelectedType(item.searchType);
                        }}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-start gap-3.5 text-right font-semibold border ${
                          isSelected 
                            ? 'bg-amber-500/10 border-amber-500/40 shadow-sm' 
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        {/* Icon based on item type */}
                        <div className={`p-2.5 rounded-xl border shrink-0 ${
                          bType === 'domain' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                          bType === 'beneficiary' ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900 text-rose-600' :
                          bType === 'project' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900 text-blue-600' :
                          bType === 'document' ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900 text-purple-600' :
                          'bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900 text-sky-600'
                        }`}>
                          {bType === 'domain' && React.createElement(item.icon || Grid, { className: 'w-5 h-5 text-amber-500' })}
                          {bType === 'beneficiary' && <Users className="w-5 h-5" />}
                          {bType === 'project' && <Briefcase className="w-5 h-5" />}
                          {bType === 'user' && <UserCheck className="w-5 h-5" />}
                          {bType === 'document' && <FileText className="w-5 h-5" />}
                        </div>

                        {/* Text Block */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-[9px] font-mono font-black border rounded px-1.5 py-0.5 uppercase tracking-wide shrink-0 ${getCategoryBadgeColor(bType)}`}>
                              {bType === 'domain' ? `? Nexora Domain ${item.code}` :
                               bType === 'beneficiary' ? (lang === 'ar' ? 'الروضة' : 'Beneficiary') :
                               bType === 'project' ? (lang === 'ar' ? 'مسؤول النشاط' : 'Project') :
                               bType === 'document' ? (lang === 'ar' ? 'مستند/مرفق' : 'Document') :
                               (lang === 'ar' ? 'أيام' : 'Staff')}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400 font-bold">
                              {bType === 'domain' && item.code}
                              {bType === 'beneficiary' && item.beneficiary_code}
                              {bType === 'project' && item.code}
                              {bType === 'user' && (item.position_code || 'STAFF')}
                              {bType === 'document' && item.type}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate leading-snug">
                            {bType === 'domain' && (lang === 'ar' ? item.titleAr : item.titleEn)}
                            {bType === 'beneficiary' && highlightMatch(item.full_name_ar, cleanQuery)}
                            {bType === 'project' && highlightMatch(lang === 'ar' ? item.name_ar : (item.name_en || item.name_ar), cleanQuery)}
                            {bType === 'user' && highlightMatch(lang === 'ar' ? (item.name_ar || item.name) : item.name, cleanQuery)}
                            {bType === 'document' && highlightMatch(lang === 'ar' ? item.title_ar : (item.title_en || item.title_ar), cleanQuery)}
                          </h4>

                          <p className="text-[10px] text-zinc-400 truncate mt-1">
                            {bType === 'domain' && (lang === 'ar' ? `اضغط للانتقال لمجال ${item.titleAr}` : `Click to launch ${item.titleEn}`)}
                            {bType === 'beneficiary' && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-400" />
                                {item.governorate} - {item.district} | {item.phone_primary}
                              </span>
                            )}
                            {bType === 'project' && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-400" />
                                {item.location_name} | {lang === 'ar' ? 'الميزانية: ' : 'Budget: '} {item.budget} {item.currency_code}
                              </span>
                            )}
                            {bType === 'user' && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-zinc-400" />
                                {item.email} | {item.phone}
                              </span>
                            )}
                            {bType === 'document' && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-zinc-400" />
                                {item.size} | {item.author} | {item.date}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right preview panel */}
              {selectedItem && selectedType && (
                <div className="w-full md:w-[380px] p-5 bg-slate-50 dark:bg-zinc-950 border-t md:border-t-0 md:border-slate-200 dark:md:border-zinc-800 overflow-y-auto max-h-[45vh] md:max-h-none space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                      {lang === 'ar' ? 'التزام الفترة الكلي' : 'Live Document Preview'}
                    </h3>
                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(selectedType)}`}>
                      {selectedType === 'domain' && (lang === 'ar' ? 'مجال مؤسسي' : 'Enterprise Domain')}
                      {selectedType === 'beneficiary' && (lang === 'ar' ? 'سجل مستفيد' : 'Beneficiary Record')}
                      {selectedType === 'project' && (lang === 'ar' ? 'بطاقة مشروع' : 'Project Card')}
                      {selectedType === 'user' && (lang === 'ar' ? 'ملف موظف' : 'Staff Profile')}
                      {selectedType === 'document' && (lang === 'ar' ? 'مستند/مرفق' : 'Document')}
                    </span>
                  </div>

                  {/* PREVIEW LAYOUT 0: DOMAIN JUMP */}
                  {selectedType === 'domain' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-zinc-900 border border-amber-500/30 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl">
                            {React.createElement(selectedItem.icon || Grid, { className: 'w-6 h-6' })}
                          </div>
                          <div>
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 font-mono font-black text-xs rounded border border-amber-500/20">
                              {selectedItem.code}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 mt-1">
                              {lang === 'ar' ? selectedItem.titleAr : selectedItem.titleEn}
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                          <span className="text-zinc-400">{lang === 'ar' ? 'بادئة البحث (Prefix)' : 'Search Prefix'}</span>
                          <span className="font-mono font-black text-amber-500">{selectedItem.prefixEn}:</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">{lang === 'ar' ? 'التبويب المستهدف' : 'Target Workspace'}</span>
                          <span className="font-mono font-bold text-emerald-500">{selectedItem.targetTab}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleItemClick(selectedItem, 'domain')}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                      >
                        <span>{lang === 'ar' ? 'الانتقال إلى مساحة العمل مباشرةً' : 'Launch Domain Workspace'}</span>
                        {lang === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {/* PREVIEW LAYOUT 1: BENEFICIARY */}
                  {selectedType === 'beneficiary' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-1">
                        <p className="text-[10px] text-zinc-400 font-extrabold">{lang === 'ar' ? 'الاسم الكامل باللغة العربية' : 'Full Name (AR)'}</p>
                        <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">{selectedItem.full_name_ar}</h4>
                        <p className="text-[10px] font-mono text-slate-500 mt-1">
                          {lang === 'ar' ? 'الرمز التعريفي للمستفيد: ' : 'Beneficiary Code: '}
                          <span className="font-extrabold text-amber-500">{selectedItem.beneficiary_code}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg">
                          <span className="text-zinc-400">{lang === 'ar' ? 'التصنيف الرئيسي' : 'Category'}</span>
                          <p className="text-slate-800 dark:text-zinc-200 font-black mt-0.5">{selectedItem.category_code}</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg">
                          <span className="text-zinc-400">{lang === 'ar' ? 'حالة الأهلية' : 'Welfare Status'}</span>
                          <p className="text-emerald-500 font-black mt-0.5 uppercase">{selectedItem.status_code || 'Active'}</p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'العنوان والموقع الميداني' : 'Address'}
                          </span>
                          <span className="text-slate-800 dark:text-zinc-200 font-bold">{selectedItem.governorate} - {selectedItem.district}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'رقم الهاتف الأساسي' : 'Phone'}
                          </span>
                          <span className="text-slate-800 dark:text-zinc-200 font-mono font-bold">{selectedItem.phone_primary}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleItemClick(selectedItem, 'beneficiary')}
                        className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer mt-4"
                      >
                        <span>{lang === 'ar' ? 'الذهاب إلى سجل المستفيدين' : 'Navigate to Beneficiaries'}</span>
                        {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {/* PREVIEW LAYOUT 2: PROJECT */}
                  {selectedType === 'project' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-1">
                        <p className="text-[10px] text-zinc-400 font-extrabold">{lang === 'ar' ? 'اسم المشروع التنموي' : 'Project Name'}</p>
                        <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                          {lang === 'ar' ? selectedItem.name_ar : (selectedItem.name_en || selectedItem.name_ar)}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-500 mt-1">
                          {lang === 'ar' ? 'كود المشروع المالي: ' : 'Project Code: '}
                          <span className="font-extrabold text-amber-500">{selectedItem.code}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg">
                          <span className="text-zinc-400 flex items-center gap-0.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            {lang === 'ar' ? 'ميزانية المشروع' : 'Total Budget'}
                          </span>
                          <p className="text-emerald-500 font-black text-xs font-mono mt-1">
                            {parseFloat(selectedItem.budget || '0').toLocaleString()} {selectedItem.currency_code}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg">
                          <span className="text-zinc-400 flex items-center gap-0.5">
                            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                            {lang === 'ar' ? 'نسبة الإنجاز المالي' : 'Completion Rate'}
                          </span>
                          <p className="text-amber-500 font-black text-xs font-mono mt-1">
                            {selectedItem.progress_percent || '0'}%
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleItemClick(selectedItem, 'project')}
                        className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer mt-4"
                      >
                        <span>{lang === 'ar' ? 'الذهاب إلى سجل المشاريع' : 'Navigate to Projects'}</span>
                        {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {/* PREVIEW LAYOUT 3: USER STAFF */}
                  {selectedType === 'user' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-1 text-center">
                        <div className="w-12 h-12 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-full flex items-center justify-center font-black text-lg mx-auto mb-2">
                          {selectedItem.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">{lang === 'ar' ? (selectedItem.name_ar || selectedItem.name) : selectedItem.name}</h4>
                        <p className="text-[10px] font-mono text-slate-500">
                          {selectedItem.email}
                        </p>
                      </div>

                      <button
                        onClick={() => handleItemClick(selectedItem, 'user')}
                        className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer mt-4"
                      >
                        <span>{lang === 'ar' ? 'الذهاب إلى سجل الموظفين' : 'Navigate to Users'}</span>
                        {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {/* PREVIEW LAYOUT 4: DOCUMENT */}
                  {selectedType === 'document' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-1">
                        <p className="text-[10px] text-zinc-400 font-extrabold">{lang === 'ar' ? 'اسم المستند / المرفق' : 'Document Name'}</p>
                        <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                          {lang === 'ar' ? selectedItem.title_ar : (selectedItem.title_en || selectedItem.title_ar)}
                        </h4>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            {selectedItem.type}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {selectedItem.size}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'المؤلف / المالك' : 'Author'}
                          </span>
                          <span className="text-slate-800 dark:text-zinc-200 font-bold">{selectedItem.author}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'المجال المرتبط' : 'Domain'}
                          </span>
                          <span className="text-slate-800 dark:text-zinc-200 font-mono font-bold">{selectedItem.domain}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'تاريخ الفهرسة' : 'Index Date'}
                          </span>
                          <span className="text-slate-800 dark:text-zinc-200 font-mono font-bold">{selectedItem.date}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleItemClick(selectedItem, 'document')}
                        className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer mt-4"
                      >
                        <span>{lang === 'ar' ? 'فتح المستند لمعاينته' : 'Open Document'}</span>
                        {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Footer keyboard hint bar */}
            <div className="p-3 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 text-[10px] text-zinc-400 font-bold flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 text-[9px] shadow-sm font-mono text-amber-500 font-black">Ctrl + K</kbd>
                  {' '}{lang === 'ar' ? 'للبحث والملاحة' : 'Search & Navigate'}
                </span>
                <span>
                  <kbd className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-1.5 py-0.5 text-[9px] shadow-sm font-mono text-zinc-400 font-bold">Esc</kbd>
                  {' '}{lang === 'ar' ? 'للإغلاق' : 'to close'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-zinc-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'ar' ? 'محرك البحث والربط الشامل لـ NexoraOS™ Enterprise OS' : 'NexoraOS? Unified Enterprise Search Engine'}</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
