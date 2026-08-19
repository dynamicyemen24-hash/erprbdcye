// Dashboard, Navigation Tabs & Meta Domain Types for NexoraOS™

import { Program } from './programs';
import { Project } from './projects';

export type ActiveTab = 
  | 'dashboard' 
  | 'control_panel' 
  | 'domains' 
  | 'programs' 
  | 'projects' 
  | 'activities' 
  | 'beneficiaries' 
  | 'sponsorships' 
  | 'finance' 
  | 'approvals' 
  | 'reports' 
  | 'users' 
  | 'inventory' 
  | 'contracts' 
  | 'currencies' 
  | 'settings' 
  | 'audit' 
  | 'backup' 
  | 'docs' 
  | 'scenarios' 
  | 'allocations' 
  | 'geospatial'
  | 'strategic_planning'
  | 'investments'
  | 'hr_dashboard'
  | 'third-party-network'
  | 'sales';

export type TabId = ActiveTab;

export interface DashboardStats {
  counts: {
    organizations: number;
    programs: number;
    projects: number;
    users: number;
    currencies: number;
    beneficiaries: number;
    sponsorships: number;
  };
  financials: {
    totalProgramBudget: number;
  };
  recentPrograms: Partial<Program>[];
  recentProjects: Partial<Project>[];
}

export interface DomainMetadata {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  iconName: string;
  description: string;
}
