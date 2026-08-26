import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Search, Trash2, Eye, Printer, Building, Layers, 
  Activity, CheckCircle2, XCircle, Clock, ArrowRight, CheckCircle, 
  AlertCircle, FileText, FileSpreadsheet, UserCheck, Workflow, 
  ChevronRight, BadgePercent, TrendingUp, DollarSign, RefreshCw, Warehouse
} from 'lucide-react';
import { Account, Project } from './FinanceTypes';
import { printHTML, createPrintDocument } from '../../lib/printUtils';
import { generateShortId, generateNumericCode } from '../../lib/idGenerator';

interface ProcurementTabProps {
  accounts: Account[];
  projects: Project[];
  currencies: any[];
  activities: any[];
  organizations: any[];
  lang: 'ar' | 'en';
  onRefresh: () => void;
}

interface Requisition {
  id: string;
  pr_number: string;
  title: string;
  project_id: string;
  activity_id: string | null;
  category: string;
  requested_by: string;
  department: string;
  estimated_cost: number;
  currency_code: string;
  priority: 'low' | 'medium' | 'high';
  notes: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ORDERED';
  created_at: string;
  items: Array<{ name: string; qty: number; unit_price: number; total: number }>;
}

interface Quotation {
  id: string;
  pr_id: string;
  supplier_name: string;
  quote_ref: string;
  delivery_days: number;
  technical_score: number; // 0 to 100
  unit_prices: Record<string, number>; // item index or name -> price
  total_price: number;
  notes: string;
  status: 'SUBMITTED' | 'WINNING' | 'REJECTED';
  created_at: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  pr_id: string;
  quote_id: string;
  supplier_name: string;
  total_amount: number;
  currency_code: string;
  delivery_date: string;
  terms: string;
  status: 'DRAFT' | 'APPROVED' | 'ISSUED' | 'RECEIVED' | 'SETTLED';
  created_at: string;
  warehouse_id: string;
}

interface GoodsReceipt {
  id: string;
  grn_number: string;
  po_id: string;
  received_by: string;
  received_date: string;
  items_status: Record<string, { ordered: number; received: number; accepted: number; rejected: number }>;
  warehouse_name: string;
  quality_ok: boolean;
  notes: string;
  status: 'ACCEPTED' | 'REJECTED';
}

export default function ProcurementTab({ 
  accounts, 
  projects, 
  currencies = [], 
  activities = [], 
  organizations = [], 
  lang, 
  onRefresh 
}: ProcurementTabProps) {
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'overview' | 'requisitions' | 'quotes' | 'orders' | 'receiving' | 'settlement'>('overview');
  const [loading, setLoading] = useState(true);

  // Core P2P States (Fetched from Neon PostgreSQL via API)
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);

  // Forms states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prForm, setPrForm] = useState({
    title: '',
    project_id: '',
    activity_id: '',
    category: 'غذائية وإيوائية',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: '',
    requested_by: 'المدير الميداني',
    department: 'العمليات الميدانية',
    items: [{ name: '', qty: 1, unit_price: 0 }]
  });

  const [quoteForm, setQuoteForm] = useState({
    pr_id: '',
    supplier_name: '',
    quote_ref: '',
    delivery_days: 5,
    technical_score: 90,
    unit_prices: {} as Record<string, number>,
    notes: ''
  });

  const [poForm, setPoForm] = useState({
    pr_id: '',
    quote_id: '',
    delivery_date: '',
    terms: '',
    warehouse_id: 'wh-1'
  });

  const [grnForm, setGrnForm] = useState({
    po_id: '',
    received_by: '',
    received_date: '',
    warehouse_name: 'المستودع المركزي الرئيسي',
    notes: '',
    items_status: {} as Record<string, { ordered: number; received: number; accepted: number; rejected: number }>
  });

  const [settlementForm, setSettlementForm] = useState({
    po_id: '',
    expense_account_id: '',
    payable_account_id: '',
    description: '',
    payment_method: 'BANK_TRANSFER',
    reference_number: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedPrIdForQuote, setSelectedPrIdForQuote] = useState<string | null>(null);
  const [selectedPoForReceipt, setSelectedPoForReceipt] = useState<string | null>(null);
  const [previewPo, setPreviewPo] = useState<PurchaseOrder | null>(null);

  // Fetch data from real API (Neon PostgreSQL)
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [poRes, rfqRes] = await Promise.all([
          fetch('/api/tables/purchase_orders'),
          fetch('/api/tables/rfqs')
        ]);

        if (!cancelled) {
          if (poRes.ok) {
            const poData = await poRes.json();
            setPurchaseOrders(Array.isArray(poData) ? poData : []);
          }
          if (rfqRes.ok) {
            const rfqData = await rfqRes.json();
            setQuotations(Array.isArray(rfqData) ? rfqData : []);
          }
        }
      } catch (e) {
        console.error('Error fetching procurement data:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [projects]);


  // Requisitions handlers
  const handleAddPrItem = () => {
    setPrForm(prev => ({
      ...prev,
      items: [...prev.items, { name: '', qty: 1, unit_price: 0 }]
    }));
  };

  const handleRemovePrItem = (idx: number) => {
    if (prForm.items.length <= 1) return;
    setPrForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handlePrItemChange = (idx: number, field: string, value: any) => {
    setPrForm(prev => {
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const emptyItem = prForm.items.some(item => !item.name.trim() || item.qty <= 0 || item.unit_price <= 0);
    if (emptyItem) {
      setMessage({
        type: 'error',
        text: isRtl ? 'يرجى ملء جميع حقول تفاصيل المواد وأسعار التقدير بشكل صحيح.' : 'Please fill all item specifications and pricing correctly.'
      });
      return;
    }

    if (!prForm.project_id && projects.length > 0) {
      prForm.project_id = projects[0].id;
    }

    const totalEstimate = prForm.items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);

    const newPr: Requisition = {
      id: generateShortId('req'),
      pr_number: `PR-2026-${String(requisitions.length + 1).padStart(3, '0')}`,
      title: prForm.title,
      project_id: prForm.project_id,
      activity_id: prForm.activity_id || null,
      category: prForm.category,
      requested_by: prForm.requested_by,
      department: prForm.department,
      estimated_cost: totalEstimate,
      currency_code: 'YER',
      priority: prForm.priority,
      notes: prForm.notes,
      status: 'PENDING',
      created_at: new Date().toISOString().split('T')[0],
      items: prForm.items.map(i => ({ ...i, total: i.qty * i.unit_price }))
    };

    const updated = [newPr, ...requisitions];
    setRequisitions(updated);


    // Reset Form
    setPrForm({
      title: '',
      project_id: projects[0]?.id || '',
      activity_id: '',
      category: 'غذائية وإيوائية',
      priority: 'medium',
      notes: '',
      requested_by: 'المدير الميداني',
      department: 'العمليات الميدانية',
      items: [{ name: '', qty: 1, unit_price: 0 }]
    });

    setMessage({
      type: 'success',
      text: isRtl ? `تم تسجيل طلب الشراء ذو الرقم ${newPr.pr_number} بنجاح وتحويله لسير الاعتماد.` : `Purchase requisition ${newPr.pr_number} created successfully.`
    });
  };

  const handleTogglePrStatus = (prId: string, status: 'APPROVED' | 'REJECTED') => {
    const updated = requisitions.map(pr => {
      if (pr.id === prId) {
        return { ...pr, status };
      }
      return pr;
    });
    setRequisitions(updated);

    setMessage({
      type: 'success',
      text: isRtl ? `تم تحديث حالة طلب الشراء بنجاح إلى ${status === 'APPROVED' ? 'معتمد ومؤهل لجمع العروض' : 'مرفوض'}.` : `Requisition status updated to ${status}.`
    });
  };

  // Quotes handlers
  const handleAddQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const selectedPr = requisitions.find(pr => pr.id === quoteForm.pr_id);
    if (!selectedPr) return;

    // Check that we have a unit price for all items
    const missingPrice = selectedPr.items.some((_, idx) => !quoteForm.unit_prices[idx] || quoteForm.unit_prices[idx] <= 0);
    if (missingPrice) {
      setMessage({
        type: 'error',
        text: isRtl ? 'يرجى إدخال أسعار العرض لجميع البنود المدرجة في طلب الشراء.' : 'Please enter prices for all requested items.'
      });
      return;
    }

    // Calculate total price based on quote unit prices and PR quantities
    const total = selectedPr.items.reduce((sum, item, idx) => {
      const price = quoteForm.unit_prices[idx] || 0;
      return sum + (item.qty * price);
    }, 0);

    const newQuote: Quotation = {
      id: generateShortId('q'),
      pr_id: quoteForm.pr_id,
      supplier_name: quoteForm.supplier_name,
      quote_ref: quoteForm.quote_ref,
      delivery_days: quoteForm.delivery_days,
      technical_score: quoteForm.technical_score,
      unit_prices: quoteForm.unit_prices,
      total_price: total,
      notes: quoteForm.notes,
      status: 'SUBMITTED',
      created_at: new Date().toISOString().split('T')[0]
    };

    const updated = [...quotations, newQuote];
    setQuotations(updated);


    // Reset Form
    setQuoteForm({
      pr_id: '',
      supplier_name: '',
      quote_ref: '',
      delivery_days: 5,
      technical_score: 90,
      unit_prices: {},
      notes: ''
    });
    setSelectedPrIdForQuote(null);

    setMessage({
      type: 'success',
      text: isRtl ? 'تم إدخال وتسجيل عرض أسعار المورد ومطابقته الفنية.' : 'Vendor quotation recorded successfully.'
    });
  };

  const handleSelectWinningQuote = (quoteId: string) => {
    const selectedQuote = quotations.find(q => q.id === quoteId);
    if (!selectedQuote) return;

    // Reject all other quotes for this PR and set this one as winning
    const updated = quotations.map(q => {
      if (q.pr_id === selectedQuote.pr_id) {
        return { ...q, status: q.id === quoteId ? 'WINNING' : 'REJECTED' as any };
      }
      return q;
    });

    setQuotations(updated);


    setMessage({
      type: 'success',
      text: isRtl ? `تم اختيار عرض المورد "${selectedQuote.supplier_name}" كعرض فائز لبدء أمر الشراء.` : `Vendor "${selectedQuote.supplier_name}" quotation selected as winning bid.`
    });
  };

  // PO handlers
  const handleGeneratePO = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const selectedPr = requisitions.find(pr => pr.id === poForm.pr_id);
    const selectedQuote = quotations.find(q => q.id === poForm.quote_id);

    if (!selectedPr || !selectedQuote) return;

    const newPO: PurchaseOrder = {
      id: generateShortId('po'),
      po_number: `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      pr_id: poForm.pr_id,
      quote_id: poForm.quote_id,
      supplier_name: selectedQuote.supplier_name,
      total_amount: selectedQuote.total_price,
      currency_code: 'YER',
      delivery_date: poForm.delivery_date || new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
      terms: poForm.terms,
      status: 'APPROVED',
      created_at: new Date().toISOString().split('T')[0],
      warehouse_id: poForm.warehouse_id
    };

    // Update Requisition status to ORDERED
    const updatedPRs = requisitions.map(pr => pr.id === poForm.pr_id ? { ...pr, status: 'ORDERED' as any } : pr);
    setRequisitions(updatedPRs);

    const updatedPOs = [newPO, ...purchaseOrders];
    setPurchaseOrders(updatedPOs);


    // Reset Form
    setPoForm({ pr_id: '', quote_id: '', delivery_date: '', terms: '', warehouse_id: 'wh-1' });

    setMessage({
      type: 'success',
      text: isRtl ? `تم توليد وصياغة أمر الشراء الرسمي ${newPO.po_number} بنجاح.` : `Purchase order ${newPO.po_number} formulated successfully.`
    });
  };

  // GRN handlers
  const handleRecordGRN = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const selectedPO = purchaseOrders.find(po => po.id === grnForm.po_id);
    if (!selectedPO) return;

    const newGRN: GoodsReceipt = {
      id: generateShortId('grn'),
      grn_number: `GRN-2026-${String(goodsReceipts.length + 1).padStart(3, '0')}`,
      po_id: grnForm.po_id,
      received_by: grnForm.received_by || 'أمين المستودع المناوب',
      received_date: grnForm.received_date || new Date().toISOString().split('T')[0],
      items_status: grnForm.items_status,
      warehouse_name: grnForm.warehouse_name,
      quality_ok: true,
      notes: grnForm.notes,
      status: 'ACCEPTED'
    };

    // Update PO Status to RECEIVED
    const updatedPOs = purchaseOrders.map(po => po.id === grnForm.po_id ? { ...po, status: 'RECEIVED' as any } : po);
    setPurchaseOrders(updatedPOs);


    const updatedGRNs = [newGRN, ...goodsReceipts];
    setGoodsReceipts(updatedGRNs);

    // Reset Form
    setGrnForm({
      po_id: '', received_by: '', received_date: '', warehouse_name: 'المستودع المركزي الرئيسي', notes: '', items_status: {}
    });
    setSelectedPoForReceipt(null);

    setMessage({
      type: 'success',
      text: isRtl ? `تم تحرير سند الاستلام المخزني ${newGRN.grn_number} وتحويل المعاملة لقسم الحسابات للسداد المالي.` : `Goods Receipt Note ${newGRN.grn_number} registered.`
    });
  };

  // Financial Posting handler (INTEGRATED with real DB!)
  const handlePostFinancialSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const selectedPO = purchaseOrders.find(po => po.id === settlementForm.po_id);
    const selectedPr = requisitions.find(pr => pr.id === selectedPO?.pr_id);
    if (!selectedPO || !selectedPr) return;

    if (!settlementForm.expense_account_id || !settlementForm.payable_account_id) {
      setMessage({
        type: 'error',
        text: isRtl ? 'يرجى اختيار كلاً من حساب المصروف/التكلفة النشاط، وحساب الالتزام/ذمم الموردين لإتمام التوجيه المزدوج.' : 'Please select both the expense account and the accounts payable account.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const expAcc = accounts.find(a => a.id === settlementForm.expense_account_id);
      const payAcc = accounts.find(a => a.id === settlementForm.payable_account_id);

      const prCode = selectedPr.pr_number;
      const poCode = selectedPO.po_number;
      const amount = selectedPO.total_amount;

      const txNumber = `JV-PROC-${generateNumericCode(0, 9999)}`;
      const narration = isRtl 
        ? `تسوية فاتورة شراء وسداد المورد "${selectedPO.supplier_name}" مقابل ${selectedPr.title} بموجب أمر شراء ${poCode} وطلب ${prCode}`
        : `Settlement of procurement invoice for supplier "${selectedPO.supplier_name}" against ${selectedPr.title} per PO ${poCode} & PR ${prCode}`;

      // 1. Post transaction header
      const txRes = await fetch('/api/tables/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_number: txNumber,
          transaction_date: new Date().toISOString().split('T')[0],
          posting_date: new Date().toISOString().split('T')[0],
          transaction_type: 'JOURNAL_ENTRY',
          total_debit: amount,
          total_credit: amount,
          total_debit_base: amount,
          total_credit_base: amount,
          currency_id: currencies[0]?.id || null,
          exchange_rate: 1,
          description: narration,
          payment_method: settlementForm.payment_method,
          reference_number: settlementForm.reference_number || poCode,
          branch_code: 'HQ',
          security_level: 2,
          organization_id: '00000000-0000-0000-0000-000000000001',
          is_posted: true
        })
      });

      if (!txRes.ok) throw new Error('Failed to create transaction header in DB');
      const txResult = await txRes.json();

      // 2. Post Debit Line (Expense / Activity Center)
      await fetch('/api/tables/transaction_lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: txResult.id,
          organization_id: '00000000-0000-0000-0000-000000000001',
          line_number: 1,
          account_id: expAcc?.id,
          account_code: expAcc?.account_code,
          description: `[مدين - تكلفة النشاط] ${narration}`,
          debit_amount: amount,
          credit_amount: 0,
          project_id: selectedPr.project_id || null,
          activity_id: selectedPr.activity_id || null,
          currency_code: 'YER',
          security_level: 2
        })
      });

      // 3. Post Credit Line (Accounts Payable / Supplier Liabilities)
      await fetch('/api/tables/transaction_lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: txResult.id,
          organization_id: '00000000-0000-0000-0000-000000000001',
          line_number: 2,
          account_id: payAcc?.id,
          account_code: payAcc?.account_code,
          description: `[دائن - ذمة المورد] ${narration}`,
          debit_amount: 0,
          credit_amount: amount,
          project_id: selectedPr.project_id || null,
          activity_id: selectedPr.activity_id || null,
          currency_code: 'YER',
          security_level: 2
        })
      });

      // 4. Update GL balances in Chart of Accounts
      if (expAcc) {
        const nextBal = parseFloat(String(expAcc.current_balance || 0)) + amount;
        await fetch(`/api/tables/chart_of_accounts/${expAcc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_balance: nextBal })
        });
      }
      if (payAcc) {
        const nextBal = parseFloat(String(payAcc.current_balance || 0)) + amount; // Liability Credit increases balance
        await fetch(`/api/tables/chart_of_accounts/${payAcc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_balance: nextBal })
        });
      }

      // Update PO Status to SETTLED
      const updatedPOs = purchaseOrders.map(po => po.id === settlementForm.po_id ? { ...po, status: 'SETTLED' as any } : po);
      setPurchaseOrders(updatedPOs);
  

      // Refresh finance ledger view
      onRefresh();

      // Reset Form
      setSettlementForm({
        po_id: '', expense_account_id: '', payable_account_id: '', description: '', payment_method: 'BANK_TRANSFER', reference_number: ''
      });

      setMessage({
        type: 'success',
        text: isRtl 
          ? `تم ترحيل قيد التسوية المحاسبي ذو الرقم ${txNumber} لدفتر الأستاذ بنجاح وسداد مستحقات المورد.` 
          : `Financial double-entry ledger settlement posted successfully as ${txNumber}.`
      });

    } catch (err: any) {
      console.error('Error posting procurement journal:', err);
      setMessage({
        type: 'error',
        text: isRtl ? 'حدث خطأ أثناء الاتصال بقاعدة البيانات لترحيل القيد المالي.' : `Database ledger posting failure: ${err.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintPO = (po: PurchaseOrder) => {
    const pr = requisitions.find(p => p.id === po.pr_id);
    if (!pr) return;

    // Resilient print writer — popup window when allowed, sandbox-safe iframe fallback
    const printDoc = createPrintDocument();

    const dir = isRtl ? 'rtl' : 'ltr';
    const itemsHTML = pr.items.map((item, idx) => {
      const price = po.total_amount / pr.items.reduce((acc, i) => acc + i.qty, 0); // approx
      return `
        <tr class="border-b border-slate-200">
          <td class="p-3 text-center font-bold">${idx + 1}</td>
          <td class="p-3 text-right font-black">${item.name}</td>
          <td class="p-3 text-center font-bold">${item.qty}</td>
          <td class="p-3 text-left font-mono font-bold">${price.toLocaleString()} YER</td>
          <td class="p-3 text-left font-mono font-bold">${(item.qty * price).toLocaleString()} YER</td>
        </tr>
      `;
    }).join('');

    printDoc.write(`
      <!DOCTYPE html>
      <html lang="${lang}" dir="${dir}">
      <head>
        <meta charset="UTF-8">
        <title>أمر شراء رسمي - ${po.po_number}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body class="bg-slate-50 text-slate-900 p-8">
        <div class="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
          <span class="text-xs font-bold text-slate-500">${isRtl ? 'أمر شراء مالي معتمد للطباعة والتوقيع الميداني' : 'Approved official PO ready for printing'}</span>
          <button onclick="window.print()" class="px-5 py-2.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl cursor-pointer">
            ${isRtl ? 'طباعة مستند أمر الشراء 🖨️' : 'Print Purchase Order 🖨️'}
          </button>
        </div>

        <div class="max-w-4xl mx-auto bg-white border border-slate-300 rounded-xl p-10 shadow-lg min-h-[297mm] flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center pb-6 border-b-2 border-slate-900">
              <div class="text-right">
                <h1 class="font-black text-sm text-slate-900">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h1>
                <p class="text-[10px] font-bold text-slate-500">نظام NexoraOS™ المؤسسي</p>
              </div>
              <span class="text-xs font-black border-2 border-slate-900 px-4 py-1.5 bg-slate-50 rounded">
                أمر شراء رسمي (Purchase Order)
              </span>
              <div class="text-left">
                <h1 class="font-black text-sm text-slate-900">Rohamaa Charity Foundation</h1>
                <p class="text-[10px] font-bold text-slate-500">NexoraOS™ System</p>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-200 text-xs mb-6">
              <div>
                <p class="text-slate-400 font-bold">رقم أمر الشراء</p>
                <p class="font-mono font-black text-slate-900 mt-1">${po.po_number}</p>
              </div>
              <div>
                <p class="text-slate-400 font-bold">تاريخ التحرير</p>
                <p class="font-semibold text-slate-700 mt-1">${new Date(po.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p class="text-slate-400 font-bold">المورد المعتمد</p>
                <p class="font-bold text-slate-700 mt-1">${po.supplier_name}</p>
              </div>
              <div>
                <p class="text-slate-400 font-bold">مجموع القيمة المعتمدة</p>
                <p class="font-mono font-black text-emerald-700 mt-1">${po.total_amount.toLocaleString()} YER</p>
              </div>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200/60 mb-6 text-xs">
              <p class="text-slate-400 font-black mb-1">البيان والغرض من التوريد</p>
              <p class="font-bold text-slate-900 leading-relaxed">${pr.title}</p>
            </div>

            <table class="w-full text-xs text-right border-collapse border border-slate-200 mb-8">
              <thead>
                <tr class="bg-slate-900 text-white font-extrabold uppercase">
                  <th class="p-3 border border-slate-200 text-center w-12">#</th>
                  <th class="p-3 border border-slate-200">المواد المطلوبة ومواصفاتها الفنية</th>
                  <th class="p-3 border border-slate-200 text-center w-24">الكمية</th>
                  <th class="p-3 border border-slate-200 text-left w-32">السعر التقريبي</th>
                  <th class="p-3 border border-slate-200 text-left w-32">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
                <tr class="bg-slate-100 font-black text-slate-900">
                  <td colspan="4" class="p-3 border border-slate-200 text-center">الإجمالي الكلي المعتمد</td>
                  <td class="p-3 border border-slate-200 text-left font-mono">${po.total_amount.toLocaleString()} YER</td>
                </tr>
              </tbody>
            </table>

            <div class="space-y-2 text-xs border border-slate-200 p-4 rounded-xl">
              <p class="font-black text-slate-900">شروط وأحكام التوريد:</p>
              <p class="text-slate-600 leading-relaxed">${po.terms || 'مطابقة للمواصفات القياسية والاستلام من لجنة الرقابة قبل التسليم النهائي.'}</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-6 text-center text-[10px] font-black text-slate-600 border-t border-slate-200 pt-6">
            <div>
              <p class="border-b border-slate-400 pb-1">توقيع منسق المشتريات والخدمات</p>
            </div>
            <div>
              <p class="border-b border-slate-400 pb-1">توقيع واعتماد المدير المالي</p>
            </div>
            <div>
              <p class="border-b border-slate-400 pb-1">اعتماد رئيس مجلس الإدارة والختم</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printDoc.close();
  };

  // Helper Stats Calculation
  const totalSpend = purchaseOrders
    .filter(po => po.status === 'RECEIVED' || po.status === 'SETTLED')
    .reduce((sum, po) => sum + po.total_amount, 0);

  const pendingPrCount = requisitions.filter(pr => pr.status === 'PENDING').length;
  const activePoCount = purchaseOrders.filter(po => po.status === 'APPROVED' || po.status === 'ISSUED').length;

  return (
    <div className="space-y-6 animate-fade-in" id="procurement-system-container">
      
      {/* P2P Quick Status Steps tracker header */}
      <div className="bg-slate-900 dark:bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <ShoppingCart className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white">{isRtl ? 'مسار دورة المشتريات الموحد (Procure-to-Pay)' : 'Unified Procure-to-Pay Pipeline'}</h4>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{isRtl ? 'ربط تخطيط الاحتياج وإرساء العقود بالتسوية المالية التلقائية' : 'Linked requisition, RFQ bidding, PO receiving & automated ledger post'}</p>
          </div>
        </div>
        
        {/* Step tracker icons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-extrabold text-zinc-400 max-w-full">
          <span className={`px-2 py-1 rounded border ${activeTab === 'requisitions' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>1. {isRtl ? 'طلب شراء PR' : 'Requisition'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <span className={`px-2 py-1 rounded border ${activeTab === 'quotes' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>2. {isRtl ? 'عروض الأسعار' : 'Quotations'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <span className={`px-2 py-1 rounded border ${activeTab === 'orders' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>3. {isRtl ? 'أمر توريد PO' : 'Purchase Order'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <span className={`px-2 py-1 rounded border ${activeTab === 'receiving' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>4. {isRtl ? 'استلام GRN' : 'Receipt'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <span className={`px-2 py-1 rounded border ${activeTab === 'settlement' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>5. {isRtl ? 'قيد مالي وتوجيه' : 'GL Settlement'}</span>
        </div>
      </div>

      {/* Procurement Mini Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl">
        {[
          { id: 'overview', label: isRtl ? 'لوحة المشتريات العامة' : 'Procurement Overview', icon: Activity },
          { id: 'requisitions', label: isRtl ? 'طلبات الشراء' : 'Purchase Requisitions', icon: FileText },
          { id: 'quotes', label: isRtl ? 'تحليل ومقارنة العروض' : 'Bid Comparison & Quotes', icon: FileSpreadsheet },
          { id: 'orders', label: isRtl ? 'أوامر الشراء الرسمية' : 'Purchase Orders', icon: Printer },
          { id: 'receiving', label: isRtl ? 'الاستلام والتوريد المخزني' : 'Goods Receipts', icon: Warehouse },
          { id: 'settlement', label: isRtl ? 'التوجيه وسداد الفاتورة تلقائياً' : 'Financial Settlement', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`proc-tab-button-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id as any);
                setMessage(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isActive ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Message Banner */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-xs font-bold">{message.text}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center gap-3 p-12 bg-white border border-slate-200 rounded-2xl">
          <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
          <p className="text-xs font-bold text-slate-500">{isRtl ? 'جارٍ تحميل بيانات المشتريات من قاعدة البيانات...' : 'Loading procurement data from database...'}</p>
        </div>
      )}

      {!loading && (<>
      {/* TAB 1: OVERVIEW & BI DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-black">{isRtl ? 'إجمالي الإنفاق المعتمد' : 'Total Spent Amount'}</p>
                <h3 className="text-lg font-black text-slate-900 mt-1">{totalSpend.toLocaleString()} <span className="text-xs text-zinc-500">YER</span></h3>
                <p className="text-[9px] text-emerald-600 font-bold mt-0.5">✔ {isRtl ? 'مطابق ومرحل للدفاتر المساعدة' : 'Triple-matched & posted'}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-black">{isRtl ? 'الطلبات بانتظار الاعتماد' : 'PR Pending Approval'}</p>
                <h3 className="text-lg font-black text-amber-600 mt-1">{pendingPrCount} <span className="text-xs text-zinc-500">{isRtl ? 'طلب' : 'PRs'}</span></h3>
                <p className="text-[9px] text-zinc-500 font-bold mt-0.5">{isRtl ? 'بانتظار موافقة لجان المشتريات' : 'Requires workflow authorization'}</p>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-black">{isRtl ? 'أوامر الشراء النشطة' : 'Active POs Issued'}</p>
                <h3 className="text-lg font-black text-cyan-600 mt-1">{activePoCount} <span className="text-xs text-zinc-500">{isRtl ? 'أمر' : 'POs'}</span></h3>
                <p className="text-[9px] text-zinc-500 font-bold mt-0.5">{isRtl ? 'قيد التوريد والتسليم الميداني' : 'Pending warehouse reception'}</p>
              </div>
              <div className="p-3 bg-cyan-500/10 text-cyan-600 rounded-xl">
                <Printer className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase font-black">{isRtl ? 'نسبة الامتثال والرقابة' : 'Compliance Rating'}</p>
                <h3 className="text-lg font-black text-emerald-700 mt-1">100%</h3>
                <p className="text-[9px] text-emerald-600 font-bold mt-0.5">✔ {isRtl ? 'التزام تام بمعايير التدقيق المزدوج' : 'Fully compliant with audit standards'}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'تحليلات تدفق المشتريات (Procurement Analytics)' : 'Procurement Process Tracker'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 text-xs">
                <p className="font-bold text-slate-700">{isRtl ? 'سرعة الاستجابة اللوجستية وتوزيع المواد' : 'Logistics Speed & Efficiency'}</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-500 mb-1">
                      <span>{isRtl ? 'اعتماد طلب الاحتياج وعروض الأسعار' : 'PR to Quote Bidding'}</span>
                      <span className="text-emerald-600">3 {isRtl ? 'أيام' : 'days'}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-500 mb-1">
                      <span>{isRtl ? 'أمر الشراء وتوريد المورد للمخازن' : 'PO Issuance to Warehousing'}</span>
                      <span className="text-emerald-600">5 {isRtl ? 'أيام' : 'days'}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-black text-slate-500 mb-1">
                      <span>{isRtl ? 'مطابقة الفواتير والسداد المحاسبي المزدوج' : 'Invoice 3-Way Match & GL Posting'}</span>
                      <span className="text-emerald-600">1 {isRtl ? 'يوم' : 'day'}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '99%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between text-xs">
                <div className="space-y-2">
                  <p className="font-bold text-slate-700">{isRtl ? 'الرقابة والشفافية في تعاملات الموردين' : 'Supplier Integrity & Control Policy'}</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    {isRtl 
                      ? 'يفرض النظام رقابة صارمة عبر المطابقة الثلاثية (3-Way Matching). لا يمكن سداد أي فاتورة مورد ما لم يتوفر أمر شراء PO معتمد ومطابق لسند استلام مخزني GRN موقع ومعمد من لجنة الفحص الفنية ولجنة الجرد.' 
                      : 'The system strictly enforces a 3-Way Matching mechanism. No vendor payment is processed unless a corresponding purchase order (PO) and goods receipt note (GRN) are authorized by the audit committee.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 text-[10px] font-black text-slate-600">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isRtl ? 'مفعل بموجب دستور الرقابة والامتثال الداخلي.' : 'Verified per internal control constitution standards.'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REQUISITIONS (PR) */}
      {activeTab === 'requisitions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Create PR Form */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'إنشاء طلب شراء احتياج' : 'New Requisition'}</h4>
            <form onSubmit={handleCreateRequisition} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'عنوان الاحتياج الإغاثي/التشغيلي' : 'Requisition Title'}</label>
                <input 
                  type="text" 
                  required
                  placeholder={isRtl ? 'مثال: شراء دقيق وتوريد سلال غذائية لعدن' : 'e.g., Purchase of medical kits'}
                  value={prForm.title}
                  onChange={(e) => setPrForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'المشروع المستهدف' : 'Target Project'}</label>
                  <select
                    value={prForm.project_id}
                    onChange={(e) => setPrForm(prev => ({ ...prev, project_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{isRtl ? p.name_ar : p.name_en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'نوع الاحتياج الفني' : 'Category'}</label>
                  <select
                    value={prForm.category}
                    onChange={(e) => setPrForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                  >
                    <option value="مواد غذائية وإغاثية">{isRtl ? 'مواد غذائية وإغاثية' : 'Food & Relief'}</option>
                    <option value="أدوية ومستلزمات طبية">{isRtl ? 'أدوية ومستلزمات طبية' : 'Medicine & Health'}</option>
                    <option value="إيواء وتجهيزات طارئة">{isRtl ? 'إيواء وتجهيزات طارئة' : 'Shelter & Emergency'}</option>
                    <option value="أجهزة مكتبية وتقنية">{isRtl ? 'أجهزة مكتبية وتقنية' : 'IT & Technical'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'مقدم الطلب' : 'Requested By'}</label>
                  <input 
                    type="text" 
                    value={prForm.requested_by}
                    onChange={(e) => setPrForm(prev => ({ ...prev, requested_by: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'أولوية الطلب' : 'Priority'}</label>
                  <select
                    value={prForm.priority}
                    onChange={(e) => setPrForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                  >
                    <option value="low">{isRtl ? 'منخفضة' : 'Low'}</option>
                    <option value="medium">{isRtl ? 'متوسطة' : 'Medium'}</option>
                    <option value="high">{isRtl ? 'عالية ومستعجلة' : 'High / Urgent'}</option>
                  </select>
                </div>
              </div>

              {/* Items Table inside PR */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase">{isRtl ? 'بنود المواد وسعر التقدير' : 'Item Specifications'}</span>
                  <button 
                    type="button" 
                    onClick={handleAddPrItem}
                    className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black flex items-center gap-1 hover:bg-emerald-100"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isRtl ? 'إضافة مادة' : 'Add Item'}</span>
                  </button>
                </div>

                {prForm.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-2">
                    <div className="flex justify-between items-center gap-1.5">
                      <input 
                        type="text" 
                        required
                        placeholder={isRtl ? 'المواصفات الفنية للمادة' : 'Item Specification'}
                        value={item.name}
                        onChange={(e) => handlePrItemChange(idx, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                      />
                      {prForm.items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemovePrItem(idx)}
                          className="p-1 hover:bg-rose-50 rounded text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input 
                          type="number" 
                          required
                          min="1"
                          placeholder={isRtl ? 'الكمية' : 'Qty'}
                          value={item.qty || ''}
                          onChange={(e) => handlePrItemChange(idx, 'qty', parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          required
                          placeholder={isRtl ? 'سعر التقدير YER' : 'Est. Price'}
                          value={item.unit_price || ''}
                          onChange={(e) => handlePrItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الملاحظات الإضافية والتعليمات الميدانية' : 'Field Notes'}</label>
                <textarea 
                  rows={2}
                  value={prForm.notes}
                  onChange={(e) => setPrForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={isRtl ? 'مثال: يرجى التحقق من تواريخ انتهاء الصلاحية لا تقل عن 18 شهراً من التسليم...' : 'Instructions...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{isRtl ? 'تسجيل وإرسال للتحقق المالي' : 'Register Requisition'}</span>
              </button>
            </form>
          </div>

          {/* PR Listing and Approvals */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'طلبات الشراء بانتظار الاعتماد والفرز' : 'Requisitions Review Ledger'}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr className="bg-slate-900 text-amber-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                    <th className="p-3 w-28">{isRtl ? 'رقم الطلب' : 'PR Number'}</th>
                    <th className="p-3">{isRtl ? 'بيان الاحتياج والمشروع' : 'Request details'}</th>
                    <th className="p-3 text-right w-36">{isRtl ? 'القيمة التقديرية' : 'Est. Amount'}</th>
                    <th className="p-3 text-center w-24">{isRtl ? 'الأولوية' : 'Priority'}</th>
                    <th className="p-3 text-center w-28">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 text-center w-36">{isRtl ? 'الرقابة والاعتماد' : 'Controls'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-slate-700">
                  {requisitions.map((pr) => {
                    const matchedProj = projects.find(p => p.id === pr.project_id);
                    return (
                      <tr key={pr.id} className="hover:bg-slate-50/50 transition-all font-semibold">
                        <td className="p-3 font-mono text-slate-900 font-black text-[11px]">{pr.pr_number}</td>
                        <td className="p-3">
                          <p className="font-black text-slate-900">{pr.title}</p>
                          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                            📁 {matchedProj ? (isRtl ? matchedProj.name_ar : matchedProj.name_en) : (isRtl ? 'مخزن عام / مركز تفتيش' : 'General')} 
                            <span className="mx-1.5">|</span> 👤 {pr.requested_by}
                          </p>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900 font-extrabold text-[11px]">{pr.estimated_cost.toLocaleString()} YER</td>
                        <td className="p-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                            pr.priority === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' :
                            pr.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {pr.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                            pr.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            pr.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            pr.status === 'ORDERED' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                          }`}>
                            {pr.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {pr.status === 'PENDING' ? (
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => handleTogglePrStatus(pr.id, 'APPROVED')}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded border border-emerald-200 transition-all"
                                title={isRtl ? 'اعتماد الطلب لتلقي العروض' : 'Approve PR'}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleTogglePrStatus(pr.id, 'REJECTED')}
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded border border-rose-200 transition-all"
                                title={isRtl ? 'رفض الطلب' : 'Reject PR'}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : pr.status === 'APPROVED' ? (
                            <button
                              onClick={() => {
                                setSelectedPrIdForQuote(pr.id);
                                setQuoteForm(prev => ({ ...prev, pr_id: pr.id }));
                                setActiveTab('quotes');
                              }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1 mx-auto"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{isRtl ? 'تسجيل عرض أسعار' : 'Add Quote'}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'جاهز للتوريد' : 'Processed'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUOTATIONS & COMPARISON GRID */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          
          {/* Add Quote form block */}
          {selectedPrIdForQuote && (
            <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">
                  {isRtl ? 'تسجيل عروض أسعار للطلب المعتمد:' : 'Register Supplier Quote for Approved PR:'}
                  <span className="text-emerald-600 font-mono ml-2">
                    {requisitions.find(pr => pr.id === selectedPrIdForQuote)?.pr_number}
                  </span>
                </h4>
                <button 
                  onClick={() => setSelectedPrIdForQuote(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddQuotation} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم المورد / الشركة التجارية' : 'Supplier Name'}</label>
                    <input 
                      type="text" 
                      required
                      placeholder={isRtl ? 'مثال: شركة حضرموت للتجارة' : 'Supplier Company Name'}
                      value={quoteForm.supplier_name}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, supplier_name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'مرجع عرض الأسعار والرمز' : 'Quote Reference'}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. QTY-2026-X"
                      value={quoteForm.quote_ref}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, quote_ref: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'فترة التسليم (أيام)' : 'Delivery (days)'}</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={quoteForm.delivery_days}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, delivery_days: parseInt(e.target.value) || 1 }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'درجة المطابقة الفنية %' : 'Tech Quality %'}</label>
                      <input 
                        type="number" 
                        required
                        min="50"
                        max="100"
                        value={quoteForm.technical_score}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, technical_score: parseInt(e.target.value) || 100 }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الملاحظات الإضافية على عرض الأسعار' : 'Supplier notes'}</label>
                    <input 
                      type="text" 
                      placeholder={isRtl ? 'تفاصيل السعر والضمان...' : 'Warranty details...'}
                      value={quoteForm.notes}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 mb-1.5 uppercase">{isRtl ? 'تحديد أسعار المواد والبنود:' : 'Unit price per requested items:'}</p>
                    <div className="space-y-2">
                      {requisitions.find(pr => pr.id === selectedPrIdForQuote)?.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center gap-2">
                          <span className="truncate max-w-44 text-[10px] text-zinc-600 font-bold">{item.name}</span>
                          <input 
                            type="number"
                            required
                            placeholder={isRtl ? 'السعر الفعلي' : 'Unit Price'}
                            value={quoteForm.unit_prices[idx] || ''}
                            onChange={(e) => setQuoteForm(prev => ({
                              ...prev,
                              unit_prices: { ...prev.unit_prices, [idx]: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-24 bg-white border border-slate-300 rounded px-1.5 py-1 text-right text-[11px] font-mono font-bold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-colors flex justify-center items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'تسجيل عرض المورد واعتماده' : 'Submit Quotation'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quotations & evaluation matrix comparison list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'مصفوفة تحليل العروض وعمل المفاضلة والترسية' : 'Bids Comparison & Evaluation Matrix'}</h4>
              <span className="text-[9px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 border border-amber-500/20 rounded-full">{isRtl ? 'ثنائي الأبعاد: السعر والسرعة والجودة الفنية' : 'Optimized multi-factor comparison'}</span>
            </div>

            {requisitions.filter(pr => pr.status === 'APPROVED' || pr.status === 'PENDING').map(pr => {
              const prQuotes = quotations.filter(q => q.pr_id === pr.id);
              return (
                <div key={pr.id} className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-slate-50/40">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 flex items-center gap-2">
                        <span className="font-mono bg-zinc-800 text-amber-400 px-2 py-0.5 rounded text-[10px]">{pr.pr_number}</span>
                        <span>{pr.title}</span>
                      </h5>
                      <p className="text-[9px] text-zinc-400 font-bold mt-0.5">
                        💵 {isRtl ? 'ميزانية الاحتياج التقريبية' : 'Estimated budget'}: {pr.estimated_cost.toLocaleString()} YER
                      </p>
                    </div>
                    {prQuotes.length === 0 && (
                      <span className="text-[10px] text-amber-600 font-black animate-pulse">⚠️ {isRtl ? 'بانتظار تسجيل عروض الأسعار لبدء المقارنة والترسية' : 'Awaiting quote submissions'}</span>
                    )}
                  </div>

                  {prQuotes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {prQuotes.map(quote => {
                        const isWinner = quote.status === 'WINNING';
                        return (
                          <div key={quote.id} className={`bg-white rounded-xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                            isWinner ? 'border-emerald-500 ring-2 ring-emerald-500/15 bg-emerald-50/5' : 'border-slate-200 hover:border-slate-300'
                          }`}>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-black text-slate-900 text-xs truncate max-w-44">{quote.supplier_name}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                  isWinner ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {quote.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                                <div className="bg-slate-50 p-1.5 rounded">
                                  <span className="text-zinc-400 font-bold block">{isRtl ? 'إجمالي السعر' : 'Total Quote'}</span>
                                  <span className="font-mono font-black text-slate-900">{quote.total_price.toLocaleString()} YER</span>
                                </div>
                                <div className="bg-slate-50 p-1.5 rounded">
                                  <span className="text-zinc-400 font-bold block">{isRtl ? 'مدة التسليم' : 'Delivery'}</span>
                                  <span className="font-black text-slate-900">{quote.delivery_days} {isRtl ? 'أيام' : 'days'}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] bg-slate-50 p-1.5 rounded text-slate-600">
                                <span className="text-zinc-400 font-bold">{isRtl ? 'التقييم الفني والجودة' : 'Technical Quality'}</span>
                                <span className="font-mono font-black text-emerald-600">{quote.technical_score}/100</span>
                              </div>
                              {quote.notes && (
                                <p className="text-[9px] text-slate-500 italic font-semibold">“{quote.notes}”</p>
                              )}
                            </div>

                            {!isWinner ? (
                              <button
                                onClick={() => handleSelectWinningQuote(quote.id)}
                                className="w-full py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-200 hover:border-emerald-500 text-slate-700 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>{isRtl ? 'ترسية وإرساء العقد' : 'Select Winning Bid'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setPoForm({
                                    pr_id: quote.pr_id,
                                    quote_id: quote.id,
                                    delivery_date: new Date(Date.now() + quote.delivery_days*24*60*60*1000).toISOString().split('T')[0],
                                    terms: isRtl ? 'يتم توريد الاحتياج بالكامل وتسليمه للجنة الفحص وسداد القيمة بموجب تسوية قيد الحسابات.' : 'Delivery to main warehouse with double entry settlement.',
                                    warehouse_id: 'wh-1'
                                  });
                                  setActiveTab('orders');
                                }}
                                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                <span>{isRtl ? 'صياغة وتوليد أمر الشراء PO' : 'Formulate PO'}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 p-6 bg-white rounded-xl border border-dashed border-slate-200 text-zinc-400 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{isRtl ? 'لا يوجد عروض أسعار مسجلة لهذا الطلب حالياً.' : 'No quotes recorded yet.'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: PURCHASE ORDERS (PO) */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PO formulation form */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'توليد أمر الشراء الرسمي' : 'Generate Purchase Order'}</h4>
            <form onSubmit={handleGeneratePO} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اختيار طلب الشراء المعتمد' : 'Select Approved PR'}</label>
                <select
                  value={poForm.pr_id}
                  onChange={(e) => {
                    const selectedPrQuotes = quotations.filter(q => q.pr_id === e.target.value);
                    const winningQuote = selectedPrQuotes.find(q => q.status === 'WINNING') || selectedPrQuotes[0];
                    setPoForm(prev => ({ 
                      ...prev, 
                      pr_id: e.target.value,
                      quote_id: winningQuote ? winningQuote.id : ''
                    }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none"
                  required
                >
                  <option value="">{isRtl ? '-- يرجى اختيار طلب الشراء --' : '-- Select PR --'}</option>
                  {requisitions.filter(pr => pr.status === 'APPROVED').map(pr => (
                    <option key={pr.id} value={pr.id}>[{pr.pr_number}] {pr.title}</option>
                  ))}
                </select>
              </div>

              {poForm.pr_id && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'عرض سعر المورد المعتمد' : 'Select Winner Bidding'}</label>
                  <select
                    value={poForm.quote_id}
                    onChange={(e) => setPoForm(prev => ({ ...prev, quote_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                    required
                  >
                    {quotations.filter(q => q.pr_id === poForm.pr_id).map(q => (
                      <option key={q.id} value={q.id}>{q.supplier_name} - {q.total_price.toLocaleString()} YER</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'مستودع الاستلام والوجهة' : 'Destination Warehouse'}</label>
                  <select
                    value={poForm.warehouse_id}
                    onChange={(e) => setPoForm(prev => ({ ...prev, warehouse_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                  >
                    <option value="wh-1">{isRtl ? 'مستودع مأرب الإقليمي الرئيسي' : 'Marib Regional Whse'}</option>
                    <option value="wh-2">{isRtl ? 'مستودع صنعاء المركزي' : 'Sanaa Central Whse'}</option>
                    <option value="wh-3">{isRtl ? 'مستودع عدن اللوجستي' : 'Aden Logistics Whse'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'تاريخ التسليم الأقصى' : 'Target Delivery Date'}</label>
                  <input 
                    type="date"
                    required
                    value={poForm.delivery_date}
                    onChange={(e) => setPoForm(prev => ({ ...prev, delivery_date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'الشروط القانونية والمالية للتوريد' : 'Terms & Conditions'}</label>
                <textarea
                  rows={3}
                  value={poForm.terms}
                  onChange={(e) => setPoForm(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder={isRtl ? 'تفاصيل السداد والجزاءات إن وجدت...' : 'Terms...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{isRtl ? 'توليد وصياغة أمر الشراء PO' : 'Formulate Official PO'}</span>
              </button>
            </form>
          </div>

          {/* Active PO List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'سجل أوامر الشراء الصادرة والمفتوحة' : 'Purchase Orders Ledger'}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr className="bg-slate-900 text-amber-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                    <th className="p-3 w-28">{isRtl ? 'رقم أمر الشراء' : 'PO Number'}</th>
                    <th className="p-3">{isRtl ? 'المورد المعتمد وبيان الطلب' : 'Supplier & PR'}</th>
                    <th className="p-3 text-right w-36">{isRtl ? 'إجمالي قيمة العقد' : 'Total Amount'}</th>
                    <th className="p-3 text-center w-28">{isRtl ? 'تاريخ الاستلام الأقصى' : 'Delivery Target'}</th>
                    <th className="p-3 text-center w-24">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 text-center w-24">{isRtl ? 'الطباعة' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-slate-700">
                  {purchaseOrders.map((po) => {
                    const matchedPr = requisitions.find(pr => pr.id === po.pr_id);
                    return (
                      <tr key={po.id} className="hover:bg-slate-50/50 transition-all font-semibold">
                        <td className="p-3 font-mono text-slate-900 font-black text-[11px]">{po.po_number}</td>
                        <td className="p-3">
                          <p className="font-black text-slate-900">{po.supplier_name}</p>
                          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                            📄 {matchedPr?.title}
                          </p>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900 font-extrabold text-[11px]">{po.total_amount.toLocaleString()} YER</td>
                        <td className="p-3 text-center font-mono text-slate-600">{new Date(po.delivery_date).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                            po.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            po.status === 'RECEIVED' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handlePrintPO(po)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded text-[9px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                          >
                            <Printer className="w-3 h-3" />
                            <span>{isRtl ? 'طباعة' : 'Print'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GOODS RECEIPTS (GRN) */}
      {activeTab === 'receiving' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GRN Record Form */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'تحرير محضر استلام فني ومخزني' : 'New Goods Receipt Note'}</h4>
            
            {/* Choose PO to receive */}
            {!selectedPoForReceipt ? (
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اختيار أمر شراء نشط بانتظار التوريد' : 'Select PO to receive'}</label>
                <div className="space-y-2">
                  {purchaseOrders.filter(po => po.status === 'APPROVED' || po.status === 'ISSUED').map(po => {
                    const pr = requisitions.find(p => p.id === po.pr_id);
                    return (
                      <button
                        key={po.id}
                        type="button"
                        onClick={() => {
                          setSelectedPoForReceipt(po.id);
                          const initialItems: Record<string, any> = {};
                          pr?.items.forEach((_, idx) => {
                            initialItems[idx] = { ordered: _.qty, received: _.qty, accepted: _.qty, rejected: 0 };
                          });
                          setGrnForm(prev => ({ 
                            ...prev, 
                            po_id: po.id,
                            items_status: initialItems
                          }));
                        }}
                        className="w-full text-right p-3 bg-slate-50 hover:bg-emerald-50/20 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition-all text-slate-800 flex justify-between items-center"
                        style={{ textAlign: isRtl ? 'right' : 'left' }}
                      >
                        <div>
                          <p className="font-black text-slate-900">[{po.po_number}] - {po.supplier_name}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{pr?.title}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-emerald-600" />
                      </button>
                    );
                  })}
                  {purchaseOrders.filter(po => po.status === 'APPROVED' || po.status === 'ISSUED').length === 0 && (
                    <div className="p-6 text-center text-zinc-400 font-bold border border-dashed border-slate-200 rounded-xl text-xs">
                      {isRtl ? 'لا توجد أوامر شراء نشطة بانتظار التوريد حالياً.' : 'No active POs awaiting delivery.'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecordGRN} className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-black text-emerald-600">{isRtl ? 'توريد مستندات أمر شراء:' : 'Awaiting Receipt for:'} {purchaseOrders.find(po => po.id === selectedPoForReceipt)?.po_number}</span>
                  <button type="button" onClick={() => setSelectedPoForReceipt(null)} className="text-zinc-400 hover:text-slate-600 text-xs font-black">{isRtl ? 'تراجع' : 'Back'}</button>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم المسؤول المستلم (أمين المستودع/لجنة الفحص)' : 'Received & Inspected By'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder={isRtl ? 'مثال: أ. جابر عياش' : 'Inspector Name'}
                    value={grnForm.received_by}
                    onChange={(e) => setGrnForm(prev => ({ ...prev, received_by: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اسم المستودع المستهدف' : 'Target Warehouse'}</label>
                    <input 
                      type="text" 
                      required
                      value={grnForm.warehouse_name}
                      onChange={(e) => setGrnForm(prev => ({ ...prev, warehouse_name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'تاريخ الاستلام والعد الميداني' : 'Receipt Date'}</label>
                    <input 
                      type="date" 
                      required
                      value={grnForm.received_date}
                      onChange={(e) => setGrnForm(prev => ({ ...prev, received_date: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Items counting check */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase">{isRtl ? 'العد الميداني ومحضر الفحص والقبول' : 'Items Count & Inspection'}</span>
                  {requisitions.find(pr => pr.id === purchaseOrders.find(po => po.id === selectedPoForReceipt)?.pr_id)?.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="text-zinc-400 font-bold block">{isRtl ? 'المطلوب بالـ PO' : 'Ordered'}</span>
                          <span className="font-mono font-black text-slate-900">{item.qty}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 font-bold block">{isRtl ? 'المستلم فعلاً' : 'Received'}</span>
                          <input 
                            type="number"
                            required
                            value={grnForm.items_status[idx]?.received || ''}
                            onChange={(e) => {
                              const rec = parseInt(e.target.value) || 0;
                              setGrnForm(prev => {
                                const st = { ...prev.items_status };
                                st[idx] = { ...st[idx], received: rec, accepted: rec }; // default accepted
                                return { ...prev, items_status: st };
                              });
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-zinc-400 font-bold block text-rose-600">{isRtl ? 'المرفوض/التالف' : 'Rejected'}</span>
                          <input 
                            type="number"
                            required
                            value={grnForm.items_status[idx]?.rejected || 0}
                            onChange={(e) => {
                              const rej = parseInt(e.target.value) || 0;
                              setGrnForm(prev => {
                                const st = { ...prev.items_status };
                                const acceptedQty = (st[idx]?.received || 0) - rej;
                                st[idx] = { ...st[idx], rejected: rej, accepted: Math.max(0, acceptedQty) };
                                return { ...prev, items_status: st };
                              });
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center font-bold text-rose-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'تقرير الفحص والمطابقة النوعية' : 'Inspection quality report'}</label>
                  <textarea 
                    rows={2}
                    value={grnForm.notes}
                    onChange={(e) => setGrnForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={isRtl ? 'اكتب ملاحظات فحص الجودة الفنية وسلامة الكمية المستلمة...' : 'Verification notes...'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isRtl ? 'اعتماد سند التوريد وإدخال المخزن' : 'Accept & Record GRN'}</span>
                </button>
              </form>
            )}
          </div>

          {/* GRN ledger listing */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'أرشيف محاضر وسندات الاستلام المخزن (GRN)' : 'Goods Receipt Notes Archive'}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr className="bg-slate-900 text-amber-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                    <th className="p-3 w-32">{isRtl ? 'رقم محضر الاستلام' : 'GRN Number'}</th>
                    <th className="p-3 w-32">{isRtl ? 'أمر شراء PO' : 'PO Number'}</th>
                    <th className="p-3">{isRtl ? 'المستلم ومستودع التوريد' : 'Receiver & Whse'}</th>
                    <th className="p-3 w-36 text-center">{isRtl ? 'تاريخ الفحص' : 'Date'}</th>
                    <th className="p-3 w-32 text-center">{isRtl ? 'المطابقة النوعية' : 'Quality'}</th>
                    <th className="p-3 w-28 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-slate-700 font-semibold">
                  {goodsReceipts.map((grn) => {
                    const po = purchaseOrders.find(p => p.id === grn.po_id);
                    return (
                      <tr key={grn.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3 font-mono text-slate-900 font-black text-[11px]">{grn.grn_number}</td>
                        <td className="p-3 font-mono text-zinc-600 font-bold">{po?.po_number || '-'}</td>
                        <td className="p-3">
                          <p className="font-black text-slate-900">{grn.warehouse_name}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">👤 {grn.received_by}</p>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600">{new Date(grn.received_date).toLocaleDateString()}</td>
                        <td className="p-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-black">
                            {isRtl ? 'مطابق وممتاز' : 'Passed Inspection'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-600 text-white font-black">
                            {grn.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FINANCIAL SETTLEMENT */}
      {activeTab === 'settlement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Post Ledger Form */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'ترحيل قيد فاتورة المشتريات تلقائياً' : 'Automated GL Settlement'}</h4>
            
            <form onSubmit={handlePostFinancialSettlement} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'اختيار المعاملة المكتملة الفحص' : 'Select Received PO'}</label>
                <select
                  value={settlementForm.po_id}
                  onChange={(e) => {
                    const po = purchaseOrders.find(p => p.id === e.target.value);
                    const pr = requisitions.find(p => p.id === po?.pr_id);
                    setSettlementForm(prev => ({ 
                      ...prev, 
                      po_id: e.target.value,
                      description: po ? narrationText(po, pr) : ''
                    }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none"
                  required
                >
                  <option value="">{isRtl ? '-- اختر أمر الشراء المستلم --' : '-- Select Received PO --'}</option>
                  {purchaseOrders.filter(po => po.status === 'RECEIVED').map(po => {
                    const pr = requisitions.find(p => p.id === po.pr_id);
                    return (
                      <option key={po.id} value={po.id}>[{po.po_number}] - {po.supplier_name} ({po.total_amount.toLocaleString()} YER)</option>
                    );
                  })}
                </select>
              </div>

              {settlementForm.po_id && (
                <>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <p className="font-bold text-slate-700">{isRtl ? 'ملخص المطابقة الثلاثية المكتملة:' : '3-Way Match Verification Summary:'}</p>
                    <div className="space-y-1 text-[10px] text-slate-600 font-semibold">
                      <p className="flex justify-between"><span>✔ {isRtl ? 'طلب شراء PR' : 'Requisition PR'}</span> <span className="font-mono text-emerald-600">{requisitions.find(pr => pr.id === purchaseOrders.find(p => p.id === settlementForm.po_id)?.pr_id)?.pr_number}</span></p>
                      <p className="flex justify-between"><span>✔ {isRtl ? 'أمر توريد PO معتمد' : 'Purchase Order PO'}</span> <span className="font-mono text-emerald-600">{purchaseOrders.find(p => p.id === settlementForm.po_id)?.po_number}</span></p>
                      <p className="flex justify-between"><span>✔ {isRtl ? 'سند استلام مخازن GRN' : 'Goods Receipt GRN'}</span> <span className="font-mono text-emerald-600">{goodsReceipts.find(g => g.po_id === settlementForm.po_id)?.grn_number}</span></p>
                    </div>
                  </div>

                  {/* Account Dimensions */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'حساب مدين: تكلفة النشاط / مركز التكلفة' : 'Debit Account: Activity / Project Expense'}</label>
                    <select
                      value={settlementForm.expense_account_id}
                      onChange={(e) => setSettlementForm(prev => ({ ...prev, expense_account_id: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none"
                      required
                    >
                      <option value="">{isRtl ? '-- اختر حساب التكلفة (EXPENSE) --' : '-- Select Expense Account --'}</option>
                      {accounts.filter(a => a.account_type === 'EXPENSE' || a.account_type === 'ASSET').map(a => (
                        <option key={a.id} value={a.id}>[{a.account_code}] {isRtl ? a.name_ar : (a.name_en || a.name_ar)} ({parseFloat(String(a.current_balance)).toLocaleString()} YER)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'حساب دائن: ذمم الموردين / التزامات معلقة' : 'Credit Account: Supplier Liabilities'}</label>
                    <select
                      value={settlementForm.payable_account_id}
                      onChange={(e) => setSettlementForm(prev => ({ ...prev, payable_account_id: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none"
                      required
                    >
                      <option value="">{isRtl ? '-- اختر حساب الالتزام (LIABILITY) --' : '-- Select Liabilities Account --'}</option>
                      {accounts.filter(a => a.account_type === 'LIABILITY' || a.account_type === 'EQUITY').map(a => (
                        <option key={a.id} value={a.id}>[{a.account_code}] {isRtl ? a.name_ar : (a.name_en || a.name_ar)} ({parseFloat(String(a.current_balance)).toLocaleString()} YER)</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'طريقة التسوية المالية' : 'Payment Method'}</label>
                      <select
                        value={settlementForm.payment_method}
                        onChange={(e) => setSettlementForm(prev => ({ ...prev, payment_method: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700"
                      >
                        <option value="BANK_TRANSFER">{isRtl ? 'حوالة مصرفية عاجلة' : 'Bank Transfer'}</option>
                        <option value="CASH">{isRtl ? 'نقد بالخزينة' : 'Cash on Hand'}</option>
                        <option value="CHECK">{isRtl ? 'شيك بنكي معتمد' : 'Cheque'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'رقم الشيك أو الحوالة' : 'Ref / Cheque Number'}</label>
                      <input 
                        type="text" 
                        placeholder="e.g. CHQ-99451"
                        value={settlementForm.reference_number}
                        onChange={(e) => setSettlementForm(prev => ({ ...prev, reference_number: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'البيان وشرح القيد المحاسبي المولد' : 'Voucher Narration'}</label>
                    <textarea 
                      rows={2}
                      value={settlementForm.description}
                      onChange={(e) => setSettlementForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold focus:outline-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 text-white rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-1.5 shadow-md shadow-emerald-700/10 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Workflow className="w-4 h-4" />
                    )}
                    <span>{isRtl ? 'ترحيل قيد التسوية المحاسبي المزدوج' : 'Post Double-Entry Journal Voucher'}</span>
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Settled / Completed PO grid logs */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{isRtl ? 'أوامر الشراء التي تم تسويتها وترحيلها محاسبياً' : 'Settled Procurement Ledger'}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr className="bg-slate-900 text-amber-400 font-extrabold text-[10px] uppercase border-b border-zinc-800">
                    <th className="p-3 w-28">{isRtl ? 'رقم أمر الشراء' : 'PO Number'}</th>
                    <th className="p-3">{isRtl ? 'المورد والمطابقة والبيان المالي' : 'Supplier & Match Narration'}</th>
                    <th className="p-3 text-right w-36">{isRtl ? 'القيمة المسواة' : 'Settled Amount'}</th>
                    <th className="p-3 text-center w-28">{isRtl ? 'طريقة السداد' : 'Payment Method'}</th>
                    <th className="p-3 text-center w-24">{isRtl ? 'القيد المالي' : 'Ledger State'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-slate-700 font-semibold">
                  {purchaseOrders.filter(po => po.status === 'SETTLED').map((po) => {
                    const matchedPr = requisitions.find(pr => pr.id === po.pr_id);
                    return (
                      <tr key={po.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3 font-mono text-slate-900 font-black text-[11px]">{po.po_number}</td>
                        <td className="p-3">
                          <p className="font-black text-slate-900">{po.supplier_name}</p>
                          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                            ✔ {isRtl ? 'مطابقة ثلاثية تامة (PR + PO + GRN)' : 'Complete 3-Way Match'}: {matchedPr?.title}
                          </p>
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-700 font-extrabold text-[11px]">{po.total_amount.toLocaleString()} YER</td>
                        <td className="p-3 text-center">
                          <span className="text-[11px] text-slate-600 font-bold">BANK_TRANSFER</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-600 text-white font-black flex items-center justify-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>{isRtl ? 'قيد مرحّل' : 'Posted Ledger'}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {purchaseOrders.filter(po => po.status === 'SETTLED').length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-zinc-400 font-bold">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span>{isRtl ? 'لا توجد معاملات شراء تم سدادها بالكامل بالترحيل المزدوج حالياً.' : 'No settled procurement transactions found.'}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </>)}

    </div>
  );
}

function narrationText(po: PurchaseOrder, pr?: Requisition): string {
  return `تسوية سداد فاتورة المورد "${po.supplier_name}" مقابل ${pr?.title || 'مواد إغاثية'} بموجب مستند أمر توريد ${po.po_number}`;
}
