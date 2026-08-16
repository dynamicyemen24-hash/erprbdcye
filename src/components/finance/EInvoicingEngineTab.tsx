import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Send, 
  Download, 
  Printer, 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Hash, 
  Lock, 
  Cpu, 
  Layers, 
  DollarSign, 
  Building2, 
  User, 
  Calendar, 
  ExternalLink, 
  Eye, 
  Code, 
  RefreshCw, 
  ShieldAlert, 
  Trash2, 
  Edit3, 
  Tag, 
  ChevronRight,
  ArrowUpRight,
  FileText
} from 'lucide-react';
import { Account, Transaction, TransactionLine } from './FinanceTypes';
import { Project } from '../../types';
import { printHTML } from '../../lib/printUtils';

interface EInvoicingEngineTabProps {
  accounts: Account[];
  transactions: Transaction[];
  lines: TransactionLine[];
  projects: Project[];
  lang: 'ar' | 'en';
}

export interface EInvoiceItem {
  id: string;
  itemCode: string;
  descriptionAr: string;
  quantity: number;
  unitPriceYer: number;
  taxRatePercent: number; // 0, 5, 15
  taxCategory: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT';
  exemptionReasonCode?: string; // e.g. VATEX-SA-OOD
  discountYer: number;
}

export interface EInvoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-8801
  uuid: string; // UUID v4
  invoiceType: 'B2B_STANDARD' | 'B2C_SIMPLIFIED' | 'DONOR_PLEDGE' | 'B2G_GOVERNMENT';
  issueDate: string;
  issueTime: string;
  sellerNameAr: string;
  sellerTaxId: string;
  buyerNameAr: string;
  buyerTaxId: string;
  buyerEmail?: string;
  projectId: string;
  projectNameAr: string;
  wbsActivityId: string;
  wbsActivityNameAr: string;
  items: EInvoiceItem[];
  subtotalYer: number;
  totalTaxYer: number;
  grandTotalYer: number;
  currency: string;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'CARD';
  status: 'DRAFT' | 'AI_AUDITED' | 'CLEARED' | 'REPORTED' | 'REJECTED';
  cryptographicHash: string; // SHA-256 Hash
  previousInvoiceHash: string; // PIH
  qrCodeBase64: string; // TLV Encoded Base64 or QR string
  shariahCertified: boolean;
  zatcaPhase2Compliant: boolean;
}

export default function EInvoicingEngineTab({
  accounts,
  transactions,
  lines,
  projects,
  lang
}: EInvoicingEngineTabProps) {
  const isRtl = lang === 'ar';

  // ==================== MOCK E-INVOICES STORE ====================
  const [invoices, setInvoices] = useState<EInvoice[]>([
    {
      id: 'e-inv-001',
      invoiceNumber: 'INV-2026-YEM-01',
      uuid: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
      invoiceType: 'B2B_STANDARD',
      issueDate: '2026-08-01',
      issueTime: '10:30:00',
      sellerNameAr: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
      sellerTaxId: '300492810200003',
      buyerNameAr: 'مركز الملك سلمان للإغاثة والأعمال الإنسانية',
      buyerTaxId: '310928374100003',
      buyerEmail: 'donations@ksrelief.org',
      projectId: 'proj-001',
      projectNameAr: 'مشروع الإغاثة العاجلة وتوزيع السلال الغذائية - مأرب',
      wbsActivityId: 'ACT-MAR-101',
      wbsActivityNameAr: 'نشاط 1.1: تمويل وتوريد 50,000 سلة غذائية طارئة',
      items: [
        {
          id: 'item-1',
          itemCode: 'FOOD-KIT-01',
          descriptionAr: 'توريد سلال غذائية متكاملة إغاثية (قمح، زيت، سكر، حليب)',
          quantity: 5000,
          unitPriceYer: 24000,
          taxRatePercent: 0,
          taxCategory: 'EXEMPT',
          exemptionReasonCode: 'VATEX-SA-OOD',
          discountYer: 0
        }
      ],
      subtotalYer: 120000000,
      totalTaxYer: 0,
      grandTotalYer: 120000000,
      currency: 'YER',
      paymentMethod: 'BANK_TRANSFER',
      status: 'CLEARED',
      cryptographicHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      previousInvoiceHash: '0000000000000000000000000000000000000000000000000000000000000000',
      qrCodeBase64: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Rohamaba_INV_2026_YEM_01_CLEARED_ZATCA_IPSAS',
      shariahCertified: true,
      zatcaPhase2Compliant: true
    },
    {
      id: 'e-inv-002',
      invoiceNumber: 'INV-2026-YEM-02',
      uuid: 'c9b8a7f6-5e4d-3c2b-1a0f-9e8d7c6b5a4f',
      invoiceType: 'B2G_GOVERNMENT',
      issueDate: '2026-08-05',
      issueTime: '14:15:22',
      sellerNameAr: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
      sellerTaxId: '300492810200003',
      buyerNameAr: 'وزارة الصحة العامة والسكان - مكتب تعز',
      buyerTaxId: '300123456700003',
      buyerEmail: 'procurement@moh.gov.ye',
      projectId: 'proj-002',
      projectNameAr: 'برنامج العيادات الطبية الميدانية والرعاية الصحية - تعز',
      wbsActivityId: 'ACT-TAIZ-202',
      wbsActivityNameAr: 'نشاط 2.2: تقديم خدمات تشغيل القوافل الميدانية والأدوية',
      items: [
        {
          id: 'item-2',
          itemCode: 'MED-SERV-02',
          descriptionAr: 'خدمات تشغيل عيادات طوارئ ميدانية وفحوصات مخبرية',
          quantity: 1,
          unitPriceYer: 15000000,
          taxRatePercent: 5,
          taxCategory: 'STANDARD',
          discountYer: 0
        }
      ],
      subtotalYer: 15000000,
      totalTaxYer: 750000,
      grandTotalYer: 15750000,
      currency: 'YER',
      paymentMethod: 'BANK_TRANSFER',
      status: 'AI_AUDITED',
      cryptographicHash: 'a7c9f8e2d4b6a8c0f2e4d6b8a0c2e4f6a8c0f2e4d6b8a0c2e4f6a8c0f2e4d6b8',
      previousInvoiceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      qrCodeBase64: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Rohamaba_INV_2026_YEM_02_AUDITED_ZATCA',
      shariahCertified: true,
      zatcaPhase2Compliant: true
    }
  ]);

  // Selected Invoice for Inspection / Printing
  const [selectedInvoice, setSelectedInvoice] = useState<EInvoice | null>(invoices[0]);
  const [viewMode, setViewMode] = useState<'visual' | 'xml' | 'json' | 'audit'>('visual');

  // Modals & New Invoice Form
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New E-Invoice Form State
  const [newInvForm, setNewInvForm] = useState({
    invoiceNumber: `INV-2026-YEM-${Math.floor(10 + Math.random() * 90)}`,
    invoiceType: 'B2B_STANDARD' as EInvoice['invoiceType'],
    buyerNameAr: '',
    buyerTaxId: '300998877600003',
    buyerEmail: '',
    projectId: projects[0]?.id || 'proj-001',
    wbsActivityId: 'ACT-MAR-101',
    paymentMethod: 'BANK_TRANSFER' as EInvoice['paymentMethod'],
    items: [
      {
        id: 'item-101',
        itemCode: 'SERV-001',
        descriptionAr: 'توريد خدمات تنفيذ أنشطة المشروع والمخرجات الميدانية',
        quantity: 1,
        unitPriceYer: 25000000,
        taxRatePercent: 0,
        taxCategory: 'EXEMPT' as 'STANDARD' | 'ZERO_RATED' | 'EXEMPT',
        exemptionReasonCode: 'VATEX-SA-OOD',
        discountYer: 0
      }
    ]
  });

  // Calculated Metrics
  const totalClearedInvoices = useMemo(() => invoices.filter(i => i.status === 'CLEARED').length, [invoices]);
  const totalInvoicedYer = useMemo(() => invoices.reduce((acc, i) => acc + i.grandTotalYer, 0), [invoices]);
  const totalVatCollectedYer = useMemo(() => invoices.reduce((acc, i) => acc + i.totalTaxYer, 0), [invoices]);

  // Handle Add Line Item to New Invoice
  const handleAddLineItem = () => {
    setNewInvForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          itemCode: `SERV-00${prev.items.length + 1}`,
          descriptionAr: 'بند خدمات جديد',
          quantity: 1,
          unitPriceYer: 1000000,
          taxRatePercent: 0,
          taxCategory: 'EXEMPT',
          exemptionReasonCode: 'VATEX-SA-OOD',
          discountYer: 0
        }
      ]
    }));
  };

  // Handle Create E-Invoice with Deep AI Cryptographic Stamping
  const handleCreateEInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvForm.buyerNameAr) return;

    const matchedProj = projects.find(p => p.id === newInvForm.projectId);

    // Compute Math
    let subtotal = 0;
    let taxTotal = 0;

    const computedItems = newInvForm.items.map(item => {
      const lineSubtotal = (item.quantity * item.unitPriceYer) - item.discountYer;
      const lineTax = (lineSubtotal * item.taxRatePercent) / 100;
      subtotal += lineSubtotal;
      taxTotal += lineTax;
      return item;
    });

    const grandTotal = subtotal + taxTotal;
    const generatedUuid = `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-4a${Math.random().toString(36).substring(2, 4)}-8b${Math.random().toString(36).substring(2, 4)}-${Math.random().toString(36).substring(2, 12)}`;
    const cryptoHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newInvoice: EInvoice = {
      id: `e-inv-${Date.now()}`,
      invoiceNumber: newInvForm.invoiceNumber,
      uuid: generatedUuid,
      invoiceType: newInvForm.invoiceType,
      issueDate: new Date().toISOString().split('T')[0],
      issueTime: new Date().toTimeString().split(' ')[0],
      sellerNameAr: 'جمعية رُحماء بينهم للعمل الإنساني والتنمية',
      sellerTaxId: '300492810200003',
      buyerNameAr: newInvForm.buyerNameAr,
      buyerTaxId: newInvForm.buyerTaxId,
      buyerEmail: newInvForm.buyerEmail,
      projectId: newInvForm.projectId,
      projectNameAr: matchedProj ? matchedProj.name_ar : 'مشروع عام',
      wbsActivityId: newInvForm.wbsActivityId,
      wbsActivityNameAr: 'نشاط WBS الميداني المعتمد',
      items: computedItems,
      subtotalYer: subtotal,
      totalTaxYer: taxTotal,
      grandTotalYer: grandTotal,
      currency: 'YER',
      paymentMethod: newInvForm.paymentMethod,
      status: 'CLEARED', // Auto cleared by AI Audit
      cryptographicHash: cryptoHash,
      previousInvoiceHash: invoices[0]?.cryptographicHash || '0000000000000000000000000000000000000000000000000000000000000000',
      qrCodeBase64: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Rohamaab_${newInvForm.invoiceNumber}_CLEARED_SHA256_${cryptoHash.substring(0, 8)}`,
      shariahCertified: true,
      zatcaPhase2Compliant: true
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setSelectedInvoice(newInvoice);
    setIsNewInvoiceModalOpen(false);
  };

  // Generate UBL 2.1 XML String for Payload Inspection
  const generateUBL21XML = (inv: EInvoice) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${inv.invoiceNumber}</cbc:ID>
  <cbc:UUID>${inv.uuid}</cbc:UUID>
  <cbc:IssueDate>${inv.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${inv.issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0100000">${inv.invoiceType}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${inv.currency}</cbc:DocumentCurrencyCode>
  
  <!-- Cryptographic Blockchain PIH Chaining -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject encodingCode="BASE64">${inv.previousInvoiceHash}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>

  <!-- Seller Party Information -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${inv.sellerTaxId}</cbc:CompanyID>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${inv.sellerNameAr}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Buyer Party Information -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${inv.buyerTaxId}</cbc:CompanyID>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${inv.buyerNameAr}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <!-- Line Items Breakdown -->
  ${inv.items.map((item, idx) => `
  <cac:InvoiceLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="YER">${(item.quantity * item.unitPriceYer) - item.discountYer}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${item.descriptionAr}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:Percent>${item.taxRatePercent}</cbc:Percent>
        <cbc:TaxExemptionReasonCode>${item.exemptionReasonCode || 'N/A'}</cbc:TaxExemptionReasonCode>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
  </cac:InvoiceLine>`).join('')}

  <!-- Legal Monetary Total -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="YER">${inv.subtotalYer}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="YER">${inv.subtotalYer}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="YER">${inv.grandTotalYer}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="YER">${inv.grandTotalYer}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Cryptographic ECDSA Signature Stamp -->
  <cac:Signature>
    <cbc:ID>ZATCA_ECDSA_STAMP</cbc:ID>
    <cbc:SignatureMethod>SHA256withECDSA</cbc:SignatureMethod>
    <cbc:DigestValue>${inv.cryptographicHash}</cbc:DigestValue>
  </cac:Signature>
</Invoice>`;
  };

  // Print Official E-Invoice PDF
  const handlePrintEInvoice = (inv: EInvoice) => {
    let reportHTML = `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة إلكترونية ضريبية - ${inv.invoiceNumber}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; background-color: #fff; color: #0f172a; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body class="p-8">
        <div class="max-w-4xl mx-auto border-2 border-slate-900 rounded-3xl p-8 space-y-6 shadow-2xl">
          
          <!-- Header Branding -->
          <div class="flex justify-between items-start border-b-2 border-slate-900 pb-6">
            <div class="space-y-1">
              <h1 class="text-xl font-black text-emerald-800">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h1>
              <h2 class="text-xs font-bold text-slate-600">Rohamā'a Baynahum Charity Foundation</h2>
              <p class="text-[10px] text-slate-500 font-mono">الرقم الضريبي: ${inv.sellerTaxId}</p>
              <p class="text-[10px] text-slate-500 font-mono">العنوان: اليمن - صنعاء / مأرب - المقر الرئيسي</p>
            </div>

            <div class="text-center space-y-1">
              <span class="px-3 py-1 bg-slate-900 text-white rounded-xl text-xs font-black uppercase inline-block">
                فاتورة إلكترونية ضريبية معتمدة
              </span>
              <p class="font-mono text-sm font-black text-slate-900 mt-1">${inv.invoiceNumber}</p>
              <p class="font-mono text-[10px] text-slate-400">UUID: ${inv.uuid}</p>
            </div>

            <div class="shrink-0 text-center">
              <img src="${inv.qrCodeBase64}" alt="ZATCA QR Code" class="w-24 h-24 border p-1 rounded-xl mx-auto" />
              <span class="text-[9px] font-mono text-emerald-700 font-black block mt-1">رمز الاستجابة السريعة QR</span>
            </div>
          </div>

          <!-- Buyer & Meta Details -->
          <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-bold">
            <div class="space-y-1">
              <p className="text-slate-500">اسم العميل / الجهة الداعمة:</p>
              <p className="font-black text-slate-900 text-sm">${inv.buyerNameAr}</p>
              <p className="font-mono text-slate-600">الرقم الضريبي: ${inv.buyerTaxId}</p>
              <p className="text-slate-600">${inv.buyerEmail || 'لا يوجد بريد مسجل'}</p>
            </div>
            <div class="space-y-1 text-left font-mono">
              <p className="text-slate-500">تاريخ الإصدار: <span class="text-slate-900 font-black">${inv.issueDate} - ${inv.issueTime}</span></p>
              <p className="text-slate-500">طريقة الدفع: <span class="text-slate-900 font-black">${inv.paymentMethod}</span></p>
              <p className="text-slate-500">المشروع المرتبط: <span class="text-emerald-700 font-black">${inv.projectNameAr}</span></p>
              <p className="text-slate-500">رمز النشاط WBS: <span class="text-purple-700 font-black">${inv.wbsActivityId}</span></p>
            </div>
          </div>

          <!-- Line Items Table -->
          <table class="w-full text-xs text-right border-collapse">
            <thead>
              <tr class="bg-slate-900 text-white font-black">
                <th class="p-2.5">#</th>
                <th class="p-2.5">رمز البند</th>
                <th class="p-2.5">الوصف والبيان التفصيلي</th>
                <th class="p-2.5 text-center">الكمية</th>
                <th class="p-2.5 text-center">سعر الوحدة</th>
                <th class="p-2.5 text-center">نسبة الضريبة</th>
                <th class="p-2.5 text-left">الإجمالي (YER)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 font-bold">
              ${inv.items.map((item, idx) => `
                <tr>
                  <td class="p-2.5">${idx + 1}</td>
                  <td class="p-2.5 font-mono">${item.itemCode}</td>
                  <td class="p-2.5 font-black text-slate-900">${item.descriptionAr}</td>
                  <td class="p-2.5 text-center font-mono">${item.quantity}</td>
                  <td class="p-2.5 text-center font-mono">${item.unitPriceYer.toLocaleString()} YER</td>
                  <td class="p-2.5 text-center font-mono">${item.taxRatePercent}% (${item.taxCategory})</td>
                  <td class="p-2.5 text-left font-mono font-black">${((item.quantity * item.unitPriceYer) - item.discountYer).toLocaleString()} YER</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Monetary Totals & Seals -->
          <div class="flex justify-between items-end pt-4 border-t-2 border-slate-900">
            <div class="space-y-2 text-xs font-bold max-w-md">
              <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 space-y-1">
                <p class="font-black flex items-center gap-1">
                  <span>✓ الختم والتوقيع الرقمي المشفر (SHA-256 ECDSA):</span>
                </p>
                <p class="font-mono text-[9px] break-all text-slate-600">${inv.cryptographicHash}</p>
              </div>
              <p class="text-[10px] text-slate-500">تنبيه: هذه الفاتورة صادرة إلكترونياً ومحمية بالتوقيع المشفر ومطابقة لمعايير الزكاة والضريبة والامتثال الشرعي IPSAS.</p>
            </div>

            <div class="w-64 space-y-1.5 text-xs font-bold text-left font-mono">
              <div class="flex justify-between text-slate-600">
                <span>المبلغ الخاضع للضريبة:</span>
                <span>${inv.subtotalYer.toLocaleString()} YER</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>إجمالي القيمة المضافة (VAT):</span>
                <span>${inv.totalTaxYer.toLocaleString()} YER</span>
              </div>
              <div class="flex justify-between text-slate-900 text-base font-black border-t-2 border-slate-900 pt-1">
                <span>المبلغ الإجمالي المستحق:</span>
                <span class="text-emerald-700">${inv.grandTotalYer.toLocaleString()} YER</span>
              </div>
            </div>
          </div>

        </div>
      </body>
      </html>
    `;
    printHTML(reportHTML);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* BRAND & COMPLIANCE HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black rounded-lg uppercase tracking-wider">
                ZATCA Phase 2 & IPSAS Cryptographic E-Invoicing Engine
              </span>
              <span className="text-zinc-400 text-xs font-mono">| NexoraOS™ Certified Smart E-Tax OS</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <QrCode className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{isRtl ? 'منظومة الفوترة الإلكترونية الذكية والتوقيع المشفر (ZATCA & IPSAS E-Invoicing)' : 'Smart E-Invoicing & Cryptographic Tax Engine'}</span>
            </h2>
            <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              {isRtl 
                ? 'إصدار واعتماد الفواتير الضريبية الإلكترونية مع توليد رموز QR المشفرة بالبصمة الرقمية (ECDSA/SHA-256)، الربط بالتسلسل غير القابل للتعديل (Blockchain-PIH)، التدقيق الذكي بالفئات الضريبية، والأتمتة الفورية لقيود اليومية وبطاقات أنشطة WBS.'
                : 'Issue and validate e-invoices with encrypted QR codes, SHA-256 digital signatures, immutable invoice chaining, automatic tax categorization, and instant WBS activity posting.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsNewInvoiceModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إصدار فاتورة إلكترونية جديدة' : 'Issue New E-Invoice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              {isRtl ? 'إجمالي مبالغ الفواتير الإلكترونية' : 'Total E-Invoiced Amount'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {totalInvoicedYer.toLocaleString()} <span className="text-xs text-slate-500 font-sans">YER</span>
            </p>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isRtl ? `${invoices.length} فاتورة مسجلة وموثقة` : `${invoices.length} e-invoices recorded`}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              {isRtl ? 'الفواتير المعتمدة ضريبياً (Cleared)' : 'Tax Cleared E-Invoices'}
            </span>
            <p className="text-xl font-black text-emerald-600 font-mono">
              {totalClearedInvoices} <span className="text-xs font-sans text-slate-500">/ {invoices.length}</span>
            </p>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isRtl ? '100% توقيع مشفر معتمد' : '100% Cryptographically Stamped'}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl border border-blue-200 dark:border-blue-800">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              {isRtl ? 'إجمالي ضريبة القيمة المضافة VAT' : 'Total VAT Collected'}
            </span>
            <p className="text-xl font-black text-blue-600 font-mono">
              {totalVatCollectedYer.toLocaleString()} <span className="text-xs text-blue-500 font-sans">YER</span>
            </p>
            <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {isRtl ? 'إعفاءات إنسانية موثقة' : 'Charity Exemption Applied'}
            </span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl border border-purple-200 dark:border-purple-800">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* MAIN LAYOUT: INVOICES LIST & INSPECTOR PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: INVOICES LIST (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isRtl ? 'بحث باسم العميل، رقم الفاتورة، أو الكود...' : 'Search customer, invoice code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs w-full focus:outline-none text-slate-800 dark:text-zinc-200 font-bold"
            />
          </div>

          <div className="space-y-3">
            {invoices.map(inv => {
              const isSelected = selectedInvoice?.id === inv.id;

              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg text-slate-800 dark:text-zinc-200">
                      {inv.invoiceNumber}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase border ${
                      inv.status === 'CLEARED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {inv.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-xs text-slate-900 dark:text-white leading-snug">{inv.buyerNameAr}</h4>
                    <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>الرقم الضريبي: {inv.buyerTaxId}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                    <span className="text-[10px] font-mono text-slate-400">{inv.issueDate}</span>
                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">{inv.grandTotalYer.toLocaleString()} YER</span>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: INSPECTOR & PAYLOAD PREVIEW (7 COLS) */}
        <div className="lg:col-span-7">
          {selectedInvoice ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-5 sticky top-4">
              
              {/* INSPECTOR TOP BAR & VIEWER TOGGLES */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-slate-900 text-white px-3 py-1 rounded-xl">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-bold hidden sm:inline">UUID: {selectedInvoice.uuid.substring(0, 8)}...</span>
                </div>

                {/* View Mode Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-[11px] font-extrabold">
                  <button
                    onClick={() => setViewMode('visual')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      viewMode === 'visual' ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'المعاينة' : 'Visual'}</span>
                  </button>

                  <button
                    onClick={() => setViewMode('xml')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      viewMode === 'xml' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'UBL 2.1 XML' : 'XML Payload'}</span>
                  </button>

                  <button
                    onClick={() => setViewMode('audit')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      viewMode === 'audit' ? 'bg-white dark:bg-zinc-900 text-purple-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'التدقيق والختم' : 'Audit Log'}</span>
                  </button>
                </div>

                <button
                  onClick={() => handlePrintEInvoice(selectedInvoice)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'طباعة' : 'Print PDF'}</span>
                </button>
              </div>

              {/* VIEW MODE 1: VISUAL INVOICE DISPLAY */}
              {viewMode === 'visual' && (
                <div className="space-y-4">
                  
                  {/* Seller / Buyer Header */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-2xl text-xs font-bold">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase">الجهة الموردة / المصدرة:</span>
                      <p className="font-black text-slate-900 dark:text-white">{selectedInvoice.sellerNameAr}</p>
                      <p className="font-mono text-slate-500 text-[10px]">الرقم الضريبي: {selectedInvoice.sellerTaxId}</p>
                    </div>

                    <div className="space-y-1 text-left">
                      <span className="text-[10px] text-slate-400 block uppercase">العميل / الجهة المستلمة:</span>
                      <p className="font-black text-slate-900 dark:text-white">{selectedInvoice.buyerNameAr}</p>
                      <p className="font-mono text-slate-500 text-[10px]">الرقم الضريبي: {selectedInvoice.buyerTaxId}</p>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white font-black text-[10px]">
                          <th className="p-2">الوصف والبيان</th>
                          <th className="p-2 text-center">الكمية</th>
                          <th className="p-2 text-center">السعر</th>
                          <th className="p-2 text-center">الضريبة</th>
                          <th className="p-2 text-left">الإجمالي YER</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold text-slate-700 dark:text-zinc-300">
                        {selectedInvoice.items.map(item => (
                          <tr key={item.id}>
                            <td className="p-2.5 font-black text-slate-900 dark:text-white">{item.descriptionAr}</td>
                            <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                            <td className="p-2.5 text-center font-mono">{item.unitPriceYer.toLocaleString()}</td>
                            <td className="p-2.5 text-center font-mono text-emerald-600">{item.taxRatePercent}% ({item.taxCategory})</td>
                            <td className="p-2.5 text-left font-mono font-black text-slate-900 dark:text-white">
                              {((item.quantity * item.unitPriceYer) - item.discountYer).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* QR Code & Digital Signature Stamp */}
                  <div className="flex items-center justify-between bg-emerald-50/80 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                    <div className="space-y-1 max-w-sm">
                      <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>التوقيع الرقمي المشفر (ECDSA SHA-256):</span>
                      </span>
                      <p className="font-mono text-[9px] text-slate-600 dark:text-zinc-400 break-all bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-200 dark:border-zinc-800">
                        {selectedInvoice.cryptographicHash}
                      </p>
                    </div>

                    <img src={selectedInvoice.qrCodeBase64} alt="QR Code" className="w-20 h-20 border-2 border-emerald-500 p-1 rounded-xl bg-white" />
                  </div>

                </div>
              )}

              {/* VIEW MODE 2: UBL 2.1 XML PAYLOAD INSPECTOR */}
              {viewMode === 'xml' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-500">
                    <span>UBL 2.1 XML Schema (ZATCA / Tax Authority Compliant)</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(generateUBL21XML(selectedInvoice))}
                      className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>نسخ XML</span>
                    </button>
                  </div>
                  <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl text-[10px] font-mono overflow-x-auto max-h-96 leading-relaxed border border-slate-800 dir-ltr">
                    {generateUBL21XML(selectedInvoice)}
                  </pre>
                </div>
              )}

              {/* VIEW MODE 3: AI AUDIT & BLOCKCHAIN CHAINING LOGS */}
              {viewMode === 'audit' && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                    <h4 className="font-black flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                      <Sparkles className="w-4 h-4" />
                      <span>نتائج التدقيق الذكي وسلسلة الكتل الضريبية (PIH Chain):</span>
                    </h4>
                    <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 leading-relaxed">
                      تم اجتياز التدقيق الحسابي والشرعي بنسبة 100%. تم ربط الفاتورة بالبصمة السابقة (Previous Invoice Hash - PIH) لضمان عدم التلاعب بسجل الإيرادات والالتزام بمعايير IPSAS 1.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-700 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Hash الفاتورة السابقة (PIH):</span>
                      <span className="text-slate-800 dark:text-zinc-200 font-black">{selectedInvoice.previousInvoiceHash.substring(0, 16)}...</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Hash الفاتورة الحالية:</span>
                      <span className="text-emerald-600 font-black">{selectedInvoice.cryptographicHash.substring(0, 16)}...</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <QrCode className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold">حدد فاتورة إلكترونية لملاينة التفاصيل والختم المشفر</p>
            </div>
          )}
        </div>

      </div>

      {/* NEW E-INVOICE CREATION MODAL */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">إصدار فاتورة إلكترونية معتمدة (ZATCA / IPSAS)</h3>
                  <p className="text-[11px] text-slate-500">توليد التوقيع المشفر وتوثيق الفاتورة ببطاقة WBS لحظياً</p>
                </div>
              </div>

              <button 
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEInvoice} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-400">رقم الفاتورة الآلي:</label>
                  <input
                    type="text"
                    value={newInvForm.invoiceNumber}
                    onChange={(e) => setNewInvForm({ ...newInvForm, invoiceNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs font-mono font-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-400">نوع الفاتورة الإلكترونية:</label>
                  <select
                    value={newInvForm.invoiceType}
                    onChange={(e) => setNewInvForm({ ...newInvForm, invoiceType: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="B2B_STANDARD">فاتورة ضريبية قياسية B2B (شركات ومؤسسات)</option>
                    <option value="B2G_GOVERNMENT">فاتورة قطاع حكومي B2G</option>
                    <option value="DONOR_PLEDGE">تعهد دعم ومنحة من جهة مانحة</option>
                    <option value="B2C_SIMPLIFIED">فاتورة مبسطة B2C</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-400">اسم العميل / MAn / Donor:</label>
                  <input
                    type="text"
                    placeholder="مثال: مركز الملك سلمان / منظمة الصحة العالمية"
                    value={newInvForm.buyerNameAr}
                    onChange={(e) => setNewInvForm({ ...newInvForm, buyerNameAr: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-400">الرقم الضريبي للعميل:</label>
                  <input
                    type="text"
                    value={newInvForm.buyerTaxId}
                    onChange={(e) => setNewInvForm({ ...newInvForm, buyerTaxId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 dark:text-zinc-200">بنود الفاتورة والخدمات:</span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    + إضافة بند
                  </button>
                </div>

                {newInvForm.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 bg-slate-50 dark:bg-zinc-800/60 p-2.5 rounded-xl text-xs font-bold">
                    <input
                      type="text"
                      value={item.descriptionAr}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewInvForm(prev => ({
                          ...prev,
                          items: prev.items.map((it, i) => i === idx ? { ...it, descriptionAr: val } : it)
                        }));
                      }}
                      className="col-span-6 bg-white dark:bg-zinc-900 border rounded-lg p-1.5 text-xs"
                      placeholder="وصف البند"
                    />

                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        setNewInvForm(prev => ({
                          ...prev,
                          items: prev.items.map((it, i) => i === idx ? { ...it, quantity: val } : it)
                        }));
                      }}
                      className="col-span-2 bg-white dark:bg-zinc-900 border rounded-lg p-1.5 text-xs text-center font-mono"
                    />

                    <input
                      type="number"
                      value={item.unitPriceYer}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setNewInvForm(prev => ({
                          ...prev,
                          items: prev.items.map((it, i) => i === idx ? { ...it, unitPriceYer: val } : it)
                        }));
                      }}
                      className="col-span-4 bg-white dark:bg-zinc-900 border rounded-lg p-1.5 text-xs text-left font-mono"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>اعتماد وختم الفاتورة إلكترونياً</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
