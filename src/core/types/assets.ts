// Fixed Assets & Inventory Logistics Domain Types for NexoraOS™

export interface FixedAssetRecord {
  id: string;
  organization_id?: string;
  asset_code: string;
  name_ar: string;
  name_en: string;
  category: 'VEHICLE' | 'IT_EQUIPMENT' | 'HEAVY_MACHINERY' | 'EQUIPMENT' | 'FURNITURE' | 'REAL_ESTATE' | string;
  serial_number?: string;
  purchase_date: string;
  purchase_cost: number;
  current_value: number;
  depreciation_rate?: number;
  accumulated_depreciation: number;
  useful_life_months: number;
  residual_value: number;
  supplier_name?: string;
  supplier_contact?: string;
  warranty_expiry_date?: string;
  location_name?: string;
  warehouse_id?: string;
  project_id?: string;
  project_name?: string;
  activity_id?: string;
  assigned_custodian_hr?: string;
  condition_code: 'NEW' | 'USED_GOOD' | 'UNDER_MAINTENANCE' | 'DAMAGED' | 'DISPOSED' | string;
  status_code: 'ACTIVE' | 'MAPPED_TO_PROJECT' | 'UNDER_MAINTENANCE' | 'DISPOSED' | 'TRANSFERRED' | string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  disposal_date?: string;
  disposal_reason?: string;
  created_at?: string;
  updated_at?: string;
}
