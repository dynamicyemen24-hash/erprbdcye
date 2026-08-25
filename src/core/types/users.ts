// Users, Human Resources & Security Roles Domain Types for NexoraOS™

export interface User {
  id: string;
  email: string;
  name: string;
  name_ar: string | null;
  phone: string | null;
  status: string | null;
  default_language: string | null;
  security_level: number;
  created_at: string;
  updated_at: string;
  department_code: string | null;
  position_code: string | null;
  can_approve: boolean | null;
  max_approval_amount: string | null;
  role?: string;
}

export interface HrStaff {
  id: string;
  organization_id: string;
  user_id: string | null;
  employee_code: string | null;
  full_name_ar: string;
  full_name_en: string;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  level: number;
  description: string | null;
  security_level: number;
}
