// NEB-09: Resource & HR OS - Payroll Definitions
export interface PayrollRecord {
  id: string;
  employee_id: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: 'pending' | 'processed' | 'paid';
}
