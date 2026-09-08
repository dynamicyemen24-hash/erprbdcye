// Commitments & Obligations Domain Types for NexoraOS™

export interface Commitment {
  id: string;
  organization_id: string;
  commitment_number: string;
  commitment_type: 'BUDGET' | 'DONOR' | 'CONTRACTUAL' | 'SPONSORSHIP' | 'INTER_ORG' | 'GRANT' | 'OTHER';
  title_ar: string;
  title_en?: string;
  description?: string;
  total_amount: string;
  spent_amount: string;
  remaining_amount?: string;
  currency_code: string;
  project_id?: string;
  program_id?: string;
  donor_id?: string;
  beneficiary_id?: string;
  contract_id?: string;
  budget_line_id?: string;
  is_periodic: boolean;
  periodicity: 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'SEMESTER' | 'ANNUAL' | 'CUSTOM';
  next_due_date?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ACTIVE' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CLOSED' | 'CANCELLED' | 'SUSPENDED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  commitment_date?: string;
  start_date?: string;
  end_date?: string;
  committed_by?: string;
  committed_by_user_id?: string;
  approved_by?: string;
  approved_by_user_id?: string;
  approved_at?: string;
  reference_document?: string;
  internal_notes?: string;
  attachments_count?: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Obligation {
  id: string;
  organization_id: string;
  obligation_number: string;
  obligation_type: 'RECURRING' | 'CONTRACTUAL' | 'REGULATORY' | 'BENEFICIARY' | 'DONOR' | 'OTHER';
  title_ar: string;
  title_en?: string;
  description?: string;
  total_amount: string;
  paid_amount: string;
  pending_amount?: string;
  currency_code: string;
  periodicity: 'ONE_TIME' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMESTER' | 'ANNUAL' | 'CUSTOM';
  frequency_count?: number;
  project_id?: string;
  program_id?: string;
  beneficiary_id?: string;
  vendor_id?: string;
  contract_id?: string;
  budget_line_id?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ACTIVE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CLOSED' | 'CANCELLED' | 'SUSPENDED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  obligation_date?: string;
  start_date?: string;
  end_date?: string;
  next_due_date?: string;
  last_payment_date?: string;
  created_by?: string;
  created_by_user_id?: string;
  approved_by?: string;
  approved_by_user_id?: string;
  approved_at?: string;
  reference_document?: string;
  internal_notes?: string;
  attachments_count?: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface CommitmentPayment {
  id: string;
  organization_id: string;
  commitment_id: string;
  payment_number: string;
  payment_amount: string;
  currency_code: string;
  payment_date: string;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_PAYMENT' | 'OTHER';
  voucher_number?: string;
  receipt_number?: string;
  approved_by?: string;
  notes?: string;
  status: 'PENDING' | 'COMPLETED' | 'REVERSED' | 'CANCELLED';
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface ObligationPayment {
  id: string;
  organization_id: string;
  obligation_id: string;
  payment_number: string;
  payment_amount: string;
  currency_code: string;
  payment_date: string;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_PAYMENT' | 'OTHER';
  voucher_number?: string;
  receipt_number?: string;
  approved_by?: string;
  notes?: string;
  status: 'PENDING' | 'COMPLETED' | 'REVERSED' | 'CANCELLED';
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface CommitmentDocument {
  id: string;
  organization_id: string;
  entity_type: 'COMMITMENT' | 'OBLIGATION';
  entity_id: string;
  document_type: 'ATTACHMENT' | 'SIGNED_CONTRACT' | 'APPROVAL_LETTER' | 'PAYMENT_RECEIPT' | 'BUDGET_ALLOCATION' | 'AUDIT_REPORT' | 'CORRESPONDENCE' | 'OTHER';
  file_name: string;
  file_path?: string;
  file_size?: number;
  uploaded_by?: string;
  description?: string;
  created_at: string;
  deleted_at?: string;
}

export interface CommitmentSummary {
  organization_id: string;
  commitment_type: string;
  total_count: number;
  total_committed: string;
  total_spent: string;
  total_remaining: string;
  fulfillment_pct: number;
  active_count: number;
  fulfilled_count: number;
  cancelled_count: number;
}

export interface ObligationSummary {
  organization_id: string;
  obligation_type: string;
  periodicity: string;
  total_count: number;
  total_obligated: string;
  total_paid: string;
  total_pending: string;
  payment_pct: number;
  active_count: number;
  overdue_count: number;
  paid_count: number;
  due_soon_count: number;
}
