// Organization & Settings Domain Types for NexoraOS™

export interface Organization {
  id: string;
  parent_id: string | null;
  name_en: string;
  name_ar: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  registration_number: string | null;
  tax_number: string | null;
  license_number: string | null;
  license_expiry: string | null;
  type_code: string | null;
  status: string | null;
  timezone: string | null;
  default_currency_code: string | null;
  subscription_plan?: string | null;
  max_users?: number | null;
  max_storage_gb?: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSetting {
  id: string;
  organization_id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  security_level: number;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  organization_id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string | null;
  description: string | null;
  is_encrypted: boolean | null;
  is_public: boolean | null;
  created_at: string;
  updated_at: string;
}
