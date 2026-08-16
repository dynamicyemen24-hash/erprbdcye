// Programs Domain Types for NexoraOS™

export interface Program {
  id: string;
  organization_id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description: string | null;
  category_code: string | null;
  status_code: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: string | null;
  currency_code: string | null;
  progress_percent: string | null;
  target_beneficiaries: number | null;
  actual_beneficiaries: number | null;
  program_type: string | null;
  phase_code: string | null;
  priority_code: string | null;
  compliance_status: string | null;
  risk_level: string | null;
  shariah_board_approval: boolean | null;
  objectives?: string | null;
  created_at: string;
  updated_at: string;
}
