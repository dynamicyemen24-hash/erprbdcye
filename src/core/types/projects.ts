// Projects & Field Operations Domain Types for NexoraOS™

export interface Project {
  id: string;
  program_id: string | null;
  organization_id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description: string | null;
  status_code: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: string | null;
  currency_code: string | null;
  progress_percent: string | null;
  target_beneficiaries: number | null;
  actual_beneficiaries: number | null;
  location_name: string | null;
  risk_level: string | null;
  priority_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  titleAr: string;
  titleEn: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'in_progress' | 'delayed' | 'upcoming';
}

