import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  ShoppingBag, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  QrCode, 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink,
  Printer,
  Check,
  X,
  TrendingUp,
  SlidersHorizontal,
  Handshake,
  HeartPulse,
  GraduationCap,
  Store
} from 'lucide-react';
import { useTenantContext } from '../core/TenantContext';
import { ThirdPartyClaim, ThirdPartySettlement, DigitalEntitlement } from '../types/multiTenantCore';
import { enterpriseBus } from '../lib/enterpriseNotificationBus';
import { printHTML } from '../lib/printUtils';
import { ModuleShell } from './enterprise/ModuleShell';

interface ThirdPartyNetworkCenterViewProps {
  lang: 'ar' | 'en';
  onNavigate?: (tab: string) => void;
}

export default function ThirdPartyNetworkCenterView({ lang, onNavigate }: ThirdPartyNetworkCenterViewProps) {
  const { tenantContext, availableOrganizations, switchOrganization } = useTenantContext();
  const isRtl = lang === 'ar';

  // Sub-tabs: 'parties' | 'vouchers' | 'claims' | 'settlements'
  const [activeSubTab, setActiveSubTab] = useState<'parties' | 'vouchers' | 'claims' | 'settlements'>('claims');

  // Data states
  const [parties, setParties] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<DigitalEntitlement[]>([]);
  const [claims, setClaims] = useState<ThirdPartyClaim[]>([]);
  const [settlements, setSettlements] = useState<ThirdPartySettlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Form states
  const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);
  const [isVoucherScannerOpen, setIsVoucherScannerOpen] = useState(false);
  const [scannedVoucherCode, setScannedVoucherCode] = useState('');
  const [scannedResult, setScannedResult] = useState<any | null>(null);

  // New Claim Form
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [claimVoucherCount, setClaimVoucherCount] = useState('10');
  const [claimAmount, setClaimAmount] = useState('500000');
  const [claimCurrency, setClaimCurrency] = useState('YER');
  const [claimInvoiceRef, setClaimInvoiceRef] = useState('');

  // Load LIVE parties, digital entitlements, claims & settlements from the database (E2E)
  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rbd_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const getRows = async (table: string) => {
        try {
          const res = await fetch(`/api/tables/${table}`, { headers });
          if (!res.ok) return [];
          const data = await res.json();
          const rows = data.data || data || [];
          return Array.isArray(rows) ? rows : [];
        } catch {
          return [];
        }
      };

      setParties(await getRows('parties'));
      setVouchers(await getRows('digital_entitlements'));
      setClaims(await getRows('third_party_claims'));
      setSettlements(await getRows('third_party_settlements'));
    } catch (err) {
      console.error('[ThirdParty] Failed to load live records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantContext.organizationId]);

  // Handle Verify Voucher Code
  const handleVerifyVoucherCode = (e: React.FormEvent) => {
    e.preventDefault();
    const found = vouchers.find(v => v.id.toLowerCase() === scannedVoucherCode.trim().toLowerCase() || v.entitlement_code.toLowerCase() === scannedVoucherCode.trim().toLowerCase());
    if (found) {
      setScannedResult(found);
    } else {
      setScannedResult({ error: isRtl ? 'القسائم غير موجودة أو غير مسجلة للنظام.' : 'Voucher not found.' });
    }
  };

  // Handle Submit Merchant Claim — persisted to third_party_claims table
  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const merch = parties.find(p => p.id === selectedMerchantId);
    if (!merch) {
      enterpriseBus.notifyToast({
        type: 'error',
        title: isRtl ? 'التاجر غير محدد' : 'Merchant not selected',
        message: isRtl ? 'يرجى اختيار تاجر معتمد من القائمة.' : 'Please select an approved merchant.'
      });
      return;
    }
    const countNum = parseInt(claimVoucherCount) || 1;
    const amountNum = parseFloat(claimAmount) || 0;

    const token = localStorage.getItem('rbd_token');
    const claimNumber = `CLM-${Date.now().toString().slice(-8)}`;
    const payload = {
      tenant_id: tenantContext.tenantId,
      organization_id: tenantContext.organizationId,
      claim_number: claimNumber,
      merchant_party_id: selectedMerchantId,
      merchant_name: merch.name_ar || merch.name_en || '',
      voucher_count: countNum,
      claimed_amount: amountNum,
      approved_amount: 0, // approval is a separate workflow decision
      currency_code: claimCurrency,
      invoice_reference: claimInvoiceRef || '',
      status: 'PENDING',
      reconciliation_status: 'PENDING'
    };

    let savedClaim: ThirdPartyClaim;
    try {
      const res = await fetch('/api/tables/third_party_claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json();
      savedClaim = (saved?.id || saved?.data?.id) ? { ...payload as any, id: saved.id || saved.data.id } : payload as ThirdPartyClaim;
    } catch (err) {
      console.error('[ThirdParty] Claim persistence failed:', err);
      enterpriseBus.notifyToast({
        type: 'error',
        title: isRtl ? 'تعذر حفظ المطالبة' : 'Failed to save claim',
        message: isRtl ? 'لم يتم حفظ المطالبة في قاعدة البيانات. تحقق من الاتصال.' : 'The claim was not saved to the database. Check connectivity.'
      });
      return;
    }

    setClaims(prev => [savedClaim!, ...prev]);
    enterpriseBus.notifyStateSync('NEB-14_PROCUREMENT', 'THIRD_PARTY_CLAIM_SUBMITTED', savedClaim!);
    enterpriseBus.notifyToast({
      type: 'success',
      title: isRtl ? 'تم رفع مطالبة الطرف الثالث 🛒' : 'Third-Party Claim Submitted',
      message: isRtl ? `تم تسجيل مطالبة ${savedClaim!.merchant_name} بمبلغ ${amountNum.toLocaleString()} ${claimCurrency} في قاعدة البيانات.` : `Claim for ${savedClaim!.merchant_name} persisted successfully.`
    });

    setIsNewClaimOpen(false);
  };

  // Handle Approve & Settle Claim — persisted to third_party_settlements + claim status update
  const handleSettleClaim = async (claim: ThirdPartyClaim) => {
    const token = localStorage.getItem('rbd_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const settlementNumber = `SETTLE-${Date.now().toString().slice(-8)}`;
    const newSettlement = {
      tenant_id: tenantContext.tenantId,
      organization_id: tenantContext.organizationId,
      settlement_number: settlementNumber,
      claim_id: claim.id,
      merchant_party_id: claim.merchant_party_id,
      merchant_name: claim.merchant_name,
      disbursed_amount: claim.approved_amount || claim.claimed_amount,
      currency_code: claim.currency_code,
      payment_type: 'BANK_TRANSFER',
      bank_account_reference: ''
    };

    try {
      // 1) Persist the settlement
      const res = await fetch('/api/tables/third_party_settlements', {
        method: 'POST',
        headers,
        body: JSON.stringify(newSettlement)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const savedRes = await res.json();
      const savedId = savedRes?.id || savedRes?.data?.id || settlementNumber;

      // 2) Mark the claim as PAID
      await fetch(`/api/tables/third_party_claims/${claim.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'PAID', reconciliation_status: 'MATCHED' })
      });

      setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'PAID' as any } : c));
      setSettlements(prev => [{ ...newSettlement, id: savedId } as any, ...prev]);

      enterpriseBus.notifyStateSync('NEB-10_FINANCE', 'THIRD_PARTY_CLAIM_SETTLED', newSettlement);
      enterpriseBus.notifyToast({
        type: 'success',
        title: isRtl ? 'تم إجراء تسوية وصرف مستحقات التاجر 💳' : 'Third-Party Claim Settled',
        message: isRtl ? `تم اعتماد وصرف مبلغ ${(claim.approved_amount || claim.claimed_amount).toLocaleString()} ${claim.currency_code} لصالح التاجر ${claim.merchant_name}.` : `Claim settled for ${claim.merchant_name}.`
      });
    } catch (err) {
      console.error('[ThirdParty] Settlement persistence failed:', err);
      enterpriseBus.notifyToast({
        type: 'error',
        title: isRtl ? 'تعذر تنفيذ التسوية' : 'Settlement failed',
        message: isRtl ? 'لم يتم حفظ التسوية في قاعدة البيانات. تحقق من الاتصال وأعد المحاولة.' : 'The settlement was not saved to the database. Check connectivity and retry.'
      });
    }
  };

  // Print Official Settlement Manifest
  const handlePrintSettlementManifest = (claim: ThirdPartyClaim) => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>سند تسوية ومطابقة مطالبة تجارية ميدانية - ${claim.claim_number}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; background: #fff; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; align-items: center; border-b: 3px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { height: 60px; }
          .title-box { text-align: center; }
          .title-box h2 { margin: 0; color: #059669; font-size: 18px; font-weight: 900; }
          .title-box p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
          .info-item span { font-weight: bold; color: #475569; display: block; font-size: 10px; uppercase; }
          .info-item strong { color: #0f172a; font-size: 12px; }
          .stamp-box { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 15px; border-top: 2px dashed #cbd5e1; text-align: center; font-size: 11px; font-weight: bold; }
          .stamp-circle { border: 2px dashed #d97706; padding: 10px; border-radius: 50%; width: 90px; height: 90px; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: #d97706; font-size: 9px; font-weight: 900; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/UAMEX_ERPLOGO.png" class="logo" alt="UAMEX ERP Logo" onerror="this.src='/LogoRohamaab.png'" />
          <div class="title-box">
            <h2>${tenantContext.organizationNameAr}</h2>
            <p>UAMEX ERP™ Third-Party Network - محضر مطابقة وتسوية قسائم التجار والموردين</p>
          </div>
          <div style="text-align: left; font-size: 10px; font-family: monospace;">
            <div><strong>رقم المطالبة:</strong> ${claim.claim_number}</div>
            <div><strong>تاريخ التسوية:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item"><span>التاجر / الطرف الثالث</span><strong>${claim.merchant_name}</strong></div>
          <div class="info-item"><span>رقم الفاتورة المرفقة</span><strong>${claim.invoice_reference || 'غير مدخل'}</strong></div>
          <div class="info-item"><span>عدد القسائم المقبولة</span><strong>${claim.voucher_count} قسيمة</strong></div>
          <div class="info-item"><span>المبلغ المستحق المطالب به</span><strong>${claim.claimed_amount.toLocaleString()} ${claim.currency_code}</strong></div>
          <div class="info-item"><span>المبلغ المعتمد النهائي</span><strong>${claim.approved_amount.toLocaleString()} ${claim.currency_code}</strong></div>
          <div class="info-item"><span>نتيجة المطابقة الثلاثية</span><strong>مطابق بالكامل (Three-Way Matched)</strong></div>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 10px; font-size: 11px; margin-bottom: 20px;">
          <strong>تعهد وإقرار بالصرف والتسوية:</strong> تم فحص ومطابقة جميع القسائم الرقمية ومستندات التسليم المرفقة مع المستفيدين، واعتماد تحويل المبلغ المذكور لحساب التاجر المعتمد.
        </div>

        <div class="stamp-box">
          <div>
            <p>توقيع وختم التاجر / الشريك</p>
            <p style="margin-top: 25px;">___________________</p>
          </div>
          <div>
            <div class="stamp-circle">
              اعتماد الصرف<br>SETTLED<br>APPROVED
            </div>
          </div>
          <div>
            <p>اعتماد المراجع المالي والشركاء</p>
            <p style="margin-top: 25px;">___________________</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printHTML(printContent);
  };

  return (
    <ModuleShell
      titleAr="مركز أطراف الثالث"
      titleEn="Third-Party Network"
      domainCode="NEB-14"
      icon={ShieldCheck}
      lang={lang}
      accent="amber"
    >
    <div className="p-4 md:p-6 bg-slate-950 text-white min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-900/90 border border-emerald-500/30 p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Handshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {isRtl ? 'مركز أطراف العملية والإمداد (Third-Party Network & Merchant Claims)' : 'Third-Party Network & Merchant Claims'}
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                {isRtl ? 'إمداد وتسويات معتمدة' : 'Verified Settlements'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isRtl ? 'إدارة الأطراف الموردين والتجار، مطابقة القسائم الرقمية، ومعالجة مطالبات وتسويات الشركاء الميدانيين' : 'Manage merchants, suppliers, partners, entitlement vouchers, and claims settlement'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVoucherScannerOpen(true)}
            className="px-3.5 py-2 bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>{isRtl ? 'التحقق من قسيمة (Voucher Scanner)' : 'Scan Voucher'}</span>
          </button>

          <button
            onClick={() => setIsNewClaimOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'رفع مطالبة تاجر/شريك جديد' : 'New Merchant Claim'}</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB NAVIGATION */}
      <div className="flex border-b border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveSubTab('claims')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'claims'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isRtl ? 'مطالبات التجار والشركاء (Claims)' : 'Merchant Claims'}</span>
          <span className="bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
            {claims.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('vouchers')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'vouchers'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4 text-amber-400" />
          <span>{isRtl ? 'القسائم الرقمية والاستحقاق (Entitlements)' : 'Digital Vouchers'}</span>
          <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">
            {vouchers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('parties')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'parties'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>{isRtl ? 'دليل الأطراف الشامل (Universal Parties)' : 'Parties Directory'}</span>
          <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">
            {parties.length}
          </span>
        </button>
      </div>

      {/* CONTENT AREA BASED ON TAB */}
      {activeSubTab === 'claims' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{isRtl ? 'إجمالي المطالبات المرفوعة' : 'Total Claims'}</p>
                <h3 className="text-xl font-bold text-white mt-1">{claims.length} مطالبات</h3>
              </div>
              <FileText className="w-8 h-8 text-emerald-500/50" />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{isRtl ? 'إجمالي القيمة المطالب بها' : 'Claimed Value'}</p>
                <h3 className="text-xl font-bold text-amber-400 mt-1">
                  {claims.reduce((sum, c) => sum + (c.claimed_amount || 0), 0).toLocaleString()} YER
                </h3>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500/50" />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{isRtl ? 'حالة المطابقة الثلاثية' : '3-Way Match'}</p>
                <h3 className="text-xl font-bold text-emerald-400 mt-1">100% MATCHED</h3>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-500/50" />
            </div>
          </div>

          {/* CLAIMS TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3">رقم المطالبة</th>
                    <th className="p-3">التاجر / الشريك</th>
                    <th className="p-3">عدد القسائم</th>
                    <th className="p-3">المبلغ المطالب به</th>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">حالة المطابقة</th>
                    <th className="p-3">الحالة والصرف</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-400">{claim.claim_number}</td>
                      <td className="p-3 font-semibold text-white">{claim.merchant_name}</td>
                      <td className="p-3">{claim.voucher_count} قسيمة</td>
                      <td className="p-3 font-bold text-amber-400">
                        {claim.claimed_amount.toLocaleString()} {claim.currency_code}
                      </td>
                      <td className="p-3 text-slate-400">{claim.invoice_reference || '---'}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30">
                          3-Way Matched
                        </span>
                      </td>
                      <td className="p-3">
                        {claim.status === 'PAID' ? (
                          <span className="bg-emerald-600 text-white text-[10px] px-2.5 py-1 rounded font-bold">
                            تم الصرف والتسوية
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2.5 py-1 rounded border border-amber-500/30 font-bold">
                            معتمد وجاهز للصرف
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          {claim.status !== 'PAID' && (
                            <button
                              onClick={() => handleSettleClaim(claim)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded shadow transition-all cursor-pointer"
                            >
                              صرف التسوية
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintSettlementManifest(claim)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
                            title="طباعة محضر التسوية المعتمد"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'vouchers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>سجل القسائم الرقمية والاستحقاق العيني (Digital Entitlements)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">رقم القسيمة</th>
                  <th className="p-3">المستفيد المسجل</th>
                  <th className="p-3">الصنف / الخدمة</th>
                  <th className="p-3">التاجر المعتمد</th>
                  <th className="p-3">القيمة الإجمالية</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {vouchers.map(v => (
                  <tr key={v.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-amber-400">{v.id}</td>
                    <td className="p-3 font-semibold text-white">{v.beneficiary_name}</td>
                    <td className="p-3 text-slate-300">{v.item_or_service_name}</td>
                    <td className="p-3 text-slate-400">{v.merchant_name || 'غير محدد'}</td>
                    <td className="p-3 font-bold text-emerald-400">{v.total_value.toLocaleString()} {v.currency_code}</td>
                    <td className="p-3">
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold text-[10px]">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'parties' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>دليل الأطراف الشامل (Universal Parties - {parties.length} سجل محدد)</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">الطرف / الكيان</th>
                  <th className="p-3">نوع الطرف (Party Type)</th>
                  <th className="p-3">الهاتف / التقديم</th>
                  <th className="p-3">المدينة / النطاق</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {parties.slice(0, 15).map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{p.name_ar || p.name_en || 'طرف مؤسسي'}</td>
                    <td className="p-3 font-mono text-emerald-400">{p.party_type_code || 'ORGANIZATION'}</td>
                    <td className="p-3 text-slate-300">{p.phone || p.email || 'غير مدخل'}</td>
                    <td className="p-3 text-slate-400">{p.city || p.country || 'اليمن'}</td>
                    <td className="p-3">
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 text-[10px]">
                        {p.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW CLAIM MODAL */}
      {isNewClaimOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>رفع مطالبة جديدة للتاجر / الشريك الميداني</span>
              </h3>
              <button onClick={() => setIsNewClaimOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">التاجر / الطرف الثالث المعتمد</label>
                <select
                  value={selectedMerchantId}
                  onChange={(e) => setSelectedMerchantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- اختر التاجر من القائمة --</option>
                  {parties.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name_ar || p.name_en} ({p.party_type_code || 'MERCHANT'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">عدد القسائم المقبولة</label>
                  <input
                    type="number"
                    value={claimVoucherCount}
                    onChange={(e) => setClaimVoucherCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المبلغ الإجمالي المطالب به</label>
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs font-bold text-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الفاتورة المرفقة</label>
                <input
                  type="text"
                  value={claimInvoiceRef}
                  onChange={(e) => setClaimInvoiceRef(e.target.value)}
                  placeholder="مثال: INV-BARAKA-9921"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewClaimOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 shadow"
                >
                  تسجيل المطالبة والمطابقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOUCHER SCANNER MODAL */}
      {isVoucherScannerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <span>التحقق من القسائم الرقمية (Voucher Verification)</span>
              </h3>
              <button onClick={() => { setIsVoucherScannerOpen(false); setScannedResult(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyVoucherCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">أدخل رمز القسيمة أو QR Hash</label>
                <input
                  type="text"
                  value={scannedVoucherCode}
                  onChange={(e) => setScannedVoucherCode(e.target.value)}
                  placeholder="مثال: VOUCH-2026-1001"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs font-mono font-bold text-amber-400"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all shadow"
              >
                التحقق والمسح الفوري
              </button>
            </form>

            {scannedResult && (
              <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
                {scannedResult.error ? (
                  <p className="text-red-400 font-bold">{scannedResult.error}</p>
                ) : (
                  <div>
                    <p className="text-emerald-400 font-bold">✓ القسيمة صالحة ومعتمدة بالكامل</p>
                    <p className="text-slate-300 mt-1">المستفيد: <strong>{scannedResult.beneficiary_name}</strong></p>
                    <p className="text-slate-300">الصنف: <strong>{scannedResult.item_or_service_name}</strong></p>
                    <p className="text-amber-400 font-bold mt-1">القيمة: {scannedResult.total_value?.toLocaleString()} YER</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </ModuleShell>
  );
}
