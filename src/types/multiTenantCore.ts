// ============================================================================
// NexoraOS™ v3.5 Ultimate Multi-Tenant & Multi-Entity Core Architecture Types
// ============================================================================

export type PartyTypeCode = 
  | 'PERSON'
  | 'HOUSEHOLD'
  | 'ORGANIZATION'
  | 'COMPANY'
  | 'GOVERNMENT'
  | 'NGO'
  | 'FOUNDATION'
  | 'MERCHANT'
  | 'SUPPLIER'
  | 'BANK'
  | 'SERVICE_PROVIDER';

export type PartyRoleType =
  | 'BENEFICIARY'
  | 'DONOR'
  | 'SPONSOR'
  | 'SUPPLIER'
  | 'MERCHANT'
  | 'SERVICE_PROVIDER'
  | 'IMPLEMENTING_PARTNER'
  | 'FIELD_AGENT'
  | 'MEDIATOR'
  | 'BANK_PARTNER'
  | 'EMPLOYEE';

export interface UniversalParty {
  id: string;
  organization_id: string;
  party_type_code: PartyTypeCode;
  name_ar: string;
  name_en?: string;
  first_name?: string;
  last_name?: string;
  national_id?: string;
  passport_number?: string;
  registration_number?: string;
  tax_number?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  status: 'active' | 'inactive' | 'suspended';
  roles: PartyRoleType[];
  created_at?: string;
}

export interface TenantContextState {
  tenantId: string;
  organizationId: string;
  organizationNameAr: string;
  organizationNameEn: string;
  entityId?: string;
  branchCode?: string;
  fiscalYear: string;
  currencyCode: string;
  userRole: string;
  isPlatformAdmin: boolean;
}

export interface DigitalEntitlement {
  id: string;
  tenant_id: string;
  organization_id: string;
  project_id?: string;
  program_id?: string;
  fund_id?: string;
  beneficiary_party_id: string;
  beneficiary_name: string;
  entitlement_code: string;
  item_or_service_name: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  currency_code: string;
  expiry_date: string;
  status: 'ISSUED' | 'RESERVED' | 'REDEEMED' | 'VERIFIED' | 'CLAIMED' | 'SETTLED' | 'EXPIRED' | 'CANCELLED';
  merchant_party_id?: string;
  merchant_name?: string;
  redemption_date?: string;
  qr_code_hash?: string;
}

export interface ThirdPartyClaim {
  id: string;
  tenant_id: string;
  organization_id: string;
  claim_number: string;
  merchant_party_id: string;
  merchant_name: string;
  project_id?: string;
  voucher_count: number;
  claimed_amount: number;
  approved_amount: number;
  currency_code: string;
  invoice_reference?: string;
  supporting_documents?: string[];
  status: 'SUBMITTED' | 'VALIDATED' | 'REVIEWED' | 'APPROVED' | 'PAYABLE' | 'PAID' | 'REJECTED';
  reconciliation_status: 'MATCHED' | 'DISCREPANCY_FLAGGED' | 'RESOLVED';
  created_at: string;
  approved_at?: string;
}

export interface ThirdPartySettlement {
  id: string;
  tenant_id: string;
  organization_id: string;
  settlement_number: string;
  claim_id: string;
  merchant_party_id: string;
  merchant_name: string;
  disbursed_amount: number;
  currency_code: string;
  payment_type: 'BANK_TRANSFER' | 'CHECK' | 'CASH_VOUCHER' | 'E_PAYMENT';
  bank_account_reference?: string;
  ledger_transaction_id?: string;
  created_at: string;
}

export interface ConsortiumProjectMember {
  organization_id: string;
  organization_name_ar: string;
  role: 'LEAD_FUNDER' | 'PROGRAM_OWNER' | 'IMPLEMENTING_PARTNER' | 'SERVICE_PROVIDER';
  allocated_budget: number;
  spent_amount: number;
}
