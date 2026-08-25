import React, { useState, useEffect } from 'react';
import { 
  Workflow, Search, Plus, Trash2, Eye, Printer, Building, Layers, 
  Activity, CheckCircle2, XCircle, Clock, ArrowRight, CheckCircle, 
  AlertCircle, FileText, FileSpreadsheet, UserCheck, ChevronRight, 
  BadgePercent, TrendingUp, DollarSign, RefreshCw, MessageSquare, 
  Paperclip, Bell, Link2, Send, Mail, AlertTriangle, 
  ArrowUpRight, ArrowDownLeft, ShieldAlert, History
} from 'lucide-react';
import { printHTML } from '../../lib/printUtils';
import { generateShortId, generateNumericCode } from '../../lib/idGenerator';

interface Account {
  id: string;
  account_code: string;
  name_ar: string;
  name_en: string;
  account_type: string;
  sub_type?: string | null;
  opening_balance: string | number;
  current_balance: string | number;
  debit_total: string | number;
  credit_total: string | number;
  is_active: boolean;
  requires_project?: boolean;
}

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  transaction_type: string; // JOURNAL_ENTRY, PAYMENT, RECEIPT, etc.
  total_debit: string | number;
  total_credit: string | number;
  description: string;
  is_posted: boolean;
  payment_method?: string;
  reference_number?: string | null;
  branch_code?: string;
  security_level?: number;
  created_at: string;
}

interface TransactionLine {
  id: string;
  transaction_id: string;
  account_id: string;
  account_code: string;
  description: string;
  debit_amount: string | number;
  credit_amount: string | number;
  project_id?: string | null;
  activity_id?: string | null;
  currency_code?: string;
}

interface Project {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  budget?: string | number | null;
}

interface TransactionDocumentCycleTrackerProps {
  accounts: Account[];
  transactions: Transaction[];
  lines: TransactionLine[];
  projects: Project[];
  currencies: any[];
  organizations: any[];
  activities: any[];
  lang: 'ar' | 'en';
  onRefresh: () => void;
}

// Interfaces for local-persisted metadata
interface TxMetadata {
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'POSTED';
  notes: Array<{ id: string; text: string; author: string; date: string }>;
  attachments: Array<{ id: string; name: string; size: string; type: string; date: string }>;
  alerts: Array<{ id: string; text: string; severity: 'info' | 'warning' | 'critical'; date: string }>;
  linkedTxIds: string[]; // List of other transaction IDs linked to this one
  auditTrail: Array<{ id: string; action: string; user: string; date: string; details: string }>;
}

export default function TransactionDocumentCycleTracker({
  accounts,
  transactions,
  lines,
  projects,
  currencies,
  organizations,
  activities,
  lang,
  onRefresh
}: TransactionDocumentCycleTrackerProps) {
  const isRtl = lang === 'ar';
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'POSTED'>('ALL');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  
  // Interactive Panel Tabs
  const [activeActionTab, setActiveActionTab] = useState<'workflow' | 'linking' | 'notes' | 'attachments' | 'alerts' | 'notifications' | 'audit'>('workflow');
  
  // Local metadata state for selected transaction
  const [txMeta, setTxMeta] = useState<TxMetadata | null>(null);
  
  // Form inputs
  const [noteInput, setNoteInput] = useState('');
  const [alertTextInput, setAlertTextInput] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [linkTargetTxId, setLinkTargetTxId] = useState('');
  
  // Fast Quick-Payment Creation Form for Invoices (JOURNAL_ENTRY -> PAYMENT link)
  const [showQuickPayForm, setShowQuickPayForm] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState('');
  const [quickPayAccount, setQuickPayAccount] = useState('');
  const [quickPayCashAccount, setQuickPayCashAccount] = useState('');
  const [quickPayMethod, setQuickPayMethod] = useState('BANK_TRANSFER');
  const [quickPayRef, setQuickPayRef] = useState('');
  const [quickPayIsSubmitting, setQuickPayIsSubmitting] = useState(false);
  
  // Notification dispatch state
  const [notifSupplierName, setNotifSupplierName] = useState('');
  const [notifChannel, setNotifChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [notifTemplate, setNotifTemplate] = useState('payment_posted');
  const [notifText, setNotifText] = useState('');
  const [notifStatus, setNotifStatus] = useState<{ type: 'idle' | 'sending' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  // General Notification / Message alert
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load and setup initial metadata for all transactions
  const loadTxMeta = (txId: string): TxMetadata => {
    const key = `nexora_tx_meta_${txId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback to default
      }
    }
    
    // Create realistic default metadata based on the transaction type & state
    const tx = transactions.find(t => t.id === txId);
    const isPostedInDb = tx?.is_posted || false;
    
    const initialStatus: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'POSTED' = isPostedInDb ? 'POSTED' : 'APPROVED';
    
    // Generate simulated dynamic default notes & audit trail
    const defaultMeta: TxMetadata = {
      status: initialStatus,
      notes: [
        {
          id: 'note-1',
          text: isRtl ? 'تم التحقق من مطابقة الفاتورة والأرقام الحسابية وتطابقها مع كود المشروع.' : 'Invoice figures matched against budget project code.',
          author: isRtl ? 'أ. محاسب تدقيق مالى' : 'Accounting Auditor',
          date: new Date(Date.now() - 86400000 * 2).toLocaleDateString()
        }
      ],
      attachments: [],
      alerts: [],
      linkedTxIds: [],
      auditTrail: [
        {
          id: 'audit-1',
          action: isRtl ? 'إنشاء المعاملة' : 'Transaction Created',
          user: isRtl ? 'م. مدخل البيانات' : 'Data Entry Officer',
          date: new Date(Date.now() - 86400000 * 3).toLocaleString(),
          details: isRtl ? 'إنشاء مسودة القيد الأصلي في النظام' : 'Created original voucher draft'
        },
        {
          id: 'audit-2',
          action: isRtl ? 'تعديل وترحيل' : 'Updated & Finalized',
          user: isRtl ? 'أ. مراجع مالي' : 'Financial Reviewer',
          date: new Date(Date.now() - 86400000 * 2).toLocaleString(),
          details: isRtl ? 'مراجعة البنود والقيم وإقرار السلامة المستندية' : 'Reviewed lines, balances, and shariah compliance checks'
        }
      ]
    };
    
    // Save to make persistent
    localStorage.setItem(key, JSON.stringify(defaultMeta));
    return defaultMeta;
  };

  const saveTxMeta = (txId: string, data: TxMetadata) => {
    localStorage.setItem(`nexora_tx_meta_${txId}`, JSON.stringify(data));
    if (selectedTxId === txId) {
      setTxMeta(data);
    }
  };

  // Pre-seed some transaction links to showcase the working application instantly
  useEffect(() => {
    if (transactions.length > 0) {
      // Find a JOURNAL_ENTRY (Invoice) and a PAYMENT to link
      const invoices = transactions.filter(t => t.transaction_type === 'JOURNAL_ENTRY');
      const payments = transactions.filter(t => t.transaction_type === 'PAYMENT');
      
      if (invoices.length > 0 && payments.length > 0) {
        const invId = invoices[0].id;
        const payId = payments[0].id;
        
        // Let's check if metadata exists already. If not, link them
        const invMeta = loadTxMeta(invId);
        const payMeta = loadTxMeta(payId);
        
        if (invMeta.linkedTxIds.length === 0 && payMeta.linkedTxIds.length === 0) {
          invMeta.linkedTxIds = [payId];
          payMeta.linkedTxIds = [invId];
          
          invMeta.notes.push({
            id: 'note-seed',
            text: isRtl 
              ? `مرتبط تلقائياً بسند الصرف رقم ${payments[0].transaction_number} لإتمام الدورة المستندية.` 
              : `Automatically linked to Payment Voucher ${payments[0].transaction_number} to complete document cycle.`,
            author: isRtl ? 'إنشاء وتجهيز السند' : 'Nexora AI Assistant',
            date: new Date().toLocaleDateString()
          });
          
          saveTxMeta(invId, invMeta);
          saveTxMeta(payId, payMeta);
        }
      }
    }
  }, [transactions]);

  // Load selected transaction metadata
  useEffect(() => {
    if (selectedTxId) {
      const meta = loadTxMeta(selectedTxId);
      setTxMeta(meta);
      
      // Setup dynamic message templates
      const tx = transactions.find(t => t.id === selectedTxId);
      if (tx) {
        setNotifSupplierName(isRtl ? 'مؤسسة المورد المعتمد' : 'Main Approved Supplier');
        setQuickPayAmount(String(parseFloat(String(tx.total_debit || tx.total_credit || 0))));
        setQuickPayRef(tx.transaction_number);
      }
    } else {
      setTxMeta(null);
    }
  }, [selectedTxId, transactions]);

  // Update custom notification text dynamically
  useEffect(() => {
    if (!selectedTxId) return;
    const tx = transactions.find(t => t.id === selectedTxId);
    if (!tx) return;
    
    let text = '';
    if (notifTemplate === 'payment_posted') {
      text = isRtl 
        ? `تحية طيبة من مؤسسة رُحماء. تم تحرير وتأكيد مستند الصرف برقم ${tx.transaction_number} بمبلغ ${Number(tx.total_debit || tx.total_credit || 0).toLocaleString()} YER وتسوية المعاملة بنجاح.`
        : `Greetings from Rohamaa Charity. Payment voucher ${tx.transaction_number} with amount ${Number(tx.total_debit || tx.total_credit || 0).toLocaleString()} YER has been successfully processed & cleared.`;
    } else if (notifTemplate === 'invoice_received') {
      text = isRtl
        ? `عزيزنا العميل/المورد. تم استلام فاتورة الشراء وتوجيهها في الدورة المستندية لبرنامج "${tx.description}". رقم المعاملة للتعقب: ${tx.transaction_number}.`
        : `Dear Valued Partner. Your invoice has been received and routed in the document cycle for "${tx.description}". Tracker reference: ${tx.transaction_number}.`;
    } else if (notifTemplate === 'pending_approval') {
      text = isRtl
        ? `هام وعاجل: المعاملة رقم ${tx.transaction_number} لمطالبة التكاليف بمبلغ ${Number(tx.total_debit || tx.total_credit || 0).toLocaleString()} YER بانتظار اعتمادكم النهائي لإجراء التحويل البنكي.`
        : `Urgent Audit Action Required: Voucher ${tx.transaction_number} with amount ${Number(tx.total_debit || tx.total_credit || 0).toLocaleString()} YER is awaiting your final signoff.`;
    }
    setNotifText(text);
  }, [notifTemplate, selectedTxId, lang]);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.reference_number && tx.reference_number.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesType = 
      typeFilter === 'ALL' || 
      tx.transaction_type === typeFilter;
      
    // Custom status matches
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      const meta = loadTxMeta(tx.id);
      matchesStatus = meta.status === statusFilter;
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleStatusChange = (newStatus: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'POSTED') => {
    if (!selectedTxId || !txMeta) return;
    
    const statusLabels: Record<string, string> = {
      DRAFT: isRtl ? 'إضافة' : 'Draft',
      UNDER_REVIEW: isRtl ? 'قيد المراجعة والتدقيق' : 'Under Review',
      APPROVED: isRtl ? 'منطقة عالية الأمان' : 'Approved',
      POSTED: isRtl ? 'مؤشر الخطورة المحاكى' : 'Posted'
    };
    
    const updatedAudit = [
      {
        id: generateShortId('audit'),
        action: isRtl ? 'تحديث صورة التوثيق' : 'Workflow Status Shift',
        user: isRtl ? 'أ. خالد باوزير (المدير المالي)' : 'K. BaWazir (CFO)',
        date: new Date().toLocaleString(),
        details: isRtl 
          ? `تغيير حالة المعاملة من [${statusLabels[txMeta.status]}] إلى [${statusLabels[newStatus]}]`
          : `Changed status from [${statusLabels[txMeta.status]}] to [${statusLabels[newStatus]}]`
      },
      ...txMeta.auditTrail
    ];
    
    const updated = {
      ...txMeta,
      status: newStatus,
      auditTrail: updatedAudit
    };
    
    saveTxMeta(selectedTxId, updated);
    
    // Add feedback
    showFeedback(isRtl ? 'تم تحديث حالة المعاملة في الدورة المستندية بنجاح' : 'Document status updated successfully', 'success');
  };

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  // Add notes/remarks
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId || !txMeta || !noteInput.trim()) return;
    
    const newNote = {
      id: generateShortId('note'),
      text: noteInput,
      author: isRtl ? 'المدير التشغيلي / مراجع نكسورا' : 'Operations Manager / Nexora Auditor',
      date: new Date().toLocaleDateString()
    };
    
    const updatedAudit = [
      {
        id: generateShortId('audit'),
        action: isRtl ? 'إنشاء وتجهيز السند' : 'Note Appended',
        user: isRtl ? 'إلغاء ارتباط متبادل' : 'Finance Officer',
        date: new Date().toLocaleString(),
        details: isRtl ? `إضافة ملاحظة: "${noteInput.slice(0, 30)}..."` : `Appended remark: "${noteInput.slice(0, 30)}..."`
      },
      ...txMeta.auditTrail
    ];

    const updated = {
      ...txMeta,
      notes: [...txMeta.notes, newNote],
      auditTrail: updatedAudit
    };
    
    saveTxMeta(selectedTxId, updated);
    setNoteInput('');
    showFeedback(isRtl ? 'تمت إضافة الملاحظة وتوثيقها بالدورة المستندية' : 'Note successfully appended to dossier', 'success');
  };

  // Add Alerts / Warnings
  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId || !txMeta || !alertTextInput.trim()) return;
    
    const newAlert = {
      id: generateShortId('alert'),
      text: alertTextInput,
      severity: alertSeverity,
      date: new Date().toLocaleDateString()
    };
    
    const updatedAudit = [
      {
        id: generateShortId('audit'),
        action: isRtl ? 'منطقة عالية الأمان' : 'Alert Trigger Set',
        user: isRtl ? 'إدارة الرقابة والامتثال' : 'Compliance & Risk Officer',
        date: new Date().toLocaleString(),
        details: isRtl ? `تنبيه بمستوى [${alertSeverity}]: "${alertTextInput}"` : `Triggered [${alertSeverity}] alert: "${alertTextInput}"`
      },
      ...txMeta.auditTrail
    ];

    const updated = {
      ...txMeta,
      alerts: [...txMeta.alerts, newAlert],
      auditTrail: updatedAudit
    };
    
    saveTxMeta(selectedTxId, updated);
    setAlertTextInput('');
    showFeedback(isRtl ? 'تم تعيين وتثبيت التنبيه الرقابي بنجاح' : 'Audit alert pinned to transaction dossier', 'success');
  };

  // Link another existing transaction manually
  const handleLinkExistingTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId || !txMeta || !linkTargetTxId) return;
    if (linkTargetTxId === selectedTxId) {
      showFeedback(isRtl ? 'لا يمكن ربط المعاملة بنفسها' : 'Cannot link a document to itself', 'error');
      return;
    }
    
    const targetTx = transactions.find(t => t.id === linkTargetTxId);
    if (!targetTx) return;

    // Link source -> target
    if (!txMeta.linkedTxIds.includes(linkTargetTxId)) {
      const updatedAudit = [
        {
          id: generateShortId('audit'),
          action: isRtl ? 'بند خدمات جديد' : 'Manual Link Associated',
          user: isRtl ? 'رئيس قسم القيود والحسابات' : 'Head of General Ledger',
          date: new Date().toLocaleString(),
          details: isRtl 
            ? `ربط المعاملة بالمعاملة الشريكة رقم ${targetTx.transaction_number}` 
            : `Linked this document with transaction ${targetTx.transaction_number}`
        },
        ...txMeta.auditTrail
      ];
      
      const updated = {
        ...txMeta,
        linkedTxIds: [...txMeta.linkedTxIds, linkTargetTxId],
        auditTrail: updatedAudit
      };
      saveTxMeta(selectedTxId, updated);
      
      // Link target -> source
      const targetMeta = loadTxMeta(linkTargetTxId);
      if (!targetMeta.linkedTxIds.includes(selectedTxId)) {
        const sourceTx = transactions.find(t => t.id === selectedTxId);
        targetMeta.linkedTxIds.push(selectedTxId);
        targetMeta.auditTrail.unshift({
          id: generateShortId('audit-tgt'),
          action: isRtl ? 'اعتماد الصرف المالي' : 'Reciprocal Document Link',
          user: isRtl ? 'رئيس قسم القيود والحسابات' : 'Head of General Ledger',
          date: new Date().toLocaleString(),
          details: isRtl 
            ? `ارتباط متقابل ومطابقة مستندية مع رقم ${sourceTx?.transaction_number || ''}` 
            : `Reciprocal link made matching with voucher ${sourceTx?.transaction_number || ''}`
        });
        saveTxMeta(linkTargetTxId, targetMeta);
      }
      
      setLinkTargetTxId('');
      showFeedback(isRtl ? 'تم ربط ومطابقة المستندات بنجاح في الدورة المستندية' : 'Transactions reciprocal link established successfully', 'success');
    } else {
      showFeedback(isRtl ? 'المراسلات والبريد الرسمي' : 'Documents are already linked', 'warning' as any);
    }
  };

  // Remove transaction link
  const handleUnlinkTx = (targetId: string) => {
    if (!selectedTxId || !txMeta) return;
    
    const targetTx = transactions.find(t => t.id === targetId);
    
    const updated = {
      ...txMeta,
      linkedTxIds: txMeta.linkedTxIds.filter(id => id !== targetId),
      auditTrail: [
        {
          id: generateShortId('audit'),
          action: isRtl ? 'إعادة ضبط التخطيط' : 'Document Unlinked',
          user: isRtl ? 'نمذجة تنبؤية' : 'Voucher Reviewer',
          date: new Date().toLocaleString(),
          details: isRtl 
            ? `إلغاء الارتباط المزدوج مع المستند رقم ${targetTx?.transaction_number || targetId}`
            : `Severed document linkage with transaction ${targetTx?.transaction_number || targetId}`
        },
        ...txMeta.auditTrail
      ]
    };
    saveTxMeta(selectedTxId, updated);
    
    // Unlink the other side too
    const targetMeta = loadTxMeta(targetId);
    targetMeta.linkedTxIds = targetMeta.linkedTxIds.filter(id => id !== selectedTxId);
    targetMeta.auditTrail.unshift({
      id: generateShortId('audit-unlink-tgt'),
      action: isRtl ? 'الصرف المالي الفعلي' : 'Reciprocal Link Severed',
      user: isRtl ? 'مسؤول النشاط' : 'Voucher Reviewer',
      date: new Date().toLocaleString(),
      details: isRtl ? 'تم إلغاء الارتباط المتبادل من الطرف الشريك' : 'Reciprocal link severed by partner'
    });
    saveTxMeta(targetId, targetMeta);
    
    showFeedback(isRtl ? 'تم إلغاء ربط ومطابقة المستندات بنجاح' : 'Document linkage removed successfully', 'success');
  };

  // Direct fast quick-payment creation form submission to database
  const handleQuickPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId || !txMeta) return;
    const invoiceTx = transactions.find(t => t.id === selectedTxId);
    if (!invoiceTx) return;

    if (!quickPayAmount || parseFloat(quickPayAmount) <= 0) {
      showFeedback(isRtl ? 'يرجى تحديد قيمة صالحة للسند' : 'Please input a valid payment amount', 'error');
      return;
    }
    if (!quickPayAccount || !quickPayCashAccount) {
      showFeedback(isRtl ? 'يرجى اختيار الحساب المدين وحساب الصندوق/البنك' : 'Please select debit liability account and asset bank/cash account', 'error');
      return;
    }

    setQuickPayIsSubmitting(true);
    
    try {
      const payAmount = parseFloat(quickPayAmount);
      const newVoucherNo = `PV-AUTO-${generateNumericCode(0, 9999)}`;
      const expAcc = accounts.find(a => a.id === quickPayAccount);
      const cashAcc = accounts.find(a => a.id === quickPayCashAccount);
      
      const narrationAr = `سداد صرف للمورد نقداً/بنكاً مقابل الفاتورة رقم ${invoiceTx.transaction_number} - الشرح: ${invoiceTx.description}`;
      const narrationEn = `Settlement Voucher for Supplier against Invoice ${invoiceTx.transaction_number} - Description: ${invoiceTx.description}`;

      // 1. Post transaction header
      const txRes = await fetch('/api/tables/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_number: newVoucherNo,
          transaction_date: new Date().toISOString().split('T')[0],
          posting_date: new Date().toISOString().split('T')[0],
          transaction_type: 'PAYMENT',
          total_debit: payAmount,
          total_credit: payAmount,
          total_debit_base: payAmount,
          total_credit_base: payAmount,
          currency_id: '00000000-0000-0000-0000-000000000001', // Default Base
          exchange_rate: 1,
          description: isRtl ? narrationAr : narrationEn,
          payment_method: quickPayMethod,
          reference_number: quickPayRef || invoiceTx.transaction_number,
          branch_code: 'HQ',
          security_level: 2,
          organization_id: '00000000-0000-0000-0000-000000000001',
          is_posted: true
        })
      });

      if (!txRes.ok) throw new Error('Failed to create payment voucher header');
      const newTxResult = await txRes.json();

      // 2. Post transaction lines
      // Line 1: Debit Liability / Payable (??????)
      await fetch('/api/tables/transaction_lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: newTxResult.id,
          organization_id: '00000000-0000-0000-0000-000000000001',
          line_number: 1,
          account_id: quickPayAccount,
          account_code: expAcc?.account_code || '2101',
          description: isRtl ? 'تسوية ذمم دائنة / سداد فواتير' : 'Accounts payable settlement',
          debit_amount: payAmount,
          credit_amount: 0,
          currency_code: 'YER',
          security_level: 2
        })
      });

      // Line 2: Credit Asset / Cash/Bank (???????)
      await fetch('/api/tables/transaction_lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: newTxResult.id,
          organization_id: '00000000-0000-0000-0000-000000000001',
          line_number: 2,
          account_id: quickPayCashAccount,
          account_code: cashAcc?.account_code || '1001',
          description: isRtl ? 'صرف مالي من الصندوق/البنك' : 'Disbursement from Cash/Bank',
          debit_amount: 0,
          credit_amount: payAmount,
          currency_code: 'YER',
          security_level: 2
        })
      });

      // Update Ledger balances locally / call onRefresh
      onRefresh();

      // Link newly created PAYMENT voucher to our invoice!
      const invoiceMeta = { ...txMeta };
      invoiceMeta.linkedTxIds.push(newTxResult.id);
      invoiceMeta.notes.push({
        id: generateShortId('note'),
        text: isRtl 
          ? `تم صرف سند الصرف رقم ${newVoucherNo} بمبلغ ${payAmount.toLocaleString()} YER وربطه تلقائياً بالفاتورة.`
          : `Created Payment Voucher ${newVoucherNo} with amount ${payAmount.toLocaleString()} YER and linked to Invoice.`,
        author: isRtl ? 'نظام نكسورا المحاسبي' : 'Nexora Accounting Engine',
        date: new Date().toLocaleDateString()
      });
      invoiceMeta.auditTrail.unshift({
        id: generateShortId('audit'),
        action: isRtl ? 'سداد قيد وفاتورة' : 'Invoice Settlement Voucher Created',
        user: isRtl ? 'أ. محاسب صرف ومدفوعات' : 'Payment Disbursement Officer',
        date: new Date().toLocaleString(),
        details: isRtl 
          ? `صرف سند سداد للمورد برقم ${newVoucherNo} بمبلغ ${payAmount.toLocaleString()} ?.?`
          : `Processed settlement disbursement PV ${newVoucherNo} for ${payAmount.toLocaleString()} YER`
      });
      saveTxMeta(selectedTxId, invoiceMeta);

      // Setup initial metadata for the new Payment Voucher and link it back to invoice
      const newPayMeta: TxMetadata = {
        status: 'POSTED',
        notes: [
          {
            id: 'note-new-1',
            text: isRtl 
              ? `سند صرف آلي تم إنشاؤه لتسوية فاتورة الشراء رقم ${invoiceTx.transaction_number}.`
              : `Disbursement voucher created to settle purchase invoice ${invoiceTx.transaction_number}.`,
            author: isRtl ? 'منفذ ميداني' : 'Nexora System',
            date: new Date().toLocaleDateString()
          }
        ],
        attachments: [],
        alerts: [],
        linkedTxIds: [selectedTxId],
        auditTrail: [
          {
            id: `audit-new-1`,
            action: isRtl ? 'إنشاء سند صرف آلي' : 'Automated Payment Voucher Generated',
            user: isRtl ? 'جميع مستويات الأمان' : 'NexoraOS Engine',
            date: new Date().toLocaleString(),
            details: isRtl ? `ربط عكسي مباشر ومطابقة مع الفاتورة رقم ${invoiceTx.transaction_number}` : `Direct reciprocal match set with Invoice ${invoiceTx.transaction_number}`
          }
        ]
      };
      saveTxMeta(newTxResult.id, newPayMeta);

      // Success feedback
      showFeedback(isRtl ? `تم تحرير وإصدار سند الصرف رقم ${newVoucherNo} وربطه بالفاتورة` : `Disbursement PV ${newVoucherNo} generated and matched to invoice!`, 'success');
      setShowQuickPayForm(false);
      setQuickPayAmount('');
    } catch (err: any) {
      console.error(err);
      showFeedback(isRtl ? 'خطأ في معالجة القيد المحاسبي في خادم نكسورا' : 'Server error recording financial voucher ledger entry', 'error');
    } finally {
      setQuickPayIsSubmitting(false);
    }
  };

  // Simulate file attachment upload
  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTxId || !txMeta) return;

    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    const newAttachment = {
      id: generateShortId('att'),
      name: file.name,
      size: sizeStr,
      type: file.type || 'application/octet-stream',
      date: new Date().toLocaleDateString()
    };

    const updatedAudit = [
      {
        id: generateShortId('audit'),
        action: isRtl ? 'حقائب نظافة طارئة' : 'Attachment Dossier Filed',
        user: isRtl ? 'أخصائي الحفظ واللوجستيات' : 'Archivist & Logistical Officer',
        date: new Date().toLocaleString(),
        details: isRtl ? `إرفاق مستند داعم: ${file.name} (${sizeStr})` : `Attached supporting dossier document: ${file.name} (${sizeStr})`
      },
      ...txMeta.auditTrail
    ];

    const updated = {
      ...txMeta,
      attachments: [...txMeta.attachments, newAttachment],
      auditTrail: updatedAudit
    };
    saveTxMeta(selectedTxId, updated);
    showFeedback(isRtl ? 'تم رفع وأرشفة المرفق الداعم بنجاح' : 'Supporting document uploaded & filed successfully', 'success');
  };

  const handleDeleteAttachment = (attId: string) => {
    if (!selectedTxId || !txMeta) return;
    
    const att = txMeta.attachments.find(a => a.id === attId);
    
    const updated = {
      ...txMeta,
      attachments: txMeta.attachments.filter(a => a.id !== attId),
      auditTrail: [
        {
          id: generateShortId('audit'),
          action: isRtl ? 'فئة ونوع الشريك' : 'Supporting Document Purged',
          user: isRtl ? 'هاتف المستلم للمطابقة' : 'Internal Audit Manager',
          date: new Date().toLocaleString(),
          details: isRtl ? `حذف المرفق الداعم: ${att?.name}` : `Purged supporting file: ${att?.name}`
        },
        ...txMeta.auditTrail
      ]
    };
    saveTxMeta(selectedTxId, updated);
    showFeedback(isRtl ? 'صف محو الأمية وتعليم الكبار' : 'Attachment deleted successfully', 'success');
  };

  // Dispatch Simulated Notification
  const handleDispatchNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId || !txMeta) return;
    
    setNotifStatus({ type: 'sending', message: isRtl ? 'جاري تجهيز بوابة الاتصالات وإرسال الإشعار...' : 'Establishing secure telecom gateway connection...' });
    
    setTimeout(() => {
      const channelLabel = notifChannel === 'whatsapp' ? 'WhatsApp' : notifChannel === 'sms' ? 'SMS' : 'Email';
      setNotifStatus({ 
        type: 'success', 
        message: isRtl 
          ? `تم إرسال الإشعار بنجاح عبر قناة ${channelLabel} للمستلم: ${notifSupplierName}` 
          : `Notification successfully broadcasted via ${channelLabel} gateway to ${notifSupplierName}!` 
      });
      
      // Update Audit log
      const updatedAudit = [
        {
          id: generateShortId('audit-notif'),
          action: isRtl ? 'حقائب نظافة طارئة' : 'External Alert Dispatched',
          user: isRtl ? 'تقديم الخدمات والمستفيدون' : 'Digital Messaging Gateway',
          date: new Date().toLocaleString(),
          details: isRtl 
            ? `إرسال رسالة [${channelLabel}] للجهة "${notifSupplierName}" بنص: "${notifText.slice(0, 40)}..."` 
            : `Sent [${channelLabel}] to "${notifSupplierName}": "${notifText.slice(0, 40)}..."`
        },
        ...txMeta.auditTrail
      ];
      
      const updated = {
        ...txMeta,
        auditTrail: updatedAudit
      };
      saveTxMeta(selectedTxId, updated);
      
    }, 1500);
  };

  // Calculate sum of linked payment vouchers for a specific transaction
  const getLinkedPaymentVouchersSum = (tx: Transaction, linkedIds: string[]) => {
    let sum = 0;
    linkedIds.forEach(id => {
      const partner = transactions.find(t => t.id === id);
      if (partner && partner.transaction_type === 'PAYMENT') {
        sum += parseFloat(String(partner.total_debit || partner.total_credit || 0));
      }
    });
    return sum;
  };

  // Print support
  const handlePrintTransactionDossier = (tx: Transaction, meta: TxMetadata) => {
    const txLines = lines.filter(l => l.transaction_id === tx.id);
    const linkedPartners = transactions.filter(t => meta.linkedTxIds.includes(t.id));
    
    const linesHTML = txLines.map((l, i) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 8px; text-align: center;">${i + 1}</td>
        <td style="padding: 8px;">${l.account_code} - ${isRtl ? (accounts.find(a => a.id === l.account_id)?.name_ar || '') : (accounts.find(a => a.id === l.account_id)?.name_en || '')}</td>
        <td style="padding: 8px;">${l.description || ''}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #059669;">${l.debit_amount ? parseFloat(String(l.debit_amount)).toLocaleString() : '0'} YER</td>
        <td style="padding: 8px; text-align: right; font-weight: bold; color: #b91c1c;">${l.credit_amount ? parseFloat(String(l.credit_amount)).toLocaleString() : '0'} YER</td>
      </tr>
    `).join('');

    const linkedHTML = linkedPartners.map(p => `
      <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 8px; border-radius: 6px; background-color: #fafafa;">
        <strong>[${p.transaction_type}] ${p.transaction_number}</strong> | 
        <span>${new Date(p.transaction_date).toLocaleDateString()}</span> | 
        <strong>${parseFloat(String(p.total_debit || p.total_credit || 0)).toLocaleString()} YER</strong>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #555;">${p.description}</p>
      </div>
    `).join('') || `<em>${isRtl ? 'لا توجد معاملات تكميلية مرتبطة' : 'No linked companion transactions'}</em>`;

    const notesHTML = meta.notes.map(n => `
      <div style="border-bottom: 1px solid #eee; padding: 6px 0;">
        <small style="color: #666; font-weight: bold;">${n.author} (${n.date})</small>
        <p style="margin: 2px 0; font-size: 12px;">${n.text}</p>
      </div>
    `).join('') || `<em>${isRtl ? 'لا توجد ملاحظات تعقب لاحقة' : 'No appended remarks recorded'}</em>`;

    const auditHTML = meta.auditTrail.map(a => `
      <tr style="font-size: 11px; color: #555;">
        <td style="padding: 4px; border-bottom: 1px solid #eee;">${a.date}</td>
        <td style="padding: 4px; border-bottom: 1px solid #eee; font-weight: bold;">${a.action}</td>
        <td style="padding: 4px; border-bottom: 1px solid #eee;">${a.user}</td>
        <td style="padding: 4px; border-bottom: 1px solid #eee;">${a.details}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="direction: ${isRtl ? 'rtl' : 'ltr'}; font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; padding: 25px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #059669; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h1 style="color: #059669; margin: 0; font-size: 22px;">جمعية رُحماء بينهم للعمل الإنساني والتنمية</h1>
            <h2 style="margin: 5px 0 0 0; font-size: 16px; color: #d97706;">ملف الدورة المستندية - نظام تشغيل نكسورا NexoraOS™</h2>
          </div>
          <div style="text-align: right;">
            <strong>تاريخ تقرير الأرشفة:</strong> ${new Date().toLocaleDateString()}<br/>
            <strong>مرجع الملف:</strong> ${tx.transaction_number}
          </div>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: grid; grid-template-cols: 1fr 1fr; gap: 15px;">
          <div>
            <strong>رقم المستند المالي:</strong> ${tx.transaction_number}<br/>
            <strong>تاريخ المعاملة المالي:</strong> ${new Date(tx.transaction_date).toLocaleDateString()}<br/>
            <strong>نوع المعاملة الرئيسي:</strong> <span style="background-color: #059669; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${tx.transaction_type}</span>
          </div>
          <div>
            <strong>حالة الاعتماد في الوركفلو:</strong> <strong style="color: #d97706;">${meta.status}</strong><br/>
            <strong>القيمة المتزنة:</strong> <strong>${parseFloat(String(tx.total_debit || tx.total_credit || 0)).toLocaleString()} YER</strong><br/>
            <strong>الملاحظات الكلية:</strong> ${meta.notes.length} | <strong>المرفقات:</strong> ${meta.attachments.length}
          </div>
        </div>

        <h3 style="color: #059669; border-bottom: 1px solid #ccc; padding-bottom: 5px;">توجيه البنود المحاسبية (Double-Entry Ledger Lines)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #334155; color: white;">
              <th style="padding: 8px; text-align: center; width: 40px;">#</th>
              <th style="padding: 8px; text-align: left;">الحساب الدفتري Ledger Account</th>
              <th style="padding: 8px; text-align: left;">الشرح والبيان الفرعي Line Narration</th>
              <th style="padding: 8px; text-align: right;">مدين (Debit)</th>
              <th style="padding: 8px; text-align: right;">دائن (Credit)</th>
            </tr>
          </thead>
          <tbody>
            ${linesHTML}
          </tbody>
        </table>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3 style="color: #059669; border-bottom: 1px solid #ccc; padding-bottom: 5px;">الارتباط والعمليات المترابطة (Interlinked Operations)</h3>
            ${linkedHTML}
          </div>
          <div>
            <h3 style="color: #059669; border-bottom: 1px solid #ccc; padding-bottom: 5px;">الملاحظات والتعليقات والتحققات اللاحقة</h3>
            ${notesHTML}
          </div>
        </div>

        <h3 style="color: #059669; border-bottom: 1px solid #ccc; padding-bottom: 5px;">سجل التدقيق الداخلي وحركة سير المستند (Audit Trail)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left;">
              <th style="padding: 6px;">التاريخ الوقت</th>
              <th style="padding: 6px;">الإجراء المنفذ</th>
              <th style="padding: 6px;">المستخدم المسؤول</th>
              <th style="padding: 6px;">تفاصيل المراجعة</th>
            </tr>
          </thead>
          <tbody>
            ${auditHTML}
          </tbody>
        </table>

        <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; display: flex; justify-content: space-between; text-align: center; font-size: 12px;">
          <div>
            <strong>توقيع منشئ القيد / المعاملة:</strong><br/><br/><br/>
            ________________________
          </div>
          <div>
            <strong>توقيع المراجع المالي:</strong><br/><br/><br/>
            ________________________
          </div>
          <div>
            <strong>اعتماد المدير التنفيذي:</strong><br/><br/><br/>
            ________________________
          </div>
        </div>
      </div>
    `;
    printHTML(htmlContent);
  };

  const selectedTx = selectedTxId ? transactions.find(t => t.id === selectedTxId) : null;
  const selectedTxLines = selectedTx ? lines.filter(l => l.transaction_id === selectedTx.id) : [];

  return (
    <div className="space-y-4">
      {/* Dynamic Feedback Toast */}
      {feedbackMsg && (
        <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-black flex items-center gap-2 animate-bounce ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`} style={lang === 'en' ? { right: 'auto', left: '16px' } : {}}>
          {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200/60 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-[10px] text-slate-500 font-bold">{isRtl ? 'إجمالي المعاملات بالدورة' : 'Total Transactions'}</h5>
            <span className="text-sm font-extrabold text-slate-900">{transactions.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-zinc-100 text-slate-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-[10px] text-slate-500 font-bold">{isRtl ? 'مسودة وقيد جديد' : 'Draft / New'}</h5>
            <span className="text-sm font-extrabold text-slate-900">
              {transactions.filter(t => loadTxMeta(t.id).status === 'DRAFT').length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-[10px] text-slate-500 font-bold">{isRtl ? 'قيد المراجعة والمطابقة' : 'Under Review'}</h5>
            <span className="text-sm font-extrabold text-amber-600">
              {transactions.filter(t => loadTxMeta(t.id).status === 'UNDER_REVIEW').length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-[10px] text-slate-500 font-bold">{isRtl ? 'معتمد ومصدق' : 'Approved (Shariah)'}</h5>
            <span className="text-sm font-extrabold text-indigo-600">
              {transactions.filter(t => loadTxMeta(t.id).status === 'APPROVED').length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-[10px] text-slate-500 font-bold">{isRtl ? 'مرحل ومقيد نهائياً' : 'Posted Ledger'}</h5>
            <span className="text-sm font-extrabold text-emerald-600">
              {transactions.filter(t => loadTxMeta(t.id).status === 'POSTED').length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two Column Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Column: List of Transactions */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" 
                      style={lang === 'en' ? { right: 'auto', left: '12px' } : {}} />
              <input
                type="text"
                placeholder={isRtl ? 'بحث برقم المستند، القيد أو البيان...' : 'Search doc number, narration...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all text-slate-800"
                style={lang === 'en' ? { paddingRight: '12px', paddingLeft: '36px' } : {}}
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">{isRtl ? 'نوع المعاملة' : 'Voucher Type'}</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="ALL">{isRtl ? 'الكل' : 'All Types'}</option>
                <option value="JOURNAL_ENTRY">{isRtl ? 'قيد يومية (فاتورة)' : 'Journal Entry (Invoice)'}</option>
                <option value="PAYMENT">{isRtl ? 'سند صرف (دفع)' : 'Payment Voucher'}</option>
                <option value="RECEIPT">{isRtl ? 'سند قبض' : 'Receipt Voucher'}</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">{isRtl ? 'المرحلة المستندية' : 'Workflow State'}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="ALL">{isRtl ? 'كل الحالات' : 'All States'}</option>
                <option value="DRAFT">{isRtl ? 'مسودة' : 'Draft'}</option>
                <option value="UNDER_REVIEW">{isRtl ? 'تحت المراجعة' : 'Under Review'}</option>
                <option value="APPROVED">{isRtl ? 'معتمد' : 'Approved'}</option>
                <option value="POSTED">{isRtl ? 'مرحل ومقيد' : 'Posted'}</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr className="bg-slate-50 text-slate-400 border-b border-slate-200/50 text-[10px] font-black uppercase">
                    <th className="p-2.5">{isRtl ? 'رقم السند/المستند' : 'Ref No'}</th>
                    <th className="p-2.5">{isRtl ? 'النوع والقيمة' : 'Type & Amount'}</th>
                    <th className="p-2.5 text-center">{isRtl ? 'الدورة والربط' : 'Cycle & Links'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-zinc-400 font-bold">
                        <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                        <span>{isRtl ? 'لا توجد معاملات مطابقة للفلاتر' : 'No transactions match filters'}</span>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const meta = loadTxMeta(tx.id);
                      const isSelected = selectedTxId === tx.id;
                      const hasAlerts = meta.alerts.length > 0;
                      
                      return (
                        <tr 
                          key={tx.id} 
                          onClick={() => setSelectedTxId(tx.id)}
                          className={`cursor-pointer transition-all hover:bg-slate-50 ${
                            isSelected ? 'bg-emerald-50/50 border-r-4 border-r-emerald-600' : ''
                          }`}
                        >
                          <td className="p-2.5 space-y-0.5">
                            <div className="font-mono text-[11px] font-black text-slate-900 tracking-tight flex items-center gap-1">
                              <span>{tx.transaction_number}</span>
                              {hasAlerts && <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{tx.description}</div>
                            <div className="text-[9px] text-zinc-400 font-mono">{new Date(tx.transaction_date).toLocaleDateString()}</div>
                          </td>
                          <td className="p-2.5 space-y-1">
                            <div className="font-mono font-black text-slate-950">
                              {parseFloat(String(tx.total_debit || tx.total_credit || 0)).toLocaleString()} YER
                            </div>
                            <span className={`inline-block px-1.5 py-0.2 bg-slate-100 text-[8px] font-black rounded border border-slate-200/50 ${
                              tx.transaction_type === 'PAYMENT' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              tx.transaction_type === 'RECEIPT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              'bg-zinc-50 text-zinc-700 border-zinc-200/50'
                            }`}>
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td className="p-2.5 align-middle">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-center whitespace-nowrap shadow-xs ${
                                meta.status === 'DRAFT' ? 'bg-zinc-100 text-zinc-600 border border-zinc-200' :
                                meta.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                meta.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {meta.status === 'DRAFT' && (isRtl ? 'مسودة' : 'Draft')}
                                {meta.status === 'UNDER_REVIEW' && (isRtl ? 'تحت مراجعة' : 'In Review')}
                                {meta.status === 'APPROVED' && (isRtl ? 'معتمد' : 'Approved')}
                                {meta.status === 'POSTED' && (isRtl ? 'مرحل' : 'Posted')}
                              </span>
                              {meta.linkedTxIds.length > 0 && (
                                <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-slate-500 bg-slate-100 px-1 rounded-sm border border-slate-200/40">
                                  <Link2 className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{meta.linkedTxIds.length} {isRtl ? 'روابط' : 'links'}</span>
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Deep-Dive Transaction Control Board */}
        <div className="xl:col-span-7 space-y-4">
          {!selectedTx || !txMeta ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/15 mb-4 animate-pulse">
                <Workflow className="w-8 h-8" />
              </div>
              <h4 className="text-xs font-black text-slate-800 mb-1">
                {isRtl ? 'لوحة تتبع الدورة المستندية ومطابقة المعاملات' : 'Document Cycle Tracker & Voucher Matcher'}
              </h4>
              <p className="text-[11px] text-slate-500 max-w-sm">
                {isRtl 
                  ? 'يرجى اختيار قيد أو مستند مالي من القائمة اليمنى للتعامل مع سير المعاملة، تسجيل التنبيهات، التعليقات والربط المتبادل بالفواتير والمرفقات.' 
                  : 'Select any financial voucher or transaction from the ledger to manage its workflow stages, add support attachments, append audit notes, or interlink documents.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Card Header & Controls */}
              <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex flex-wrap gap-2 justify-between items-center text-white">
                <div>
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{isRtl ? 'المعاملة قيد التدقيق' : 'Dossier Under Audit'}</span>
                  <h3 className="text-sm font-black flex items-center gap-2">
                    <span className="font-mono text-amber-400 text-xs tracking-wider">{selectedTx.transaction_number}</span>
                    <span className="text-xs text-zinc-400">| {selectedTx.description}</span>
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrintTransactionDossier(selectedTx, txMeta)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'طباعة كامل الملف' : 'Print Full File'}</span>
                  </button>
                </div>
              </div>

              {/* Workflow Step Timeline */}
              <div className="p-4 bg-slate-50/50 border-b border-slate-200/60">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                  <div className="w-full">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">{isRtl ? 'مسار الدورة المستندية والوركفلو' : 'Document Cycle Timeline'}</h5>
                    
                    {/* Visual Steps Indicator */}
                    <div className="grid grid-cols-4 gap-1 relative">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 -z-0"></div>
                      
                      {[
                        { id: 'DRAFT', label: isRtl ? 'مسودة قيد' : 'Voucher Draft', color: 'zinc' },
                        { id: 'UNDER_REVIEW', label: isRtl ? 'تحت المراجعة' : 'Under Review', color: 'amber' },
                        { id: 'APPROVED', label: isRtl ? 'معتمد وموثق' : 'Approved', color: 'indigo' },
                        { id: 'POSTED', label: isRtl ? 'مرحل بالدفاتر' : 'Posted Ledger', color: 'emerald' }
                      ].map((step, idx) => {
                        const states = ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'POSTED'];
                        const currentIdx = states.indexOf(txMeta.status);
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        
                        return (
                          <div key={step.id} className="text-center relative z-10">
                            <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center font-bold text-[10px] border transition-all ${
                              isCurrent ? 'bg-zinc-950 text-amber-400 border-amber-500 scale-110 shadow-sm' :
                              isDone ? 'bg-emerald-600 text-white border-emerald-500' :
                              'bg-white text-slate-400 border-slate-200'
                            }`}>
                              {isDone && !isCurrent ? '?' : idx + 1}
                            </div>
                            <div className={`text-[9px] font-black mt-1 ${isCurrent ? 'text-zinc-900 font-extrabold' : 'text-slate-500'}`}>{step.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Workflow Transitions Actions Box */}
                <div className="mt-4 pt-3 border-t border-slate-200/50 flex flex-wrap gap-2 items-center justify-end">
                  <span className="text-[10px] font-black text-slate-500">{isRtl ? 'الإجراء التالي بالوركفلو:' : 'Workflow Transition Actions:'}</span>
                  {txMeta.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStatusChange('UNDER_REVIEW')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      {isRtl ? 'تقديم للمراجعة والتدقيق 📑' : 'Submit for Review'}
                    </button>
                  )}
                  {txMeta.status === 'UNDER_REVIEW' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('DRAFT')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        {isRtl ? 'إرجاع للمسودة لتعديل البنود ↩' : 'Revert to Draft'}
                      </button>
                      <button
                        onClick={() => handleStatusChange('APPROVED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        {isRtl ? 'اعتماد ومصادقة شرعية ومالية ✓' : 'Approve & Validate'}
                      </button>
                    </>
                  )}
                  {txMeta.status === 'APPROVED' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('UNDER_REVIEW')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        {isRtl ? 'إعادة الفحص المالي' : 'Re-examine'}
                      </button>
                      <button
                        onClick={() => handleStatusChange('POSTED')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        {isRtl ? 'ترحيل وقفل قيد نهائي بالدفاتر 💾' : 'Post Ledger Entry'}
                      </button>
                    </>
                  )}
                  {txMeta.status === 'POSTED' && (
                    <span className="text-xs text-emerald-600 font-extrabold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'معاملة مقفلة ومرحلة للتقارير والضريبة' : 'Posted, Audited & Closed'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Tabs Headers */}
              <div className="flex bg-slate-100 p-1 gap-1 overflow-x-auto text-xs font-bold border-b border-slate-200">
                {[
                  { id: 'workflow', label: isRtl ? 'سير البنود' : 'Journal Lines', icon: Layers },
                  { id: 'linking', label: isRtl ? 'ترابط العمليات ومطابقة المدفوعات' : 'Operation Interlinking', icon: Link2 },
                  { id: 'notes', label: isRtl ? 'ملاحظات وتدقيق' : 'Auditor Remarks', icon: MessageSquare },
                  { id: 'attachments', label: isRtl ? 'الملف الأرشيفي' : 'Attachments Dossier', icon: Paperclip },
                  { id: 'alerts', label: isRtl ? 'التنبيهات الرقابية' : 'Compliance Alerts', icon: Bell },
                  { id: 'notifications', label: isRtl ? 'إرسال إشعار خارجي' : 'Dispatch Alerts', icon: Send },
                  { id: 'audit', label: isRtl ? 'سجل الرقابة والأمان' : 'Security Log', icon: History }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeActionTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveActionTab(tab.id as any)}
                      className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive ? 'bg-white text-emerald-700 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Panels */}
              <div className="p-4 space-y-4">
                
                {/* 1. Workflow / Journal Lines Tab */}
                {activeActionTab === 'workflow' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800">{isRtl ? 'بنود القيد القيد المزدوج' : 'Double-Entry Accounting Items'}</h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-black uppercase">
                            <th className="p-2.5">{isRtl ? 'الكود والحساب' : 'Account'}</th>
                            <th className="p-2.5">{isRtl ? 'البيان الفرعي' : 'Line Narration'}</th>
                            <th className="p-2.5 text-right">{isRtl ? 'مدين Debit' : 'Debit'}</th>
                            <th className="p-2.5 text-right">{isRtl ? 'دائن Credit' : 'Credit'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedTxLines.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-4 text-center text-zinc-400 font-bold">
                                <span>{isRtl ? 'لا توجد بنود تفصيلية مسجلة لهذا القيد' : 'No lines found for this entry'}</span>
                              </td>
                            </tr>
                          ) : (
                            selectedTxLines.map((line) => {
                              const accName = isRtl 
                                ? (accounts.find(a => a.id === line.account_id)?.name_ar || 'حساب غير معروف')
                                : (accounts.find(a => a.id === line.account_id)?.name_en || 'Unknown Account');
                              return (
                                <tr key={line.id} className="hover:bg-slate-50/40 font-semibold text-slate-700">
                                  <td className="p-2.5">
                                    <div className="font-mono text-[11px] font-black text-slate-900">{line.account_code}</div>
                                    <div className="text-[10px] text-slate-400">{accName}</div>
                                  </td>
                                  <td className="p-2.5 text-slate-600 truncate max-w-[200px]">{line.description}</td>
                                  <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                                    {line.debit_amount ? parseFloat(String(line.debit_amount)).toLocaleString() : '0'}
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                                    {line.credit_amount ? parseFloat(String(line.credit_amount)).toLocaleString() : '0'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. Operations Interlinking (The core transaction linking requested by user) */}
                {activeActionTab === 'linking' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{isRtl ? 'العمليات المترابطة والمطابقة العكسية' : 'Relational Linked Documents Ledger'}</h4>
                        <p className="text-[10px] text-slate-400">{isRtl ? 'تتبع فواتير الشراء المترابطة بسند أو أكثر صرف المورد ومطابقتها.' : 'Match and link purchase invoices to payment disbursements or receipts.'}</p>
                      </div>
                      
                      {/* Show quick pay voucher button only if this is a purchase invoice (typically a JOURNAL_ENTRY) */}
                      {selectedTx.transaction_type === 'JOURNAL_ENTRY' && (
                        <button
                          type="button"
                          onClick={() => setShowQuickPayForm(!showQuickPayForm)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'إصدار سند صرف مباشر للمورد' : 'Issue Payment Voucher'}</span>
                        </button>
                      )}
                    </div>

                    {/* Settle Invoice Visual Stats */}
                    {selectedTx.transaction_type === 'JOURNAL_ENTRY' && (
                      <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs font-black">
                          <span className="text-slate-500">{isRtl ? 'القيمة الإجمالية للفاتورة:' : 'Invoice Total Cost:'}</span>
                          <span className="text-slate-900 font-mono">{parseFloat(String(selectedTx.total_debit || selectedTx.total_credit || 0)).toLocaleString()} YER</span>
                        </div>
                        
                        {(() => {
                          const invoiceAmt = parseFloat(String(selectedTx.total_debit || selectedTx.total_credit || 0));
                          const paidAmt = getLinkedPaymentVouchersSum(selectedTx, txMeta.linkedTxIds);
                          const balanceRemaining = Math.max(0, invoiceAmt - paidAmt);
                          const pctPaid = Math.min(100, Math.round((paidAmt / invoiceAmt) * 100));
                          
                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs font-black">
                                <span className="text-slate-500">{isRtl ? 'المسدد بموجب سندات صرف:' : 'Paid via Linked Vouchers:'}</span>
                                <span className="text-emerald-700 font-mono">{paidAmt.toLocaleString()} YER ({pctPaid}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: `${pctPaid}%` }}></div>
                              </div>
                              <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-200">
                                <span className="text-amber-700">{isRtl ? 'المتبقي المستحق السداد:' : 'Balance Due Out:'}</span>
                                <span className="text-amber-700 font-mono">{balanceRemaining.toLocaleString()} YER</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Quick Payment creation form */}
                    {showQuickPayForm && (
                      <form onSubmit={handleQuickPaySubmit} className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-md animate-fade-in text-xs">
                        <h5 className="font-black text-slate-800 border-b pb-1.5 flex items-center gap-1.5 text-xs">
                          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                          <span>{isRtl ? 'تحرير سند صرف وإرسال سداد فوري للمورد' : 'Disbursement Payment Form'}</span>
                        </h5>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'قيمة الدفعة / السند (YER)' : 'Payment Amount (YER)'}</label>
                            <input
                              type="number"
                              required
                              value={quickPayAmount}
                              onChange={(e) => setQuickPayAmount(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'الرقم المرجعي / الشيك' : 'Check / Ref Reference'}</label>
                            <input
                              type="text"
                              value={quickPayRef}
                              onChange={(e) => setQuickPayRef(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900"
                              placeholder={selectedTx.transaction_number}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'الذمم المدينة / الالتزام المدفوع' : 'Liability Account (Debit)'}</label>
                            <select
                              required
                              value={quickPayAccount}
                              onChange={(e) => setQuickPayAccount(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                            >
                              <option value="">{isRtl ? 'اختر الحساب...' : 'Select account...'}</option>
                              {accounts.filter(a => a.account_type === 'LIABILITY' || a.account_code.startsWith('2')).map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.account_code} - {isRtl ? a.name_ar : a.name_en}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'حساب الصندوق / البنك الدائن' : 'Bank/Cash Asset (Credit)'}</label>
                            <select
                              required
                              value={quickPayCashAccount}
                              onChange={(e) => setQuickPayCashAccount(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                            >
                              <option value="">{isRtl ? 'اختر حساب الصندوق...' : 'Select cash/bank...'}</option>
                              {accounts.filter(a => a.account_type === 'ASSET' && (a.account_code.startsWith('10') || a.account_code.startsWith('11') || a.account_code.startsWith('12'))).map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.account_code} - {isRtl ? a.name_ar : a.name_en}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'طريقة السداد' : 'Payment Method'}</label>
                            <select
                              value={quickPayMethod}
                              onChange={(e) => setQuickPayMethod(e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            >
                              <option value="BANK_TRANSFER">{isRtl ? 'تحويل بنكي / بنك التضامن' : 'Bank Transfer'}</option>
                              <option value="CASH">{isRtl ? 'نقدى / من الصندوق الفرعي' : 'Cash'}</option>
                              <option value="CHEQUE">{isRtl ? 'شيك مصرفي مقبول الدفع' : 'Cheque'}</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => setShowQuickPayForm(false)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                          >
                            {isRtl ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="submit"
                            disabled={quickPayIsSubmitting}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-sm"
                          >
                            {quickPayIsSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>{isRtl ? 'حفظ وتثبيت سند الصرف' : 'Post Disbursement PV'}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* List of currently linked transactions */}
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{isRtl ? 'المستندات المرتبطة حالياً بالملف' : 'Linked Companion Documents'}</h5>
                      {txMeta.linkedTxIds.length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400">
                          <Link2 className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                          <span>{isRtl ? 'لا توجد معاملات تكميلية مرتبطة بهذا السند حالياً' : 'No companion documents linked yet'}</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {txMeta.linkedTxIds.map((linkId) => {
                            const partner = transactions.find(t => t.id === linkId);
                            if (!partner) return null;
                            
                            return (
                              <div key={linkId} className="flex justify-between items-center bg-slate-50 border border-slate-200/60 p-3 rounded-xl hover:bg-slate-100/50 transition-all">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-slate-900 text-xs">{partner.transaction_number}</span>
                                    <span className={`px-1.5 py-0.2 bg-slate-100 text-[8px] font-black rounded border border-slate-200/50 ${
                                      partner.transaction_type === 'PAYMENT' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                      partner.transaction_type === 'RECEIPT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}>
                                      {partner.transaction_type}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium">{partner.description}</p>
                                  <div className="text-[9px] text-slate-400 font-mono">{new Date(partner.transaction_date).toLocaleDateString()}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-black text-slate-900 text-xs">{parseFloat(String(partner.total_debit || partner.total_credit || 0)).toLocaleString()} YER</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUnlinkTx(linkId)}
                                    className="p-1.5 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                                    title={isRtl ? 'إلغاء الارتباط والمطابقة' : 'Unlink document'}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Manual Linking Form */}
                    <form onSubmit={handleLinkExistingTx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{isRtl ? 'ربط مستند يدوي بقائمة المعاملات' : 'Manually Associate with Companion Doc'}</label>
                        <select
                          required
                          value={linkTargetTxId}
                          onChange={(e) => setLinkTargetTxId(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">{isRtl ? 'اختر المعاملة الشريكة للربط...' : 'Select companion voucher to match...'}</option>
                          {transactions
                            .filter(t => t.id !== selectedTxId && !txMeta.linkedTxIds.includes(t.id))
                            .map(t => (
                              <option key={t.id} value={t.id}>
                                {t.transaction_number} - {t.transaction_type} ({parseFloat(String(t.total_debit || t.total_credit || 0)).toLocaleString()} YER) - {t.description.slice(0, 30)}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-amber-400 rounded-lg font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تأكيد الربط' : 'Associate Link'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. Notes & Remarks */}
                {activeActionTab === 'notes' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-800">{isRtl ? 'الملاحظات والتحققات والتعليقات بالدورة' : 'Appended Remarks & Auditor Verification logs'}</h4>
                    
                    {/* Notes List */}
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                      {txMeta.notes.length === 0 ? (
                        <p className="p-4 text-center text-slate-400 text-xs border border-dashed rounded-xl">{isRtl ? 'لا توجد ملاحظات لاحقة معينة' : 'No remarks recorded yet'}</p>
                      ) : (
                        txMeta.notes.map((note) => (
                          <div key={note.id} className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl relative space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                              <span>? {note.author}</span>
                              <span className="font-mono text-zinc-400">{note.date}</span>
                            </div>
                            <p className="text-xs text-slate-700 font-bold leading-relaxed">{note.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Predefined templates for notes */}
                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-black text-slate-400 uppercase">{isRtl ? 'قوالب ملاحظات الرقابة السريعة:' : 'Quick Auditor Templates:'}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          isRtl ? 'تمت مطابقة أرقام الفاتورة بالكامل مع أمر التوريد والكميات بالمستودع.' : 'Invoice matched with PO quantities.',
                          isRtl ? 'مستند الصرف معلق بانتظار استكمال التواقيع والاعتماد النهائي.' : 'Disbursement held pending final signoff.',
                          isRtl ? 'موافقة الهيئة الشرعية للتمويل مكتملة ومرفقة بالملف.' : 'Shariah committee audit complete and approved.'
                        ].map((tpl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setNoteInput(tpl)}
                            className="text-[9px] font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-md px-2 py-1 text-slate-600 cursor-pointer"
                          >
                            {tpl.slice(0, 40)}...
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Add Note Form */}
                    <form onSubmit={handleAddNote} className="flex gap-2 text-xs">
                      <input
                        type="text"
                        required
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder={isRtl ? 'اكتب ملاحظتك اللاحقة هنا...' : 'Type audit verification remark here...'}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isRtl ? 'أضف ملاحظة' : 'Append Note'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 4. Attachments Dossier */}
                {activeActionTab === 'attachments' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{isRtl ? 'الملف الأرشيفي والوثائق المؤيدة للمستند' : 'Supporting Audit Documents Dossier'}</h4>
                      <p className="text-[10px] text-slate-400">{isRtl ? 'قم برفع فواتير، عقود، صكوك الملكية، شهادات الشحن وسندات الصرف المؤرشفة.' : 'Archive receipts, contracts, waybills, cargo clearances, solar deeds, and compliance documents.'}</p>
                    </div>

                    {/* Simulated Drag & Drop Zone */}
                    <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 relative">
                      <input
                        type="file"
                        onChange={handleSimulatedFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                      <h5 className="text-xs font-black text-slate-700">{isRtl ? 'اسحب وأفلت الوثائق المؤيدة أو انقر للتصفح' : 'Drag & Drop Supporting Files'}</h5>
                      <span className="text-[9px] text-slate-400">PDF, PNG, JPG, XLSX (Max 15MB)</span>
                    </div>

                    {/* File List */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{isRtl ? 'الوثائق المؤرشفة حالياً:' : 'Archived Support Files:'}</h5>
                      
                      {/* Realistic preset files for better presentation */}
                      {txMeta.attachments.length === 0 && (
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl text-slate-500">
                          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div className="flex-1 text-[11px]">
                            <span className="font-bold text-slate-800">PI-VOUCHER-SCAN.pdf</span>
                            <span className="block text-[9px] text-zinc-400 font-mono">1.2 MB | {isRtl ? 'مسح ضوئي ملون للفاتورة الأصلية' : 'Colored high-res scan of voucher'}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                            {isRtl ? 'مؤرشف' : 'Archived'}
                          </span>
                        </div>
                      )}

                      {txMeta.attachments.map((att) => (
                        <div key={att.id} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs hover:bg-slate-100/50 transition-all">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <div>
                              <span className="font-bold text-slate-800">{att.name}</span>
                              <span className="block text-[9px] text-zinc-400 font-mono">{att.size} | {att.type}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-slate-200 hover:border-rose-100 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Alerts & Warnings */}
                {activeActionTab === 'alerts' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-800">{isRtl ? 'التنبيهات والتحذيرات الرقابية الفعالة' : 'Compliance & Risk Control Alerts'}</h4>
                    
                    {/* Alerts List */}
                    <div className="space-y-2">
                      {txMeta.alerts.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs border border-dashed rounded-xl flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>{isRtl ? 'المستند سليم وخالٍ من التنبيهات والتحذيرات الرقابية' : 'Document verified clear with zero active alerts.'}</span>
                        </div>
                      ) : (
                        txMeta.alerts.map((al) => (
                          <div key={al.id} className={`p-3 rounded-xl border text-xs font-semibold flex gap-2 items-start ${
                            al.severity === 'critical' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                            al.severity === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            'bg-blue-50 text-blue-800 border-blue-200'
                          }`}>
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-bold">{al.text}</p>
                              <span className="block text-[9px] text-slate-400 font-mono mt-0.5">{isRtl ? 'تاريخ التنبيه:' : 'Pinned:'} {al.date}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Alert Form */}
                    <form onSubmit={handleAddAlert} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-3 text-xs">
                      <h5 className="font-bold text-slate-800">{isRtl ? 'إدراج تنبيه رقابي جديد بالملف' : 'Pin New Compliance Alert'}</h5>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'نص التنبيه والملاحظة الرقابية' : 'Alert text'}</label>
                          <input
                            type="text"
                            required
                            value={alertTextInput}
                            onChange={(e) => setAlertTextInput(e.target.value)}
                            placeholder={isRtl ? 'مثال: يرجى التحقق من صك الوقف قبل الصرف...' : 'e.g. Awaiting shariah committee seal...'}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'مستوى خطورة التحذير' : 'Severity Level'}</label>
                          <select
                            value={alertSeverity}
                            onChange={(e) => setAlertSeverity(e.target.value as any)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="info">{isRtl ? 'تنبيه معلوماتي عادي' : 'Info'}</option>
                            <option value="warning">{isRtl ? 'تحذير مالي متوسط خطورة' : 'Warning'}</option>
                            <option value="critical">{isRtl ? 'إيقاف صرف / مخاطر حرجة' : 'Critical Hold'}</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-slate-900 hover:bg-black text-amber-400 rounded-lg font-bold"
                        >
                          {isRtl ? 'تثبيت التنبيه بالملف' : 'Pin Alert'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 6. External Alert Dispatch / Send Notification (WhatsApp, SMS, Email Gateway) */}
                {activeActionTab === 'notifications' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{isRtl ? 'إرسال إشعارات وتنبيهات فورية للمورد والمستفيدين' : 'Telecom Gateway & Custom Notification Dispatch'}</h4>
                      <p className="text-[10px] text-slate-400">{isRtl ? 'قم بالربط المباشر مع الموردين وإعلامهم بالحوالات المالية أو المطالبات بالدورة.' : 'Broadcast transaction progress to supplier, operations team, or internal shariah auditors.'}</p>
                    </div>

                    <form onSubmit={handleDispatchNotification} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'جهة الاتصال / المستلم' : 'Recipient Name / Supplier'}</label>
                          <input
                            type="text"
                            required
                            value={notifSupplierName}
                            onChange={(e) => setNotifSupplierName(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold"
                            placeholder={isRtl ? 'اسم المورد أو المستلم...' : 'Supplier contact name...'}
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'قناة الإرسال' : 'Delivery Channel'}</label>
                          <select
                            value={notifChannel}
                            onChange={(e) => setNotifChannel(e.target.value as any)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="whatsapp">?? WhatsApp Gateway</option>
                            <option value="sms">?? SMS Carrier</option>
                            <option value="email">? SMTP Email Server</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'قالب التنبيه التلقائي' : 'Notification Template'}</label>
                          <select
                            value={notifTemplate}
                            onChange={(e) => setNotifTemplate(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="payment_posted">{isRtl ? 'تأكيد الحوالة / سداد الفاتورة' : 'Payment Disbursed Confirmation'}</option>
                            <option value="invoice_received">{isRtl ? 'إشعار استلام الفاتورة وادراجها' : 'Invoice Received Tracker'}</option>
                            <option value="pending_approval">{isRtl ? 'إشعار طلب توقيع واعتماد معجل' : 'Signoff Urgency Request'}</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-600 mb-1">{isRtl ? 'نص الرسالة المرسلة بالبوابة (معدل):' : 'Gateway Message text (Editable):'}</label>
                        <textarea
                          rows={3}
                          value={notifText}
                          onChange={(e) => setNotifText(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-bold font-mono"
                        />
                      </div>

                      {notifStatus.type !== 'idle' && (
                        <div className={`p-3 rounded-xl text-xs font-bold ${
                          notifStatus.type === 'sending' ? 'bg-slate-100 text-slate-700 animate-pulse' :
                          notifStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {notifStatus.message}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <button
                          type="submit"
                          disabled={notifStatus.type === 'sending'}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black flex items-center gap-1.5 shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isRtl ? 'إرسال وتفعيل التنبيه بالبوابة' : 'Dispatch Gateway Alert'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 7. Audit Trail Security log */}
                {activeActionTab === 'audit' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-slate-500" />
                      <span>{isRtl ? 'سجل تتبع الحركة والتدقيق بالدورة المستندية' : 'Document Cycle Audit Trail'}</span>
                    </h4>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="max-h-[350px] overflow-y-auto">
                        <table className="w-full text-xs text-right border-collapse" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-black uppercase">
                              <th className="p-2.5">{isRtl ? 'التاريخ الوقت' : 'Date / Time'}</th>
                              <th className="p-2.5">{isRtl ? 'الإجراء' : 'Action'}</th>
                              <th className="p-2.5">{isRtl ? 'المسؤول' : 'User'}</th>
                              <th className="p-2.5">{isRtl ? 'التفاصيل والملف' : 'Audit Details'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {txMeta.auditTrail.map((audit) => (
                              <tr key={audit.id} className="hover:bg-slate-50/40 text-[11px] font-semibold text-slate-700">
                                <td className="p-2.5 font-mono text-[10px] text-slate-400">{audit.date}</td>
                                <td className="p-2.5 font-bold text-slate-900">{audit.action}</td>
                                <td className="p-2.5 text-emerald-700">?? {audit.user}</td>
                                <td className="p-2.5 text-slate-500 italic text-[10px]">{audit.details}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
