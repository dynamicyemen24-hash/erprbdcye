import React, { useState } from 'react';
import { X, Printer, Download, FileText, ShieldCheck, CheckCircle2, Building2, User, Globe } from 'lucide-react';

interface HRDocumentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  employeeData?: any;
}

export default function HRDocumentGeneratorModal({
  isOpen,
  onClose,
  lang,
  employeeData
}: HRDocumentGeneratorModalProps) {
  if (!isOpen) return null;
  const isRtl = lang === 'ar';

  const [docType, setDocType] = useState<'permanent' | 'volunteer' | 'consultant' | 'daily_wage' | 'coi' | 'clearance'>('volunteer');
  const [unSector, setUnSector] = useState<string>('FSC');

  const empName = employeeData?.full_name_ar || employeeData?.name || (isRtl ? 'أحمد محمد المعمري' : 'Ahmad M. Al-Maamari');
  const empCode = employeeData?.employee_code || 'EMP-2026-089';
  const deptName = employeeData?.department_name || (isRtl ? 'إدارة المشاريع والتدخلات الإغاثية' : 'Relief Projects Department');

  const handlePrint = () => {
    window.print();
  };

  const unSectors = [
    { code: 'FSC', ar: '🌾 الأمن الغذائي والزراعة (Food Security)', en: 'Food Security Cluster (FSC)' },
    { code: 'WASH', ar: '💧 المياه والإصحاح البيئي (WASH)', en: 'Water & Sanitation (WASH)' },
    { code: 'HEALTH', ar: '🏥 الصحة والخدمات الطبية (Health)', en: 'Health & Nutrition' },
    { code: 'PROT', ar: '🛡️ الحماية وحماية الأطفال (Protection)', en: 'Child Protection' },
    { code: 'SHELTER', ar: '🏕️ الإيواء والمواد غير الغذائية (Shelter)', en: 'Shelter & NFI' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* MODAL HEADER */}
        <div className="p-4 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">
                {isRtl ? 'منشئ الوثائق والعقود المؤسسية المعتمدة (MDM & UN Standards)' : 'Institutional HR Document & Contract Generator'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isRtl ? 'صياغة العقود، اتفاقيات التطوع، ميثاق السلوك الإنساني وفق تصنيفات الأمم المتحدة MDM' : 'Standardized contracts, UN Cluster sectors & MDM governance categories.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer no-print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isRtl ? 'طباعة الوثيقة' : 'Print Document'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-400 no-print"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* UN HUMANITARIAN SECTOR SELECTOR STRIP */}
        <div className="p-2.5 bg-emerald-950/20 border-b border-emerald-500/20 flex items-center justify-between gap-2 overflow-x-auto text-xs font-bold shrink-0 no-print">
          <div className="flex items-center gap-1.5 text-emerald-400 shrink-0">
            <Globe className="w-4 h-4" />
            <span>{isRtl ? 'قطاع التدخل الدولي UN/IATI Cluster:' : 'UN Humanitarian Cluster Sector:'}</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {unSectors.map((sec) => (
              <button
                key={sec.code}
                onClick={() => setUnSector(sec.code)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                  unSector === sec.code
                    ? 'bg-emerald-600 text-white font-black'
                    : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {isRtl ? sec.ar : sec.en}
              </button>
            ))}
          </div>
        </div>

        {/* DOCUMENT TYPE SELECTOR STRIP */}
        <div className="p-2 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-xs font-bold shrink-0 no-print">
          {[
            { id: 'volunteer', ar: '🤝 اتفاقية تطوع ميداني (VOL_FIELD)', en: 'Volunteer Agreement' },
            { id: 'permanent', ar: '👔 عقد عمل دائم (PERM_FULL)', en: 'Permanent Employment Contract' },
            { id: 'consultant', ar: '💼 عقد خدمات استشارية (EXT_CONSULT)', en: 'Consultancy Services' },
            { id: 'daily_wage', ar: '🛠️ اتفاقية تعاون بأجر يومي (DAILY_WAGE)', en: 'Daily Wage Work' },
            { id: 'coi', ar: '🛡️ إقرار النزاهة والسلوك', en: 'Integrity & COI Policy' },
            { id: 'clearance', ar: '📋 إخلاء طرف واستلام عهدة', en: 'Asset Clearance Form' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setDocType(type.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                docType === type.id
                  ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              {isRtl ? type.ar : type.en}
            </button>
          ))}
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white text-slate-900 font-sans leading-relaxed text-xs space-y-6">
          
          {/* HEADER LOGO STRIP */}
          <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-4">
            <div className="space-y-1">
              <h2 className="text-base font-black text-emerald-800">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
              <p className="text-[10px] text-slate-500 font-bold">Rohamā'a Baynahum Charity Foundation — NexoraOS Enterprise Standard</p>
            </div>
            <div className="text-left rtl:text-right font-mono text-[10px] text-slate-500">
              <p>Ref: ROH-HR-2026-DOC</p>
              <p>UN Cluster: <span className="font-bold text-emerald-700">{unSector}</span></p>
              <p>Date: {new Date().toLocaleDateString('ar-YE')}</p>
            </div>
          </div>

          {/* DOCUMENT CONTENT SWITCHER */}
          {docType === 'volunteer' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-center text-slate-900 bg-slate-100 py-2 rounded border border-slate-200">
                اتفاقية تطوع ميداني وميثاق السلوك الإنساني — قطاع ({unSectors.find(s => s.code === unSector)?.ar})
              </h3>
              <p>
                تم الاتفاق بين <strong>جمعية رُحماء بينهم للعمل الإنساني</strong> (الطرف الأول) والأخ/ت: <strong>{empName}</strong> (الطرف الثاني - متطوع ميداني) الرقم الوظيفي: <code>{empCode}</code> على التردد والمساهمة التطوعية في قطاع التدخل الإنساني الدولي: <strong>{unSectors.find(s => s.code === unSector)?.en}</strong>.
              </p>

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-black text-slate-800">البنود والتعهدات الرئيسية:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>الالتزام التام بالمعايير الإنسانية الدولية (Sphere Project & Core Humanitarian Standard - CHS).</li>
                  <li>العمل على توزيع المساعدات بشفافية وعدم التمييز بين المستفيدين بناءً على أي اعتبارات.</li>
                  <li>الحفاظ على سرية بيانات المستفيدين والأيتام المسجلين في النظام.</li>
                  <li>تحسب الساعات التطوعية وفق نظام نقاط الأثر الميداني المعتمد في NexoraOS.</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200">
                <div className="text-center space-y-4">
                  <p className="font-bold text-slate-700">توقيع المتطوع الميداني:</p>
                  <p className="text-slate-400 italic">__________________</p>
                </div>
                <div className="text-center space-y-4">
                  <p className="font-bold text-slate-700">اعتماد مدير الموارد البشرية:</p>
                  <p className="text-slate-400 italic">__________________</p>
                </div>
              </div>
            </div>
          )}

          {docType === 'permanent' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-center text-slate-900 bg-slate-100 py-2 rounded border border-slate-200">
                عقد عمل كادر دائم (Permanent Employment Contract - PERM_FULL)
              </h3>
              <p>
                إنه في يوم {new Date().toLocaleDateString('ar-YE')} اتفق الطرفان على تعيين الأخ/ت: <strong>{empName}</strong> بموجب عقد عمل دائم في وظيفة: <strong>منسق مشاريع إغاثية</strong> بإدارة: <strong>{deptName}</strong> ضمن قطاع: <strong>{unSector}</strong>.
              </p>
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-black text-slate-800">الشروط والالتزامات المالية:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>يخضع الموظف لدرجة وظيفية معتمدة براتب أساسي وبدلات مدرحة في مسير الرواتب IPSAS.</li>
                  <li>الالتزام بساعات الدوام الرسمية ونظام البصمة الرقمية المعتمد.</li>
                  <li>يستحق الموظف إجازة سنوية مدفوعة الأجر قدرها 30 يوماً تقسم وفق الجدول المعتمد.</li>
                </ul>
              </div>
            </div>
          )}

          {docType === 'consultant' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-center text-slate-900 bg-slate-100 py-2 rounded border border-slate-200">
                عقد خدمات استشارية (Consultancy Services Agreement - EXT_CONSULT)
              </h3>
              <p>
                اتفاقية تقديم خدمات استشارية متخصصة لتقييم الأثر الميداني في قطاع <strong>{unSector}</strong> وإعداد تقارير المانحين بين الجمعية والاستشاري/خبير: <strong>{empName}</strong>.
              </p>
            </div>
          )}

          {docType === 'daily_wage' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-center text-slate-900 bg-slate-100 py-2 rounded border border-slate-200">
                اتفاقية تعاون ميداني بأجر يومي (Daily Wage Field Work Agreement - DAILY_WAGE)
              </h3>
              <p>
                اتفاقية إنجاز مهمة ميدانية محددة (حملة توزيع إغاثية / حفر آبار) بالأجر اليومي المعتمد في الموازنة لقطاع <strong>{unSector}</strong>.
              </p>
            </div>
          )}

          {docType === 'coi' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-center text-slate-900 bg-slate-100 py-2 rounded border border-slate-200">
                إقرار عدم تعارض المصالح وميثاق النزاهة (Conflict of Interest Declaration)
              </h3>
              <p>
                يتعهد المقر الأخ/ت: <strong>{empName}</strong> بعدم وجود أي تعارض مصالح مباشر أو غير مباشر في جميع المعاملات والمشتريات وتوزيع المساعدات.
              </p>
            </div>
          )}

          {docType === 'clearance' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-center text-slate-900 bg-slate-100 py-2 rounded border border-slate-200">
                نموذج إخلاء طرف واستلام عهدة (Asset Clearance & Custody Form)
              </h3>
              <p>
                توثيق استلام وتسليم العهد العينية والأجهزة الرقمية والبطاقات الوظيفية الخاصة بـ <strong>{empName}</strong>.
              </p>
            </div>
          )}

          {/* FOOTER VERIFICATION BAR */}
          <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-400 font-mono flex justify-between items-center">
            <span>Verified by NexoraOS Audit Vault (MDM Governed)</span>
            <span>Category Code: HR_WORKFORCE_TYPE | Sector: {unSector}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
