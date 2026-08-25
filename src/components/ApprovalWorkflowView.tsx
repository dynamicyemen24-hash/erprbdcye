import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  FileText, 
  Printer, 
  Plus,
  RefreshCw,
  Coins,
  History,
  User, 
  UserCheck,
  Shield,
  Calendar,
  CheckSquare,
  Trash2,
  Check, 
  X,
  TrendingUp,
  AlertTriangle,
  Lock,
  LockOpen,
  Filter,
  Workflow,
  ArrowDown,
  Activity,
  ShoppingBag,
  Box
} from 'lucide-react';
import { Project, Program, ApprovalRequest, ApprovalHistory, WorkflowDefinition } from '../types';
import { enterpriseBus } from '../lib/enterpriseNotificationBus';
import { ModuleShell } from './enterprise/ModuleShell';
import { ErrorBoundary } from '../app/components/ErrorBoundary';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ApprovalWorkflowViewProps {
  currentUser: UserProfile;
  lang: 'ar' | 'en';
  onRefresh: () => void;
  initialStatusFilter?: 'all' | 'pending' | 'approved' | 'rejected';
  onNavigate?: (tab: string) => void;
}

export default function ApprovalWorkflowView({ currentUser, lang, onRefresh, initialStatusFilter, onNavigate }: ApprovalWorkflowViewProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [history, setHistory] = useState<ApprovalHistory[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // New compliance states
  const [approvalMatrix, setApprovalMatrix] = useState<any[]>([]);
  const [approvalThresholds, setApprovalThresholds] = useState<any[]>([]);
  const [approvalDelegations, setApprovalDelegations] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'matrix' | 'delegations'>('requests');
  
  // Create delegation states
  const [isNewDelegationOpen, setIsNewDelegationOpen] = useState(false);
  const [delegateId, setDelegateId] = useState('');
  const [delegationEntityTypes, setDelegationEntityTypes] = useState<string>('project');
  const [delegationMaxAmount, setDelegationMaxAmount] = useState('500000');
  const [delegationStartDate, setDelegationStartDate] = useState('');
  const [delegationEndDate, setDelegationEndDate] = useState('');
  const [delegationReason, setDelegationReason] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(initialStatusFilter || 'all');

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Selection states
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [historyForSelected, setHistoryForSelected] = useState<ApprovalHistory[]>([]);
  const [selectedRequestViewMode, setSelectedRequestViewMode] = useState<'timeline' | 'flowchart'>('flowchart');
  
  // Create state
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [newRequestType, setNewRequestType] = useState<'project' | 'transaction'>('project');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestPriority, setRequestPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  
  // Review actions state
  const [commentText, setCommentText] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load everything
  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, histRes, wfRes, projRes, txRes, usersRes, matrixRes, thresholdsRes, delegationsRes] = await Promise.all([
        fetch('/api/tables/approval_requests').then(r => r.json()),
        fetch('/api/tables/approval_history').then(r => r.json()),
        fetch('/api/tables/workflow_definitions').then(r => r.json()),
        fetch('/api/tables/projects').then(r => r.json()),
        fetch('/api/tables/transactions').then(r => r.json()),
        fetch('/api/tables/users').then(r => r.json()),
        fetch('/api/tables/approval_matrix').then(r => r.json()),
        fetch('/api/tables/approval_thresholds').then(r => r.json()),
        fetch('/api/tables/approval_delegations').then(r => r.json())
      ]);

      // Simple user Map for fast lookup
      const userMap = new Map();
      if (Array.isArray(usersRes)) {
        usersRes.forEach(u => {
          userMap.set(u.id, lang === 'ar' ? (u.name_ar || u.name) : (u.name || u.name_ar));
        });
      }

      // Add human-readable names to requests
      const formattedRequests = (Array.isArray(reqRes) ? reqRes : []).map((req: any) => {
        let name = '';
        let code = '';
        if (req.entity_type === 'project' && Array.isArray(projRes)) {
          const matchedProj = projRes.find(p => p.id === req.entity_id);
          if (matchedProj) {
            name = lang === 'ar' ? matchedProj.name_ar : matchedProj.name_en;
            code = matchedProj.project_code || matchedProj.code || 'PROJ-ID';
          }
        } else if (req.entity_type === 'transaction' && Array.isArray(txRes)) {
          const matchedTx = txRes.find(t => t.id === req.entity_id);
          if (matchedTx) {
            name = lang === 'ar' 
              ? `سند مالي رقم ${matchedTx.transaction_number || matchedTx.id.slice(0, 8)}` 
              : `Voucher No ${matchedTx.transaction_number || matchedTx.id.slice(0, 8)}`;
            code = matchedTx.transaction_number || 'TX-ID';
          }
        } else if (req.entity_type === 'procurement_requisition' || req.approval_type === 'procurement') {
          const meta = typeof req.metadata === 'string' ? JSON.parse(req.metadata) : (req.metadata || {});
          const newVal = typeof req.new_value === 'string' ? JSON.parse(req.new_value) : (req.new_value || {});
          name = lang === 'ar' 
            ? `طلب شراء مواد: ${newVal?.name_ar || meta?.item_name_ar || 'مادة إغاثية'}` 
            : `Procurement Order: ${newVal?.name_en || meta?.item_name_en || 'Relief Item'}`;
          code = newVal?.sku || meta?.sku || `REQ-PROC-${req.id.slice(0, 6)}`;
        }

        // Normalize status to lowercase
        const status = (req.status || 'pending').toLowerCase() as any;

        return {
          ...req,
          status,
          requester_name: userMap.get(req.requester_id) || (lang === 'ar' ? 'منسق ميداني' : 'Field Officer'),
          entity_name: name || (lang === 'ar' ? 'جهة غير محددة' : 'Unknown Entity'),
          entity_code: code || 'CODE-N/A'
        };
      });

      // Add human-readable names to history
      const formattedHistory = (Array.isArray(histRes) ? histRes : []).map((hist: any) => ({
        ...hist,
        action: (hist.action || 'approved').toLowerCase() as any,
        approver_name: userMap.get(hist.approver_id) || (lang === 'ar' ? 'المشرف العام' : 'Executive Supervisor')
      }));

      // Incorporate local field financial & material disbursements into approval queue
      try {
        const savedDisb = localStorage.getItem('nexora_field_financial_disbursements');
        if (savedDisb) {
          const parsed = JSON.parse(savedDisb);
          parsed.forEach((disb: any) => {
            if (!formattedRequests.some(r => r.id === disb.id)) {
              formattedRequests.unshift({
                id: disb.id,
                entity_type: 'transaction',
                entity_id: disb.id,
                requester_id: 'usr-field',
                requester_name: disb.payeeName || (lang === 'ar' ? 'منسق ميداني' : 'Field Officer'),
                approval_type: 'financial_disbursement',
                status: 'pending',
                current_step_order: 1,
                entity_name: lang === 'ar' ? `صرف مالي للنشاط: ${disb.activityName}` : `Field Disbursement: ${disb.activityName}`,
                entity_code: disb.id,
                metadata: {
                  amount: disb.amount,
                  currency: disb.currency,
                  paymentType: disb.paymentType,
                  notes: disb.notes
                },
                created_at: disb.createdAt || new Date().toISOString()
              } as any);
            }
          });
        }
      } catch (err) {
        console.error(err);
      }

      setRequests(formattedRequests);
      setHistory(formattedHistory);
      setWorkflows(Array.isArray(wfRes) ? wfRes : []);
      setProjects(Array.isArray(projRes) ? projRes : []);
      setTransactions(Array.isArray(txRes) ? txRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setApprovalMatrix(Array.isArray(matrixRes) ? matrixRes : []);
      setApprovalThresholds(Array.isArray(thresholdsRes) ? thresholdsRes : []);
      setApprovalDelegations(Array.isArray(delegationsRes) ? delegationsRes : []);

      // Refresh selection if one exists
      if (selectedRequest) {
        const updatedReq = formattedRequests.find(r => r.id === selectedRequest.id);
        if (updatedReq) {
          setSelectedRequest(updatedReq);
          setHistoryForSelected(formattedHistory.filter(h => h.approval_request_id === updatedReq.id));
        }
      }
    } catch (err: any) {
      console.error("Error loading approval workflow records:", err);
      setErrorMessage(lang === 'ar' ? 'فشل تحميل بيانات نظام الموافقات والاعتمادات.' : 'Failed to retrieve approval workflow data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = enterpriseBus.subscribe('state-sync', () => {
      loadData();
    });
    return () => unsub();
  }, [lang]);

  // Handle row selection
  const handleSelectRequest = (req: ApprovalRequest) => {
    setSelectedRequest(req);
    setHistoryForSelected(history.filter(h => h.approval_request_id === req.id));
    setCommentText('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Perform Approval or Rejection
  const handleApprovalAction = async (action: 'approved' | 'rejected' | 'cancelled') => {
    if (!selectedRequest) return;
    setActionSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const organization_id = selectedRequest.organization_id || '00000000-0000-0000-0000-000000000001';
      
      // 1. Write Audit entry in approval_history (lowercase action)
      const historyPayload = {
        id: crypto.randomUUID(),
        organization_id,
        approval_request_id: selectedRequest.id,
        action,
        approver_id: currentUser.id,
        approver_role: currentUser.role,
        comments: commentText || (action === 'approved' ? 'Approved through central ERP matrix' : 'Rejected under organizational policy'),
        attachment_url: null,
        created_at: new Date().toISOString()
      };

      const historySave = await fetch('/api/tables/approval_history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyPayload)
      });

      if (!historySave.ok) throw new Error("Could not record approval history trail.");

      // 2. Update Request status (lowercase status)
      const updatedRequestPayload = {
        status: action,
        notes: commentText ? `${selectedRequest.notes || ''}\n[Update: ${commentText}]` : selectedRequest.notes
      };

      const reqUpdate = await fetch(`/api/tables/approval_requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRequestPayload)
      });

      if (!reqUpdate.ok) throw new Error("Could not update approval request status.");

      // 3. Enforce target table status updates (Governance!)
      if (selectedRequest.entity_type === 'project') {
        const projectStatusCode = action === 'approved' ? 'active' : action === 'rejected' ? 'rejected' : 'pending_approval';
        
        const projectUpdatePayload = {
          status_code: projectStatusCode,
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
          approval_stage: action === 'approved' ? 'Board Approved' : 'Rejected',
          approval_stage_date: new Date().toISOString()
        };

        const projUpdate = await fetch(`/api/tables/projects/${selectedRequest.entity_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectUpdatePayload)
        });

        if (!projUpdate.ok) {
          // Silent fallback - table schema will handle gracefully
        }
      } else if (selectedRequest.entity_type === 'transaction') {
        const txStatusCode = action === 'approved' ? 'posted' : action === 'rejected' ? 'rejected' : 'pending';
        const transactionUpdatePayload = {
          status_code: txStatusCode,
          posted_by: currentUser.id,
          approval_level: action === 'approved' ? 2 : 0
        };

        const txUpdate = await fetch(`/api/tables/transactions/${selectedRequest.entity_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionUpdatePayload)
        });

        if (!txUpdate.ok) {
          // Silent fallback
        }
      } else if (selectedRequest.entity_type === 'material_issue_request') {
        if (action === 'approved') {
          try {
            const newVal = typeof selectedRequest.new_value === 'string' ? JSON.parse(selectedRequest.new_value) : (selectedRequest.new_value || {});
            const itemId = newVal.item_id || selectedRequest.entity_id;
            const requestedQty = Number(newVal.requested_qty) || 0;

            const itemRes = await fetch(`/api/tables/inventory_items/${itemId}`);
            if (itemRes.ok) {
              const itemObj = await itemRes.json();
              const updatedQty = Math.max(0, (itemObj.qty || 0) - requestedQty);

              await fetch(`/api/tables/inventory_items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qty: updatedQty })
              });

              // Log transaction
              await fetch(`/api/tables/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: crypto.randomUUID(),
                  organization_id: '00000000-0000-0000-0000-000000000001',
                  type: 'DISBURSE',
                  entity_id: itemId,
                  quantity: requestedQty,
                  notes: `صرف مادة لمشروع ${newVal.project_name_ar || ''} (WBS: ${newVal.wbs_activity_name || ''})`,
                  created_at: new Date().toISOString()
                })
              });

              // Reorder point check: if updated stock drops <= reorder level, create Draft PO
              if (updatedQty <= (itemObj.reorder_level || 0)) {
                const suggestedOrderQty = Math.max(((itemObj.reorder_level || 100) * 2) - updatedQty, itemObj.reorder_level || 100);
                const unitCostYer = itemObj.unit_value_yer || 25000;
                await fetch('/api/tables/approval_requests', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: crypto.randomUUID(),
                    organization_id: '00000000-0000-0000-0000-000000000001',
                    requester_id: currentUser.id,
                    approval_type: 'procurement',
                    entity_type: 'procurement_requisition',
                    entity_id: itemId,
                    field_name: 'reorder_point_trigger',
                    old_value: { qty: updatedQty, reorder_level: itemObj.reorder_level },
                    new_value: {
                      item_id: itemId,
                      sku: itemObj.sku,
                      name_ar: itemObj.name_ar,
                      name_en: itemObj.name_en,
                      current_qty: updatedQty,
                      reorder_level: itemObj.reorder_level,
                      suggested_order_qty: suggestedOrderQty,
                      unit_value_yer: unitCostYer,
                      estimated_cost_yer: Math.round(suggestedOrderQty * unitCostYer)
                    },
                    requested_at: new Date().toISOString(),
                    status: 'pending',
                    priority_code: updatedQty === 0 ? 'urgent' : 'high',
                    notes: `[Reorder Point Auto PO] تم صرف شحنة للمشروع مما خفض رصيد المادة (${itemObj.name_ar}) إلى ${updatedQty} ${itemObj.unit_ar || 'وحدة'} (حد الخطر: ${itemObj.reorder_level}). تم توليد مسودة طلب شراء آلي موازية للتزويد!`,
                    metadata: { source: 'DISBURSEMENT_REORDER_ENGINE', auto_generated: true },
                    created_at: new Date().toISOString()
                  })
                });
              }
            }
          } catch (e) {
            console.error("Error executing material disburse update:", e);
          }
        }
      }

      setSuccessMessage(
        action === 'approved' 
          ? (lang === 'ar' ? 'تم اعتماد الطلب وتحديث السجلات المرتبطة بنجاح!' : 'Request approved and target record updated successfully!')
          : (lang === 'ar' ? 'تم رفض الطلب وتسجيله بالدفاتر المرفوضة.' : 'Request rejected and logged accordingly.')
      );

      // Reload UI
      await loadData();
      onRefresh(); // Refresh parent stats
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || (lang === 'ar' ? 'خطأ أثناء تنفيذ المعاملة المالية.' : 'Error executing ledger governance workflow.'));
    } finally {
      setActionSubmitting(false);
    }
  };

  // Submit a brand new Request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) {
      setErrorMessage(lang === 'ar' ? 'يرجى تحديد المشروع أو المستند المراد رفعه للاعتماد.' : 'Please select an active project or financial document.');
      return;
    }

    setFormSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const organization_id = '00000000-0000-0000-0000-000000000001';
      const requestId = crypto.randomUUID();

      // Determine Workflow Type
      const wName = newRequestType === 'project' ? 'Project Approval' : 'Expense Approval';
      const matchedWf = workflows.find(w => w.name === wName);
      
      const payload: Partial<ApprovalRequest> = {
        id: requestId,
        organization_id,
        requester_id: currentUser.id,
        approval_type: newRequestType === 'project' ? 'project_approval' : 'financial_transaction',
        entity_type: newRequestType,
        entity_id: selectedEntityId,
        field_name: 'status_code',
        old_value: { status_code: 'pending_approval' },
        new_value: { status_code: 'active' },
        requested_at: new Date().toISOString(),
        status: 'pending', // lowercase pending
        priority_code: requestPriority,
        notes: requestNotes,
        metadata: {
          submitted_by_role: currentUser.role,
          workflow_definition_id: matchedWf?.id || null
        },
        created_at: new Date().toISOString()
      };

      const res = await fetch('/api/tables/approval_requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Could not draft the approval request in DB.");

      // Also set the entity's stage/status to pending approval if we can
      if (newRequestType === 'project') {
        await fetch(`/api/tables/projects/${selectedEntityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status_code: 'pending_approval',
            approval_stage: 'Technical Review',
            approval_stage_date: new Date().toISOString()
          })
        });
      }

      setSuccessMessage(lang === 'ar' ? 'تم رفع طلب الاعتماد والتدقيق بنجاح لسلسلة الرقابة.' : 'Approval request successfully submitted to the ERP workflow hierarchy.');
      setIsNewRequestOpen(false);
      setSelectedEntityId('');
      setRequestNotes('');

      await loadData();
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Create new delegation in DB
  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateId) {
      setErrorMessage(lang === 'ar' ? 'الرجاء اختيار الموظف المفوض.' : 'Please select a delegate.');
      return;
    }
    if (!delegationStartDate || !delegationEndDate) {
      setErrorMessage(lang === 'ar' ? 'الرجاء تحديد التواريخ.' : 'Please select start and end dates.');
      return;
    }

    setFormSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        organization_id: '00000000-0000-0000-0000-000000000001',
        delegator_id: currentUser.id,
        delegate_id: delegateId,
        entity_types: [delegationEntityTypes],
        max_amount: parseFloat(delegationMaxAmount) || 500000,
        max_amount_base: parseFloat(delegationMaxAmount) || 500000,
        currency_code: 'YER',
        start_date: delegationStartDate,
        end_date: delegationEndDate,
        reason: delegationReason,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const res = await fetch('/api/tables/approval_delegations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Could not save the delegation record in DB.");

      setSuccessMessage(lang === 'ar' ? 'تم إصدار وثيقة تفويض الصلاحيات المالية وتعميدها بالملف التنظيمي.' : 'Financial authority delegation issued and locked in the registry.');
      setIsNewDelegationOpen(false);
      
      // Reset form
      setDelegateId('');
      setDelegationReason('');
      setDelegationStartDate('');
      setDelegationEndDate('');

      await loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Revoke delegation in DB
  const handleRevokeDelegation = async (id: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/tables/approval_delegations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: currentUser.id
        })
      });

      if (!res.ok) throw new Error("Could not revoke the delegation.");

      setSuccessMessage(lang === 'ar' ? 'تم إلغاء التفويض بنجاح وتجريد الموظف من الصلاحيات المؤقتة.' : 'Delegation successfully revoked and temporary authority stripped.');
      await loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    }
  };

  // Print audit report
  const handlePrintReport = () => {
    window.print();
  };

  const renderMatrixView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
        {/* Left: Matrix List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-amber-600" />
              <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                <h3 className="text-sm font-black text-slate-900">
                  {lang === 'ar' ? 'مصفوفة الاعتماد الفني والبرامجي' : 'Technical Approval Matrix'}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold">
                  {lang === 'ar' ? 'سلسلة المعنيين بالاعتماد حسب تصنيفات الموازنات والمشاريع.' : 'Designated sequence of authority per programmatic deployments.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {approvalMatrix.map((mat) => (
                <div key={mat.id} className="bg-slate-50 border border-zinc-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-extrabold px-1.5 py-0.5 rounded-md font-mono uppercase tracking-wider block w-fit mb-1">
                        {mat.matrix_code}
                      </span>
                      <h4 className="text-xs font-black text-slate-800">
                        {lang === 'ar' ? mat.name_ar : mat.matrix_code}
                      </h4>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2 py-0.5 rounded-full">
                      {lang === 'ar' ? 'نشط ومطابق' : 'Active & Enforced'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold bg-white p-2 rounded-lg border border-slate-100">
                    <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                      <span>{lang === 'ar' ? 'نوع المعاملة:' : 'Entity Type:'}</span>{' '}
                      <span className="text-slate-700 font-extrabold capitalize">{mat.entity_type}</span>
                    </div>
                    <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                      <span>{lang === 'ar' ? 'النطاق المالي:' : 'Financial Range:'}</span>{' '}
                      <span className="text-slate-700 font-extrabold font-mono">
                        {parseFloat(mat.min_amount).toLocaleString()} - {parseFloat(mat.max_amount).toLocaleString()} YER
                      </span>
                    </div>
                  </div>

                  <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold block mb-1">
                      {lang === 'ar' ? 'مسار وسلسلة الموقعين المعتمدين:' : 'Required Signatory Sequence:'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Array.isArray(mat.required_approvers) ? (
                        mat.required_approvers.map((role: string, idx: number) => (
                          <React.Fragment key={idx}>
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-black px-2 py-1 rounded-lg">
                              {role === 'Program Director' && (lang === 'ar' ? 'مدير البرامج PMO' : 'Program Director')}
                              {role === 'Financial Manager' && (lang === 'ar' ? 'مدير الشؤون المالية' : 'Financial Manager')}
                              {role === 'Executive Board' && (lang === 'ar' ? 'المجلس التنفيذي الأعلى' : 'Executive Board')}
                              {role !== 'Program Director' && role !== 'Financial Manager' && role !== 'Executive Board' && role}
                            </span>
                            {idx < mat.required_approvers.length - 1 && (
                              <span className="text-zinc-400 font-bold">?</span>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-bold">None</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Threshold Limits */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Coins className="w-5 h-5 text-amber-600" />
              <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                <h3 className="text-sm font-black text-slate-900">
                  {lang === 'ar' ? 'الحدود المالية ومستويات الصلاحيات' : 'Financial Approval Thresholds'}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold">
                  {lang === 'ar' ? 'الحد الأقصى للصلاحيات الفردية قبل الحاجة لتدخل وتدقيق المستوى الأعلى.' : 'Maximum transactional limits before triggering advanced hierarchy.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {approvalThresholds.map((thr) => (
                <div key={thr.id} className="bg-slate-50 border border-zinc-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold block uppercase tracking-wider">
                        {thr.threshold_type === 'single_transaction' 
                          ? (lang === 'ar' ? 'عملية منفردة' : 'Single Transaction Limit') 
                          : (lang === 'ar' ? 'الحد الشهري التراكمي' : 'Monthly Cumulative Limit')}
                      </span>
                      <span className="text-base font-black text-slate-900 font-mono">
                        {parseFloat(thr.max_amount || '0').toLocaleString()}{' '}
                        <span className="text-xs font-extrabold text-slate-500">{thr.currency_code}</span>
                      </span>
                    </div>
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {lang === 'ar' ? 'مفعل وجاهز' : 'Enforced'}
                    </span>
                  </div>

                  <div className="border-t border-slate-200/50 pt-2 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-zinc-400 block mb-0.5">{lang === 'ar' ? 'توقيع مدير الشؤون' : 'Manager Audit'}</span>
                      <span className={thr.approval_required_manager ? 'text-emerald-600 font-black' : 'text-zinc-400'}>
                        {thr.approval_required_manager ? (lang === 'ar' ? 'مطلوب ✓' : 'Required') : (lang === 'ar' ? 'اختياري ✗' : 'Optional')}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-zinc-400 block mb-0.5">{lang === 'ar' ? 'تدقيق الحسابات' : 'Finance Audit'}</span>
                      <span className={thr.approval_required_finance ? 'text-emerald-600 font-black' : 'text-zinc-400'}>
                        {thr.approval_required_finance ? (lang === 'ar' ? 'مطلوب ✓' : 'Required') : (lang === 'ar' ? 'اختياري ✗' : 'Optional')}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-zinc-400 block mb-0.5">{lang === 'ar' ? 'اعتماد المجلس' : 'Board Veto'}</span>
                      <span className={thr.approval_required_board ? 'text-emerald-600 font-black' : 'text-zinc-400'}>
                        {thr.approval_required_board ? (lang === 'ar' ? 'مطلوب ✓' : 'Required') : (lang === 'ar' ? 'اختياري ✗' : 'Optional')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDelegationView = () => {
    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u.name));

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                <h3 className="text-sm font-black text-slate-900">
                  {lang === 'ar' ? 'تفويض الصلاحيات المالية والرقابية' : 'Financial Authority Delegations'}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold">
                  {lang === 'ar' ? 'سجلات تفويض السلطات التنظيمية والمالية للموظفين لضمان استمرارية العمل.' : 'Authorize temporary financial keys to field and programmatic staff.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsNewDelegationOpen(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-600/15"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إصدار تفويض مالي جديد' : 'Issue New Delegation'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {approvalDelegations.length === 0 ? (
              <div className="text-center p-8 text-zinc-400 text-xs font-bold">
                {lang === 'ar' ? 'لا توجد أي تفويضات مالية نشطة حالياً.' : 'No active delegations found.'}
              </div>
            ) : (
              approvalDelegations.map((del) => {
                const delegatorName = userMap.get(del.delegator_id) || (lang === 'ar' ? 'المدير التنفيذي' : 'Executive Director');
                const delegateName = userMap.get(del.delegate_id) || (lang === 'ar' ? 'الموظف المفوض' : 'Delegate Staff');

                return (
                  <div key={del.id} className="bg-slate-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-800">
                            {lang === 'ar' ? `تفويض من: ${delegatorName}` : `Delegated by: ${delegatorName}`}
                          </span>
                          <span className="text-zinc-400 text-[10px]">?</span>
                          <span className="text-xs font-black text-amber-600">
                            {lang === 'ar' ? `إلى الموظف: ${delegateName}` : `To: ${delegateName}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold max-w-2xl leading-relaxed">
                          <strong>{lang === 'ar' ? 'بواسطة المندوب: ' : 'Justification: '}</strong>
                          {del.reason}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          del.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-100 text-zinc-400 border-slate-200'
                        }`}>
                          {del.is_active ? (lang === 'ar' ? 'نشط وساري' : 'Active') : (lang === 'ar' ? 'ملغي ومسحوب' : 'Revoked')}
                        </span>

                        {del.is_active && (
                          <button
                            onClick={() => handleRevokeDelegation(del.id)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all cursor-pointer"
                            title={lang === 'ar' ? 'إلغاء وسحب الصلاحية فورا' : 'Revoke instantly'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] text-slate-500 font-bold bg-white p-3 rounded-lg border border-slate-100">
                      <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                        <span className="text-zinc-400 block mb-0.5">{lang === 'ar' ? 'سقف المبلغ المالي المسموح:' : 'Max Amount Limit:'}</span>
                        <span className="text-slate-800 font-black font-mono">
                          {parseFloat(del.max_amount || '0').toLocaleString()} {del.currency_code}
                        </span>
                      </div>
                      <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                        <span className="text-zinc-400 block mb-0.5">{lang === 'ar' ? 'الصلاحية على الكيانات:' : 'Target Entities:'}</span>
                        <span className="text-slate-800 font-black capitalize flex items-center gap-1">
                          <CheckSquare className="w-3 h-3 text-amber-500" />
                          {Array.isArray(del.entity_types) ? del.entity_types.join(', ') : 'project'}
                        </span>
                      </div>
                      <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                        <span className="text-zinc-400 block mb-0.5">{lang === 'ar' ? 'الفترة الزمنية السارية:' : 'Effective Duration:'}</span>
                        <span className="text-slate-800 font-black font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          {new Date(del.start_date).toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US')} - {new Date(del.end_date).toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.entity_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesType = typeFilter === 'all' || req.entity_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const getWorkflowSteps = (req: ApprovalRequest, histList: ApprovalHistory[]) => {
    const isApproved = req.status === 'approved';
    const isRejected = req.status === 'rejected';
    const isPending = req.status === 'pending';

    if (req.entity_type === 'project') {
      const hasPmoAction = histList.some(h => h.approver_role === 'PROG_MGR' || h.approver_role === 'Programs & Projects Manager');
      const hasFinanceAction = histList.some(h => h.approver_role === 'Financial Manager');

      let step1Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'completed';
      let step2Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';
      let step3Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';
      let step4Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';

      let bottleneckStep = 0;

      if (isApproved) {
        step2Status = 'completed';
        step3Status = 'completed';
        step4Status = 'completed';
      } else if (isRejected) {
        const lastReject = [...histList].reverse().find(h => h.action === 'rejected');
        const rejectRole = lastReject?.approver_role;
        
        step2Status = 'completed';
        step3Status = 'completed';
        
        if (rejectRole === 'PROG_MGR' || rejectRole === 'Programs & Projects Manager') {
          step2Status = 'rejected';
          step3Status = 'upcoming';
          step4Status = 'upcoming';
        } else if (rejectRole === 'Financial Manager') {
          step3Status = 'rejected';
          step4Status = 'upcoming';
        } else {
          step4Status = 'rejected';
        }
      } else if (isPending) {
        if (!hasPmoAction) {
          step2Status = 'pending';
          bottleneckStep = 2;
        } else if (!hasFinanceAction) {
          step2Status = 'completed';
          step3Status = 'pending';
          bottleneckStep = 3;
        } else {
          step2Status = 'completed';
          step3Status = 'completed';
          step4Status = 'pending';
          bottleneckStep = 4;
        }
      }

      return [
        {
          id: 1,
          name_ar: 'التقديم وتدقيق الملفات',
          name_en: 'Initiation & Validation',
          role_ar: 'منسق المشروع / أخصائي ميداني',
          role_en: 'Field Operations Officer',
          status: step1Status,
          actor: req.requester_name || 'Basem Al-Mikhlafi',
          date: req.created_at,
          isBottleneck: false,
          desc_ar: 'تم إعداد ورفع ملفات المشروع بنجاح إلى المنصة.',
          desc_en: 'Project documents compiled and submitted to governance.',
        },
        {
          id: 2,
          name_ar: 'المراجعة الفنية (PMO)',
          name_en: 'PMO Technical Review',
          role_ar: 'مدير البرامج والمشاريع',
          role_en: 'Programs & Projects Manager',
          status: step2Status,
          actor: histList.find(h => h.approver_role === 'PROG_MGR' || h.approver_role === 'Programs & Projects Manager')?.approver_name || (step2Status === 'pending' ? 'Eng. Tareq Al-Wasabi' : ''),
          date: histList.find(h => h.approver_role === 'PROG_MGR' || h.approver_role === 'Programs & Projects Manager')?.created_at,
          isBottleneck: bottleneckStep === 2,
          desc_ar: step2Status === 'pending' 
            ? 'معلقة بانتظار التحقق من خطة العمل والملاءمة الإستراتيجية للأهداف.' 
            : step2Status === 'completed' ? 'تمت مراجعة خطة العمل الفنية والتصديق عليها.' : 'تم رفض الخطة لعدم مطابقة الشروط الفنية.',
          desc_en: step2Status === 'pending'
            ? 'Awaiting scope of work (WBS) and alignment validations.'
            : step2Status === 'completed' ? 'Technical framework verified and signed off.' : 'Rejected due to misalignment with standards.',
        },
        {
          id: 3,
          name_ar: 'التدقيق المالي والموازنة',
          name_en: 'Financial Compliance Audit',
          role_ar: 'مدير الشؤون المالية',
          role_en: 'Financial Manager',
          status: step3Status,
          actor: histList.find(h => h.approver_role === 'Financial Manager')?.approver_name || (step3Status === 'pending' ? 'Dr. Abdulkarim Al-Hamdani' : ''),
          date: histList.find(h => h.approver_role === 'Financial Manager')?.created_at,
          isBottleneck: bottleneckStep === 3,
          desc_ar: step3Status === 'pending'
            ? 'تحت التدقيق المالي لمطابقة بنود الصرف وموازنة الجهات المانحة.'
            : step3Status === 'completed' ? 'تمت مطابقة الموازنة وتوافر السيولة المالية.' : 'تم رفض الموازنة لوجود عجز أو أخطاء حسابية.',
          desc_en: step3Status === 'pending'
            ? 'Awaiting budget matching and donor allocation audit.'
            : step3Status === 'completed' ? 'Allocation audited and funds confirmed.' : 'Budget audited and flagged for deficit or mismatch.',
        },
        {
          id: 4,
          name_ar: 'الاعتماد التنفيذي النهائي',
          name_en: 'Board Executive Sign-off',
          role_ar: 'المدير التنفيذي / مجلس الأمناء',
          role_en: 'Executive Director / Board',
          status: step4Status,
          actor: isApproved ? 'Executive Board' : (step4Status === 'pending' ? 'Dr. Abdulkarim Al-Hamdani' : ''),
          date: isApproved ? req.requested_at : undefined,
          isBottleneck: bottleneckStep === 4,
          desc_ar: step4Status === 'pending'
            ? 'بانتظار المصادقة والتوقيع النهائي من الإدارة العليا لتفعيل العمل الميداني.'
            : step4Status === 'completed' ? 'تم توقيع واعتماد المشروع بالكامل بالترخيص الرقمي.' : 'تم رفض المشروع بقرار إداري علوي.',
          desc_en: step4Status === 'pending'
            ? 'Awaiting final supreme executive approval to trigger field rollout.'
            : step4Status === 'completed' ? 'Authorized and cryptographically locked.' : 'Aborted by executive board directive.',
        }
      ];
    } else if (req.entity_type === 'procurement_requisition' || req.approval_type === 'procurement') {
      const hasProcurementAction = histList.some(h => h.approver_role === 'LOGISTICS_MGR' || h.approver_role === 'Procurement Officer' || h.approver_role === 'Logistics Manager');
      const hasFinanceAction = histList.some(h => h.approver_role === 'Financial Manager');

      let step1Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'completed';
      let step2Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';
      let step3Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';
      let step4Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';

      let bottleneckStep = 0;

      if (isApproved) {
        step2Status = 'completed';
        step3Status = 'completed';
        step4Status = 'completed';
      } else if (isRejected) {
        step2Status = 'completed';
        step3Status = 'completed';
        step4Status = 'rejected';
      } else if (isPending) {
        if (!hasProcurementAction) {
          step2Status = 'pending';
          bottleneckStep = 2;
        } else if (!hasFinanceAction) {
          step2Status = 'completed';
          step3Status = 'pending';
          bottleneckStep = 3;
        } else {
          step2Status = 'completed';
          step3Status = 'completed';
          step4Status = 'pending';
          bottleneckStep = 4;
        }
      }

      return [
        {
          id: 1,
          name_ar: 'توليد مسودة طلب الشراء التلقائي',
          name_en: 'Reorder Point Auto-Trigger',
          role_ar: 'محرك المخزون والمشتريات الآلي',
          role_en: 'Inventory Reorder Engine',
          status: step1Status,
          actor: req.requester_name || 'System Reorder Engine',
          date: req.created_at,
          isBottleneck: false,
          desc_ar: 'تم رصد انخفاض مخزون المادة عن الحد الأدنى وتوليد مسودة طلب الشراء تلقائياً.',
          desc_en: 'Item dropped below reorder threshold; procurement draft requisition generated.',
        },
        {
          id: 2,
          name_ar: 'تدقيق قسم المشتريات واللوجستيات',
          name_en: 'Procurement & Logistics Audit',
          role_ar: 'مسؤول المشتريات وسلاسل الإمداد',
          role_en: 'Procurement Officer',
          status: step2Status,
          actor: histList.find(h => h.approver_role === 'Procurement Officer' || h.approver_role === 'LOGISTICS_MGR')?.approver_name || (step2Status === 'pending' ? 'أخصائي المشتريات والتوريد' : ''),
          date: histList.find(h => h.approver_role === 'Procurement Officer' || h.approver_role === 'LOGISTICS_MGR')?.created_at,
          isBottleneck: bottleneckStep === 2,
          desc_ar: step2Status === 'pending'
            ? 'بانتظار مراجعة الكميات المقترحة، عروض الأسعار والموردين المعتمدين.'
            : step2Status === 'completed' ? 'تمت مراجعة المواصفات الفنية وعروض الأسعار مع الموردين.' : 'تم رفض طلب الشراء لعدم الحاجة أو تعديل الكميات.',
          desc_en: step2Status === 'pending'
            ? 'Awaiting procurement validation of quantity, suppliers, and specifications.'
            : step2Status === 'completed' ? 'Procurement specs verified with qualified suppliers.' : 'Rejected by procurement unit.',
        },
        {
          id: 3,
          name_ar: 'التدقيق المالي والاعتماد المحاسبي',
          name_en: 'Finance Compliance & Budget Check',
          role_ar: 'مدير الشؤون المالية',
          role_en: 'Financial Manager',
          status: step3Status,
          actor: histList.find(h => h.approver_role === 'Financial Manager')?.approver_name || (step3Status === 'pending' ? 'Dr. Abdulkarim Al-Hamdani' : ''),
          date: histList.find(h => h.approver_role === 'Financial Manager')?.created_at,
          isBottleneck: bottleneckStep === 3,
          desc_ar: step3Status === 'pending'
            ? 'تحت المراجعة والتدقيق المالي لتأكيد التغطية الموازنية لحساب التوريد.'
            : step3Status === 'completed' ? 'تم تأكيد التغطية المالية وحجز موازنة التوريد.' : 'مرفوض مالياً لعدم توفر الموازنة.',
          desc_en: step3Status === 'pending'
            ? 'Awaiting financial budget validation and allocation verification.'
            : step3Status === 'completed' ? 'Budget confirmed and procurement encumbrance approved.' : 'Rejected due to budget limits.',
        },
        {
          id: 4,
          name_ar: 'الاعتماد النهائي وتصدير أمر الشراء (PO)',
          name_en: 'Executive PO Release',
          role_ar: 'المدير التنفيذي / مدير المشتريات',
          role_en: 'Executive Director',
          status: step4Status,
          actor: isApproved ? 'Executive Board' : (step4Status === 'pending' ? 'Dr. Abdulkarim Al-Hamdani' : ''),
          date: isApproved ? req.requested_at : undefined,
          isBottleneck: bottleneckStep === 4,
          desc_ar: step4Status === 'pending'
            ? 'بانتظار الاعتماد النهائي وتوقيع أمر الشراء (Purchase Order) للتوريد للمستودع.'
            : step4Status === 'completed' ? 'تم تعميد أمر الشراء (PO) وتصديره للمورد للتوريد.' : 'تم رفض أمر الشراء.',
          desc_en: step4Status === 'pending'
            ? 'Awaiting final executive approval to sign and dispatch official PO.'
            : step4Status === 'completed' ? 'PO officially signed and dispatched to supplier.' : 'PO request rejected.',
        }
      ];
    } else if (req.entity_type === 'material_issue_request' || req.approval_type === 'material_issue') {
      const hasProjectAction = histList.some(h => h.approver_role === 'PROJECT_MGR' || h.approver_role === 'Project Manager');
      const hasFinanceAction = histList.some(h => h.approver_role === 'Financial Manager');

      let step1Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'completed';
      let step2Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';
      let step3Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';
      let step4Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';

      let bottleneckStep = 0;

      if (isApproved) {
        step2Status = 'completed';
        step3Status = 'completed';
        step4Status = 'completed';
      } else if (isRejected) {
        step2Status = 'completed';
        step3Status = 'completed';
        step4Status = 'rejected';
      } else if (isPending) {
        if (!hasProjectAction) {
          step2Status = 'pending';
          bottleneckStep = 2;
        } else if (!hasFinanceAction) {
          step2Status = 'completed';
          step3Status = 'pending';
          bottleneckStep = 3;
        } else {
          step2Status = 'completed';
          step3Status = 'completed';
          step4Status = 'pending';
          bottleneckStep = 4;
        }
      }

      return [
        {
          id: 1,
          name_ar: 'إنشاء طلب صرف المادة ومطابقة WBS',
          name_en: 'Material Issue Request & WBS Mapping',
          role_ar: 'منسق المشروع / أخصائي اللوجستيات',
          role_en: 'Project Officer / Logistics Specialist',
          status: step1Status,
          actor: req.requester_name || 'Project Coordinator',
          date: req.created_at,
          isBottleneck: false,
          desc_ar: 'تم تقديم طلب الصرف وتحديد نشاط خطة المشروع (WBS Activity) والكميات المطلوبة.',
          desc_en: 'Issue request submitted with WBS activity link and requested quantities.',
        },
        {
          id: 2,
          name_ar: 'فحص ميزانية وصلاحيات المشروع',
          name_en: 'Project Budget & Authority Audit',
          role_ar: 'مدير المشروع الميداني',
          role_en: 'Project Manager',
          status: step2Status,
          actor: histList.find(h => h.approver_role === 'Project Manager')?.approver_name || (step2Status === 'pending' ? 'مدير المشروع' : ''),
          date: histList.find(h => h.approver_role === 'Project Manager')?.created_at,
          isBottleneck: bottleneckStep === 2,
          desc_ar: step2Status === 'pending'
            ? 'بانتظار التحقق من مطابقة الصرف لخطة WBS والسقف المالي للنشاط.'
            : step2Status === 'completed' ? 'تمت مراجعة مطابقة الصرف وموافقة مدير المشروع.' : 'مرفوض لعدم التطابق مع خطة WBS.',
          desc_en: step2Status === 'pending'
            ? 'Awaiting project manager audit against activity WBS budget.'
            : step2Status === 'completed' ? 'WBS activity & project budget authority verified.' : 'Rejected by Project Manager.',
        },
        {
          id: 3,
          name_ar: 'التدقيق المالي وحجز الميزانية',
          name_en: 'Financial Clearance & Ledger Posting',
          role_ar: 'المدير المالي والامتثال المحاسبي',
          role_en: 'Financial Manager',
          status: step3Status,
          actor: histList.find(h => h.approver_role === 'Financial Manager')?.approver_name || (step3Status === 'pending' ? 'د. عبدالكريم الحمداني' : ''),
          date: histList.find(h => h.approver_role === 'Financial Manager')?.created_at,
          isBottleneck: bottleneckStep === 3,
          desc_ar: step3Status === 'pending'
            ? 'تحت التدقيق المالي للتأكد من رصيد الميزانية الشاغر وترحيل التكلفة لحساب المشروع.'
            : step3Status === 'completed' ? 'تم تأكيد التغطية المالية وترحيل تكلفة الصرف لدفتر الاستاد.' : 'مرفوض لتجاوز السقف المالي للمشروع.',
          desc_en: step3Status === 'pending'
            ? 'Awaiting financial clearance and budget encumbrance audit.'
            : step3Status === 'completed' ? 'Financial budget clearance granted and cost allocated.' : 'Rejected due to budget limits.',
        },
        {
          id: 4,
          name_ar: 'اعتماد إذن الصرف وتحديث المخزون',
          name_en: 'Final Disburse Sign-off & Dispatched',
          role_ar: 'أمين المستودع المركزي / مدير اللوجستيات',
          role_en: 'Logistics Manager / Storekeeper',
          status: step4Status,
          actor: isApproved ? 'Storekeeper & Logistics' : (step4Status === 'pending' ? 'أمين مستودع مأرب' : ''),
          date: isApproved ? req.requested_at : undefined,
          isBottleneck: bottleneckStep === 4,
          desc_ar: step4Status === 'pending'
            ? 'بانتظار الاعتماد النهائي وتجهيز شحنة الصرف للمشروع وتقليل رصيد المخزون.'
            : step4Status === 'completed' ? 'تم تسليم الشحنة للمشروع وخصم الكمية وتفعيل تنبيه Reorder Point عند انخفاض الرصيد.' : 'تم إلغاء إذن الصرف.',
          desc_en: step4Status === 'pending'
            ? 'Awaiting storekeeper release to disburse stock and update inventory.'
            : step4Status === 'completed' ? 'Stock disbursed to project and reorder trigger evaluated.' : 'Disbursement request cancelled.',
        }
      ];
    } else {
      const hasAuditAction = histList.some(h => h.approver_role === 'Financial Manager');
      const hasAdminAction = histList.some(h => h.approver_role === 'Administrator');

      let step1Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'completed';
      let step2Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';
      let step3Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';
      let step4Status: 'completed' | 'pending' | 'upcoming' | 'rejected' = 'upcoming';

      let bottleneckStep = 0;

      if (isApproved) {
        step2Status = 'completed';
        step3Status = 'completed';
        step4Status = 'completed';
      } else if (isRejected) {
        const lastReject = [...histList].reverse().find(h => h.action === 'rejected');
        const rejectRole = lastReject?.approver_role;

        step2Status = 'completed';
        step3Status = 'completed';

        if (rejectRole === 'Financial Manager') {
          step2Status = 'rejected';
          step3Status = 'upcoming';
          step4Status = 'upcoming';
        } else if (rejectRole === 'Administrator') {
          step3Status = 'rejected';
          step4Status = 'upcoming';
        } else {
          step4Status = 'rejected';
        }
      } else if (isPending) {
        if (!hasAuditAction) {
          step2Status = 'pending';
          bottleneckStep = 2;
        } else if (!hasAdminAction) {
          step2Status = 'completed';
          step3Status = 'pending';
          bottleneckStep = 3;
        } else {
          step2Status = 'completed';
          step3Status = 'completed';
          step4Status = 'pending';
          bottleneckStep = 4;
        }
      }

      return [
        {
          id: 1,
          name_ar: 'إنشاء وتجهيز السند',
          name_en: 'Voucher Generation',
          role_ar: 'المحاسب الميداني / مدخل البيانات',
          role_en: 'Finance / Entry Staff',
          status: step1Status,
          actor: req.requester_name || 'Basem Al-Mikhlafi',
          date: req.created_at,
          isBottleneck: false,
          desc_ar: 'تم قيد وتسجيل تفاصيل السند المالي وتوجيهه لدفتر الحسابات المؤقت.',
          desc_en: 'Voucher transaction posted to temporary sub-ledger.',
        },
        {
          id: 2,
          name_ar: 'التدقيق والرقابة الداخلية',
          name_en: 'Internal Compliance Audit',
          role_ar: 'مدير الرقابة والمطابقة',
          role_en: 'Internal Auditor / Fin Manager',
          status: step2Status,
          actor: histList.find(h => h.approver_role === 'Financial Manager')?.approver_name || (step2Status === 'pending' ? 'Dr. Abdulkarim Al-Hamdani' : ''),
          date: histList.find(h => h.approver_role === 'Financial Manager')?.created_at,
          isBottleneck: bottleneckStep === 2,
          desc_ar: step2Status === 'pending'
            ? 'المعاملة قيد المراجعة والتحقق من المستندات الثبوتية والفواتير والاعتمادات المرفقة.'
            : step2Status === 'completed' ? 'تمت مطابقة الفواتير المرفقة وقانونية مستندات الصرف.' : 'تم رفض السند لعدم اكتمال الفواتير والمرفقات المطلوبة.',
          desc_en: step2Status === 'pending'
            ? 'Awaiting audit verification of receipts, ledger classifications, and vouchers.'
            : step2Status === 'completed' ? 'Audited with attached physical vouchers successfully.' : 'Disallowed due to lack of required documentation.',
        },
        {
          id: 3,
          name_ar: 'اعتماد وموافقة الصرف',
          name_en: 'Disbursement Sign-off',
          role_ar: 'المدير التنفيذي',
          role_en: 'Executive Director',
          status: step3Status,
          actor: histList.find(h => h.approver_role === 'Administrator')?.approver_name || (step3Status === 'pending' ? 'Dr. Abdulkarim Al-Hamdani' : ''),
          date: histList.find(h => h.approver_role === 'Administrator')?.created_at,
          isBottleneck: bottleneckStep === 3,
          desc_ar: step3Status === 'pending'
            ? 'معلقة بانتظار توقيع المدير التنفيذي لإطلاق الدفعة المالية المعتمدة.'
            : step3Status === 'completed' ? 'تم تعميد وتوقيع أمر الصرف المالي رقمياً.' : 'تم تجميد أو رفض الصرف المالي بقرار إدارة.',
          desc_en: step3Status === 'pending'
            ? 'Awaiting Executive Director signature to initiate the fund disbursement.'
            : step3Status === 'completed' ? 'Disbursement order signed and cryptographically validated.' : 'Frozen or rejected by executive decision.',
        },
        {
          id: 4,
          name_ar: 'الترحيل المصرفي الفعلي',
          name_en: 'Final Ledger Posting',
          role_ar: 'أمين الصندوق / قسم المدفوعات',
          role_en: 'Treasurer / Cashier',
          status: step4Status,
          actor: isApproved ? 'ERP Finance System' : '',
          date: isApproved ? req.requested_at : undefined,
          isBottleneck: bottleneckStep === 4,
          desc_ar: step4Status === 'pending'
            ? 'بانتظار الصرف الفعلي وترحيل المبالغ في الحسابات المصرفية المعتمدة للمؤسسة.'
            : step4Status === 'completed' ? 'تم ترحيل السند وإغلاق الدفاتر وحسم الموازنة.' : 'فشل الصرف أو تم إلغاؤه.',
          desc_en: step4Status === 'pending'
            ? 'Awaiting actual cash payout and ledger synchronization.'
            : step4Status === 'completed' ? 'Disbursed, posted to main ledger, and budget locked.' : 'Payment aborted or cancelled.',
        }
      ];
    }
  };

  return (
    <ErrorBoundary domainName="ApprovalWorkflowView" lang={lang || 'ar'}>
    <ModuleShell titleAr="نظام الموافقات والاعتمادات" titleEn="Workflows & Approvals OS" domainCode="NEB-10" icon={ShieldCheck} accent="indigo" lang={lang} onRefresh={onRefresh}>
    <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5.5 h-5.5 text-amber-600 shrink-0" />
            <span>{lang === 'ar' ? 'مركز الموافقات والاعتمادات الرسمية' : 'Approval & Authorization Center'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'ar' 
              ? 'متابعة واعتماد طلبات الصرف المالي والأنشطة الميدانية لضمان الدقة وسرعة الإنجاز.'
              : 'Review and approve financial disbursements and field activities with verified authority levels.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsNewRequestOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-600/15"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طلب موافقة جديد' : 'Submit for Approval'}</span>
          </button>
          
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            title={lang === 'ar' ? 'مرفوض' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">{lang === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{requests.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-amber-600 font-bold block uppercase tracking-wider">{lang === 'ar' ? 'قيد المراجعة والتدقيق' : 'Awaiting Review'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{pendingCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 font-bold block uppercase tracking-wider">{lang === 'ar' ? 'تم اعتمادها وترحيلها' : 'Approved & Posted'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{approvedCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-rose-600 font-bold block uppercase tracking-wider">{lang === 'ar' ? 'نمذجة تنبؤية' : 'Rejected Requests'}</span>
            <span className="text-lg font-black text-slate-900 font-mono">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Sub-tabs Selector */}
      <div className="flex border-b border-slate-200/80 gap-1 print:hidden">
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`px-4 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'requests'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{lang === 'ar' ? 'مندوب الاستلام والتسليم' : 'Approval & Audit Requests'}</span>
          <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`px-4 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{lang === 'ar' ? 'البريد الإلكتروني المؤسسي' : 'Governance & Limits Matrix'}</span>
          <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
            {approvalMatrix.length + approvalThresholds.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('delegations')}
          className={`px-4 py-3 text-xs font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'delegations'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{lang === 'ar' ? 'تفويض الصلاحيات المالية' : 'Authority Delegations'}</span>
          <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
            {approvalDelegations.length}
          </span>
        </button>
      </div>

      {activeSubTab === 'requests' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Filter and Requests List (8 Columns) */}
        <div className="lg:col-span-7 space-y-4 print:hidden">
          
          {/* Controls Box */}
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-2.5">
              
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" 
                        style={lang === 'en' ? { right: 'auto', left: '14px' } : {}} />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'بحث بكود المستند، الموظف، التفاصيل...' : 'Search by code, requester, description...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  style={lang === 'en' ? { paddingRight: '16px', paddingLeft: '40px' } : {}}
                />
              </div>

              {/* Status Tabs */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      statusFilter === tab 
                        ? 'bg-white text-zinc-950 shadow-sm font-extrabold' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'all' && (lang === 'ar' ? 'الكل' : 'All')}
                    {tab === 'pending' && (lang === 'ar' ? 'قيد المراجعة' : 'Pending')}
                    {tab === 'approved' && (lang === 'ar' ? 'معتمد' : 'Approved')}
                    {tab === 'rejected' && (lang === 'ar' ? 'مرفوض' : 'Rejected')}
                  </button>
                ))}
              </div>
            </div>

            {/* Entity type Filter */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400 font-bold text-[10px]">{lang === 'ar' ? 'تصفية حسب النوع:' : 'Filter Type:'}</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-[10.5px] font-bold rounded-lg px-2 py-1 text-slate-600 focus:outline-none"
              >
                <option value="all">{lang === 'ar' ? 'جميع التصنيفات' : 'All Types'}</option>
                <option value="project">{lang === 'ar' ? 'المشاريع الميدانية' : 'Field Projects'}</option>
                <option value="transaction">{lang === 'ar' ? 'سندات قيود الحسابات' : 'Voucher Transactions'}</option>
                <option value="procurement_requisition">{lang === 'ar' ? 'طلبات الشراء والمشتريات (Procurement)' : 'Procurement Requisitions'}</option>
              </select>
            </div>
          </div>

          {/* Requests Cards List */}
          {loading ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-bold">{lang === 'ar' ? 'جاري الاتصال والتحقق من التواقيع الرقمية...' : 'Synchronizing cryptographic signature keys...'}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-zinc-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
              <p className="text-xs font-bold">{lang === 'ar' ? 'لا توجد طلبات اعتماد مطابقة لمعايير البحث حالياً.' : 'No active approval items match your criteria currently.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(req => {
                const isSelected = selectedRequest?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => handleSelectRequest(req)}
                    className={`bg-white border rounded-xl p-4 transition-all cursor-pointer text-right hover:shadow-md ${
                      isSelected 
                        ? 'border-amber-500 shadow-md ring-1 ring-amber-500/20' 
                        : 'border-slate-200/80 hover:border-zinc-300'
                    }`}
                    style={lang === 'en' ? { textAlign: 'left' } : {}}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            req.entity_type === 'project' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {req.entity_type === 'project' 
                              ? (lang === 'ar' ? 'مشروع تنموي' : 'Field Project') 
                              : (lang === 'ar' ? 'قيد مالي' : 'Voucher Line')}
                          </span>

                          <span className="font-mono text-xs font-black text-slate-900">{req.entity_code}</span>
                          
                          {req.priority_code === 'urgent' && (
                            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[8px] px-1.5 py-0.5 rounded font-black uppercase animate-pulse">
                              {lang === 'ar' ? 'مدقق عادي' : 'Urgent'}
                            </span>
                          )}
                        </div>

                        <h3 className="font-black text-xs text-slate-800">{req.entity_name}</h3>
                        
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold font-mono">
                          <User className="w-3.5 h-3.5 text-zinc-300" />
                          <span>{req.requester_name}</span>
                          <span>?</span>
                          <span>{new Date(req.requested_at).toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US')}</span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl shrink-0 uppercase tracking-wider ${
                        req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        req.status === 'cancelled' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                      }`}>
                        {req.status === 'approved' && (lang === 'ar' ? 'مشروع تنموي' : 'Approved & Posted')}
                        {req.status === 'rejected' && (lang === 'ar' ? 'مرفوض' : 'Rejected')}
                        {req.status === 'cancelled' && (lang === 'ar' ? 'ملغي' : 'Cancelled')}
                        {req.status === 'pending' && (lang === 'ar' ? 'انتظار الموافقة' : 'Awaiting Audit')}
                      </span>
                    </div>

                    {req.notes && (
                      <p className="text-[10px] text-slate-500 mt-2 line-clamp-1 bg-slate-50 p-1.5 rounded border border-slate-100 font-semibold">
                        {req.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Detailed Approval / Timeline Panel (5 Columns) */}
        <div className="lg:col-span-5 space-y-4 print:col-span-12 text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
          {selectedRequest ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6 print:border-none print:p-0">
              
              {/* Detailed Header for print / screen */}
              <div className="border-b border-slate-100 pb-4 flex justify-between items-start gap-4">
                <div className="text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block">
                    {lang === 'ar' ? 'تفاصيل طلب الاعتماد والموافقة' : 'Approval Request Details'}
                  </span>
                  <h3 className="font-black text-sm text-slate-900 mt-1">
                    {selectedRequest.entity_name}
                  </h3>
                  <div className="flex gap-2 items-center text-[10px] text-slate-500 font-bold mt-1 justify-end"
                       style={lang === 'en' ? { justifyContent: 'flex-start' } : {}}>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-black">{selectedRequest.entity_code}</span>
                    <span>?</span>
                    <span>{lang === 'ar' ? `المقدم: ${selectedRequest.requester_name}` : `By: ${selectedRequest.requester_name}`}</span>
                  </div>
                </div>

                <button 
                  onClick={handlePrintReport}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-all cursor-pointer print:hidden shrink-0"
                  title={lang === 'ar' ? 'طباعة تقرير التدقيق المالي ومحضر التواقيع' : 'Print Audit Trail Report'}
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* Procurement Requisition Card (If Procurement Type) */}
              {(selectedRequest.entity_type === 'procurement_requisition' || selectedRequest.approval_type === 'procurement') && (() => {
                const newVal = typeof selectedRequest.new_value === 'string' ? JSON.parse(selectedRequest.new_value) : (selectedRequest.new_value || {});
                const meta = typeof selectedRequest.metadata === 'string' ? JSON.parse(selectedRequest.metadata) : (selectedRequest.metadata || {});
                
                const currentQty = newVal.current_qty ?? meta.current_qty ?? 0;
                const reorderLimit = newVal.reorder_level ?? meta.reorder_level ?? 0;
                const suggestedQty = newVal.suggested_order_qty ?? meta.suggested_order_qty ?? 0;
                const unitCostYer = newVal.unit_value_yer ?? 25000;
                const estimatedTotalYer = newVal.estimated_cost_yer ?? (suggestedQty * unitCostYer);
                const estimatedTotalUsd = Math.round(estimatedTotalYer / 1620);

                return (
                  <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-amber-500/20 pb-2">
                      <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تفاصيل طلب الشراء وإعادة التمويل (Procurement Requisition)' : 'Procurement Requisition Details'}</span>
                      </span>
                      <span className="bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {lang === 'ar' ? 'توليد آلي' : 'Auto Generated'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-amber-200/50">
                        <span className="text-zinc-400 text-[9px] block mb-0.5">{lang === 'ar' ? 'الرصيد المتبقي' : 'Available Stock'}</span>
                        <span className="text-rose-600 font-mono font-black">{currentQty.toLocaleString()}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-amber-200/50">
                        <span className="text-zinc-400 text-[9px] block mb-0.5">{lang === 'ar' ? 'حد إعادة الطلب' : 'Reorder Threshold'}</span>
                        <span className="text-slate-700 dark:text-zinc-300 font-mono font-black">{reorderLimit.toLocaleString()}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-amber-200/50">
                        <span className="text-zinc-400 text-[9px] block mb-0.5">{lang === 'ar' ? 'الكمية المطلوبة' : 'Order Qty'}</span>
                        <span className="text-amber-600 font-mono font-black">{suggestedQty.toLocaleString()}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-amber-200/50">
                        <span className="text-zinc-400 text-[9px] block mb-0.5">{lang === 'ar' ? 'التكلفة الإجمالية' : 'Total Estimated'}</span>
                        <span className="text-emerald-600 font-mono font-black text-[11px]">{estimatedTotalYer.toLocaleString()} YER</span>
                        <span className="text-[8px] text-zinc-400 block font-normal">(? ${estimatedTotalUsd.toLocaleString()} USD)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Material Issue Request Card (If Material Issue Type) */}
              {(selectedRequest.entity_type === 'material_issue_request' || selectedRequest.approval_type === 'material_issue') && (() => {
                const newVal = typeof selectedRequest.new_value === 'string' ? JSON.parse(selectedRequest.new_value) : (selectedRequest.new_value || {});
                const meta = typeof selectedRequest.metadata === 'string' ? JSON.parse(selectedRequest.metadata) : (selectedRequest.metadata || {});
                
                const projName = newVal.project_name_ar || meta.project_name_ar || 'المشروع الميداني';
                const projCode = newVal.project_code || meta.project_code || 'PRJ-2026';
                const wbsName = newVal.wbs_activity_name || meta.wbs_activity_name || 'نشاط WBS';
                const itemName = newVal.item_name_ar || meta.item_name_ar || 'المادة الإغاثية';
                const sku = newVal.sku || meta.sku || 'SKU';
                const requestedQty = newVal.requested_qty ?? meta.requested_qty ?? 0;
                const unitAr = newVal.unit_ar || 'وحدة';
                const totalCostYer = newVal.total_cost_yer ?? meta.total_cost_yer ?? 0;
                const totalCostUsd = Math.round(totalCostYer / 1620);
                const budgetStatus = newVal.budget_check_status || meta.budget_check_status || 'PASSED_WITHIN_BUDGET';
                const reorderTriggered = newVal.reorder_triggered || meta.reorder_triggered || false;

                return (
                  <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
                      <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                        <Box className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'طلب صرف مواد للمشروع (WBS Material Issue Request)' : 'Project Material Issue Voucher'}</span>
                      </span>
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {lang === 'ar' ? 'مربوط بـ WBS' : 'WBS Mapped'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-emerald-200/50 flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-zinc-400 font-bold block">{lang === 'ar' ? 'المشروع المستهدف:' : 'Target Project:'}</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{projName}</span>
                          <span className="font-mono text-[10px] text-emerald-600 font-bold block">{projCode}</span>
                        </div>
                        <div className="text-left dir-ltr">
                          <span className="text-[9px] text-zinc-400 font-bold block">{lang === 'ar' ? 'نشاط WBS:' : 'WBS Activity:'}</span>
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 text-[11px]">{wbsName}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                        <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-emerald-200/50">
                          <span className="text-zinc-400 text-[9px] block mb-0.5">{lang === 'ar' ? 'المادة المطلوبة' : 'Requested Item'}</span>
                          <span className="text-slate-900 dark:text-white font-black text-[11px] block truncate">{itemName}</span>
                          <span className="text-[9px] font-mono text-zinc-400">{sku}</span>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-emerald-200/50">
                          <span className="text-zinc-400 text-[9px] block mb-0.5">{lang === 'ar' ? 'الكمية المطلوبة' : 'Quantity'}</span>
                          <span className="text-purple-600 font-mono font-black text-sm">{requestedQty.toLocaleString()} {unitAr}</span>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-emerald-200/50">
                          <span className="text-zinc-400 text-[9px] block mb-0.5">{lang === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}</span>
                          <span className="text-emerald-600 font-mono font-black text-[11px]">{totalCostYer.toLocaleString()} YER</span>
                          <span className="text-[8px] text-zinc-400 block font-normal">(? ${totalCostUsd.toLocaleString()} USD)</span>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-emerald-200/50">
                          <span className="text-zinc-400 text-[9px] block mb-0.5">{lang === 'ar' ? 'مطابقة الميزانية' : 'Budget Compliance'}</span>
                          {budgetStatus === 'PASSED_WITHIN_BUDGET' ? (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                              ? {lang === 'ar' ? 'ضمن السقف' : 'In Budget'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded inline-block animate-pulse">
                              ?? {lang === 'ar' ? 'تجاوز السقف' : 'Over Budget'}
                            </span>
                          )}
                        </div>
                      </div>

                      {reorderTriggered && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            {lang === 'ar'
                              ? '⚡ تنبيه المحرك: صرف هذه الشحنة سينقص رصيد المخزون عن حد إعادة الطلب (Reorder Threshold). سيتم إنشاء مسودة طلب شراء آلي تلقائياً عند الاعتماد!'
                              : '? Reorder Engine: Disbursing this batch will trigger automated PO draft creation to replenish depot stock!'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Request Context values (Old vs New value) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-zinc-200 text-xs font-bold space-y-2">
                <h4 className="text-[10px] uppercase text-zinc-400 tracking-wider flex items-center gap-1 justify-end"
                    style={lang === 'en' ? { justifyContent: 'flex-start' } : {}}>
                  <Coins className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{lang === 'ar' ? 'التأثير الهيكلي وقواعد العمل' : 'Impact & Business Rules Checked'}</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-4 pt-1.5 text-center">
                  <div>
                    <span className="text-[9px] text-zinc-400 block">{lang === 'ar' ? 'الحالة الحالية' : 'Current Status'}</span>
                    <span className="text-slate-600 font-mono text-[10px] flex items-center gap-1 mt-0.5 justify-center">
                      <Lock className="w-3 h-3 text-zinc-400" />
                      {selectedRequest.status === 'pending' ? (lang === 'ar' ? 'قيد المراجعة' : 'Pending Audit') : selectedRequest.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-400 block">{lang === 'ar' ? 'التأثير المعتمد' : 'Enforced Status'}</span>
                    <span className="text-emerald-600 font-mono text-[10px] flex items-center gap-1 mt-0.5 justify-center">
                      <LockOpen className="w-3 h-3" />
                      {lang === 'ar' ? 'نشط / مرحل بالكامل' : 'Active / Posted'}
                    </span>
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                    <span className="text-[9px] text-zinc-400 block">{lang === 'ar' ? 'مذكرة المبررات والطلب' : 'Request Justifications'}</span>
                    <p className="text-[10.5px] text-slate-600 font-medium leading-relaxed mt-1">
                      {selectedRequest.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Hierarchical Progress Timeline */}
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-2 pb-2 border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1"
                      style={lang === 'ar' ? { flexDirection: 'row-reverse' } : {}}>
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                    <span>{lang === 'ar' ? 'خطوات ومراحل الاعتماد' : 'Approval Workflow Sequence'}</span>
                  </h4>

                  {/* View Mode Switcher */}
                  <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[9px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSelectedRequestViewMode('flowchart')}
                      className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        selectedRequestViewMode === 'flowchart'
                          ? 'bg-white dark:bg-zinc-900 text-amber-600 shadow-3xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Workflow className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'التزام الفترة الكلي' : 'Smart Flowchart'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRequestViewMode('timeline')}
                      className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        selectedRequestViewMode === 'timeline'
                          ? 'bg-white dark:bg-zinc-900 text-amber-600 shadow-3xs font-extrabold'
                          : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'التسلسل الزمني' : 'Timeline'}</span>
                    </button>
                  </div>
                </div>

                {selectedRequestViewMode === 'flowchart' ? (
                  <div className="space-y-5 animate-fade-in">
                    {/* Dynamic Flowchart Content */}
                    {(() => {
                      const wfSteps = getWorkflowSteps(selectedRequest, historyForSelected);
                      const bottleneckNode = wfSteps.find(s => s.isBottleneck);

                      return (
                        <div className="space-y-4">
                          {/* Top Status/Bottleneck Banner */}
                          {bottleneckNode ? (
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 flex gap-2.5 items-start text-amber-800 dark:text-amber-300">
                              <AlertTriangle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                              <div className="text-right flex-1" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                                <h5 className="text-[11px] font-black uppercase tracking-wide">
                                  {lang === 'ar' ? 'تم رصد موقع اختناق (عنق زجاجة) نشط!' : 'Active Approval Bottleneck Flagged!'}
                                </h5>
                                <p className="text-[10px] text-amber-700/90 dark:text-amber-400/90 font-bold mt-1 leading-relaxed">
                                  {lang === 'ar'
                                    ? `المعاملة قيد الانتظار حالياً في مرحلة [${bottleneckNode.name_ar}] لدى: ${bottleneckNode.actor || bottleneckNode.role_ar}. تم تصنيف هذه الخطوة كعنق زجاجة يؤخر تدفق العمل التنفيذي.`
                                    : `The request is currently halted at [${bottleneckNode.name_en}] by ${bottleneckNode.actor || bottleneckNode.role_en}. This node is identified as the pacing delay.`
                                  }
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3 flex gap-2.5 items-start text-emerald-800 dark:text-emerald-300">
                              <CheckCircle className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                              <div className="text-right flex-1" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                                <h5 className="text-[11px] font-black uppercase tracking-wide">
                                  {lang === 'ar' ? 'سلسلة الاعتماد مكتملة وخالية من أي معوقات' : 'Workflow Intact - Zero Bottlenecks!'}
                                </h5>
                                <p className="text-[10px] text-emerald-700/90 dark:text-emerald-400/90 font-bold mt-0.5 leading-relaxed">
                                  {lang === 'ar'
                                    ? 'تم ترحيل المعاملة والمصادقة الرقمية بالكامل عبر سلسلة الصلاحيات دون اختناقات تذكر.'
                                    : 'All approval keys successfully matched. The transaction flow completed without any pacing delay.'
                                  }
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Flowchart Diagram (Nodes with Connections) */}
                          <div className="relative space-y-4 pt-1">
                            {/* Vertical connecting line */}
                            <div className="absolute right-[21px] top-4 bottom-4 w-[2px] bg-slate-200 dark:bg-zinc-800 border-dashed border-l-2 border-slate-300 dark:border-zinc-700 pointer-events-none"
                                 style={lang === 'en' ? { right: 'auto', left: '21px' } : {}} />

                            {wfSteps.map((step, sIdx) => {
                              const isCompleted = step.status === 'completed';
                              const isPending = step.status === 'pending';
                              const isRejected = step.status === 'rejected';
                              const isUpcoming = step.status === 'upcoming';

                              let borderStyle = "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900";
                              let iconBg = "bg-slate-100 text-slate-400 border-slate-200";
                              let textStyle = "text-slate-800 dark:text-zinc-200";

                              if (isCompleted) {
                                borderStyle = "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/5 hover:border-emerald-500";
                                iconBg = "bg-emerald-500 text-white border-emerald-600";
                              } else if (isRejected) {
                                borderStyle = "border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/5 hover:border-rose-500";
                                iconBg = "bg-rose-500 text-white border-rose-600";
                              } else if (isPending) {
                                if (step.isBottleneck) {
                                  borderStyle = "border-amber-500 border-2 bg-amber-50/45 dark:bg-amber-950/10 shadow-[0_0_12px_rgba(217,119,6,0.15)] animate-pulse";
                                  iconBg = "bg-amber-500 text-zinc-950 border-amber-600";
                                } else {
                                  borderStyle = "border-amber-400 bg-amber-50/20 dark:bg-amber-950/5";
                                  iconBg = "bg-amber-400 text-zinc-950 border-amber-500";
                                }
                              } else if (isUpcoming) {
                                borderStyle = "border-slate-200 dark:border-zinc-800/60 border-dashed bg-slate-50/40 dark:bg-zinc-950/10 opacity-70";
                                iconBg = "bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 border-slate-200 dark:border-zinc-800";
                                textStyle = "text-slate-400 dark:text-zinc-500";
                              }

                              return (
                                <div key={step.id} className="relative">
                                  {/* Connector Arrow for steps > 0 */}
                                  {sIdx > 0 && (
                                    <div className="absolute right-[13px] top-[-18px] z-10 w-[18px] h-[18px] bg-slate-100 dark:bg-zinc-800 rounded-full border border-slate-300 dark:border-zinc-700 flex items-center justify-center shadow-3xs"
                                         style={lang === 'en' ? { right: 'auto', left: '13px' } : {}}>
                                      <ArrowDown className={`w-2.5 h-2.5 ${isCompleted ? 'text-emerald-600' : isPending ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
                                    </div>
                                  )}

                                  <div className={`flex gap-3 items-start p-3 rounded-xl border transition-all ${borderStyle}`}>
                                    {/* Circle Icon Badge */}
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shrink-0 ${iconBg}`}>
                                      {isCompleted ? (
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      ) : isRejected ? (
                                        <X className="w-3.5 h-3.5 stroke-[3]" />
                                      ) : isPending ? (
                                        <Clock className="w-3.5 h-3.5 stroke-[3]" />
                                      ) : (
                                        <span>{step.id}</span>
                                      )}
                                    </div>

                                    {/* Node Content */}
                                    <div className="flex-1 text-right min-w-0" style={lang === 'en' ? { textAlign: 'left' } : {}}>
                                      <div className="flex justify-between items-start gap-2 flex-wrap">
                                        <h6 className={`text-[11px] font-black leading-tight ${textStyle}`}>
                                          {lang === 'ar' ? step.name_ar : step.name_en}
                                        </h6>
                                        {step.isBottleneck && (
                                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-black text-[8px] uppercase tracking-wide animate-pulse border border-rose-200 dark:border-rose-900">
                                            {lang === 'ar' ? '⚠️ موقع الاختناق' : '⚠️ Bottleneck'}
                                          </span>
                                        )}
                                        {isCompleted && (
                                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-extrabold text-[8px] uppercase">
                                            {lang === 'ar' ? 'مكتمل' : 'Completed'}
                                          </span>
                                        )}
                                      </div>

                                      <div className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                                        {lang === 'ar' ? step.role_ar : step.role_en}
                                        {step.actor && (
                                          <span className="text-slate-600 dark:text-zinc-300 font-black">
                                            {' ? '}{step.actor}
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed mt-1.5 bg-slate-50/50 dark:bg-zinc-950/20 p-2 rounded-lg border border-slate-100 dark:border-zinc-800">
                                        {lang === 'ar' ? step.desc_ar : step.desc_en}
                                      </p>

                                      {step.date && (
                                        <div className="text-[8.5px] text-zinc-400 font-mono mt-1 font-bold">
                                          {new Date(step.date).toLocaleString(lang === 'ar' ? 'ar-YE' : 'en-US')}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="relative border-r border-slate-200 mr-2 pr-4 space-y-5"
                       style={lang === 'en' ? { borderRight: 'none', borderLeft: '1px solid #e4e4e7', marginRight: '0', paddingRight: '0', marginLeft: '8px', paddingLeft: '16px' } : {}}
                  >
                    {/* Step 1: Submission */}
                    <div className="relative">
                      <div className="absolute right-[-23px] top-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center"
                           style={lang === 'en' ? { right: 'auto', left: '-23px' } : {}}
                      >
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div className="text-[11px] font-extrabold text-slate-800">
                        {lang === 'ar' ? 'تقديم المعاملة وتدقيق الملفات' : 'Document Submission & Validation'}
                      </div>
                      <div className="text-[9px] text-zinc-400 font-bold font-mono">
                        {selectedRequest.requester_name} ? {new Date(selectedRequest.created_at).toLocaleString(lang === 'ar' ? 'ar-YE' : 'en-US')}
                      </div>
                    </div>

                    {/* Step 2: Manager/Director Review */}
                    <div className="relative">
                      <div className={`absolute right-[-23px] top-0 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                        selectedRequest.status === 'approved' ? 'bg-emerald-500' :
                        selectedRequest.status === 'rejected' ? 'bg-rose-500' :
                        'bg-amber-400 animate-pulse'
                      }`}
                           style={lang === 'en' ? { right: 'auto', left: '-23px' } : {}}
                      >
                        {selectedRequest.status === 'approved' ? (
                          <Check className="w-2.5 h-2.5 text-white" />
                        ) : selectedRequest.status === 'rejected' ? (
                          <X className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <Clock className="w-2.5 h-2.5 text-zinc-950" />
                        )}
                      </div>
                      <div className="text-[11px] font-extrabold text-slate-800">
                        {lang === 'ar' ? 'موافقة الإدارة التنفيذية' : 'Executive Director Authorization'}
                      </div>
                      <div className="text-[9px] text-zinc-400 font-bold">
                        {selectedRequest.status === 'approved' ? (
                          <span className="text-emerald-600 font-black">{lang === 'ar' ? 'تمت الموافقة والاعتماد' : 'Approved & Executed'}</span>
                        ) : selectedRequest.status === 'rejected' ? (
                          <span className="text-rose-600 font-black">{lang === 'ar' ? 'مرفوض' : 'Rejected'}</span>
                        ) : (
                          <span className="text-amber-600 font-black animate-pulse">{lang === 'ar' ? 'اختبار تفعيل الأداة بنجاح' : 'Awaiting Director Vow'}</span>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Posting Ledger */}
                    <div className="relative opacity-60">
                      <div className={`absolute right-[-23px] top-0 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                        selectedRequest.status === 'approved' ? 'bg-emerald-500' : 'bg-zinc-200'
                      }`}
                           style={lang === 'en' ? { right: 'auto', left: '-23px' } : {}}
                      >
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div className="text-[11px] font-extrabold text-slate-800">
                        {lang === 'ar' ? 'ترحيل نهائي للدفاتر والقيود الموحدة' : 'Final ERP Ledger Posting'}
                      </div>
                      <div className="text-[9px] text-zinc-400 font-bold">
                        {selectedRequest.status === 'approved' ? (lang === 'ar' ? 'مرحل ومقفل' : 'Posted & Locked') : (lang === 'ar' ? 'انتظار الخطوة السابقة' : 'Pending Prior Step')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Approval History Logs & Comments */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1 justify-end"
                    style={lang === 'en' ? { justifyContent: 'flex-start' } : {}}>
                  <History className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'مذكرات وملاحظات المراجعة الفنية' : 'Audit Trail & Discussion Comments'}</span>
                </h4>

                {historyForSelected.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 font-semibold italic text-center py-2">
                    {lang === 'ar' ? 'لم تُسجل أي مذكرات تدقيق إضافية على هذه المعاملة بعد.' : 'No audit annotations have been logged on this voucher yet.'}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {historyForSelected.map(hist => (
                      <div key={hist.id} className="bg-slate-50 border border-zinc-300 p-2.5 rounded-xl text-xs text-right"
                           style={lang === 'en' ? { textAlign: 'left' } : {}}>
                        <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold mb-1">
                          <span className="text-slate-700 font-extrabold">{hist.approver_name} ({hist.approver_role})</span>
                          <span>{new Date(hist.created_at).toLocaleString(lang === 'ar' ? 'ar-YE' : 'en-US')}</span>
                        </div>
                        <p className="text-slate-600 font-semibold leading-relaxed">
                          {hist.comments}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons for Approver */}
              {selectedRequest.status === 'pending' && (
                <div className="border-t border-slate-100 pt-4 space-y-3 print:hidden">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1 text-right"
                           style={lang === 'en' ? { textAlign: 'left' } : {}}>
                      {lang === 'ar' ? 'إضافة مذكرة تدقيق / مبررات القرار' : 'Audit Comments & Authorization Remarks'}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={lang === 'ar' ? 'اكتب تعليقك، ملاحظاتك، أو سبب الرفض هنا للتوثيق...' : 'Enter authorization rationale or review details...'}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {currentUser.role === 'Administrator' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprovalAction('approved')}
                        disabled={actionSubmitting}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/15"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'توقيع واعتماد المعاملة' : 'Sign & Authorize'}</span>
                      </button>

                      <button
                        onClick={() => handleApprovalAction('rejected')}
                        disabled={actionSubmitting}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'رفض المعاملة' : 'Reject'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl flex items-start gap-2 text-amber-800">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <p className="text-[10px] font-extrabold leading-normal">
                        {lang === 'ar' 
                          ? 'صلاحيات حسابك الحالية (منسق) لا تخولك للتوقيع المالي أو تعديل ترحيل قيود الموازنات. المعاملة معروضة للقراءة فقط.'
                          : 'Your role (Field/Staff) does not possess executive ledger authorization keys. This voucher is read-only.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Banner messages */}
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-[11px] font-bold">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-[11px] font-bold">
                  {errorMessage}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-12 text-center text-zinc-400">
              <ShieldCheck className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-xs font-bold leading-normal max-w-xs mx-auto">
                {lang === 'ar' 
                  ? 'يرجى تحديد طلب اعتماد من القائمة الجانبية لمراجعة سيره، التواقيع المعتمدة، والتأثير الهيكلي على ERP.' 
                  : 'Select an approval request from the list to review its workflow sequence, signature trails, and ledger impacts.'}
              </p>
            </div>
          )}
        </div>

      </div>
      ) : activeSubTab === 'matrix' ? (
        renderMatrixView()
      ) : (
        renderDelegationView()
      )}

      {/* MODAL: SUBMIT NEW APPROVAL REQUEST */}
      {isNewRequestOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl">
            
            <div className="bg-zinc-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-black text-xs tracking-wider uppercase flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-amber-500" />
                <span>{lang === 'ar' ? 'رفع معاملة جديدة لاعتماد التدقيق' : 'Initiate ERP Approval Request'}</span>
              </h3>
              <button 
                onClick={() => setIsNewRequestOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
              
              {/* Type Switcher */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                  {lang === 'ar' ? 'تصنيف المعاملة والتبعية' : 'Entity Categorization'}
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setNewRequestType('project'); setSelectedEntityId(''); }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      newRequestType === 'project' ? 'bg-white text-zinc-950 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {lang === 'ar' ? 'إضافة مشروع جديد' : 'Field Project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewRequestType('transaction'); setSelectedEntityId(''); }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      newRequestType === 'transaction' ? 'bg-white text-zinc-950 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {lang === 'ar' ? 'قيد أو سند مالي' : 'Ledger Transaction'}
                  </button>
                </div>
              </div>

              {/* Dynamic Entity Selector */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                  {newRequestType === 'project' 
                    ? (lang === 'ar' ? 'اختر المشروع الميداني المراد اعتماده' : 'Select Target Project')
                    : (lang === 'ar' ? 'اختر السند المحاسبي المعلق' : 'Select Pending Transaction')}
                </label>
                
                <select
                  required
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="">
                    {lang === 'ar' ? '-- اختر من القائمة المستخرجة --' : '-- Select from database --'}
                  </option>
                  
                  {newRequestType === 'project' ? (
                    projects.map(proj => (
                      <option key={proj.id} value={proj.id}>
                        [{proj.code || 'PROJ'}] {lang === 'ar' ? proj.name_ar : proj.name_en} - {lang === 'ar' ? 'ميزانية:' : 'Budget:'} {proj.budget} {proj.currency_code}
                      </option>
                    ))
                  ) : (
                    transactions.map(tx => (
                      <option key={tx.id} value={tx.id}>
                        [{tx.transaction_number || tx.id.slice(0, 8)}] {tx.description || (lang === 'ar' ? 'سند قيود يومية' : 'JV Voucher')} - {tx.amount || tx.total_amount || 0} YER
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1 text-right"
                       style={lang === 'en' ? { textAlign: 'left' } : {}}>
                  {lang === 'ar' ? 'السجل المركزي للمستفيدين' : 'Urgency & Priority'}
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                  {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRequestPriority(p)}
                      className={`py-1.5 rounded-lg border uppercase tracking-wider text-[9px] transition-all cursor-pointer ${
                        requestPriority === p 
                          ? 'bg-amber-600 text-white border-amber-600 font-extrabold shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-zinc-100'
                      }`}
                    >
                      {p === 'low' && (lang === 'ar' ? 'عادية' : 'Low')}
                      {p === 'medium' && (lang === 'ar' ? 'متوسطة' : 'Medium')}
                      {p === 'high' && (lang === 'ar' ? 'عادية' : 'High')}
                      {p === 'urgent' && (lang === 'ar' ? 'عادية' : 'Urgent')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1 text-right"
                       style={lang === 'en' ? { textAlign: 'left' } : {}}>
                  {lang === 'ar' ? 'مذكرة المبررات والتوصيات الميدانية' : 'Governance & Strategic Justification'}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={lang === 'ar' ? 'يرجى تقديم شرح واف للأسباب والمبررات التنفيذية لترحيل هذه الموازنة أو تدشين المشروع...' : 'Provide complete description and logical backup for authorization...'}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-600/15"
                >
                  {formSubmitting ? (lang === 'ar' ? 'جاري إرسال الطلب...' : 'Submitting...') : (lang === 'ar' ? 'إرسال الطلب للاعتماد' : 'Submit for Approval')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewRequestOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-zinc-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT NEW FINANCIAL DELEGATION */}
      {isNewDelegationOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl">
            
            <div className="bg-zinc-900 text-white p-4 flex justify-between items-center">
              <h3 className="font-black text-xs tracking-wider uppercase flex items-center gap-2">
                <UserCheck className="w-4.5 h-4.5 text-amber-500" />
                <span>{lang === 'ar' ? 'إصدار مستند تفويض الصلاحيات المالية' : 'Issue Financial Authority Delegation'}</span>
              </h3>
              <button 
                onClick={() => setIsNewDelegationOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDelegation} className="p-6 space-y-4 text-right" style={lang === 'en' ? { textAlign: 'left' } : {}}>
              
              {/* Select Delegate */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                  {lang === 'ar' ? 'اختر الموظف المفوض' : 'Select Target Delegate'}
                </label>
                <select
                  required
                  value={delegateId}
                  onChange={(e) => setDelegateId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="">
                    {lang === 'ar' ? '-- اختر الموظف من الكادر --' : '-- Select delegate --'}
                  </option>
                  {users.filter(u => u.id !== currentUser.id).map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity types */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                  {lang === 'ar' ? 'نطاق الصلاحية (نوع الكيانات)' : 'Delegation Domain (Entity Type)'}
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setDelegationEntityTypes('project')}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      delegationEntityTypes === 'project' ? 'bg-white text-zinc-950 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {lang === 'ar' ? 'إجمالي الموظفين' : 'Project Approvals'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelegationEntityTypes('transaction')}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      delegationEntityTypes === 'transaction' ? 'bg-white text-zinc-950 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {lang === 'ar' ? 'اعتماد الصرف المالي' : 'Ledger Disbursements'}
                  </button>
                </div>
              </div>

              {/* Max Amount */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                  {lang === 'ar' ? 'سقف صلاحية المبلغ المالي المسموح (YER)' : 'Maximum Authorized Threshold (YER)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={delegationMaxAmount}
                  onChange={(e) => setDelegationMaxAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                    {lang === 'ar' ? 'تاريخ البدء' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={delegationStartDate}
                    onChange={(e) => setDelegationStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                    {lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={delegationEndDate}
                    onChange={(e) => setDelegationEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                  {lang === 'ar' ? 'مبررات تفويض الصلاحية التنظيمية' : 'Executive Justification & Rationale'}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={lang === 'ar' ? 'يرجى تقديم مبررات واضحة لإصدار هذا التفويض المالي المؤقت للموظف...' : 'Provide complete operational rationale for issuing temporary authority keys...'}
                  value={delegationReason}
                  onChange={(e) => setDelegationReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-600/15"
                >
                  {formSubmitting ? (lang === 'ar' ? 'جاري تعميد وثيقة التفويض...' : 'Verifying keys...') : (lang === 'ar' ? 'اعتماد وإصدار التفويض' : 'Issue & Enforce')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewDelegationOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-zinc-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
    </ModuleShell>
    </ErrorBoundary>
  );
}
