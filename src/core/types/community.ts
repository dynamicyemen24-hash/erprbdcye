// Community & Welfare Domain Types for NexoraOS™

export interface Beneficiary {
  id: string;
  beneficiary_code: string;
  full_name_ar: string;
  full_name_en: string;
  gender: 'male' | 'female' | string;
  date_of_birth: string;
  category_code: string;
  phone: string;
  identity_card_number: string;
  city: string;
  governorate: string;
  needs_description: string;
  monthly_allowance: string;
  status: string;
  created_at: string;
}

export interface Sponsorship {
  id: string;
  beneficiary_id: string;
  program_id: string;
  sponsor_name_ar: string;
  sponsor_name_en: string;
  monthly_amount: string;
  currency_code: string;
  paid_amount: string;
  payment_status: 'paid' | 'pending' | string;
  delivery_status: 'delivered' | 'pending' | string;
  start_date: string;
  receiver_name_ar: string;
  receiver_phone: string;
  field_agent_name: string;
  notes: string;
}
