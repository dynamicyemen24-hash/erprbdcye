// Finance & IPSAS Ledger Domain Types for NexoraOS™

export interface Currency {
  id: string;
  organization_id: string;
  code: string;
  name_en: string;
  name_ar: string | null;
  symbol: string | null;
  decimal_places: number | null;
  is_base: boolean | null;
  is_active: boolean | null;
  security_level: number;
  created_at: string;
}

export interface Account {
  id: string;
  account_code: string;
  name_ar: string;
  name_en: string;
  account_type: string; // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  sub_type?: string | null;
  opening_balance: string | number;
  current_balance: string | number;
  debit_total: string | number;
  credit_total: string | number;
  is_active: boolean;
  requires_project?: boolean;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  transaction_type: string; // JOURNAL_ENTRY, PAYMENT, RECEIPT, DEBIT_NOTE, CREDIT_NOTE, CLOSING
  total_debit: string | number;
  total_credit: string | number;
  description: string;
  is_posted: boolean;
  payment_method?: string;
  reference_number?: string | null;
  branch_code?: string;
  project_id?: string | null;
  party_name?: string | null;
  cost_center?: string | null;
  security_level?: number;
  created_at: string;
}

export interface TransactionLine {
  id: string;
  transaction_id: string;
  account_id: string;
  account_code: string;
  description: string;
  debit_amount: string | number;
  credit_amount: string | number;
  project_id?: string | null;
  activity_id?: string | null;
  fund_id?: string | null;
  donor_id?: string | null;
  cost_center_id?: string | null;
  intercompany_id?: string | null;
  secondary_dimension_id?: string | null;
  currency_code?: string;
  security_level?: number;
}

export interface FinancialDimension {
  id: string;
  organization_id: string;
  dimension_type: 'BRANCH' | 'DONOR_GRANT' | 'COST_CENTER' | 'PROJECT_ACTIVITY' | 'INTERCOMPANY' | 'SECONDARY';
  dimension_code: string;
  name_ar: string;
  name_en: string;
  parent_id?: string;
  is_active: boolean;
}

export interface FixedAsset {
  id: string;
  organization_id: string;
  asset_code: string;
  name_ar: string;
  name_en?: string;
  asset_group: string;
  acquisition_date: string;
  acquisition_cost: number;
  accumulated_depreciation: number;
  net_book_value: number;
  useful_life_months: number;
  depreciation_method: 'STRAIGHT_LINE' | 'SUM_OF_YEARS' | 'UNITS_OF_PRODUCTION';
  salvage_value: number;
  location?: string;
  serial_number?: string;
  asset_status: 'IN_USE' | 'MAINTENANCE' | 'DISPOSED' | 'REVALUED' | 'HELD_FOR_SALE';
  fund_id?: string;
  donor_id?: string;
}

export interface FundBalance {
  id: string;
  organization_id: string;
  fund_id: string;
  donor_id?: string;
  fund_type: 'UNRESTRICTED' | 'RESTRICTED' | 'TEMPORARILY_RESTRICTED' | 'PERMANENTLY_RESTRICTED';
  opening_balance: number;
  total_receipts: number;
  total_disbursements: number;
  current_balance: number;
}

export interface ImmutableAuditLedger {
  id: string;
  organization_id: string;
  journal_header_id: string;
  ledger_hash: string;
  previous_ledger_hash: string;
  ledger_number: number;
  created_at: string;
}

export interface BudgetReservation {
  id: string;
  organization_id: string;
  project_id: string;
  budget_line_id: string;
  fund_id?: string;
  donor_id?: string;
  reservation_amount: number;
  consumed_amount: number;
  remaining_amount: number;
  status: 'RESERVED' | 'CONVERTED_TO_COMMITMENT' | 'RELEASED' | 'EXPIRED';
  reservation_date: string;
}

export interface ExchangeRateLog {
  id: string;
  organization_id: string;
  transaction_id: string;
  source_currency: string;
  target_currency: string;
  source_amount: number;
  target_amount: number;
  exchange_rate: number;
  rate_date: string;
  exchange_gain_loss: number;
}

