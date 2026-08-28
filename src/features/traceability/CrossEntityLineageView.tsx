import React, { useState, useMemo } from 'react';
import {
  GitCommit,
  Layers,
  Building2,
  Calendar,
  DollarSign,
  ShoppingCart,
  FileCheck2,
  ListOrdered,
  Users,
  Search,
  Printer,
  Download,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Filter,
  ShieldCheck,
  Award,
  Sparkles,
  Eye,
  Info,
  Scale
} from 'lucide-react';
import { printHTML, createPrintDocument, getCustomFooterHTML } from '../../lib/printUtils';

interface CrossEntityLineageViewProps {
  lang: 'ar' | 'en';
  activeEntityFilter?: {
    type: 'project' | 'voucher' | 'beneficiary';
    id: string;
  };
  onNavigateToEntity?: (domain: string, id: string) => void;
}

interface LineageTraceRecord {
  id: string;
  strategic_plan_code: string;
  strategic_plan_title_ar: string;
  portfolio_code: string;
  portfolio_title_ar: string;
  program_code: string;
  program_title_ar: string;
  project_code: string;
  project_title_ar: string;
  wbs_activity_code: string;
  wbs_activity_title_ar: string;
  cost_center_code: string;
  cost_center_name_ar: string;
  coa_account_code: string;
  coa_account_name_ar: string;
  po_number: string;
  po_vendor_name: string;
  voucher_number: string;
  voucher_amount_yer: number;
  journal_entry_number: string;
  journal_date: string;
  meal_indicator_title: string;
  meal_compliance_pct: number;
  beneficiary_archetype: 'INDIVIDUAL' | 'FAMILY' | 'COMMUNITY_ENTITY';
  beneficiary_code: string;
  beneficiary_name_ar: string;
  beneficiary_location: string;
}

const DEFAULT_LINEAGE_TRACES: LineageTraceRecord[] = [
  {
    id: 'tr-01',
    strategic_plan_code: 'STRAT-2025-2030',
    strategic_plan_title_ar: 'الخطة الاستراتيجية الخمسية للأثر الإنساني المستدام',
    portfolio_code: 'PORT-WASH-2026',
    portfolio_title_ar: 'محفظة مشاريع المياه والإصحاح الريفي والتنمية البيئية',
    program_code: 'PRG-WASH-RURAL',
    program_title_ar: 'برنامج حفر وتأهيل الآبار بالطاقة الشمسية وشبكات المياه',
    project_code: 'PRJ-WASH-SABIR-01',
    project_title_ar: 'مشروع مياه وإصحاح ريف تعز وقرى جبل صبر الموادم',
    wbs_activity_code: 'WBS-1.2-SOLAR-PUMP',
    wbs_activity_title_ar: 'توريد وتركيب منظومة الضخ الكهروضوئية 25KW وتمديد الأنابيب',
    cost_center_code: 'CC-PRG-WASH-01',
    cost_center_name_ar: 'مركز تكلفة مشاريع المياه وإصحاح البيئة (WASH)',
    coa_account_code: '510103',
    coa_account_name_ar: 'نفقات تجهيزات الآبار ومنظومات الطاقة الشمسية للمياه',
    po_number: 'PO-2026-0814',
    po_vendor_name: 'شركة الأمل لحلول الطاقة والري الحديث',
    voucher_number: 'PV-2026-00412',
    voucher_amount_yer: 42500000,
    journal_entry_number: 'JV-2026-1189',
    journal_date: '2026-08-14',
    meal_indicator_title: 'مؤشر إسفير: 15 لتر ماء نقي/فرد/يوم بجودة معتمدة',
    meal_compliance_pct: 98.4,
    beneficiary_archetype: 'COMMUNITY_ENTITY',
    beneficiary_code: 'BEN-WELL-2026-0012',
    beneficiary_name_ar: 'بئر مياه الرحمة ومحطة الضخ بالطاقة الشمسية - قرية المشرعة',
    beneficiary_location: 'تعز • صبر الموادم • قرية المشرعة'
  },
  {
    id: 'tr-02',
    strategic_plan_code: 'STRAT-2025-2030',
    strategic_plan_title_ar: 'الخطة الاستراتيجية الخمسية للأثر الإنساني المستدام',
    portfolio_code: 'PORT-RELIEF-2026',
    portfolio_title_ar: 'محفظة الأمن الغذائي والاستجابة الإنسانية الطارئة',
    program_code: 'PRG-FOOD-SEC',
    program_title_ar: 'برنامج توزيع السلال الغذائية والدعم المعيشي للأسر المتعففة',
    project_code: 'PRJ-FOOD-BASKET-26',
    project_title_ar: 'مشروع السلال الغذائية الربعية للنازحين والأسر الأشد فقراً',
    wbs_activity_code: 'WBS-2.1-PACKING-DIST',
    wbs_activity_title_ar: 'تعبئة ونقل وتوزيع 8,500 سلة غذائية بمخيمات الساحل الغربي',
    cost_center_code: 'CC-PRG-FOOD-01',
    cost_center_name_ar: 'مركز تكلفة مشاريع الأمن الغذائي والسلال الإغاثية',
    coa_account_code: '510101',
    coa_account_name_ar: 'تكاليف المساعدات والسلال الغذائية العينية والمشتراة',
    po_number: 'PO-2026-0792',
    po_vendor_name: 'مجموعة التضامن للتجارة والاستيراد الغذائي',
    voucher_number: 'PV-2026-00388',
    voucher_amount_yer: 58200000,
    journal_entry_number: 'JV-2026-1045',
    journal_date: '2026-08-02',
    meal_indicator_title: 'مؤشر Sphere: تغطية 2100 سعرة حرارية يومياً للأسرة',
    meal_compliance_pct: 99.1,
    beneficiary_archetype: 'FAMILY',
    beneficiary_code: 'BEN-FAM-2026-0185',
    beneficiary_name_ar: 'أسرة النازح / عبده قاسم سعيد الشرعبي (7 أفراد)',
    beneficiary_location: 'الحديدة • الحالي • مخيم التضامن'
  },
  {
    id: 'tr-03',
    strategic_plan_code: 'STRAT-2025-2030',
    strategic_plan_title_ar: 'الخطة الاستراتيجية الخمسية للأثر الإنساني المستدام',
    portfolio_code: 'PORT-ORPHAN-2026',
    portfolio_title_ar: 'محفظة الحماية الاجتماعية والتمكين الأسري',
    program_code: 'PRG-ORPHAN-CARE',
    program_title_ar: 'برنامج الكفالة الشاملة والرعاية التعليمية والصحية للأيتام',
    project_code: 'PRJ-ORPHAN-KAFALA-26',
    project_title_ar: 'مشروع الكفالات النقدية الشهرية لأيتام المحافظات',
    wbs_activity_code: 'WBS-3.4-CASH-ALLOWANCE',
    wbs_activity_title_ar: 'صرف المستحقات والتحويلات النقدية الدورية عبر بنك الكريمي',
    cost_center_code: 'CC-PRG-ORPHAN-01',
    cost_center_name_ar: 'مركز تكلفة الرعاية الشاملة وكفالة الأيتام',
    coa_account_code: '510201',
    coa_account_name_ar: 'مخصصات الكفالات النقدية الشهرية للأيتام',
    po_number: 'SVC-2026-0120',
    po_vendor_name: 'بنك الكريمي للتمويل الأصغر الإسلامي',
    voucher_number: 'PV-2026-00435',
    voucher_amount_yer: 18500000,
    journal_entry_number: 'JV-2026-1210',
    journal_date: '2026-08-20',
    meal_indicator_title: 'مؤشر CHS 9: انتظام الصرف الشهري وقياس رضا الأوصياء',
    meal_compliance_pct: 100.0,
    beneficiary_archetype: 'INDIVIDUAL',
    beneficiary_code: 'BEN-IND-2026-0420',
    beneficiary_name_ar: 'اليتيم / أسامة محمد رضوان الحكيمي (11 سنة)',
    beneficiary_location: 'صنعاء • السبعين • حي القادسية'
  },
  {
    id: 'tr-04',
    strategic_plan_code: 'STRAT-2025-2030',
    strategic_plan_title_ar: 'الخطة الاستراتيجية الخمسية للأثر الإنساني المستدام',
    portfolio_code: 'PORT-SHELTER-2026',
    portfolio_title_ar: 'محفظة المأوى والمخيمات وإغاثة الطوارئ',
    program_code: 'PRG-SHELTER-CAMP',
    program_title_ar: 'برنامج تأهيل وتجهيز مخيمات الكرفانات والمأوى الانتقالي',
    project_code: 'PRJ-SHELTER-CAMP-26',
    project_title_ar: 'مشروع صيانة وتأهيل كرفانات النازحين وتوزيع مستلزمات الشتاء',
    wbs_activity_code: 'WBS-4.2-CARAVAN-REFURB',
    wbs_activity_title_ar: 'صيانة العوازل الحرارية وتأهيل 40 كرفانة سكنية بمأرب',
    cost_center_code: 'CC-PRG-SHELTER-01',
    cost_center_name_ar: 'مركز تكلفة الإيواء الطارئ ومخيمات النازحين (NFI)',
    coa_account_code: '510302',
    coa_account_name_ar: 'نفقات تجهيز وصيانة الكرفانات ومواد المأوى الانتقالي',
    po_number: 'PO-2026-0830',
    po_vendor_name: 'مؤسسة الصحراء للتجهيزات والمباني الجاهزة',
    voucher_number: 'PV-2026-00450',
    voucher_amount_yer: 24800000,
    journal_entry_number: 'JV-2026-1245',
    journal_date: '2026-08-25',
    meal_indicator_title: 'معايير Sphere للمأوى: مقاومة الطقس ومساحة 3.5م² لكل فرد',
    meal_compliance_pct: 96.5,
    beneficiary_archetype: 'COMMUNITY_ENTITY',
    beneficiary_code: 'BEN-SHEL-2026-0008',
    beneficiary_name_ar: 'تجمع كرفانات ومخيم الإيواء المؤقت - قطاع الجوبة',
    beneficiary_location: 'مأرب • الجوبة • مخيم الوادي'
  }
];

export default function CrossEntityLineageView({
  lang,
  activeEntityFilter,
  onNavigateToEntity
}: CrossEntityLineageViewProps) {
  const isRtl = lang === 'ar';

  const [traces] = useState<LineageTraceRecord[]>(DEFAULT_LINEAGE_TRACES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchetypeFilter, setSelectedArchetypeFilter] = useState<string>('all');
  const [selectedTrace, setSelectedTrace] = useState<LineageTraceRecord>(traces[0]);

  // Filter traces
  const filteredTraces = useMemo(() => {
    return traces.filter(t => {
      const q = searchTerm.toLowerCase();
      const matchQuery =
        t.project_title_ar.toLowerCase().includes(q) ||
        t.project_code.toLowerCase().includes(q) ||
        t.beneficiary_name_ar.toLowerCase().includes(q) ||
        t.beneficiary_code.toLowerCase().includes(q) ||
        t.voucher_number.toLowerCase().includes(q) ||
        t.cost_center_code.toLowerCase().includes(q);

      const matchArch = selectedArchetypeFilter === 'all' || t.beneficiary_archetype === selectedArchetypeFilter;

      return matchQuery && matchArch;
    });
  }, [traces, searchTerm, selectedArchetypeFilter]);

  // Official A4 Print of Lineage Trace
  const handlePrintLineageDossier = (record: LineageTraceRecord) => {
    const documentHTML = `
      <div style="font-family: 'Tajawal', sans-serif; direction: rtl; text-align: right; color: #0f172a; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #059669; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <img src="/UAMEX_ERPLOGO.png" style="height: 52px; object-fit: contain;" />
            <img src="/LogoRohamaab.png" style="height: 52px; object-fit: contain;" />
            <div>
              <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #059669;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h2>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">نظام يو امكس المؤسسي الشامل - وثيقة التدقيق والتكامل المؤسسي الشامل (End-to-End Lineage Dossier)</p>
            </div>
          </div>
          <div style="text-align: left; font-size: 10px; color: #64748b;">
            <div><strong>تاريخ التدقيق:</strong> ${new Date().toLocaleDateString('ar-YE')}</div>
            <div><strong>كود العملية:</strong> ${record.id.toUpperCase()}</div>
            <div><strong>معيار الامتثال:</strong> Sphere & IPSAS Audited</div>
          </div>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0; font-size: 13px; color: #166534; font-weight: 800;">${record.project_title_ar}</h3>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #15803d;">كود المشروع: ${record.project_code} • المستفيد النهائي: ${record.beneficiary_name_ar} (${record.beneficiary_code})</p>
          </div>
          <div style="text-align: left; font-family: monospace; font-size: 12px; font-weight: 800; color: #059669;">
            ${record.voucher_amount_yer.toLocaleString()} ر.ي
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #0f172a; color: #fbbf24;">
              <th style="border: 1px solid #334155; padding: 6px; width: 6%; text-align: center;">المستوى</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 22%;">الطبقة المؤسسية</th>
              <th style="border: 1px solid #334155; padding: 6px; width: 20%;">الكود / المرجع المعتمد</th>
              <th style="border: 1px solid #334155; padding: 6px;">البيان التفصيلي وحالة الارتباط والتحقق</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">1</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">الخطة الاستراتيجية</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${record.strategic_plan_code}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">${record.strategic_plan_title_ar}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">2</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">المحفظة التنموية</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${record.portfolio_code}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">${record.portfolio_title_ar}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">3</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">البرنامج الإنساني</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${record.program_code}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">${record.program_title_ar}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">4</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">المشروع المعتمد</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace; font-weight: bold;">${record.project_code}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${record.project_title_ar}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">5</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">حزمة العمل والنشاط WBS</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${record.wbs_activity_code}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">${record.wbs_activity_title_ar}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">6</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">مركز التكلفة والدليل IPSAS</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${record.cost_center_code} / ${record.coa_account_code}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">${record.cost_center_name_ar} • ${record.coa_account_name_ar}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">7</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">أمر التوريد والمشتريات PO</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${record.po_number}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">المورد: ${record.po_vendor_name} (مطابقة ثلاثية معتمدة)</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">8</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">سند الصرف المالي PV</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace; font-weight: bold;">${record.voucher_number}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #059669;">المبلغ: ${record.voucher_amount_yer.toLocaleString()} ر.ي (مدفوع ومعتمد)</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">9</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">قيد اليومية والأستاذ العام JV</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace;">${record.journal_entry_number}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">مرحل بتاريخ ${record.journal_date} في الأستاذ العام المزدوج</td>
            </tr>
            <tr style="background: #f0fdf4;">
              <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">10</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #166534;">المستفيد النهائي والرصد MEAL</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-family: monospace; font-weight: bold;">${record.beneficiary_code}</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">
                ${record.beneficiary_name_ar} • ${record.beneficiary_location}
                <div style="font-size: 9px; color: #059669; margin-top: 2px;">${record.meal_indicator_title} (${record.meal_compliance_pct}% مطابقة)</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 30px; display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; font-size: 11px;">
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">مسؤول الرصد والتقييم MEAL</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">د. سامية الشرعبي</p>
          </div>
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">رئيس الحسابات العامة</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">أ. عمار السقاف</p>
          </div>
          <div>
            <p style="margin-bottom: 35px; font-weight: bold; color: #475569;">المدير المالي والامتثال</p>
            <p style="font-weight: 800; border-top: 1px dashed #94a3b8; display: inline-block; padding-top: 4px; min-width: 140px;">أ. ياسر باوزير</p>
          </div>
        </div>

        ${getCustomFooterHTML('ar')}
      </div>
    `;

    const printDoc = createPrintDocument();
    printDoc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>وثيقة التدقيق والتكامل المؤسسي الشامل - ${record.project_code}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; background: #ffffff; }
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; }
            @page { size: A4 portrait; margin: 12mm; }
          }
        </style>
      </head>
      <body style="padding: 15px;">
        ${documentHTML}
      </body>
      </html>
    `);
    printDoc.close();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Guidance */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <GitCommit className="w-6 h-6 text-emerald-600" />
              <span>{isRtl ? 'جناح الترابط والتكامل المؤسسي الشامل (End-to-End Lineage Suite)' : 'Enterprise Cross-Entity Lineage Suite'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isRtl
                ? 'تتبع دورة حياة الأثر المتكاملة من الخطة الاستراتيجية ➔ المحفظة ➔ البرنامج ➔ المشروع ➔ حزم العمل ➔ مراكز التكلفة ➔ المشتريات ➔ السندات ➔ القيود ➔ المستفيدين والمتابعة MEAL.'
                : 'Complete 10-tier unbroken institutional chain linking strategic goals to field beneficiaries and verified impact.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrintLineageDossier(selectedTrace)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isRtl ? 'طباعة وثيقة التدقيق والتتبع A4' : 'Print Lineage Dossier'}</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <div className="relative flex-1 sm:w-80">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={isRtl ? 'بحث بالمشروع، المستفيد، السند، مركز التكلفة...' : 'Search by project, ben, voucher...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 ${
                isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedArchetypeFilter}
              onChange={e => setSelectedArchetypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">{isRtl ? 'كافة نماذج المستفيدين' : 'All Archetypes'}</option>
              <option value="INDIVIDUAL">{isRtl ? 'أفراد (أيتام، معاقين)' : 'Individuals'}</option>
              <option value="FAMILY">{isRtl ? 'أسر (أسر نازحة، متعففة)' : 'Families'}</option>
              <option value="COMMUNITY_ENTITY">{isRtl ? 'كيانات (آبار، مساجد، كرفانات)' : 'Community Entities'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Interactive 10-Tier Visual Lineage Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trace List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase">
            {isRtl ? 'سجلات التتبع المؤسسي المعتمدة' : 'Verified Lineage Records'} ({filteredTraces.length})
          </h3>

          <div className="space-y-2.5">
            {filteredTraces.map(trace => {
              const isSelected = trace.id === selectedTrace.id;

              return (
                <div
                  key={trace.id}
                  onClick={() => setSelectedTrace(trace)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {trace.project_code}
                    </span>
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                      {(trace.voucher_amount_yer / 1000000).toFixed(1)} م.ر.ي
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                    {trace.project_title_ar}
                  </h4>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                    <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{trace.beneficiary_name_ar}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400 border-t border-slate-100 dark:border-zinc-800/80">
                    <span>{trace.voucher_number}</span>
                    <span className="text-emerald-600 font-bold">CHS: {trace.meal_compliance_pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: 10-Layer Visual Connected Chain */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{isRtl ? 'سلسلة التتبع الشاملة للعملية' : 'End-to-End Lineage Chain'}</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{selectedTrace.project_title_ar}</h3>
              </div>
              <button
                onClick={() => handlePrintLineageDossier(selectedTrace)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-emerald-600"
                title={isRtl ? 'طباعة وثيقة التدقيق والتكامل' : 'Print'}
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>

            {/* The 10 Layer Chain */}
            <div className="relative space-y-3 before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
              {[
                {
                  tier: 1,
                  title: isRtl ? '1. الخطة الاستراتيجية المؤسسية الخمسية' : '1. Strategic Plan',
                  code: selectedTrace.strategic_plan_code,
                  desc: selectedTrace.strategic_plan_title_ar,
                  color: 'bg-indigo-600'
                },
                {
                  tier: 2,
                  title: isRtl ? '2. المحفظة التنموية والتمويلية' : '2. Portfolio',
                  code: selectedTrace.portfolio_code,
                  desc: selectedTrace.portfolio_title_ar,
                  color: 'bg-blue-600'
                },
                {
                  tier: 3,
                  title: isRtl ? '3. البرنامج الإنساني الرئيسي' : '3. Program',
                  code: selectedTrace.program_code,
                  desc: selectedTrace.program_title_ar,
                  color: 'bg-sky-600'
                },
                {
                  tier: 4,
                  title: isRtl ? '4. المشروع الميداني المعتمد' : '4. Approved Project',
                  code: selectedTrace.project_code,
                  desc: selectedTrace.project_title_ar,
                  color: 'bg-teal-600'
                },
                {
                  tier: 5,
                  title: isRtl ? '5. حزمة العمل والنشاط الميداني (WBS)' : '5. WBS Work Package',
                  code: selectedTrace.wbs_activity_code,
                  desc: selectedTrace.wbs_activity_title_ar,
                  color: 'bg-emerald-600'
                },
                {
                  tier: 6,
                  title: isRtl ? '6. مركز التكلفة وحسابات الدليل (IPSAS COA)' : '6. Cost Center & COA',
                  code: `${selectedTrace.cost_center_code} • ${selectedTrace.coa_account_code}`,
                  desc: `${selectedTrace.cost_center_name_ar} • ${selectedTrace.coa_account_name_ar}`,
                  color: 'bg-emerald-700'
                },
                {
                  tier: 7,
                  title: isRtl ? '7. أمر التوريد والمناقصات (Purchase Order)' : '7. Purchase Order (PO)',
                  code: selectedTrace.po_number,
                  desc: `المورد المعتمد: ${selectedTrace.po_vendor_name} (مطابقة ثلاثية مستندية)`,
                  color: 'bg-amber-600'
                },
                {
                  tier: 8,
                  title: isRtl ? '8. سند الصرف المالي المعتمد (Payment Voucher)' : '8. Payment Voucher (PV)',
                  code: selectedTrace.voucher_number,
                  desc: `المبلغ المعتمد: ${selectedTrace.voucher_amount_yer.toLocaleString()} ريال يمني`,
                  color: 'bg-orange-600'
                },
                {
                  tier: 9,
                  title: isRtl ? '9. قيد اليومية والأستاذ العام (General Ledger JV)' : '9. General Ledger Entry',
                  code: selectedTrace.journal_entry_number,
                  desc: `مرحل رسمياً بتاريخ ${selectedTrace.journal_date} في ميزان المراجعة`,
                  color: 'bg-purple-600'
                },
                {
                  tier: 10,
                  title: isRtl ? '10. سجل المستفيد النهائي والرصد والمساءلة (MEAL)' : '10. Final Beneficiary & MEAL',
                  code: selectedTrace.beneficiary_code,
                  desc: `${selectedTrace.beneficiary_name_ar} • ${selectedTrace.beneficiary_location} (${selectedTrace.meal_indicator_title} - مطابقة ${selectedTrace.meal_compliance_pct}%)`,
                  color: 'bg-rose-600'
                }
              ].map(step => (
                <div key={step.tier} className="relative flex items-start gap-4">
                  {/* Step Dot */}
                  <div className={`w-8 h-8 rounded-xl ${step.color} text-white flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-xs z-10`}>
                    {step.tier}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{step.title}</span>
                      <span className="font-mono text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                        {step.code}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
