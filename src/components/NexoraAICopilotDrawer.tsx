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
  ShieldCheck
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'copilot' | 'sops' | 'ipsas' | 'shortcuts'>('copilot');

  // AI State
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CopilotResponse | null>(null);
  
  // Model & Key Configuration
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('nexora_ai_model') || 'gemini-2.5-flash';
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

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('nexora_ai_model', model);
  };

  const handleKeySave = (key: string) => {
    setCustomKey(key);
    localStorage.setItem('nexora_gemini_api_key', key);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Str = event.target?.result as string;
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'application/octet-stream',
            data: base64Str,
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
          model: selectedModel,
          prompt: queryText,
          attachedFiles: attachedFiles,
          context: contextData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isRtl ? 'حدث خطأ أثناء معالجة الطلب عبر محرك Gemini' : 'Failed to process prompt via Gemini AI'));
      }

      setResult(data);
      if (!forcedPrompt) setPrompt('');
    } catch (err: any) {
      console.error('Copilot Error:', err);
      setError(err.message || (isRtl ? 'تعذر الاتصال بمركز الذكاء الاصطناعي المؤسسي' : 'Failed to connect to AI Hub'));
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
    { keys: 'F1', descAr: 'فتح درج الذكاء الاصطناعي والمساعدة الموحد', descEn: 'Open Help & Copilot Portal' },
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
          
          {/* Drawer Header */}
          <div className="p-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <span>{isRtl ? 'درج الذكاء والمساعدة الموحد' : 'Help & Copilot Portal'}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                    Nexora AI v3.2
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isRtl ? 'الذكاء الاصطناعي، المعايير الدولية IPSAS، والأدلة التشغيلية SOPs' : 'Gemini AI, IPSAS Standards & Unified SOPs Library'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  showConfig 
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                    : 'bg-zinc-900 border-zinc-800 text-slate-400 hover:text-white'
                }`}
                title={isRtl ? 'إعدادات المفتاح والمحرك' : 'AI Model & API Key Config'}
              >
                <Sliders className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Configuration Banner */}
          {showConfig && (
            <div className="p-4 bg-zinc-900/90 border-b border-amber-500/30 animate-in slide-in-from-top-2">
              <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إعدادات محرك Gemini والمفتاح المخصص' : 'Gemini Engine & Custom API Key'}</span>
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{isRtl ? 'اختيار نموذج الذكاء الاصطناعي:' : 'Select AI Model:'}</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Super Fast)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{isRtl ? 'مفتاح Gemini API الخارجي (اختياري):' : 'Custom Gemini API Key (Optional):'}</label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => handleKeySave(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Unified Navigation Tabs */}
          <div className="flex items-center gap-1 p-2 bg-zinc-900 border-b border-zinc-800 shrink-0 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'copilot'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRtl ? 'span' : '🤖 Gemini Copilot'}</span>
            </button>
            <button
              onClick={() => setActiveTab('sops')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sops'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isRtl ? '📖 الأدلة التشغيلية SOPs' : '📖 SOPs Library'}</span>
            </button>
            <button
              onClick={() => setActiveTab('ipsas')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ipsas'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{isRtl ? '🏛️ معايير IPSAS' : '🏛️ IPSAS Rules'}</span>
            </button>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'shortcuts'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Command className="w-3.5 h-3.5" />
              <span>{isRtl ? '⌨️ اختصارات Cmd+K' : '⌨️ Shortcuts'}</span>
            </button>
          </div>

          {/* Drawer Body Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* TAB 1: GEMINI COPILOT */}
            {activeTab === 'copilot' && (
              <div className="space-y-4">
                
                {/* Preset Quick Prompts */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isRtl ? 'تحليلات سريعة نقرة واحدة:' : 'One-Click Quick Analytics:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { titleAr: '🔍 تحليل الفجوات المالية والموازنات', titleEn: 'Budget Variance Analysis' },
                      { titleAr: '📊 التنبؤ بمعدل استدامة التمويل Runway', titleEn: 'Budget Runway Forecast' },
                      { titleAr: '🛡️ مصفوفة مخاطر الوصول والعمليات الميدانية', titleEn: 'Field Risk Assessment' },
                      { titleAr: '🌟 تقرير مطابقة معايير CHS و Sphere', titleEn: 'CHS & Sphere Audit' },
                      { titleAr: '🌐 تقرير المانحين وفق معيار الشفافية IATI', titleEn: 'IATI Donor Aid Compliance Report' }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(item.titleAr)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-emerald-950/40 border border-zinc-800 hover:border-emerald-500/50 rounded-lg text-xs text-zinc-300 hover:text-emerald-300 transition-all text-right cursor-pointer"
                      >
                        {isRtl ? item.titleAr : item.titleEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attached Files List */}
                {attachedFiles.length > 0 && (
                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'الملفات والمرفقات المحددة:' : 'Attached files for analysis:'}</span>
                    </span>
                    <div className="space-y-1.5">
                      {attachedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                          <span className="truncate text-zinc-300">{file.name} ({file.sizeMb} MB)</span>
                          <button onClick={() => removeAttachedFile(idx)} className="text-rose-400 hover:text-rose-300 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading Indicator */}
                {loading && (
                  <div className="p-6 bg-zinc-900/60 rounded-2xl border border-emerald-500/20 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                    <p className="text-xs font-bold text-emerald-300 animate-pulse">
                      {isRtl ? 'جاري معالجة الاستعلام المؤسسي وإجراء التحليل التنبؤي...' : 'Executing AI predictive reasoning & IPSAS cross-matching...'}
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* AI Result Card */}
                {result && !loading && (
                  <div className="p-4 bg-zinc-900/90 rounded-2xl border border-emerald-500/30 space-y-4 shadow-xl">
                    <div>
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Brain className="w-4 h-4" />
                        <span>{isRtl ? 'الملخص والتوصيات التنفيذية' : 'Executive AI Insights'}</span>
                      </h4>
                      <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                        {result.summary}
                      </p>
                    </div>

                    {result.key_findings && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-2">{isRtl ? 'النتائج والمؤشرات الرئيسية:' : 'Key Analytical Findings:'}</h4>
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {result.key_findings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800/60">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: SOPS LIBRARY */}
            {activeTab === 'sops' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isRtl ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    value={sopFilter}
                    onChange={(e) => setSopFilter(e.target.value)}
                    placeholder={isRtl ? 'البحث في قائمة الأدلة التشغيلية المعيارية...' : 'Search SOPs Library...'}
                    className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 text-xs text-zinc-100 placeholder:text-slate-500 outline-none focus:border-emerald-500`}
                  />
                </div>

                <div className="space-y-2">
                  {filteredSops.map((sop, idx) => (
                    <div key={idx} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">
                            {sop.code}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-100">{isRtl ? sop.titleAr : sop.titleEn}</h4>
                      </div>
                      {onNavigate && (
                        <button
                          onClick={() => {
                            onNavigate(sop.tab);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>{isRtl ? 'انتقال' : 'Go'}</span>
                          {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: IPSAS RULES */}
            {activeTab === 'ipsas' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
                  <p>{isRtl ? 'تعتمد كافة العمليات المحاسبية في NexoraOS™ على القيد المزدوج التوازني وسجل التدقيق غير القابل للتعديل المعتمد لـ IPSAS.' : 'All NexoraOS? financial transactions strictly comply with IPSAS double-entry equilibrium & immutable audit trailing.'}</p>
                </div>

                {IPSAS_RULES.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-400 font-mono">{rule.std}</span>
                      <span className="text-[10px] text-slate-400">{rule.titleEn}</span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-100">{isRtl ? rule.titleAr : rule.titleEn}</h4>
                    <p className="text-xs text-slate-400">{rule.descAr}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: SHORTCUTS */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isRtl ? 'دليل الاختصارات السريعة بلوحة المفاتيح:' : 'Keyboard Shortcuts Cheat Sheet:'}
                </span>

                {KEYBOARD_SHORTCUTS.map((item, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">{isRtl ? item.descAr : item.descEn}</span>
                    <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-emerald-400 shadow">
                      {item.keys}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Drawer Footer Input (Only visible when activeTab === 'copilot') */}
          {activeTab === 'copilot' && (
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,.pdf,.csv,.json,.txt,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-zinc-400 hover:text-amber-400 rounded-xl transition-all cursor-pointer shrink-0"
                  title={isRtl ? 'إرفاق صورة أو ملف' : 'Attach image or document'}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={isRtl ? 'اسأل مساعد الذكاء الاصطناعي المؤسسي...' : 'Ask Nexora AI Copilot...'}
                  className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-zinc-100 placeholder:text-slate-500 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || (!prompt.trim() && attachedFiles.length === 0)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer"
                >
                  <span>{isRtl ? 'تحليل' : 'Analyze'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
