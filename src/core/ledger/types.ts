// NEB-10: Finance & Compliance OS - Ledger Definitions
export interface LedgerEntry {
  id: string;
  amount: number;
  currency: string;
  exchange_rate_historical: number;
  user_id: string;
  timestamp: string;
  audit_trail: string;
  is_closed: boolean;
}
