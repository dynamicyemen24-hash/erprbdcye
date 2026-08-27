import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  FileText, 
  Zap, 
  Loader2,
  Brain,
  Layers,
  HelpCircle,
  Lightbulb,
  Paperclip,
  Image as ImageIcon,
  Key,
  Sliders,
  Copy,
  Check,
  Trash2,
  Play,
  BookOpen,
  Building2,
  Command,
  ArrowRight,
  ArrowLeft,
  Search,
  ExternalLink,
  ShieldCheck,
  Award,
  Lock,
  Scale
} from 'lucide-react';
import { UAMEX_AI_MODEL_TIERS, UAMEX_AI_CONSTITUTION } from '../core/ai/UAMEXAIConstitution';

interface NexoraAICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  contextData: any;
  onNavigate?: (tab: string) => void;
}

interface CopilotResponse {
  summary: string;
  key_findings: string[];
  risk_assessment: {
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  };
  strategic_recommendations: string[];
  actionable_next_steps: string[];
}

interface AttachedFile {
  name: string;
  type: string;
  data: string; // base64
  sizeMb: string;
}

export default function NexoraAICopilotDrawer({
  isOpen,
  onClose,
  lang,
  contextData,
  onNavigate
}: NexoraAICopilotDrawerProps) {
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'copilot' | 'constitution' | 'sops' | 'ipsas' | 'shortcuts'>('copilot');

  // AI State
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CopilotResponse | null>(null);
  
  // Model & Key Configuration
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    return localStorage.getItem('uamex_ai_tier') || 'uamex-fast';
  });
  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem('nexora_gemini_api_key') || '';
  });
  const [showConfig, setShowConfig] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SOPs Search State
  const [sopFilter, setSopFilter] = useState('');

  if (!isOpen) return null;

  const currentTier = UAMEX_AI_MODEL_TIERS.find(t => t.id === selectedModelId) || UAMEX_AI_MODEL_TIERS[0];

  const handleTierChange = (tierId: string) => {
    setSelectedModelId(tierId);
    localStorage.setItem('uamex_ai_tier', tierId);
  };

  const handleKeySave = (key: string) => {
    setCustomKey(key);
    localStorage.setItem('nexora_gemini_api_key', key);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(isRtl ? 'حجم الملف يتجاوز الحد المسموح (5 ميجابايت)' : 'File size exceeds limit (5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            data: reader.result as string,
            sizeMb: (file.size / (1024 * 1024)).toFixed(2)
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (forcedPrompt?: string) => {
    const queryText = forcedPrompt || prompt;
    if (!queryText.trim() && attachedFiles.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/strategic-anomaly-monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': customKey
        },
        body: JSON.stringify({
          model: currentTier.underlyingModel,
          prompt: queryText,
          systemInstruction: UAMEX_AI_CONSTITUTION.buildSystemInstruction('جمعية رُحماء بينهم للعمل الإنساني والتنمية'),
          attachedFiles: attachedFiles,
          context: contextData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isRtl ? 'حدث تعذر مؤقت في محرك يوماكس إي آي، جاري التبديل الاحتياطي.' : 'UAMEX AI Engine temporary fallback triggered.'));
      }

      setResult(data);
      if (!forcedPrompt) setPrompt('');
    } catch (err: any) {
      console.error('UAMEX AI Copilot Error:', err);
      setError(err.message || (isRtl ? 'تعذر الاتصال بمحرك يوماكس إي آي' : 'Failed to connect to UAMEX AI Engine'));
    } finally {
      setLoading(false);
    }
  };

  const SOPS_LIBRARY = [
    { code: 'SOP-01', titleAr: 'دليل التخطيط الاستراتيجي ومراجعة مؤشرات الأداء', titleEn: 'Strategic Planning & Key Performance Indicators Playbook', domain: 'NEB-01', tab: 'dashboard' },
    { code: 'SOP-02', titleAr: 'معايير اعتماد الموازنات التشغيلية والمحافظ', titleEn: 'Operational Budgets Approval Standards', domain: 'NEB-02', tab: 'programs' },
    { code: 'SOP-03', titleAr: 'إدارة دورة حياة المشاريع الميدانية والأنشطة', titleEn: 'Field Project Life-Cycle & Activity Execution', domain: 'NEB-04', tab: 'projects' },
    { code: 'SOP-04', titleAr: 'سياسات صرف وتقييم الرعاية الاجتماعية وكفالات الأيتام', titleEn: 'Social Care & Orphan Sponsorship Disbursement', domain: 'NEB-07', tab: 'sponsorships' },
    { code: 'SOP-05', titleAr: 'دليل القيود المحاسبية ومعالجة الفروقات المالية', titleEn: 'Accounting Ledger & Financial Variance Guide', domain: 'NEB-10', tab: 'finance' },
    { code: 'SOP-06', titleAr: 'إجراءات طلبات الشراء والمناقصات والموردين المعتمدين', titleEn: 'Procurement RFQs, Tenders & Approved Vendors', domain: 'NEB-14', tab: 'contracts' },
    { code: 'SOP-07', titleAr: 'إدارة المخزون والتوريد الميداني والحركات المخزنية', titleEn: 'Inventory Management & Field Stock Movement', domain: 'NEB-09', tab: 'inventory' },
    { code: 'SOP-08', titleAr: 'دليل التدقيق الداخلي والسجلات المحمية الموثقة', titleEn: 'Internal Audit & Protected Records Standard', domain: 'NEB-10', tab: 'audit' }
  ];

  const filteredSops = SOPS_LIBRARY.filter(s => 
    s.code.toLowerCase().includes(sopFilter.toLowerCase()) ||
    s.titleAr.includes(sopFilter) ||
    s.titleEn.toLowerCase().includes(sopFilter.toLowerCase())
  );

  const IPSAS_RULES = [
    { std: 'IPSAS 1', titleAr: 'عرض القوائم المالية والميزانية العمومية', titleEn: 'Presentation of Financial Statements', descAr: 'يتطلب تصنيف الأصول والالتزامات المتداولة وغير المتداولة وتوازن القيد المزدوج.' },
    { std: 'IPSAS 2', titleAr: 'قائمة التدفقات النقدية والمقبوضات', titleEn: 'Cash Flow Statements', descAr: 'إلزامية فصل التدفقات النقدية إلى تشغيلية، استثمارية، وتمويلية.' },
    { std: 'IPSAS 9', titleAr: 'الإيرادات من المعاملات التبادلية والتبرعات', titleEn: 'Revenue from Exchange Transactions', descAr: 'الاعتراف بالإيراد فور تحقق الشروط المقترنة بالمنحة أو الكفالة.' },
    { std: 'IPSAS 17', titleAr: 'العقارات والآلات والمعدات والأصول الثابتة', titleEn: 'Property, Plant and Equipment', descAr: 'احتساب الإهلاك المعياري وتتبع الأصول في سجل الممتلكات الموحد.' }
  ];

  const KEYBOARD_SHORTCUTS = [
    { keys: 'Ctrl + K  /  Cmd + K', descAr: 'فتح شريط الأوامر الموحد والبحث الشامل', descEn: 'Open Universal Command Bar' },
    { keys: 'Alt + H', descAr: 'فتح قائمة الأدوات والمقاييس المساعدة', descEn: 'Open Helper Tools Suite' },
    { keys: 'F1', descAr: 'فتح بوابة يوماكس إي آي والمساعدة', descEn: 'Open UAMEX AI Portal' },
    { keys: 'Esc', descAr: 'إغلاق النوافذ المنبثقة واللوحات المنزلقة', descEn: 'Close open modals & drawers' },
    { keys: '/', descAr: 'التركيز المباشر على مربع البحث الشامل', descEn: 'Focus universal search bar' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div 
        className={`absolute inset-y-0 ${isRtl ? 'left-0' : 'right-0'} max-w-full flex pl-10`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-2xl bg-zinc-950 text-zinc-100 shadow-2xl border-l border-zinc-800/80 flex flex-col h-full">
          
          {/* Drawer Header - UAMEX AI Sovereign Identity */}
          <div className="p-4 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <Brain className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-white tracking-tight">
                    {isRtl ? 'يوماكس إي آي (UAMEX AI™)' : 'UAMEX AI™ Sovereign Engine'}
                  </h3>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                    {currentTier.badgeText}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isRtl ? 'محرك الذكاء الاصطناعي السيادي لجمعية رُحماء بينهم' : 'Sovereign Enterprise Intelligence for Rohama\'a Baynahum'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  showConfig 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                    : 'bg-zinc-900 border-zinc-800 text-slate-400 hover:text-white'
                }`}
                title={isRtl ? 'ترقية وتعديل نمط المعالجة' : 'Upgrade Engine Tier'}
              >
                <Sliders className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Configuration Banner - Sovereign Multi-Tier Engine */}
          {showConfig && (
            <div className="p-4 bg-zinc-900/90 border-b border-amber-500/30 animate-in slide-in-from-top-2 space-y-3">
              <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>{isRtl ? 'أنماط وترقيات محرك يوماكس إي آي (UAMEX AI Engine Tiers)' : 'UAMEX AI Processing Tiers'}</span>
              </h4>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-bold">
                  {isRtl ? 'مستوى الذكاء ونمط التحليل المؤسسي:' : 'Cognitive Processing Tier:'}
                </label>
                <select
                  value={selectedModelId}
                  onChange={(e) => handleTierChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-bold outline-none focus:border-amber-500"
                >
                  {UAMEX_AI_MODEL_TIERS.map(tier => (
                    <option key={tier.id} value={tier.id}>
                      {isRtl ? tier.nameAr : tier.nameEn}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {isRtl ? currentTier.descriptionAr : currentTier.descriptionEn}
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-bold">
                  {isRtl ? 'مفتاح الترخيص المؤسسي المشفر (اختياري للترقية):' : 'Enterprise License API Key (Optional):'}
                </label>
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => handleKeySave(e.target.value)}
                  placeholder="UAM-AI-SECURE-KEY..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Unified Navigation Tabs */}
          <div className="flex items-center gap-1 p-2 bg-zinc-900 border-b border-zinc-800 shrink-0 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'copilot'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'يوماكس إي آي' : 'UAMEX AI™ Copilot'}</span>
            </button>
            <button
              onClick={() => setActiveTab('constitution')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'constitution'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRtl ? 'دستور الذكاء المؤسسي' : 'AI Constitution'}</span>
            </button>
            <button
              onClick={() => setActiveTab('sops')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sops'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الأدلة التشغيلية SOPs' : 'SOPs Library'}</span>
            </button>
            <button
              onClick={() => setActiveTab('ipsas')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ipsas'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'المعايير المحاسبية' : 'Accounting Rules'}</span>
            </button>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'shortcuts'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Command className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الاختصارات' : 'Shortcuts'}</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* TAB 1: UAMEX AI COPILOT */}
            {activeTab === 'copilot' && (
              <div className="space-y-4">
                
                {/* 1-Click Fast Operational Prompt Chips */}
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{isRtl ? 'توجيهات سريعة بنقرة واحدة (Direct Prompts):' : 'Direct 1-Click Prompts:'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        titleAr: 'تحليل كفاءة الإنفاق والعائد SROI',
                        titleEn: 'Spend Efficiency & SROI',
                        promptAr: 'قم بإجراء تحليل معمق لكفاءة الإنفاق ومعدل العائد الاجتماعي على الاستثمار (SROI) للمشاريع الميدانية الحالية ومقارنتها بالمعيار المستهدف 1:4.8.'
                      },
                      {
                        titleAr: 'مطابقة المشاريع مع معايير ميثاق إسفير',
                        titleEn: 'Sphere Standards Audit',
                        promptAr: 'حلل مدى مطابقة مشاريع الإغاثة والمياه الجارية مع المعايير الدنيا لميثاق إسفير CHS 9، واقترح التدابير التصحيحية الفورية.'
                      },
                      {
                        titleAr: 'تدقيق كفالات الأيتام ومطابقة الحسابات',
                        titleEn: 'Orphan Sponsorships Audit',
                        promptAr: 'دقق سجلات كفالات الأيتام المربوطة بموازنات البرامج، وفحص انتظام التحويلات الشهرية وفق معايير IPSAS والحماية الاجتماعية.'
                      },
                      {
                        titleAr: 'توليد ملخص تنفيذي للمدير العام',
                        titleEn: 'Executive C-Level Summary',
                        promptAr: 'ولد ملخصاً استراتيجياً تنفيذياً شاملاً يربط البرامج التنموية بالمستفيدين الموثقين ومؤشرات الأداء الميداني في عموم المحافظات.'
                      }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(chip.promptAr)}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer text-left rtl:text-right"
                      >
                        {isRtl ? chip.titleAr : chip.titleEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Query Input Box */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 space-y-2 shadow-inner">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={isRtl ? 'اكتب استفسارك ليوماكس إي آي (مثال: دقق انحرافات الموازنة، فحص شروط الكفالة، أو استشراف الأثر)...' : 'Ask UAMEX AI anything...'}
                    className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none resize-none min-h-[70px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleSend();
                      }
                    }}
                  />

                  {/* Attached files preview */}
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                      {attachedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-lg text-[10px] text-zinc-300">
                          <Paperclip className="w-3 h-3 text-amber-400" />
                          <span className="max-w-[120px] truncate">{file.name}</span>
                          <button onClick={() => removeAttachedFile(idx)} className="text-zinc-500 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                        title={isRtl ? 'إرفاق مستند أو صورة' : 'Attach Document or Image'}
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Ctrl+Enter للإرسال
                      </span>
                    </div>

                    <button
                      onClick={() => handleSend()}
                      disabled={loading || (!prompt.trim() && attachedFiles.length === 0)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{isRtl ? 'جاري التحليل السيادي...' : 'Analyzing...'}</span>
                        </>
                      ) : (
                        <>
                          <span>{isRtl ? 'إرسال' : 'Query UAMEX AI'}</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* AI Result Card */}
                {result && (
                  <div className="bg-zinc-900/95 border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-xl animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-white">
                          {isRtl ? 'تحليل يوماكس إي آي المعتمد' : 'UAMEX AI Certified Synthesis'}
                        </span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                        result.risk_assessment?.risk_level === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        result.risk_assessment?.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        RISK: {result.risk_assessment?.risk_level || 'LOW'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold text-amber-400 uppercase">
                        {isRtl ? 'الملخص الاستراتيجي التنفيذي:' : 'Executive Summary:'}
                      </h5>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                        {result.summary}
                      </p>
                    </div>

                    {result.key_findings?.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold text-emerald-400 uppercase">
                          {isRtl ? 'أبرز الاستنتاجات الميدانية:' : 'Key Operational Findings:'}
                        </h5>
                        <ul className="space-y-1 text-xs text-zinc-300">
                          {result.key_findings.map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-mono font-bold">•</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.strategic_recommendations?.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold text-sky-400 uppercase">
                          {isRtl ? 'توصيات الحوكمة والأثر:' : 'Strategic Recommendations:'}
                        </h5>
                        <ul className="space-y-1 text-xs text-zinc-300">
                          {result.strategic_recommendations.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ArrowRight className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: UAMEX AI CONSTITUTION */}
            {activeTab === 'constitution' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-black">
                    <Scale className="w-4 h-4" />
                    <span>دستور يوماكس إي آي (UAMEX AI™ Sovereign Constitution)</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    الميثاق الدستوري الحاكم لكافة خوارزميات وتحليلات الذكاء الاصطناعي في نظام UAMEX ERP™ المعتمد لجمعية رُحماء بينهم للعمل الإنساني والتنمية.
                  </p>
                </div>

                <div className="space-y-3">
                  {UAMEX_AI_CONSTITUTION.articles.map((art) => (
                    <div key={art.articleNumber} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs flex items-center justify-center">
                          {art.articleNumber}
                        </span>
                        <h4 className="font-extrabold text-xs text-white">
                          {isRtl ? art.titleAr : art.titleEn}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed pl-8 rtl:pr-8 rtl:pl-0">
                        {isRtl ? art.textAr : art.textEn}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>Version: {UAMEX_AI_CONSTITUTION.version}</span>
                  <span className="text-emerald-400 font-bold">SOVEREIGN SEAL CERTIFIED</span>
                </div>
              </div>
            )}

            {/* TAB 3: SOPS LIBRARY */}
            {activeTab === 'sops' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={sopFilter}
                    onChange={(e) => setSopFilter(e.target.value)}
                    placeholder={isRtl ? 'البحث في الأدلة التشغيلية المعتمدة...' : 'Search SOPs...'}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  {filteredSops.map((sop) => (
                    <div key={sop.code} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-amber-400">{sop.code} ({sop.domain})</span>
                        <h5 className="text-xs font-bold text-white">{isRtl ? sop.titleAr : sop.titleEn}</h5>
                      </div>
                      {onNavigate && (
                        <button
                          onClick={() => {
                            onNavigate(sop.tab);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          {isRtl ? 'فتح التبويب' : 'Open Tab'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: IPSAS RULES */}
            {activeTab === 'ipsas' && (
              <div className="space-y-3 animate-in fade-in">
                {IPSAS_RULES.map((rule) => (
                  <div key={rule.std} className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                        {rule.std}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">IPSAS Standard</span>
                    </div>
                    <h5 className="text-xs font-bold text-white">{isRtl ? rule.titleAr : rule.titleEn}</h5>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{rule.descAr}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: SHORTCUTS */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-2 animate-in fade-in">
                {KEYBOARD_SHORTCUTS.map((sc, idx) => (
                  <div key={idx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-zinc-300">{isRtl ? sc.descAr : sc.descEn}</span>
                    <kbd className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] font-bold text-amber-400">
                      {sc.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
