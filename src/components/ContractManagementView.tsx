import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Briefcase,
  Calendar,
  Coins,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Paperclip,
  Building2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  FileCheck,
  ShieldCheck,
  Building,
  User,
  ArrowUpRight,
  PieChart,
  Tag,
  ShoppingCart,
  Receipt,
  Layers,
  Sparkles,
  Link2,
  CheckSquare,
  ArrowRight,
  Send,
  Sliders,
  Database,
  Lock,
  Zap,
  Globe,
  Handshake,
  Award,
  Scale,
  BookOpen,
  HeartHandshake,
  UserCheck,
  Globe2,
  Printer,
  Copy,
  BarChart3
} from 'lucide-react';
import VendorPerformanceAnalyticsView from '../features/procurement/VendorPerformanceAnalyticsView';
import ProcurementForecastingView from '../features/procurement/ProcurementForecastingView';
import VendorRecommendationEngineView from '../features/procurement/VendorRecommendationEngineView';
import { ModuleShell } from './enterprise/ModuleShell';
import { 
  Project, 
  ContractAttachment, 
  PaymentMilestone, 
  SupplierContract,
  PurchaseRequisition,
  PurchaseOrder,
  SalesOrderInvoice,
  ActivityProcurementLink,
  PartnershipRecord,
  PartnershipType,
  PartnershipAgreementType,
  PartnershipLifecycleStage,
  PartnershipTranche
} from '../types';
import { printElement } from '../lib/printUtils';
import { escapeHtml } from '../lib/htmlSanitizer';
import { generateId, generateShortId, generateNumericCode } from '../lib/idGenerator';
import { PolicyButton } from '../core/security/PermissionGate';

interface ContractManagementViewProps {
  lang?: 'ar' | 'en';
  projects?: Project[];
  currentUser?: any;
  onRefresh?: () => void;
  onNavigate?: (tab: string) => void;
}

export const ContractManagementView: React.FC<ContractManagementViewProps> = ({
  lang = 'ar',
  projects = [],
  currentUser,
  onRefresh,
  onNavigate
}) => {
  const isRtl = lang === 'ar';

  // Active Sub-Tab Navigation State
  const [activeSubTab, setActiveSubTab] = useState<'partnerships' | 'procurement' | 'sales_revenue' | 'contracts' | 'wbs_matrix' | 'ai_copilot'>('partnerships');

  // ==================== DATA STATE (API-DRIVEN) ====================
  const [loading, setLoading] = useState(true);

  // ==================== PERMISSION / SECURITY STATE ====================
  const [securityLevel] = useState(3);
  const [userRole] = useState('admin');

  // ==================== PARTNERSHIP & DONORS OS STATE (NEB-08) ====================
  const [partnerships, setPartnerships] = useState<PartnershipRecord[]>([]);

  // Partnership Filter States
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<string>('ALL');
  const [agreementTypeFilter, setAgreementTypeFilter] = useState<string>('ALL');
  const [partnershipLifecycleFilter, setPartnershipLifecycleFilter] = useState<string>('ALL');

  // Partnership Modals State
  const [isNewPartnershipModalOpen, setIsNewPartnershipModalOpen] = useState(false);
  const [isPcaEvaluatorModalOpen, setIsPcaEvaluatorModalOpen] = useState(false);
  const [selectedPartnershipForPca, setSelectedPartnershipForPca] = useState<PartnershipRecord | null>(null);

  // New Partnership Form State
  const [newPartnershipForm, setNewPartnershipForm] = useState({
    partnershipCode: `PRT-2026-NEW-${generateNumericCode(100, 999)}`,
    titleAr: '',
    titleEn: '',
    partnerNameAr: '',
    partnerNameEn: '',
    partnerType: 'UN_AGENCY' as PartnershipType,
    agreementType: 'PCA' as PartnershipAgreementType,
    lifecycleStage: 'ACTIVE_EXECUTION' as PartnershipLifecycleStage,
    projectId: 'proj-001',
    totalGrantYer: '',
    totalGrantUsd: '',
    matchFundingPercent: '10',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    focalPersonName: '',
    focalPersonEmail: '',
    focalPersonPhone: '',
    complianceStandards: 'Sphere Standards 2026, CHS Alliance, IATI Standard 2.03, IPSAS Ledger',
    notes: ''
  });

  // PCA Evaluation Scores State
  const [pcaPillars, setPcaPillars] = useState({
    governance: 95,
    financials: 90,
    procurement: 92,
    humanResources: 90,
    monitoringAndSphere: 95
  });

  const calculatedPcaScore = useMemo(() => {
    return Math.round((pcaPillars.governance + pcaPillars.financials + pcaPillars.procurement + pcaPillars.humanResources + pcaPillars.monitoringAndSphere) / 5);
  }, [pcaPillars]);


  // ==================== API-DRIVEN DATA STORES ====================

  // 1. Supplier & Contractor Contracts State
  const [contracts, setContracts] = useState<SupplierContract[]>([]);

  // 2. Purchase Orders (PO) & Requisitions (PR)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // 3. Sales Order & Revenue Invoices
  const [salesInvoices, setSalesInvoices] = useState<SalesOrderInvoice[]>([]);

  // 4. Project Activity WBS & Procurement Correlation Matrix Data
  const [activityLinks, setActivityLinks] = useState<ActivityProcurementLink[]>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Modals & Drawers State
  const [isNewPoModalOpen, setIsNewPoModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [selectedContractForRenewal, setSelectedContractForRenewal] = useState<SupplierContract | null>(null);
  const [selectedContractForDetails, setSelectedContractForDetails] = useState<SupplierContract | null>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

  // New PO Form State
  const [newPoForm, setNewPoForm] = useState({
    poNumber: `PO-YEM-2026-${generateNumericCode(100, 999)}`,
    requisitionRef: `PR-YEM-2026-${generateNumericCode(100, 999)}`,
    vendorNameAr: '',
    projectId: '',
    wbsActivityId: 'ACT-MAR-101',
    totalAmountYer: '',
    expectedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    autoActivityUpdate: true
  });

  // New Sales Invoice Form State
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    invoiceCode: `INV-SLS-2026-${generateNumericCode(100, 999)}`,
    clientOrDonorNameAr: '',
    invoiceType: 'DONOR_PLEDGE' as any,
    projectId: '',
    wbsActivityId: 'ACT-MAR-101',
    totalAmountYer: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    shariahCompliant: true
  });

  // New Contract Form State
  const [newContractForm, setNewContractForm] = useState({
    contractCode: `CNT-2026-${generateNumericCode(100, 999)}`,
    titleAr: '',
    titleEn: '',
    vendorNameAr: '',
    vendorNameEn: '',
    vendorTaxId: '',
    contractType: 'SUPPLIER' as 'SUPPLIER' | 'CONTRACTOR' | 'SERVICE_SLA' | 'LEASE',
    projectId: '',
    budgetlineCode: 'BGT-2026-OPERATIONAL',
    totalValueYer: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    renewalAlertDays: 30,
    autoRenew: false,
    procurementPoRef: `PO-YEM-2026-${generateNumericCode(100, 999)}`,
    notes: ''
  });

  // Renewal Form State
  const [renewalForm, setRenewalForm] = useState({
    newEndDate: '',
    additionalValueYer: '0',
    amendmentNotes: ''
  });

  // ==================== FETCH DATA FROM API ====================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [contractsRes, poRes, invoicesRes, partnershipsRes] = await Promise.all([
          fetch('/api/tables/contracts'),
          fetch('/api/tables/purchase_orders'),
          fetch('/api/tables/sales_invoices'),
          fetch('/api/tables/partner_agreements')
        ]);

        if (contractsRes.ok) {
          const data = await contractsRes.json();
          setContracts(Array.isArray(data) ? data : []);
        }
        if (poRes.ok) {
          const data = await poRes.json();
          setPurchaseOrders(Array.isArray(data) ? data : []);
        }
        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setSalesInvoices(Array.isArray(data) ? data : []);
        }
        if (partnershipsRes.ok) {
          const data = await partnershipsRes.json();
          setPartnerships(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching contract management data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Partnership Filters & Handlers
  const filteredPartnerships = useMemo(() => {
    return partnerships.filter(p => {
      const matchesSearch = searchQuery === '' ||
        p.partnershipCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.titleAr.includes(searchQuery) ||
        p.partnerNameAr.includes(searchQuery) ||
        p.focalPersonName.includes(searchQuery);

      const matchesType = partnerTypeFilter === 'ALL' || p.partnerType === partnerTypeFilter;
      const matchesAgreement = agreementTypeFilter === 'ALL' || p.agreementType === agreementTypeFilter;
      const matchesLifecycle = partnershipLifecycleFilter === 'ALL' || p.lifecycleStage === partnershipLifecycleFilter;

      return matchesSearch && matchesType && matchesAgreement && matchesLifecycle;
    });
  }, [partnerships, searchQuery, partnerTypeFilter, agreementTypeFilter, partnershipLifecycleFilter]);

  const totalGrantPortfolioYer = useMemo(() => partnerships.reduce((acc, p) => acc + p.totalGrantYer, 0), [partnerships]);
  const totalGrantReceivedYer = useMemo(() => partnerships.reduce((acc, p) => acc + p.receivedAmountYer, 0), [partnerships]);
  const avgPcaScore = useMemo(() => {
    if (partnerships.length === 0) return 0;
    return Math.round(partnerships.reduce((acc, p) => acc + p.pcaScore, 0) / partnerships.length);
  }, [partnerships]);

  const handleCreatePartnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnershipForm.titleAr || !newPartnershipForm.partnerNameAr || !newPartnershipForm.totalGrantYer) return;

    const matchedProject = projects.find(p => p.id === newPartnershipForm.projectId);
    const totalYer = parseFloat(newPartnershipForm.totalGrantYer) || 0;
    const matchPct = parseFloat(newPartnershipForm.matchFundingPercent) || 0;
    const matchYer = (totalYer * matchPct) / 100;

    const createdRecord: PartnershipRecord = {
      id: `prt-${Date.now()}`,
      partnershipCode: newPartnershipForm.partnershipCode,
      titleAr: newPartnershipForm.titleAr,
      titleEn: newPartnershipForm.titleEn || newPartnershipForm.titleAr,
      partnerNameAr: newPartnershipForm.partnerNameAr,
      partnerNameEn: newPartnershipForm.partnerNameEn || newPartnershipForm.partnerNameAr,
      partnerType: newPartnershipForm.partnerType,
      agreementType: newPartnershipForm.agreementType,
      lifecycleStage: newPartnershipForm.lifecycleStage,
      projectId: newPartnershipForm.projectId,
      projectNameAr: matchedProject ? matchedProject.name_ar : 'عام / غير مرتبط بمشروع',
      totalGrantYer: totalYer,
      totalGrantUsd: parseFloat(newPartnershipForm.totalGrantUsd) || Math.round(totalYer / 1500),
      receivedAmountYer: Math.round(totalYer * 0.5),
      matchFundingYer: matchYer,
      matchFundingPercent: matchPct,
      startDate: newPartnershipForm.startDate,
      endDate: newPartnershipForm.endDate,
      pcaScore: 92,
      focalPersonName: newPartnershipForm.focalPersonName || 'مسؤول الاتصال الشريك',
      focalPersonEmail: newPartnershipForm.focalPersonEmail || 'partner@org.org',
      focalPersonPhone: newPartnershipForm.focalPersonPhone || '+967 770 000 000',
      complianceStandards: newPartnershipForm.complianceStandards.split(',').map(s => s.trim()),
      iatiActivityId: `IATI-${newPartnershipForm.partnershipCode}`,
      tranches: [
        { id: `tr-${Date.now()}-1`, trancheNo: 1, titleAr: 'الدفعة المقدمة عند توقيع الاتفاقية 50%', titleEn: 'Tranche 1 Advance', amountYer: Math.round(totalYer * 0.5), dueDate: newPartnershipForm.startDate, disbursementStatus: 'DISBURSED', conditionsCleared: true, disbursementRef: 'TR-NEW-01' },
        { id: `tr-${Date.now()}-2`, trancheNo: 2, titleAr: 'الدفعة الختامية عند تقديم التقرير النهائي', titleEn: 'Tranche 2 Final', amountYer: Math.round(totalYer * 0.5), dueDate: newPartnershipForm.endDate, disbursementStatus: 'PENDING', conditionsCleared: false }
      ],
      notes: newPartnershipForm.notes,
      documentsCount: 3
    };

    try {
      const res = await fetch('/api/tables/partner_agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdRecord)
      });
      if (res.ok) {
        setPartnerships(prev => [createdRecord, ...prev]);
      }
    } catch (err) {
      console.error('Error creating partnership:', err);
      setPartnerships(prev => [createdRecord, ...prev]);
    }
    setIsNewPartnershipModalOpen(false);
  };

  const handleDisburseTranche = async (partnershipId: string, trancheId: string) => {
    let updatedPartnership: PartnershipRecord | null = null;
    setPartnerships(prev => prev.map(p => {
      if (p.id === partnershipId) {
        let addedAmount = 0;
        const updatedTranches = p.tranches.map(t => {
          if (t.id === trancheId && t.disbursementStatus !== 'DISBURSED') {
            addedAmount = t.amountYer;
            return {
              ...t,
              disbursementStatus: 'DISBURSED' as const,
              conditionsCleared: true,
              disbursementRef: `TR-DISB-${generateNumericCode(100, 999)}`
            };
          }
          return t;
        });
        const updated = {
          ...p,
          receivedAmountYer: p.receivedAmountYer + addedAmount,
          tranches: updatedTranches
        };
        updatedPartnership = updated;
        return updated;
      }
      return p;
    }));
    if (updatedPartnership) {
      try {
        await fetch(`/api/tables/partner_agreements/${partnershipId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPartnership)
        });
      } catch (err) {
        console.error('Error updating partnership tranche:', err);
      }
    }
  };

  const handleSavePcaEvaluation = async () => {
    if (!selectedPartnershipForPca) return;
    let updatedPartnership: PartnershipRecord | null = null;
    setPartnerships(prev => prev.map(p => {
      if (p.id === selectedPartnershipForPca.id) {
        const updated = {
          ...p,
          pcaScore: calculatedPcaScore,
          notes: `${p.notes || ''} [تم تحديث تقييم القدرات المؤسسية PCA إلى ${calculatedPcaScore}% بتاريخ ${new Date().toISOString().split('T')[0]}]`
        };
        updatedPartnership = updated;
        return updated;
      }
      return p;
    }));
    if (updatedPartnership) {
      try {
        await fetch(`/api/tables/partner_agreements/${selectedPartnershipForPca.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPartnership)
        });
      } catch (err) {
        console.error('Error updating PCA evaluation:', err);
      }
    }
    setIsPcaEvaluatorModalOpen(false);
  };

  const handlePrintPartnershipCertificate = (prt: PartnershipRecord) => {
    const e = escapeHtml;
    const printContainer = document.createElement('div');
    printContainer.id = 'printable-partnership-doc';
    printContainer.className = 'hidden';
    printContainer.innerHTML = `
      <div style="font-family: sans-serif; direction: rtl; padding: 30px; background: #fff; color: #0f172a;">
        <div style="text-align: center; border-bottom: 3px double #059669; padding-bottom: 15px; margin-bottom: 25px;">
          <h1 style="color: #059669; font-size: 20px; font-weight: 900; margin: 0 0 5px 0;">${e(localStorage.getItem('rbd_org_name') || 'جمعية رُحماء بينهم للعمل الإنساني والتنمية')}</h1>
          <h2 style="color: #d97706; font-size: 16px; font-weight: 800; margin: 0 0 10px 0;">نظام التشغيل المؤسسي NexoraOS™ - إدارة الشراكات والتمويل المؤسسي</h2>
          <div style="font-size: 14px; font-weight: bold; color: #334155;">وثيقة اتفاقية شراكة رسمية معتمدة</div>
          <div style="font-family: monospace; font-size: 12px; color: #64748b; margin-top: 5px;">كود الشراكة: ${e(prt.partnershipCode)} | معيار IATI: ${e(prt.iatiActivityId || 'N/A')}</div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px;">
          <div><strong>عنوان الشراكة:</strong> ${e(prt.titleAr)}</div>
          <div><strong>الجهة الشريكة:</strong> ${e(prt.partnerNameAr)}</div>
          <div><strong>نوع الشريحة والجهة:</strong> ${e(prt.partnerType)}</div>
          <div><strong>شكل الاتفاقية:</strong> ${e(prt.agreementType)}</div>
          <div><strong>المبلغ الإجمالي للمنحة:</strong> ${e(prt.totalGrantYer.toLocaleString())} YER ($${e(prt.totalGrantUsd.toLocaleString())} USD)</div>
          <div><strong>التمويل المقابل (Co-Funding):</strong> ${e(prt.matchFundingYer.toLocaleString())} YER (${e(String(prt.matchFundingPercent))}%)</div>
          <div><strong>مستوى التقييم المؤسسي PCA:</strong> ${e(String(prt.pcaScore))}% (مستوى أمان مرتفع)</div>
          <div><strong>تاريخ السريان والانتهاء:</strong> من ${e(prt.startDate)} إلى ${e(prt.endDate)}</div>
        </div>

        <h3 style="color: #059669; font-size: 14px; font-weight: bold; margin-bottom: 8px;">جدول الدفعات والاقساط التمويلية (Tranches Schedule)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 25px;">
          <thead>
            <tr style="background: #059669; color: white;">
              <th style="padding: 6px; border: 1px solid #059669;">رقم الدفعة</th>
              <th style="padding: 6px; border: 1px solid #059669;">البيان والمرحلة</th>
              <th style="padding: 6px; border: 1px solid #059669;">المبلغ (YER)</th>
              <th style="padding: 6px; border: 1px solid #059669;">تاريخ الاستحقاق</th>
              <th style="padding: 6px; border: 1px solid #059669;">حالة الصرف والاعتماد</th>
            </tr>
          </thead>
          <tbody>
            ${prt.tranches.map(t => `
              <tr style="text-align: center;">
                <td style="padding: 6px; border: 1px solid #cbd5e1;">الدفعة ${e(String(t.trancheNo))}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">${e(t.titleAr)}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">${e(t.amountYer.toLocaleString())}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">${e(t.dueDate)}</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: ${t.disbursementStatus === 'DISBURSED' ? '#059669' : '#d97706'};">
                  ${t.disbursementStatus === 'DISBURSED' ? 'تم الصرف والإيداع' : 'قيد المراجعة والمطابقة'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-bottom: 20px; font-size: 11px;">
          <strong>معايير الإمتثال والشفافية المعتمدة:</strong>
          <div style="margin-top: 5px; color: #475569;">${e(prt.complianceStandards.join(' • '))}</div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 12px; font-weight: bold;">
          <div>
            <div>عن الجهة المانحة / الشريكة</div>
            <div style="margin-top: 40px; color: #64748b;">التوقيع والختم الرسميان</div>
          </div>
          <div>
            <div>عن جمعية رُحماء بينهم للعمل الإنساني</div>
            <div style="margin-top: 40px; color: #059669;">رئيس الجمعية / المدير التنفيذي</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(printContainer);
    printElement('printable-partnership-doc');
    setTimeout(() => {
      document.body.removeChild(printContainer);
    }, 1000);
  };

  // Aggregate Metrics
  const totalProcurementCommitted = useMemo(() => purchaseOrders.reduce((acc, po) => acc + po.totalAmountYer, 0), [purchaseOrders]);
  const totalSalesRevenueInvoiced = useMemo(() => salesInvoices.reduce((acc, inv) => acc + inv.totalAmountYer, 0), [salesInvoices]);
  const totalSalesRevenueCollected = useMemo(() => salesInvoices.reduce((acc, inv) => acc + inv.paidAmountYer, 0), [salesInvoices]);
  const totalContractVal = useMemo(() => contracts.reduce((acc, c) => acc + c.totalValueYer, 0), [contracts]);

  // Handlers
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoForm.vendorNameAr || !newPoForm.totalAmountYer) return;

    const matchedProject = projects.find(p => p.id === newPoForm.projectId);
    const matchedLink = activityLinks.find(a => a.activityId === newPoForm.wbsActivityId);

    const createdPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: newPoForm.poNumber,
      requisitionRef: newPoForm.requisitionRef,
      vendorNameAr: newPoForm.vendorNameAr,
      projectId: newPoForm.projectId,
      projectNameAr: matchedProject ? matchedProject.name_ar : 'عام / غير مرتبط بمشروع',
      wbsActivityId: newPoForm.wbsActivityId,
      wbsActivityNameAr: matchedLink ? matchedLink.activityNameAr : 'نشاط ميداني جديد',
      totalAmountYer: parseFloat(newPoForm.totalAmountYer) || 0,
      deliveryStatus: 'ISSUED',
      paymentStatus: 'UNPAID',
      autoActivityUpdate: newPoForm.autoActivityUpdate,
      expectedDeliveryDate: newPoForm.expectedDeliveryDate
    };

    try {
      const res = await fetch('/api/tables/purchase_orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdPo)
      });
      if (res.ok) {
        setPurchaseOrders(prev => [createdPo, ...prev]);
      }
    } catch (err) {
      console.error('Error creating PO:', err);
      setPurchaseOrders(prev => [createdPo, ...prev]);
    }

    if (matchedLink) {
      setActivityLinks(prev => prev.map(a => {
        if (a.activityId === matchedLink.activityId) {
          return {
            ...a,
            committedProcurementYer: a.committedProcurementYer + (parseFloat(newPoForm.totalAmountYer) || 0),
            procurementPOs: [...a.procurementPOs, newPoForm.poNumber]
          };
        }
        return a;
      }));
    }

    setIsNewPoModalOpen(false);
  };

  const handleCreateSalesInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceForm.clientOrDonorNameAr || !newInvoiceForm.totalAmountYer) return;

    const matchedProject = projects.find(p => p.id === newInvoiceForm.projectId);
    const matchedLink = activityLinks.find(a => a.activityId === newInvoiceForm.wbsActivityId);

    const createdInv: SalesOrderInvoice = {
      id: `inv-${Date.now()}`,
      invoiceCode: newInvoiceForm.invoiceCode,
      clientOrDonorNameAr: newInvoiceForm.clientOrDonorNameAr,
      invoiceType: newInvoiceForm.invoiceType,
      projectId: newInvoiceForm.projectId,
      projectNameAr: matchedProject ? matchedProject.name_ar : 'عام / تبرعات مباشرة',
      wbsActivityId: newInvoiceForm.wbsActivityId,
      wbsActivityNameAr: matchedLink ? matchedLink.activityNameAr : 'نشاط توليد إيراد',
      totalAmountYer: parseFloat(newInvoiceForm.totalAmountYer) || 0,
      paidAmountYer: 0,
      paymentStatus: 'UNPAID',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: newInvoiceForm.dueDate,
      shariahCompliant: newInvoiceForm.shariahCompliant
    };

    try {
      const res = await fetch('/api/tables/sales_invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdInv)
      });
      if (res.ok) {
        setSalesInvoices(prev => [createdInv, ...prev]);
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setSalesInvoices(prev => [createdInv, ...prev]);
    }

    if (matchedLink) {
      setActivityLinks(prev => prev.map(a => {
        if (a.activityId === matchedLink.activityId) {
          return {
            ...a,
            generatedRevenueYer: a.generatedRevenueYer + (parseFloat(newInvoiceForm.totalAmountYer) || 0),
            salesInvoices: [...a.salesInvoices, newInvoiceForm.invoiceCode]
          };
        }
        return a;
      }));
    }

    setIsNewInvoiceModalOpen(false);
  };

  const handleDeliverPo = async (poId: string) => {
    try {
      await fetch(`/api/tables/purchase_orders/${poId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryStatus: 'DELIVERED_FULL', paymentStatus: 'FULLY_PAID' })
      });
    } catch (err) {
      console.error('Error updating PO delivery:', err);
    }
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          deliveryStatus: 'DELIVERED_FULL',
          paymentStatus: 'FULLY_PAID'
        };
      }
      return po;
    }));
  };

  return (
    <ModuleShell titleAr="نظام العقود والمناقصات" titleEn="Contracts & Procurement OS" domainCode="NEB-14" icon={FileText} accent="amber" lang={lang} onRefresh={onRefresh}>
    <div className="space-y-6 animate-fade-in pb-12">

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-lg">
            <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
            <span className="text-sm font-bold text-slate-700 dark:text-zinc-200">
              {isRtl ? 'جارٍ تحميل البيانات من الخادم...' : 'Loading data from server...'}
            </span>
          </div>
        </div>
      )}
      
      {/* SECTION 1: HEADER & ENTERPRISE BRANDING BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black rounded-lg uppercase tracking-wider">
                {isRtl ? 'المشتريات والمبيعات والأنشطة' : 'Procurement & Sales Engine'}
              </span>
              <span className="text-zinc-400 text-xs font-mono">| Procurement, Sales & WBS Activity Engine</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <ShoppingCart className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{isRtl ? 'منظومة إدارة المشتريات والمبيعات والمناقصات وترابط الأنشطة' : 'Procurement, Sales & Project WBS Activity Integration OS'}</span>
            </h1>
            <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              {isRtl 
                ? 'منظومة مؤسسية ذكية لإدارة دورة الشراء الكاملة، فواتير المبيعات والتبرعات، وربط كافة أوامر التوريد والإيرادات ببطاقات أنشطة المشاريع والمهام WBS لحظياً مع التحديث الآلي لحالة الإنجاز والامتثال الشرعي (IPSAS Compliance).'
                : 'Enterprise OS unifying purchasing POs, sales invoices, donor pledges, and real-time mapping to project WBS task cards with auto-completion triggers and IPSAS compliance.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsNewPoModalOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'أمر شراء/توريد جديد (PO)' : 'New Purchase Order'}</span>
            </button>

            <button
              onClick={() => setIsNewInvoiceModalOpen(true)}
              className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{isRtl ? 'إصدار فاتورة مبيعات/دعم' : 'Issue Sales Invoice'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: METRICS KPIS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {isRtl ? 'إجمالي المشتريات الملتزم بها' : 'Committed Procurement'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {totalProcurementCommitted.toLocaleString()} <span className="text-xs text-slate-500 font-sans">YER</span>
            </p>
            <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
              <ShoppingCart className="w-3 h-3" />
              {isRtl ? `${purchaseOrders.length} أمر توريد نشط` : `${purchaseOrders.length} active POs`}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {isRtl ? 'إجمالي فواتير المبيعات والدعم' : 'Invoiced Revenue'}
            </span>
            <p className="text-xl font-black text-blue-600 font-mono">
              {totalSalesRevenueInvoiced.toLocaleString()} <span className="text-xs text-blue-500 font-sans">YER</span>
            </p>
            <span className="text-[10px] text-blue-600 font-extrabold flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              {isRtl ? `المحصل: ${totalSalesRevenueCollected.toLocaleString()} YER` : `Collected: YER ${totalSalesRevenueCollected.toLocaleString()}`}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl border border-blue-200 dark:border-blue-800">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {isRtl ? 'عقود الموردين النشطة' : 'Active Vendor Contracts'}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {totalContractVal.toLocaleString()} <span className="text-xs text-slate-500 font-sans">YER</span>
            </p>
            <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1">
              <FileCheck className="w-3 h-3" />
              {isRtl ? `${contracts.length} عقود موثقة ومحمية` : `${contracts.length} active SLA contracts`}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl border border-amber-200 dark:border-amber-800">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4.5 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {isRtl ? 'نسبة الترابط ببطاقات WBS' : 'WBS Activity Link Ratio'}
            </span>
            <p className="text-xl font-black text-emerald-600 font-mono">
              100% <span className="text-xs text-emerald-500 font-sans">{isRtl ? 'ربط محكم' : 'synced'}</span>
            </p>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
              <Link2 className="w-3 h-3 text-emerald-500" />
              {isRtl ? 'تحديث آلي لنسب الإنجاز' : 'Auto Completion Trigger'}
            </span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl border border-purple-200 dark:border-purple-800">
            <Layers className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SECTION 3: SUB-NAVIGATION TABS */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2 flex flex-wrap items-center gap-1.5 shadow-xs">
        
        <button
          onClick={() => setActiveSubTab('partnerships')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'partnerships'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>{isRtl ? 'إدارة الشراكات والتمويل المؤسسي' : 'Partnerships & Funding OS'}</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded font-mono text-[10px]">{partnerships.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('procurement')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'procurement'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isRtl ? 'المشتريات والمناقصات (POs & PRs)' : 'Procurement & Tenders'}</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded font-mono text-[10px]">{purchaseOrders.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sales_revenue')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'sales_revenue'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{isRtl ? 'المبيعات والإيرادات والتبرعات' : 'Sales, Revenue & Invoices'}</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded font-mono text-[10px]">{salesInvoices.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'contracts'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>{isRtl ? 'إدارة عقود الموردين والالتزامات' : 'Vendor Contracts SLA'}</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded font-mono text-[10px]">{contracts.length}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wbs_matrix')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'wbs_matrix'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>{isRtl ? 'ماتريكس الترابط مع أنشطة المشاريع WBS' : 'Project Activity WBS Matrix'}</span>
          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded font-mono text-[10px]">LIVE</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai_copilot')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'ai_copilot'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>{isRtl ? 'المساعد الذكي للتحليل والرقابة' : 'AI Procurement & Revenue Copilot'}</span>
        </button>

      </div>

      {/* SECTION 4: TAB CONTENTS */}

      {/* SUB-TAB 0: PARTNERSHIPS & DONORS OS (NEB-08) */}
      {activeSubTab === 'partnerships' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Top Control Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-violet-900/10 via-purple-900/5 to-transparent p-4 rounded-2xl border border-violet-500/20 dark:bg-zinc-900">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-600/20 text-violet-700 dark:text-violet-300 border border-violet-500/30 rounded-md uppercase tracking-wider">{isRtl ? 'شراكات وتمويل' : 'Partnerships'}</span>
                <h3 className="font-black text-base text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <span>{isRtl ? 'منظومة الشراكات والمانحين والمنح الإنسانية' : 'Partnerships & Donor Grants System'}</span>
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                {isRtl 
                  ? 'إدارة شاملة لكافة أشكال الشراكات (الأمم المتحدة، المانحون الدوليون، CSR، التحالفات Executed Consortiums، الجمعيات المحلية، المذكرات الحكومية، الشراكات الأكاديمية والأوقاف).'
                  : 'Comprehensive management for all partnership forms (UN agencies, Donors, CSR, Consortiums, CSOs, Government MoUs, Academic & Endowments).'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewPartnershipModalOpen(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'إبرام اتفاقية شراكة معتمدة' : 'New Partnership Agreement'}</span>
              </button>
            </div>
          </div>

          {/* Aggregate KPI Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {isRtl ? 'محفظة التمويل والمنح الإجمالية' : 'Total Grant Portfolio'}
              </span>
              <p className="text-lg font-black text-violet-600 dark:text-violet-400 font-mono mt-1">
                {(totalGrantPortfolioYer / 1000000).toFixed(1)}M YER
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                ~${Math.round(totalGrantPortfolioYer / 1500).toLocaleString()} USD
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {isRtl ? 'الدفعات المستلمة والمودعة' : 'Disbursed Funds'}
              </span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {(totalGrantReceivedYer / 1000000).toFixed(1)}M YER
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">
                {totalGrantPortfolioYer > 0 ? `${Math.round((totalGrantReceivedYer / totalGrantPortfolioYer) * 100)}% تحصيل` : '0%'}
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {isRtl ? 'متوسط مؤشر القدرات PCA Score' : 'Avg PCA Capacity Score'}
              </span>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {avgPcaScore}%
              </p>
              <span className="text-[10px] text-amber-600 font-bold">
                {avgPcaScore >= 90 ? 'مستوى أمان ممتاز (Low Risk)' : 'مستوى متوسط'}
              </span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {isRtl ? 'الاتفاقيات النشطة المعمدة' : 'Active Partnerships'}
              </span>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
                {partnerships.length} {isRtl ? 'اتفاقيات' : 'agreements'}
              </p>
              <span className="text-[10px] text-blue-600 font-bold">
                {isRtl ? 'تغطي 8 فئات استراتيجية' : 'Covering 8 categories'}
              </span>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs space-y-3">
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <span className="text-slate-400 text-[10px] font-black pl-1">{isRtl ? 'فئة الشريك:' : 'Category:'}</span>
              
              {[
                { id: 'ALL', labelAr: 'الكل', labelEn: 'All Types' },
                { id: 'UN_AGENCY', labelAr: 'الأمم المتحدة', labelEn: 'UN Agencies' },
                { id: 'INTERNATIONAL_DONOR', labelAr: 'مانحون دوليون', labelEn: 'International Donors' },
                { id: 'CSR_CORPORATE', labelAr: 'القطاع الخاص (CSR)', labelEn: 'CSR Corporate' },
                { id: 'CONSORTIUM', labelAr: 'تحالفات ومكونات', labelEn: 'Consortiums' },
                { id: 'LOCAL_NGO', labelAr: 'جمعيات محلية (Sub-grant)', labelEn: 'Local CSOs' },
                { id: 'GOVERNMENT_MOU', labelAr: 'جهات حكومية', labelEn: 'Government MoUs' },
                { id: 'ACADEMIC_TECHNICAL', labelAr: 'أكاديمية ومعايير', labelEn: 'Academic & Standards' },
                { id: 'PHILANTHROPIC_ENDOWMENT', labelAr: 'أوقاف وداعمون', labelEn: 'Philanthropy & Endowments' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setPartnerTypeFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-all ${
                    partnerTypeFilter === cat.id
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {isRtl ? cat.labelAr : cat.labelEn}
                </button>
              ))}
            </div>

            {/* Dropdowns & Search Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100 dark:border-zinc-800">
              
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={isRtl ? 'بحث بكود الشراكة، الجهة، أو مسؤول الاتصال...' : 'Search partnership code, donor, or contact...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 focus:outline-hidden focus:border-violet-500"
                />
              </div>

              <div>
                <select
                  value={agreementTypeFilter}
                  onChange={e => setAgreementTypeFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 cursor-pointer"
                >
                  <option value="ALL">{isRtl ? 'جميع أشكال الاتفاقيات' : 'All Agreement Forms'}</option>
                  <option value="PCA">اتفاقية تعاون مشروع (PCA)</option>
                  <option value="GRANT_AGREEMENT">عقد اتفاقية منحة تمويلية</option>
                  <option value="MOU">مذكرة تفاهم إستراتيجية (MoU)</option>
                  <option value="CONSORTIUM_CHARTER">ميثاق التحالف التشغيلي</option>
                  <option value="SUB_GRANT">عقد تمويل فرعي (Sub-Grant)</option>
                  <option value="TRIPARTITE">اتفاقية ثلاثية الأطراف</option>
                  <option value="SLA">اتفاقية مستوى الخدمة (SLA)</option>
                </select>
              </div>

              <div>
                <select
                  value={partnershipLifecycleFilter}
                  onChange={e => setPartnershipLifecycleFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-200 cursor-pointer"
                >
                  <option value="ALL">{isRtl ? 'جميع مراحل دورة الحياة' : 'All Lifecycle Stages'}</option>
                  <option value="ACTIVE_EXECUTION">التنفيذ النشط وصرف الدفعات</option>
                  <option value="CO_DESIGN">التصميم والمواءمة</option>
                  <option value="PCA_ASSESSMENT">تقييم القدرات PCA</option>
                  <option value="AGREEMENT_DRAFTING">صياغة الاتفاقية</option>
                  <option value="REPORTING_AUDIT">رفع التقارير والتدقيق</option>
                </select>
              </div>

            </div>

          </div>

          {/* Partnerships Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPartnerships.length === 0 && !loading && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <Handshake className="w-12 h-12 text-slate-300 dark:text-zinc-600 mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">{isRtl ? 'لا توجد شراكات مسجلة بعد' : 'No partnerships recorded yet'}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{isRtl ? 'ابدأ بإضافة اتفاقية شراكة جديدة' : 'Start by adding a new partnership agreement'}</p>
              </div>
            )}
            {filteredPartnerships.map(prt => {
              const recPercent = prt.totalGrantYer > 0 ? Math.round((prt.receivedAmountYer / prt.totalGrantYer) * 100) : 100;
              return (
                <div key={prt.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4">
                  
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 px-2.5 py-1 rounded-lg border border-violet-200 dark:border-violet-800">
                        {prt.partnershipCode}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {prt.agreementType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        {prt.partnerType}
                      </span>
                    </div>
                  </div>

                  {/* Title & Partner Name */}
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 leading-snug">
                      {prt.titleAr}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-violet-700 dark:text-violet-400 font-extrabold">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{prt.partnerNameAr}</span>
                    </div>
                  </div>

                  {/* Financial & Match Funding Progress */}
                  {prt.totalGrantYer > 0 && (
                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-zinc-800 space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono font-black">
                        <span className="text-slate-600 dark:text-zinc-400 text-[11px] font-sans">إجمالي المنحة والتمويل:</span>
                        <span className="text-violet-700 dark:text-violet-400">{prt.totalGrantYer.toLocaleString()} YER (${prt.totalGrantUsd.toLocaleString()})</span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${recPercent}%` }} />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-zinc-400">
                        <span>المستلم: <strong className="text-emerald-600">{prt.receivedAmountYer.toLocaleString()} YER</strong> ({recPercent}%)</span>
                        {prt.matchFundingPercent > 0 && (
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                            Co-Funding: {prt.matchFundingPercent}% ({prt.matchFundingYer.toLocaleString()} YER)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PCA Score Bar & Compliance Standards */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-slate-500">{isRtl ? 'تقييم القدرات PCA:' : 'PCA Index:'}</span>
                      <div className="flex items-center gap-1 font-mono font-black text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{prt.pcaScore}%</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono">
                      focal: {prt.focalPersonName} ({prt.focalPersonPhone})
                    </div>
                  </div>

                  {/* Compliance Chips */}
                  <div className="flex flex-wrap gap-1">
                    {prt.complianceStandards.map((std, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[9px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded border border-slate-200 dark:border-zinc-700">
                        ✓ {std}
                      </span>
                    ))}
                  </div>

                  {/* Tranches Schedule Timeline */}
                  {prt.tranches.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        {isRtl ? 'جدول الدفعات والاقساط التمويلية:' : 'Disbursement Tranches Schedule:'}
                      </span>

                      <div className="space-y-1.5">
                        {prt.tranches.map(tr => (
                          <div key={tr.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-800/80 rounded-xl text-xs font-bold border border-slate-200/50 dark:border-zinc-700/50">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${tr.disbursementStatus === 'DISBURSED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className="text-[11px] font-extrabold text-slate-700 dark:text-zinc-200">{tr.titleAr}</span>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span>{tr.amountYer.toLocaleString()} YER</span>
                              {tr.disbursementStatus === 'DISBURSED' ? (
                                <span className="text-emerald-600 text-[10px] font-black">✓ تم الصرف</span>
                              ) : (
                                <button
                                  onClick={() => handleDisburseTranche(prt.id, tr.id)}
                                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-black cursor-pointer shadow-xs"
                                >
                                  اعتماد وتفريغ الدفعة
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => handlePrintPartnershipCertificate(prt)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Printer className="w-3.5 h-3.5 text-violet-600" />
                      <span>{isRtl ? 'طباعة وثيقة الشراكة' : 'Print Agreement'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPartnershipForPca(prt);
                        setIsPcaEvaluatorModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer border border-amber-200 dark:border-amber-800"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isRtl ? 'تقييم القدرات PCA' : 'Assess PCA Score'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* SUB-TAB 1: PROCUREMENT & PURCHASING ORDERS */}
      {activeSubTab === 'procurement' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">
                {isRtl ? 'أوامر الشراء المعتمدة (Purchase Orders - POs)' : 'Approved Purchase Orders'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRtl ? 'تتبع أوامر الشراء المرتبطة بالأنشطة والموردين مع إمكانية إثبات الاستلام الميداني والتحديث الآلي لـ WBS.' : 'Track purchase orders linked to activities & vendors with automatic WBS status triggers.'}
              </p>
            </div>

            <button
              onClick={() => setIsNewPoModalOpen(true)}
              className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إصدار امر توريد جديد' : 'Issue New PO'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseOrders.length === 0 && !loading && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-zinc-600 mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">{isRtl ? 'لا توجد أوامر شراء مسجلة' : 'No purchase orders recorded'}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{isRtl ? 'ابدأ بإصدار أمر شراء جديد' : 'Start by issuing a new purchase order'}</p>
              </div>
            )}
            {purchaseOrders.map(po => (
              <div key={po.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3.5 hover:shadow-md transition-all">
                
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700">
                    {po.poNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                    po.deliveryStatus === 'DELIVERED_FULL'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : po.deliveryStatus === 'IN_TRANSIT'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-blue-100 text-blue-800 border-blue-300'
                  }`}>
                    {po.deliveryStatus}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white leading-snug">{po.wbsActivityNameAr}</h4>
                  <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>المورد: {po.vendorNameAr}</span>
                  </p>
                </div>

                <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 text-[10px]">{isRtl ? 'قيمة أمر الشراء:' : 'PO Amount:'}</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">{po.totalAmountYer.toLocaleString()} YER</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{isRtl ? `طلب الشراء: ${po.requisitionRef}` : `PR Ref: ${po.requisitionRef}`}</span>
                    <span className="font-mono text-slate-400">{isRtl ? `التسليم: ${po.expectedDeliveryDate}` : `DueDate: ${po.expectedDeliveryDate}`}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl text-[10px] font-bold text-slate-600 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-black">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>مربوط بالنشاط: {po.wbsActivityId}</span>
                  </span>
                  {po.deliveryStatus !== 'DELIVERED_FULL' ? (
                    <button
                      onClick={() => handleDeliverPo(po.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>{isRtl ? 'إثبات التسليم والتحديث' : 'Confirm Delivery'}</span>
                    </button>
                  ) : (
                    <span className="text-emerald-600 font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'تم التسليم وتحديث WBS' : 'Delivered & WBS Updated'}</span>
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* PROCUREMENT AI INTELLIGENCE & VENDOR RECOMMENDATION GRID */}
          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-4">
            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{isRtl ? 'ذكاء المشتريات والمقارنة الثلاثية وتقييم الموردين' : 'Procurement AI & Three-Way Vendor Intelligence'}</span>
            </h4>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <VendorPerformanceAnalyticsView lang={lang} />
              <ProcurementForecastingView lang={lang} />
              <VendorRecommendationEngineView lang={lang} />
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: SALES, REVENUE & INVOICING */}
      {activeSubTab === 'sales_revenue' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">
                {isRtl ? 'سجل فواتير المبيعات والإيرادات والتعهدات' : 'Sales Invoices & Revenue Ledger'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRtl ? 'إدارة تعهدات المنح، عوائد الأوقاف الاستثمارية، وفواتير الخدمات الميدانية المربوطة بمخرجات المشاريع.' : 'Donor pledge tracking, endowment returns, and service invoices linked to project outputs.'}
              </p>
            </div>

            <button
              onClick={() => setIsNewInvoiceModalOpen(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إصدار فاتورة إيراد جديدة' : 'Issue Sales Invoice'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesInvoices.length === 0 && !loading && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <Receipt className="w-12 h-12 text-slate-300 dark:text-zinc-600 mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">{isRtl ? 'لا توجد فواتير مبيعات مسجلة' : 'No sales invoices recorded'}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{isRtl ? 'ابدأ بإصدار فاتورة مبيعات جديدة' : 'Start by issuing a new sales invoice'}</p>
              </div>
            )}
            {salesInvoices.map(inv => (
              <div key={inv.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3.5 hover:shadow-md transition-all">
                
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                    {inv.invoiceCode}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                    inv.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : inv.paymentStatus === 'PARTIALLY_PAID'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {inv.paymentStatus}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white leading-snug">{inv.clientOrDonorNameAr}</h4>
                  <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                    <span>نوع الإيراد: {inv.invoiceType}</span>
                  </p>
                </div>

                <div className="bg-blue-50/60 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200/60 dark:border-blue-800/60 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 text-[10px]">{isRtl ? 'إجمالي مبلغ الفاتورة:' : 'Invoice Total:'}</span>
                    <span className="font-mono text-blue-700 dark:text-blue-400 font-black">{inv.totalAmountYer.toLocaleString()} YER</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{isRtl ? `المحصل: ${inv.paidAmountYer.toLocaleString()} YER` : `Collected: YER ${inv.paidAmountYer.toLocaleString()}`}</span>
                    <span className="font-mono text-slate-400">{isRtl ? `الاستحقاق: ${inv.dueDate}` : `Due: ${inv.dueDate}`}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl text-[10px] font-bold text-slate-600 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-black">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>مربوط بالنشاط: {inv.wbsActivityId}</span>
                  </span>
                  <span className="text-emerald-600 font-black flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'مطابق شرعياً' : 'Shariah Certified'}</span>
                  </span>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* SUB-TAB 3: CONTRACTS & VENDOR AGREEMENTS */}
      {activeSubTab === 'contracts' && (
        <div className="space-y-4">
          
          {/* Contracts Control Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">
                {isRtl ? 'عقود الموردين والمقاولين والخدمات' : 'Vendor, Contractor & Service Agreements'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRtl ? 'إدارة دورة حياة العقود من الإبرام إلى التجديد أو الإنهاء مع ربط أوامر الشراء وال值 budgets المعتمدة.' : 'Full contract lifecycle from signing to renewal or closure, linked to POs and approved budgets.'}
              </p>
            </div>

            <PolicyButton
              action="create"
              domain="contracts"
              securityLevel={securityLevel}
              userRole={userRole}
              actionLabel={isRtl ? 'إضافة عقد' : 'Add Contract'}
              onClick={() => setIsNewContractModalOpen(true)}
              className="px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة عقد جديد' : 'Add New Contract'}</span>
            </PolicyButton>
          </div>

          {/* Contracts List / Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {contracts.length === 0 && !loading && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <FileCheck className="w-12 h-12 text-slate-300 dark:text-zinc-600 mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">{isRtl ? 'لا توجد عقود موردين مسجلة' : 'No vendor contracts recorded'}</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{isRtl ? 'ابدأ بإضافة عقد توريد جديد' : 'Start by adding a new supply contract'}</p>
              </div>
            )}
            {contracts.map(contract => {
              const remainingVal = contract.totalValueYer - contract.paidValueYer;
              const paidPercent = Math.min(100, Math.round((contract.paidValueYer / contract.totalValueYer) * 100));

              return (
                <div 
                  key={contract.id}
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700">
                          {contract.contractCode}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase border ${
                          contract.contractType === 'SUPPLIER'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : contract.contractType === 'CONTRACTOR'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {contract.contractType}
                        </span>
                      </div>

                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg flex items-center gap-1 ${
                        contract.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : contract.status === 'EXPIRING_SOON'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {contract.status === 'EXPIRING_SOON' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {contract.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-sm leading-snug">
                        {isRtl ? contract.titleAr : contract.titleEn}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{isRtl ? contract.vendorNameAr : contract.vendorNameEn}</span>
                        <span className="font-mono text-[10px] text-slate-400">({contract.vendorTaxId})</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-emerald-600" />
                          {isRtl ? 'المشروع المرتبط:' : 'Linked Project:'}
                        </span>
                        <span className="font-mono text-[10px] font-black text-emerald-700 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                          {contract.procurementPoRef}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-zinc-200 truncate">
                        {isRtl ? contract.projectNameAr : contract.projectNameEn}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase">{isRtl ? 'قيمة العقد الإجمالية:' : 'Contract Value:'}</span>
                        <span className="font-mono font-black text-slate-900 dark:text-white">{contract.totalValueYer.toLocaleString()} YER</span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${paidPercent}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>{isRtl ? `تم صرف: ${contract.paidValueYer.toLocaleString()} YER (${paidPercent}%)` : `Paid: YER ${contract.paidValueYer.toLocaleString()} (${paidPercent}%)`}</span>
                        <span className="font-black text-amber-600">{isRtl ? `المتبقي: ${remainingVal.toLocaleString()} YER` : `Rem: YER ${remainingVal.toLocaleString()}`}</span>
                      </div>
                    </div>

                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <PolicyButton
                        action="read"
                        domain="contracts"
                        securityLevel={securityLevel}
                        userRole={userRole}
                        actionLabel={isRtl ? 'عرض العقد' : 'View Contract'}
                        onClick={() => {
                          setSelectedContractForDetails(contract);
                          setIsDetailsDrawerOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isRtl ? 'تفاصيل' : 'Details'}</span>
                      </PolicyButton>

                      <PolicyButton
                        action="update"
                        domain="contracts"
                        securityLevel={securityLevel}
                        userRole={userRole}
                        actionLabel={isRtl ? 'تعديل العقد' : 'Edit Contract'}
                        onClick={() => {
                          setSelectedContractForDetails(contract);
                          setIsDetailsDrawerOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                      </PolicyButton>

                      <PolicyButton
                        action="delete"
                        domain="contracts"
                        securityLevel={securityLevel}
                        userRole={userRole}
                        actionLabel={isRtl ? 'حذف العقد' : 'Delete Contract'}
                        onClick={() => {
                          if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا العقد؟' : 'Are you sure you want to delete this contract?')) {
                            setContracts(prev => prev.filter(c => c.id !== contract.id));
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'حذف' : 'Delete'}</span>
                      </PolicyButton>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <PolicyButton
                        action="approve"
                        domain="contracts"
                        securityLevel={securityLevel}
                        userRole={userRole}
                        actionLabel={isRtl ? 'اعتماد العقد' : 'Approve Contract'}
                        onClick={() => {
                          setContracts(prev => prev.map(c => c.id === contract.id ? { ...c, status: 'ACTIVE' } : c));
                        }}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'اعتماد' : 'Approve'}</span>
                      </PolicyButton>

                      <PolicyButton
                        action="print"
                        domain="contracts"
                        securityLevel={securityLevel}
                        userRole={userRole}
                        actionLabel={isRtl ? 'طباعة العقد' : 'Print Contract'}
                        onClick={() => {
                          const e = escapeHtml;
                          const container = document.createElement('div');
                          container.id = 'printable-contract-doc';
                          container.className = 'hidden';
                          container.innerHTML = `
                            <div style="font-family: sans-serif; direction: rtl; padding: 30px; background: #fff; color: #0f172a;">
                              <div style="text-align: center; border-bottom: 3px double #d97706; padding-bottom: 15px; margin-bottom: 25px;">
                                <h1 style="color: #059669; font-size: 20px; font-weight: 900; margin: 0 0 5px 0;">${e(localStorage.getItem('rbd_org_name') || 'جمعية رُحماء بينهم للعمل الإنساني والتنمية')}</h1>
                                <h2 style="color: #d97706; font-size: 16px; font-weight: 800; margin: 0 0 10px 0;">نظام التشغيل المؤسسي NexoraOS™ - إدارة عقود الموردين والمقاولين</h2>
                                <div style="font-size: 14px; font-weight: bold; color: #334155;">وثيقة عقد رسمية معتمدة</div>
                                <div style="font-family: monospace; font-size: 12px; color: #64748b; margin-top: 5px;">كود العقد: ${e(contract.contractCode)} | النوع: ${e(contract.contractType)}</div>
                              </div>
                              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px;">
                                <div><strong>عنوان العقد:</strong> ${e(contract.titleAr)}</div>
                                <div><strong>المورد / المقاول:</strong> ${e(contract.vendorNameAr)}</div>
                                <div><strong>قيمة العقد الإجمالية:</strong> ${e(contract.totalValueYer.toLocaleString())} YER</div>
                                <div><strong>المبلغ المدفوع:</strong> ${e(contract.paidValueYer.toLocaleString())} YER</div>
                                <div><strong>تاريخ البداية:</strong> ${e(contract.startDate)}</div>
                                <div><strong>تاريخ الانتهاء:</strong> ${e(contract.endDate)}</div>
                                <div><strong>رقم أمر الشراء المرتبط:</strong> ${e(contract.procurementPoRef)}</div>
                                <div><strong>حالة العقد:</strong> ${e(contract.status)}</div>
                              </div>
                              <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 12px; font-weight: bold;">
                                <div>
                                  <div>المورد / المقاول</div>
                                  <div style="margin-top: 40px; color: #64748b;">التوقيع والختم</div>
                                </div>
                                <div>
                                  <div>جمعية رُحماء بينهم</div>
                                  <div style="margin-top: 40px; color: #059669;">المسؤول المعني</div>
                                </div>
                              </div>
                            </div>
                          `;
                          document.body.appendChild(container);
                          printElement('printable-contract-doc');
                          setTimeout(() => { document.body.removeChild(container); }, 1000);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Printer className="w-3.5 h-3.5 text-violet-600" />
                        <span>{isRtl ? 'طباعة' : 'Print'}</span>
                      </PolicyButton>

                      <PolicyButton
                        action="share"
                        domain="contracts"
                        securityLevel={securityLevel}
                        userRole={userRole}
                        actionLabel={isRtl ? 'مشاركة العقد' : 'Share Contract'}
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: contract.titleAr, text: `${contract.contractCode} - ${contract.titleAr}` });
                          } else {
                            navigator.clipboard.writeText(`${contract.contractCode} - ${contract.titleAr}`);
                            alert(isRtl ? 'تم نسخ بيانات العقد' : 'Contract details copied');
                          }
                        }}
                        className="px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-600 hover:text-white border border-violet-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'مشاركة' : 'Share'}</span>
                      </PolicyButton>

                      <PolicyButton
                        action="update"
                        domain="contracts"
                        securityLevel={securityLevel}
                        userRole={userRole}
                        actionLabel={isRtl ? 'تجديد العقد' : 'Renew Contract'}
                        onClick={() => {
                          setSelectedContractForRenewal(contract);
                          setRenewalForm({
                            newEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            additionalValueYer: '0',
                            amendmentNotes: ''
                          });
                          setIsRenewalModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تجديد' : 'Renew'}</span>
                      </PolicyButton>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* SUB-TAB 4: WBS PROJECT ACTIVITY & PROCUREMENT MATRIX */}
      {activeSubTab === 'wbs_matrix' && (
        <div className="space-y-4">
          
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-5 rounded-2xl border border-purple-800/40 shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-5 h-5 text-purple-400" />
              <h3 className="font-extrabold text-sm text-white">
                {isRtl ? 'ماتريكس الربط اللحظي بين أوامر التوريد والإيرادات وبطاقات أنشطة المشاريع WBS' : 'Live Correlation Matrix: Procurement, Revenue & Project WBS Tasks'}
              </h3>
            </div>
            <p className="text-xs text-purple-200 leading-relaxed">
              {isRtl 
                ? 'يربط هذا الجدول التفاعلي بين بطاقات أنشطة المشاريع الميدانية، والميزانية المرصودة، وأوامر التوريد الصادرة POs، والإيرادات المحصلة. عند إثبات استلام أمر الشراء، تتحدث نسبة إنجاز بطاقة النشاط آلياً في نظام المشاريع WBS.'
                : 'Directly correlates project WBS cards with purchase orders and revenue invoices. Executing a PO automatically advances the corresponding project WBS completion index.'}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 font-extrabold uppercase text-[10px] border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-3.5">{isRtl ? 'رمز النشاط WBS' : 'WBS Code'}</th>
                    <th className="p-3.5">{isRtl ? 'عنوان النشاط والمشروع' : 'Activity & Project'}</th>
                    <th className="p-3.5">{isRtl ? 'الميزانية المعتمدة' : 'Allocated Budget'}</th>
                    <th className="p-3.5">{isRtl ? 'المشتريات الملتزم بها (POs)' : 'Committed POs'}</th>
                    <th className="p-3.5">{isRtl ? 'الإيرادات المحصلة' : 'Revenue'}</th>
                    <th className="p-3.5">{isRtl ? 'أوامر التوريد المرتبطة' : 'Linked POs'}</th>
                    <th className="p-3.5">{isRtl ? 'فواتير الإيراد المرتبطة' : 'Linked Invoices'}</th>
                    <th className="p-3.5">{isRtl ? 'حالة الانحراف' : 'Variance Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-bold text-slate-800 dark:text-zinc-200">
                  {activityLinks.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center">
                        <Link2 className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">{isRtl ? 'لا توجد بيانات ربط أنشطة بعد' : 'No activity link data yet'}</p>
                      </td>
                    </tr>
                  )}
                  {activityLinks.map(link => (
                    <tr key={link.activityId} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-all">
                      <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-black">
                        {link.activityCode}
                      </td>
                      <td className="p-3.5">
                        <p className="font-black text-slate-900 dark:text-white">{link.activityNameAr}</p>
                        <span className="text-[10px] text-slate-400 font-normal">{link.projectNameAr}</span>
                      </td>
                      <td className="p-3.5 font-mono font-bold">{link.budgetAllocatedYer.toLocaleString()} YER</td>
                      <td className="p-3.5 font-mono font-bold text-amber-600">{link.committedProcurementYer.toLocaleString()} YER</td>
                      <td className="p-3.5 font-mono font-bold text-blue-600">{link.generatedRevenueYer.toLocaleString()} YER</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {link.procurementPOs.map(po => (
                            <span key={po} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[9px] font-black rounded">
                              {po}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {link.salesInvoices.map(inv => (
                            <span key={inv} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono text-[9px] font-black rounded">
                              {inv}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black rounded-lg">
                          {link.varianceStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 5: AI COPILOT & AUDIT ANALYTICS */}
      {activeSubTab === 'ai_copilot' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-2xl border border-emerald-700/50 shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
              <div>
                <h3 className="font-extrabold text-base text-white">
                  {isRtl ? 'المساعد الذكي لتحليل المشتريات والمبيعات وترابط أنشطة WBS' : 'AI Smart Procurement & Sales Analytics Copilot'}
                </h3>
                <p className="text-xs text-emerald-200">
                  {isRtl ? 'تحليل مقارن لأسعار التوريد مقابل متوسط السوق، والتنبؤ بالتوافق مع الميزانيات والامتثال المعياري.' : 'Comparative supplier pricing analysis against market averages and predictive cash-flow forecasting.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 space-y-2">
                <span className="text-[10px] font-black text-amber-300 uppercase block">توصية الأسعار الشفافة</span>
                <p className="text-xs text-white leading-relaxed font-bold">
                  أسعار توريد السلال الغذائية لمخيمات مأرب تنخفض بنسبة 4.2% عن متوسط السوق المحلي. يوصى باعتماد العقد النهائي.
                </p>
              </div>

              <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 space-y-2">
                <span className="text-[10px] font-black text-blue-300 uppercase block">التنبؤ بالتفق المالي</span>
                <p className="text-xs text-white leading-relaxed font-bold">
                  عوائد الإيجارات الوقفية المتوقع تحصيلها خلال 30 يوماً تغطي 100% من الالتزامات التعاقدية الوشيكة.
                </p>
              </div>

              <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 space-y-2">
                <span className="text-[10px] font-black text-emerald-300 uppercase block">الامتثال الشرعي و IPSAS</span>
                <p className="text-xs text-white leading-relaxed font-bold">
                  جميع فواتير الدعم والتبرعات مطابقة لمعايير IPSAS ومحفوظة ضمن السجل المالي غير القابل للتعديل.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: CREATE NEW PO MODAL ==================== */}
      {isNewPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">
                  {isRtl ? 'إصدار أمر شراء وتوريد جديد (PO)' : 'Issue New Purchase Order'}
                </h3>
              </div>
              <button onClick={() => setIsNewPoModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-3.5 text-xs font-bold text-slate-700 dark:text-zinc-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'رقم أمر الشراء' : 'PO Ref'}</label>
                  <input type="text" value={newPoForm.poNumber} onChange={e => setNewPoForm(p => ({ ...p, poNumber: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'اسم المورد المعتمد' : 'Vendor Name'}</label>
                  <input type="text" required placeholder="شركة السعيد للتوريدات" value={newPoForm.vendorNameAr} onChange={e => setNewPoForm(p => ({ ...p, vendorNameAr: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'نشاط المشروع المستهدف WBS' : 'Target WBS Activity Task'}</label>
                <select value={newPoForm.wbsActivityId} onChange={e => setNewPoForm(p => ({ ...p, wbsActivityId: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-bold cursor-pointer">
                  {activityLinks.map(a => (
                    <option key={a.activityId} value={a.activityId}>{a.activityCode} - {a.activityNameAr}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'المبلغ الإجمالي (YER)' : 'Total Amount (YER)'}</label>
                  <input type="number" required placeholder="0" value={newPoForm.totalAmountYer} onChange={e => setNewPoForm(p => ({ ...p, totalAmountYer: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono font-bold text-emerald-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'تاريخ التسليم المتوقع' : 'Expected Delivery'}</label>
                  <input type="date" value={newPoForm.expectedDeliveryDate} onChange={e => setNewPoForm(p => ({ ...p, expectedDeliveryDate: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono" />
                </div>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl flex items-center justify-between">
                <span className="text-[10px] font-black text-purple-700 dark:text-purple-300">تحديث نسبة إنجاز النشاط آلياً عند الاستلام</span>
                <input type="checkbox" checked={newPoForm.autoActivityUpdate} onChange={e => setNewPoForm(p => ({ ...p, autoActivityUpdate: e.target.checked }))} className="w-4 h-4 accent-purple-600 cursor-pointer" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsNewPoModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-black cursor-pointer shadow-md">{isRtl ? 'اعتماد أمر الشراء' : 'Approve & Issue PO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: CREATE NEW SALES INVOICE MODAL ==================== */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 animate-scale-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">
                  {isRtl ? 'إصدار فاتورة مبيعات / دعم / إيجار وقفي' : 'Issue Sales Invoice'}
                </h3>
              </div>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSalesInvoice} className="space-y-3.5 text-xs font-bold text-slate-700 dark:text-zinc-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'رقم الفاتورة' : 'Invoice Code'}</label>
                  <input type="text" value={newInvoiceForm.invoiceCode} onChange={e => setNewInvoiceForm(p => ({ ...p, invoiceCode: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'اسم المانح / العميل / المستأجر' : 'Client / Donor Name'}</label>
                  <input type="text" required placeholder="مركز الملك سلمان / محفظة الأوقاف" value={newInvoiceForm.clientOrDonorNameAr} onChange={e => setNewInvoiceForm(p => ({ ...p, clientOrDonorNameAr: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'نوع الإيراد' : 'Revenue Type'}</label>
                <select value={newInvoiceForm.invoiceType} onChange={e => setNewInvoiceForm(p => ({ ...p, invoiceType: e.target.value as any }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-bold cursor-pointer">
                  <option value="DONOR_PLEDGE">تعهد منح وتبرعات مشروطة</option>
                  <option value="ENDOWMENT_RENT">إيجارات وعوائد أصول وقفية</option>
                  <option value="PROJECT_SERVICE_FEE">رسوم تشغيل وإدارة مشاريع ميدانية</option>
                  <option value="PRODUCT_SALE">مبيعات منتجات وقفيّة وتنموية</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'المبلغ الإجمالي (YER)' : 'Total Amount (YER)'}</label>
                  <input type="number" required placeholder="0" value={newInvoiceForm.totalAmountYer} onChange={e => setNewInvoiceForm(p => ({ ...p, totalAmountYer: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono font-bold text-blue-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                  <input type="date" value={newInvoiceForm.dueDate} onChange={e => setNewInvoiceForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsNewInvoiceModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-black cursor-pointer shadow-md">{isRtl ? 'إصدار الفاتورة' : 'Issue Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: NEW PARTNERSHIP AGREEMENT WIZARD */}
      {isNewPartnershipModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 animate-scale-in my-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-violet-100 dark:bg-violet-950 text-violet-600 rounded-xl">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">
                    {isRtl ? 'إبرام اتفاقية شراكة معتمدة جديدة' : 'New Partnership Agreement Wizard'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {isRtl ? 'صياغة واعتماد اتفاقية شراكة موثقة مع المانحين والشركاء مع جداول التدفقات المالي الشفافة.' : 'Draft & certify structured partnership agreement with transparent disbursement schedules.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsNewPartnershipModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartnership} className="space-y-3.5 text-xs font-bold text-slate-700 dark:text-zinc-200">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'كود الشراكة المولد' : 'Partnership Code'}</label>
                  <input type="text" value={newPartnershipForm.partnershipCode} onChange={e => setNewPartnershipForm(p => ({ ...p, partnershipCode: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono text-violet-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'اسم الجهة المانحة / الشريكة (عربي)' : 'Partner Name (Arabic)'}</label>
                  <input type="text" required placeholder="مكتب الأمم المتحدة / مركز الملك سلمان / بنك..." value={newPartnershipForm.partnerNameAr} onChange={e => setNewPartnershipForm(p => ({ ...p, partnerNameAr: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'عنوان اتفاقية الشراكة والمنحة' : 'Agreement Title'}</label>
                <input type="text" required placeholder="اتفاقية منحة الاستجابة الإنسانية العاجلة الميدانية..." value={newPartnershipForm.titleAr} onChange={e => setNewPartnershipForm(p => ({ ...p, titleAr: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'فئة ونوع الشريك' : 'Partner Type'}</label>
                  <select value={newPartnershipForm.partnerType} onChange={e => setNewPartnershipForm(p => ({ ...p, partnerType: e.target.value as any }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-bold cursor-pointer">
                    <option value="UN_AGENCY">وكالة أمم متحدة (UN Agency)</option>
                    <option value="INTERNATIONAL_DONOR">مانح دولي حكومي (International Donor)</option>
                    <option value="CSR_CORPORATE">قطاع خاص ومسؤولية مجتمعية (CSR)</option>
                    <option value="CONSORTIUM">تحالف منظمات (Consortium)</option>
                    <option value="LOCAL_NGO">جمعية محلية (Sub-grant CSO)</option>
                    <option value="GOVERNMENT_MOU">وزارة / جهة حكومية (Government)</option>
                    <option value="ACADEMIC_TECHNICAL">جامعة / مركز أبحاث (Academic)</option>
                    <option value="PHILANTHROPIC_ENDOWMENT">مؤسسة وقفيّة وداعمون (Endowment)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'شكل ونوع الاتفاقية' : 'Agreement Form'}</label>
                  <select value={newPartnershipForm.agreementType} onChange={e => setNewPartnershipForm(p => ({ ...p, agreementType: e.target.value as any }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-bold cursor-pointer">
                    <option value="PCA">اتفاقية تعاون مشروع (PCA)</option>
                    <option value="GRANT_AGREEMENT">عقد اتفاقية منحة تمويلية</option>
                    <option value="MOU">مذكرة تفاهم إستراتيجية (MoU)</option>
                    <option value="CONSORTIUM_CHARTER">ميثاق التحالف التشغيلي</option>
                    <option value="SUB_GRANT">عقد تمويل فرعي (Sub-Grant)</option>
                    <option value="TRIPARTITE">اتفاقية ثلاثية الأطراف</option>
                    <option value="SLA">اتفاقية مستوى الخدمة (SLA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'المشروع المرتبط بالمنحة' : 'Linked Project'}</label>
                  <select value={newPartnershipForm.projectId} onChange={e => setNewPartnershipForm(p => ({ ...p, projectId: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-bold cursor-pointer">
                    {projects.map(prj => (
                      <option key={prj.id} value={prj.id}>{prj.name_ar}</option>
                    ))}
                    <option value="general">عام / غير مرتبط بمشروع محدد</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'مرحلة دورة الحياة Initial Lifecycle' : 'Lifecycle Stage'}</label>
                  <select value={newPartnershipForm.lifecycleStage} onChange={e => setNewPartnershipForm(p => ({ ...p, lifecycleStage: e.target.value as any }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-bold cursor-pointer">
                    <option value="ACTIVE_EXECUTION">التنفيذ النشط وصرف الدفعات</option>
                    <option value="CO_DESIGN">التصميم والمواءمة</option>
                    <option value="PCA_ASSESSMENT">تقييم القدرات PCA</option>
                    <option value="AGREEMENT_DRAFTING">صياغة الاتفاقية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'إجمالي المنحة (YER)' : 'Total Grant (YER)'}</label>
                  <input type="number" required placeholder="100000000" value={newPartnershipForm.totalGrantYer} onChange={e => setNewPartnershipForm(p => ({ ...p, totalGrantYer: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono text-violet-600 font-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'المعادل بالدولار (USD)' : 'Equivalent (USD)'}</label>
                  <input type="number" placeholder="66000" value={newPartnershipForm.totalGrantUsd} onChange={e => setNewPartnershipForm(p => ({ ...p, totalGrantUsd: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'نسبة المساهمة الذاتية %' : 'Co-Funding Match %'}</label>
                  <input type="number" placeholder="10" value={newPartnershipForm.matchFundingPercent} onChange={e => setNewPartnershipForm(p => ({ ...p, matchFundingPercent: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'تاريخ بداية السريان' : 'Start Date'}</label>
                  <input type="date" value={newPartnershipForm.startDate} onChange={e => setNewPartnershipForm(p => ({ ...p, startDate: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'تاريخ انتهاء المنحة' : 'End Date'}</label>
                  <input type="date" value={newPartnershipForm.endDate} onChange={e => setNewPartnershipForm(p => ({ ...p, endDate: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'اسم ضابط الاتصال الشريك' : 'Focal Point Name'}</label>
                  <input type="text" placeholder="د. أحمد الفضلي" value={newPartnershipForm.focalPersonName} onChange={e => setNewPartnershipForm(p => ({ ...p, focalPersonName: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input type="email" placeholder="partner@un.org" value={newPartnershipForm.focalPersonEmail} onChange={e => setNewPartnershipForm(p => ({ ...p, focalPersonEmail: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'رقم الهاتف' : 'Phone'}</label>
                  <input type="text" placeholder="+967 770 123 456" value={newPartnershipForm.focalPersonPhone} onChange={e => setNewPartnershipForm(p => ({ ...p, focalPersonPhone: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1">{isRtl ? 'معايير الامتثال والحوكمة (مفصولة بفارزة)' : 'Compliance Standards'}</label>
                <input type="text" value={newPartnershipForm.complianceStandards} onChange={e => setNewPartnershipForm(p => ({ ...p, complianceStandards: e.target.value }))} className="w-full bg-slate-50 dark:bg-zinc-800 border p-2 rounded-xl" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button type="button" onClick={() => setIsNewPartnershipModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="px-5 py-2 bg-violet-600 text-white rounded-xl font-black cursor-pointer shadow-md">{isRtl ? 'اعتماد وإبرام الاتفاقية' : 'Certify & Save Agreement'}</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 5: PARTNER CAPACITY ASSESSMENT (PCA) EVALUATOR */}
      {isPcaEvaluatorModalOpen && selectedPartnershipForPca && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">
                    {isRtl ? 'تقييم القدرات المؤسسية للشريك' : 'Partner Capacity Assessment Evaluator'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {selectedPartnershipForPca.partnerNameAr} ({selectedPartnershipForPca.partnershipCode})
                  </p>
                </div>
              </div>
              <button onClick={() => setIsPcaEvaluatorModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-bold text-slate-700 dark:text-zinc-200">
              
              <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center font-extrabold">
                  <span>1. الحوكمة والامتثال التشغيلي والقانوني:</span>
                  <span className="font-mono text-amber-600">{pcaPillars.governance}%</span>
                </div>
                <input type="range" min="50" max="100" value={pcaPillars.governance} onChange={e => setPcaPillars(p => ({ ...p, governance: parseInt(e.target.value) }))} className="w-full accent-amber-500 cursor-pointer" />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center font-extrabold">
                  <span>2. السلامة والرقابة والملاءة المالية (IPSAS Audit):</span>
                  <span className="font-mono text-amber-600">{pcaPillars.financials}%</span>
                </div>
                <input type="range" min="50" max="100" value={pcaPillars.financials} onChange={e => setPcaPillars(p => ({ ...p, financials: parseInt(e.target.value) }))} className="w-full accent-amber-500 cursor-pointer" />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center font-extrabold">
                  <span>3. سياسات المشتريات والنزاهة والتوريد:</span>
                  <span className="font-mono text-amber-600">{pcaPillars.procurement}%</span>
                </div>
                <input type="range" min="50" max="100" value={pcaPillars.procurement} onChange={e => setPcaPillars(p => ({ ...p, procurement: parseInt(e.target.value) }))} className="w-full accent-amber-500 cursor-pointer" />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center font-extrabold">
                  <span>4. الموارد البشرية والسيون والصفات الصونية (Safeguarding):</span>
                  <span className="font-mono text-amber-600">{pcaPillars.humanResources}%</span>
                </div>
                <input type="range" min="50" max="100" value={pcaPillars.humanResources} onChange={e => setPcaPillars(p => ({ ...p, humanResources: parseInt(e.target.value) }))} className="w-full accent-amber-500 cursor-pointer" />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center font-extrabold">
                  <span>5. معايير إسفير والتحقق الميداني والشفافية (IATI):</span>
                  <span className="font-mono text-amber-600">{pcaPillars.monitoringAndSphere}%</span>
                </div>
                <input type="range" min="50" max="100" value={pcaPillars.monitoringAndSphere} onChange={e => setPcaPillars(p => ({ ...p, monitoringAndSphere: parseInt(e.target.value) }))} className="w-full accent-amber-500 cursor-pointer" />
              </div>

              {/* Total Calculated Index Banner */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase block">{isRtl ? 'المؤشر المركب النهائي (PCA Score)' : 'Final Composite PCA Score'}</span>
                  <span className="text-xl font-black font-mono text-amber-600">{calculatedPcaScore}%</span>
                </div>
                <div className="text-left font-black text-xs">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] ${calculatedPcaScore >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {calculatedPcaScore >= 90 ? 'مستوى خطورة منخفض Low Risk' : 'مستوى خطورة متوسط Medium Risk'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button type="button" onClick={() => setIsPcaEvaluatorModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 cursor-pointer">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="button" onClick={handleSavePcaEvaluation} className="px-5 py-2 bg-amber-600 text-white rounded-xl font-black cursor-pointer shadow-md">{isRtl ? 'حفظ وتحديث التقييم' : 'Save PCA Score'}</button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
    </ModuleShell>
  );
};
