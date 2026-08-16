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
  currency_code?: string;
  security_level?: number;
}

