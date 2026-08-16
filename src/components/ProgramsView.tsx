import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter, 
  Layers, 
  Calendar, 
  DollarSign, 
  User, 
  TrendingUp, 
  Check, 
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Program } from '../types';

interface ProgramsViewProps {
  programs: Program[];
  loading: boolean;
  onRefresh: () => void;
  lang: 'ar' | 'en';
  initialStatusFilter?: string;
}

export default function ProgramsView({ programs, loading, onRefresh, lang, initialStatusFilter }: ProgramsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || 'all');

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form fields
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [categoryCode, setCategoryCode] = useState('HUMANITARIAN');
  const [statusCode, setStatusCode] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('0');
  const [currencyCode, setCurrencyCode] = useState('YER');
  const [progressPercent, setProgressPercent] = useState('0');
  const [targetBeneficiaries, setTargetBeneficiaries] = useState('0');
  const [actualBeneficiaries, setActualBeneficiaries] = useState('0');
  const [programType, setProgramType] = useState('general');
  const [phaseCode, setPhaseCode] = useState('planning');
  const [priorityCode, setPriorityCode] = useState('medium');
  const [objectives, setObjectives] = useState('');
  const [riskLevel, setRiskLevel] = useState('medium');

  // Load form for editing or new creation
  const openModal = (program: Program | null = null) => {
    setSelectedProgram(program);
    setFormError(null);
    if (program) {
      setCode(program.code || '');
      setNameAr(program.name_ar || '');
      setNameEn(program.name_en || '');
      setDescription(program.description || '');
      setCategoryCode(program.category_code || 'HUMANITARIAN');
      setStatusCode(program.status_code || 'active');
      setStartDate(program.start_date ? program.start_date.substring(0, 10) : '');
      setEndDate(program.end_date ? program.end_date.substring(0, 10) : '');
      setBudget(program.budget || '0');
      setCurrencyCode(program.currency_code || 'YER');
      setProgressPercent(program.progress_percent || '0');
      setTargetBeneficiaries(String(program.target_beneficiaries || '0'));
      setActualBeneficiaries(String(program.actual_beneficiaries || '0'));
      setProgramType(program.program_type || 'general');
      setPhaseCode(program.phase_code || 'planning');
      setPriorityCode(program.priority_code || 'medium');
      setObjectives(program.objectives || '');
      setRiskLevel(program.risk_level || 'medium');
    } else {
      // Defaults
      setCode(`PROG-${Date.now().toString().slice(-4)}`);
      setNameAr('');
      setNameEn('');
      setDescription('');
      setCategoryCode('HUMANITARIAN');
      setStatusCode('active');
      setStartDate(new Date().toISOString().substring(0, 10));
      setEndDate(new Date(Date.now() + 365*24*60*60*1000).toISOString().substring(0, 10));
      setBudget('1000000');
      setCurrencyCode('YER');
      setProgressPercent('0');
      setTargetBeneficiaries('1000');
      setActualBeneficiaries('0');
      setProgramType('general');
      setPhaseCode('planning');
      setPriorityCode('medium');
      setObjectives('');
      setRiskLevel('medium');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const payload = {
      code,
      name_ar: nameAr,
      name_en: nameEn,
      description,
      category_code: categoryCode,
      status_code: statusCode,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      budget,
      currency_code: currencyCode,
      progress_percent: progressPercent,
      target_beneficiaries: parseInt(targetBeneficiaries) || 0,
      actual_beneficiaries: parseInt(actualBeneficiaries) || 0,
      program_type: programType,
      phase_code: phaseCode,
      priority_code: priorityCode,
      objectives,
      risk_level: riskLevel,
      security_level: 3,
    };

    try {
      const url = selectedProgram 
        ? `/api/tables/programs/${selectedProgram.id}` 
        : `/api/tables/programs`;
      
      const response = await fetch(url, {
        method: selectedProgram ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save record.');
      }

      onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmation = lang === 'ar' 
      ? 'هل أنت متأكد من حذف هذا البرنامج؟ سيتم إخفاء البرنامج من قائمة البرامج النشطة.'
      : 'Are you sure you want to delete this program? It will be soft-deleted in the database.';
    
    if (!window.confirm(confirmation)) return;

    try {
      const response = await fetch(`/api/tables/programs/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete program.');
      }
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Filter programs logic
  const filtered = programs.filter(prog => {
    const matchesSearch = 
      (prog.name_ar && prog.name_ar.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prog.name_en && prog.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prog.code && prog.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prog.description && prog.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || prog.category_code === categoryFilter;
    const matchesStatus = statusFilter === 'all' || prog.status_code === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatCurrency = (amount: string | null) => {
    const val = parseFloat(amount || '0');
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-YE' : 'en-US', {
      style: 'currency',
      currency: 'YER',
      maximumFractionDigits: 0
    }).format(val);
  };

  const categories = [
    { code: 'HUMANITARIAN', label_ar: 'إغاثة إنسانية', label_en: 'Humanitarian Relief' },
    { code: 'EDUCATIONAL', label_ar: 'البرامج التعليمية والتحفيظ', label_en: 'Educational & Quran' },
    { code: 'DAWAH', label_ar: 'البرامج الدعوية والتوعوية', label_en: 'Dawah & Awareness' },
    { code: 'RELIEF', label_ar: 'البرامج الإغاثية والسلال', label_en: 'Relief & Baskets' },
    { code: 'WATER', label_ar: 'برامج السقيا والمياه', label_en: 'Water Projects' },
    { code: 'KITCHENS', label_ar: 'المطابخ الخيرية والإطعام', label_en: 'Charity Kitchens' },
    { code: 'SEASONAL', label_ar: 'البرامج الموسمية (رمضان، الأضاحي)', label_en: 'Seasonal Programs' },
    { code: 'COMMUNITY', label_ar: 'البرامج والتنمية المجتمعية', label_en: 'Community Development' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            {lang === 'ar' ? 'البرامج التنموية والإنسانية' : 'Core Programs Directory'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {lang === 'ar' ? 'استعراض وإكمال سجلات البرامج، خطط التنفيذ، الموازنات والمستهدفين كجزء من سجلات الأساس للمؤسسة' : 'View, edit, and complete strategic program records, budgets, and beneficiary goals'}
          </p>
        </div>

        <button
          onClick={() => openModal(null)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow transition-all duration-150 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ar' ? 'برنامج جديد' : 'Add New Program'}</span>
        </button>
      </div>

      {/* Filters Board */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-zinc-400" style={lang === 'en' ? { right: 'auto', left: '12px' } : {}} />
          <input 
            type="text"
            placeholder={lang === 'ar' ? 'ابحث باسم البرنامج، الرمز أو الوصف...' : 'Search programs name, code...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-amber-500 transition-all outline-none"
            style={lang === 'en' ? { paddingLeft: '36px', paddingRight: '12px' } : {}}
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-medium"
          >
            <option value="all">{lang === 'ar' ? 'كل الفئات' : 'All Categories'}</option>
            {categories.map(cat => (
              <option key={cat.code} value={cat.code}>
                {lang === 'ar' ? cat.label_ar : cat.label_en}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-medium"
          >
            <option value="all">{lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="planning">{lang === 'ar' ? 'تخطيط' : 'Planning'}</option>
            <option value="completed">{lang === 'ar' ? 'مكتمل' : 'Completed'}</option>
          </select>
        </div>
      </div>

      {/* Program Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3 bg-white border border-slate-200 rounded-xl">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-zinc-400 font-medium">{lang === 'ar' ? 'جاري جلب البرامج...' : 'Retrieving programs list...'}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(prog => {
            const hasDates = prog.start_date || prog.end_date;
            const progress = parseFloat(prog.progress_percent || '0');
            const target = prog.target_beneficiaries || 0;
            const actual = prog.actual_beneficiaries || 0;
            const targetMetPercent = target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;

            return (
              <div 
                key={prog.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Card Header Banner */}
                <div className="p-5 border-b border-slate-100 flex-1 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-bold font-mono uppercase">
                          {prog.code}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          prog.status_code === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          prog.status_code === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          {prog.status_code === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') :
                           prog.status_code === 'completed' ? (lang === 'ar' ? 'مكتمل' : 'Completed') :
                           (lang === 'ar' ? 'تخطيط' : 'Planning')}
                        </span>
                      </div>
                      <h2 className="text-sm font-black text-slate-800 leading-tight pt-1">
                        {lang === 'ar' ? prog.name_ar : (prog.name_en || prog.name_ar)}
                      </h2>
                    </div>
                  </div>

                  {prog.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {prog.description}
                    </p>
                  )}

                  {/* Program stats & progress */}
                  <div className="space-y-3 pt-2">
                    {/* Progress tracking */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-zinc-400">{lang === 'ar' ? 'نسبة الإنجاز الميداني' : 'Field Progress'}</span>
                        <span className="text-amber-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>

                    {/* Financial & Beneficiaries split */}
                    <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 space-y-0.5">
                        <span className="text-zinc-400 block text-[9px] font-bold uppercase">{lang === 'ar' ? 'الميزانية المخصصة' : 'Allocated Budget'}</span>
                        <span className="font-extrabold text-slate-700">{formatCurrency(prog.budget)}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 space-y-0.5">
                        <span className="text-zinc-400 block text-[9px] font-bold uppercase">{lang === 'ar' ? 'المستفيدين الميدانيين' : 'Beneficiaries Met'}</span>
                        <span className="font-extrabold text-slate-700">
                          {actual > 0 ? `${actual} / ${target}` : `${target} ${lang === 'ar' ? 'مستهدف' : 'target'}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer with actions */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {hasDates 
                        ? `${prog.start_date ? prog.start_date.substring(0, 10) : ''} - ${prog.end_date ? prog.end_date.substring(0, 10) : ''}`
                        : (lang === 'ar' ? 'غير محدد' : 'No dates set')
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openModal(prog)}
                      className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded transition-all"
                      title={lang === 'ar' ? 'تعديل البيانات' : 'Edit program'}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(prog.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded transition-all"
                      title={lang === 'ar' ? 'حذف البرنامج' : 'Delete program'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 p-12 rounded-xl text-center shadow-sm space-y-4">
          <Layers className="w-12 h-12 text-zinc-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-700">{lang === 'ar' ? 'لا توجد برامج مطابقة للبحث' : 'No matching programs found'}</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {lang === 'ar' ? 'أضف برامج جديدة لتعبئة وإكمال سجلات الأساس وإعدادات موازنات التنمية للمؤسسة.' : 'Try adjusting your search criteria or add a new program record.'}
            </p>
          </div>
          <button 
            onClick={() => openModal(null)}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
          >
            {lang === 'ar' ? 'إضافة برنامج جديد' : 'Create Program Record'}
          </button>
        </div>
      )}

      {/* Program Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {selectedProgram 
                    ? (lang === 'ar' ? 'تعديل سجل البرنامج' : 'Edit Program Record') 
                    : (lang === 'ar' ? 'إضافة برنامج تنموي/إنساني جديد' : 'Add New core Program')
                  }
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {lang === 'ar' ? 'تعبئة كود الترميز والميزانيات المعتمدة وخطط نسب المنجز' : 'Configure code mapping, approved budget, and tracking points'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-white hover:bg-slate-100 rounded-full border border-slate-200 text-zinc-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Grid 1: Codes and Names */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'كود البرنامج (الرمز)' : 'Program Code'}</label>
                  <input 
                    type="text" 
                    required 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. WATER-YER"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'اسم البرنامج (بالعربية)' : 'Arabic Name'}</label>
                  <input 
                    type="text" 
                    required 
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="e.g. برنامج كفالة الأيتام"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الاسم بالإنجليزية (اختياري)' : 'English Name'}</label>
                  <input 
                    type="text" 
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Orphan Sponsorship Program"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Grid 2: Categories, Statuses */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'تصنيف ومجال العمل' : 'Program Category'}</label>
                  <select 
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-semibold text-slate-700"
                  >
                    {categories.map(cat => (
                      <option key={cat.code} value={cat.code}>
                        {lang === 'ar' ? cat.label_ar : cat.label_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'حالة البرنامج الحالي' : 'Operational Status'}</label>
                  <select 
                    value={statusCode}
                    onChange={(e) => setStatusCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-semibold text-slate-700"
                  >
                    <option value="active">{lang === 'ar' ? 'نشط ميدانياً' : 'Active'}</option>
                    <option value="planning">{lang === 'ar' ? 'قيد التخطيط' : 'Planning'}</option>
                    <option value="completed">{lang === 'ar' ? 'مكتمل ومقفل' : 'Completed'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'مستوى الأولوية' : 'Priority Level'}</label>
                  <select 
                    value={priorityCode}
                    onChange={(e) => setPriorityCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none text-slate-700"
                  >
                    <option value="high">{lang === 'ar' ? 'مرتفعة جداً' : 'High'}</option>
                    <option value="medium">{lang === 'ar' ? 'متوسطة' : 'Medium'}</option>
                    <option value="low">{lang === 'ar' ? 'منخفضة' : 'Low'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'مستوى المخاطر' : 'Risk Level'}</label>
                  <select 
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none text-slate-700"
                  >
                    <option value="high">{lang === 'ar' ? 'مرتفعة' : 'High'}</option>
                    <option value="medium">{lang === 'ar' ? 'متوسطة' : 'Medium'}</option>
                    <option value="low">{lang === 'ar' ? 'منخفضة' : 'Low'}</option>
                  </select>
                </div>
              </div>

              {/* Grid 3: Budget and dates */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'الموازنة المعتمدة (بالريال)' : 'Approved Budget'}</label>
                  <input 
                    type="number" 
                    required 
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'المنجز الفعلي (%)' : 'Field Progress %'}</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    required 
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold text-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'تاريخ البدء المخطط' : 'Start Date'}</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'تاريخ الانتهاء المتوقع' : 'End Date'}</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Grid 4: Beneficiaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'المستهدفين من المستفيدين (عدد)' : 'Target Beneficiaries Count'}</label>
                  <input 
                    type="number" 
                    value={targetBeneficiaries}
                    onChange={(e) => setTargetBeneficiaries(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">{lang === 'ar' ? 'المستفيدين الذين تم الوصول إليهم فعلياً' : 'Actual Beneficiaries Served'}</label>
                  <input 
                    type="number" 
                    value={actualBeneficiaries}
                    onChange={(e) => setActualBeneficiaries(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase">{lang === 'ar' ? 'الوصف والنطاق الجغرافي للبرنامج' : 'Program Description & Scope'}</label>
                <textarea 
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب تفاصيل النطاق، والمحافظات المستهدفة...' : 'Add program scopes, details...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none resize-none"
                />
              </div>

              {/* Objectives (goals) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase">{lang === 'ar' ? 'أهداف التنمية والتحقيق المستدامة للبرنامج' : 'Program Key Objectives'}</label>
                <textarea 
                  rows={2}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder={lang === 'ar' ? 'حدد الأهداف الاستراتيجية بدقة...' : 'Strategic goals of this program...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:bg-white outline-none resize-none"
                />
              </div>
            </form>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={handleSave}
                disabled={formSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1 transition-all"
              >
                {formSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'ar' ? 'حفظ السجل' : 'Save Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
