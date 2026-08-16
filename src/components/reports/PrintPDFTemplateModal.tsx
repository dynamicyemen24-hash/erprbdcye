import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Eye, 
  Sliders, 
  Check, 
  Building2, 
  ShieldCheck, 
  Palette, 
  FileText,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { 
  buildProjectReportHTML, 
  buildFinancialStatementPDFHTML, 
  buildExecutiveReportPDFHTML,
  buildBeneficiaryReportPDFHTML,
  buildPredictiveReportPDFHTML,
  buildEvaluationReportPDFHTML,
  buildInterconnectedReportPDFHTML,
  buildStrategyReportPDFHTML,
  buildProgramsReportPDFHTML,
  buildActivitiesReportPDFHTML,
  buildStaffReportPDFHTML,
  generateAndDownloadPDF, 
  printPDFHTML,
  safeArray 
} from '../../lib/pdfReportGenerator';
import { useEnterprise } from '../../core/context/EnterpriseContext';

interface PrintPDFTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  type: 'project' | 'financial' | 'executive' | 'beneficiary' | 'predictive' | 'evaluation' | 'interconnected' | 'strategy' | 'programs' | 'projects' | 'activities' | 'staff';
  data: {
    projects?: any[];
    programs?: any[];
    beneficiaries?: any[];
    sponsorships?: any[];
    accounts?: any[];
    plans?: any[];
    goals?: any[];
    activities?: any[];
    users?: any[];
    financialType?: 'trial' | 'income' | 'balance_sheet';
    title?: string;
    subtitle?: string;
  };
}

export default function PrintPDFTemplateModal({
  isOpen,
  onClose,
  lang,
  type,
  data
}: PrintPDFTemplateModalProps) {
  const { activeOrg, orgName } = useEnterprise();
  const isRtl = lang === 'ar';

  // State customization
  const [reportTitle, setReportTitle] = useState(
    data.title || (type === 'project' 
      ? (isRtl ? 'تقرير الأداء التنفيذي للمشاريع الميدانية' : 'Field Projects Executive Performance Report')
      : (isRtl ? 'القوائم المالية والختامية المعيارية' : 'Standard Financial Statements'))
  );
  const [reportSubtitle, setReportSubtitle] = useState(
    data.subtitle || (type === 'project'
      ? (isRtl ? 'متابعة نسبة الإنجاز والموازنات والمستفيدين' : 'Tracking progress, budgets and beneficiaries')
      : (isRtl ? 'معدة وفق معايير IPSAS والمعايير الدولية المحاسبية' : 'Prepared according to IPSAS standards'))
  );

  const [accentColor, setAccentColor] = useState('#059669'); // Primary Emerald
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRiskMatrix, setIncludeRiskMatrix] = useState(type === 'project');
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [classification, setClassification] = useState<'OFFICIAL' | 'CONFIDENTIAL' | 'PUBLIC'>('OFFICIAL');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatedHTML = useMemo(() => {
    if (type === 'project' || type === 'projects') {
      return buildProjectReportHTML({
        projects: safeArray(data.projects),
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeRiskMatrix,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'strategy') {
      return buildStrategyReportPDFHTML({
        plans: safeArray(data.plans),
        goals: safeArray(data.goals),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'programs') {
      return buildProgramsReportPDFHTML({
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'activities') {
      return buildActivitiesReportPDFHTML({
        activities: safeArray(data.activities),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'executive') {
      return buildExecutiveReportPDFHTML({
        projects: safeArray(data.projects),
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'beneficiary') {
      return buildBeneficiaryReportPDFHTML({
        beneficiaries: safeArray(data.beneficiaries),
        sponsorships: safeArray(data.sponsorships),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'predictive') {
      return buildPredictiveReportPDFHTML({
        projects: safeArray(data.projects),
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'evaluation') {
      return buildEvaluationReportPDFHTML({
        projects: safeArray(data.projects),
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'staff') {
      return buildStaffReportPDFHTML({
        users: safeArray(data.users),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else if (type === 'interconnected') {
      return buildInterconnectedReportPDFHTML({
        projects: safeArray(data.projects),
        programs: safeArray(data.programs),
        title: reportTitle,
        subtitle: reportSubtitle,
        lang,
        accentColor,
        includeSummary,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    } else {
      return buildFinancialStatementPDFHTML({
        statementType: data.financialType || 'income',
        accounts: safeArray(data.accounts),
        title: reportTitle,
        lang,
        accentColor,
        includeSignatures,
        orgNameAr: activeOrg?.name_ar || orgName,
        orgNameEn: activeOrg?.name_en
      });
    }
  }, [type, data, reportTitle, reportSubtitle, lang, accentColor, includeSummary, includeRiskMatrix, includeSignatures, activeOrg, orgName]);

  if (!isOpen) return null;

  const handlePrint = () => {
    printPDFHTML(generatedHTML);
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    const cleanFileName = reportTitle.replace(/[^a-zA-Z0-9آ-ي]/g, '_') || 'NexoraOS_Report';
    await generateAndDownloadPDF(generatedHTML, cleanFileName);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white p-4 sm:px-6 flex justify-between items-center border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>{isRtl ? 'مصمم ومُولد تقارير PDF المعتمدة' : 'Official PDF Report & Print Generator'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  A4 / Print Ready
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">
                {isRtl ? 'تخصيص القوالب والترويسة الرسمية للتصدير والطباعة الخارجية' : 'Customize layout, branding header, signatures and export to PDF.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Controls Panel */}
          <div className="lg:col-span-4 p-5 bg-slate-50 border-r border-slate-200 overflow-y-auto space-y-5 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-black border-b border-slate-200 pb-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>{isRtl ? 'خيارات تخصيص التقرير' : 'Report Customization Options'}</span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isRtl ? 'عنوان التقرير الرئيسي:' : 'Report Title:'}
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isRtl ? 'العنوان الفرعي:' : 'Subtitle:'}
                </label>
                <input
                  type="text"
                  value={reportSubtitle}
                  onChange={(e) => setReportSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            {/* Accent Color Palette */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRtl ? 'اللون الرئيسي للترويسة:' : 'Header Accent Color:'}</span>
              </label>
              <div className="flex gap-2">
                {[
                  { name: 'زمردي', hex: '#059669' },
                  { name: 'كحلي', hex: '#1e3a8a' },
                  { name: 'عنابي', hex: '#991b1b' },
                  { name: 'ذهبي', hex: '#d97706' },
                  { name: 'داكن', hex: '#0f172a' }
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setAccentColor(color.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                      accentColor === color.hex ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {accentColor === color.hex && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sections Toggle */}
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <label className="block text-[11px] font-bold text-slate-700 mb-2">
                {isRtl ? 'مكونات المستند والقطاعات:' : 'Document Sections & Components:'}
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>{isRtl ? 'تضمين بطاقات المؤشرات الموحدة' : 'Include KPI Summary Cards'}</span>
              </label>

              {type === 'project' && (
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={includeRiskMatrix}
                    onChange={(e) => setIncludeRiskMatrix(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>{isRtl ? 'تضمين مصفوفة المخاطر والتخفيض' : 'Include Risk Mitigation Matrix'}</span>
                </label>
              )}

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>{isRtl ? 'تضمين مربع التوقيعات والختم الرسمي' : 'Include Official Signatures & Stamp'}</span>
              </label>
            </div>

            {/* Governance Badge Info */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 font-semibold space-y-1">
              <div className="flex items-center gap-1.5 font-black text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'مطابقة معايير الحوكمة والطباعة' : 'Compliant with Print & Governance'}</span>
              </div>
              <p className="text-[10px] text-emerald-700">
                {isRtl
                  ? 'المستند يحتوي على الترويسة المؤسسية الرسمية المعتمدة لجمعية رُحماء بينهم ومناسب للطباعة والتصدير المعياري.'
                  : 'Document contains certified Rohamā\'a Baynahum Charity Foundation headers and is print-ready.'}
              </p>
            </div>
          </div>

          {/* Live A4 Page Preview Panel */}
          <div className="lg:col-span-8 p-6 bg-slate-200/80 overflow-y-auto flex flex-col items-center">
            <div className="w-full max-w-[760px] bg-white shadow-2xl rounded-sm border border-slate-300 p-2 min-h-[800px] overflow-x-auto">
              {/* Dynamic HTML Output Preview */}
              <div 
                dangerouslySetInnerHTML={{ __html: generatedHTML }} 
                className="w-full text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex flex-wrap justify-between items-center gap-3">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>{isRtl ? 'نظام تشغيل المؤسسات الموحد - NexoraOS™' : 'NexoraOS™ Unified Operating System'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>{isRtl ? 'طباعة المستند / PDF المباشر' : 'Print Document / Direct PDF'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {isGenerating ? (
                <span>{isRtl ? 'جاري توليد ملف PDF...' : 'Generating PDF...'}</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isRtl ? 'تحميل ملف PDF' : 'Download PDF File'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
