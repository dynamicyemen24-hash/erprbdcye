export interface DashboardViewProps {
  stats: any;
  loading: boolean;
  onNavigate: (tabId: string) => void;
  onDrillDown?: (tabId: string, filters: any) => void;
  lang: 'ar' | 'en';
  onRefresh?: () => void;
  programs?: any[];
  projects?: any[];
  beneficiaries?: any[];
  sponsorships?: any[];
  approvalRequests?: any[];
  users?: any[];
  currencies?: any[];
  systemAlerts?: any[];
  currentUser?: any;
  activeOrg?: any;
  orgSettings?: any[];
  orgName?: string;
  onOpenHelpers?: () => void;
  onOpenSystemMap?: () => void;
  initialExperienceMode?: 'work_first' | 'classic_analytics';
  onSwitchToWorkFirst?: () => void;
  onOpenExperienceModeModal?: () => void;
}

export interface KPILayoutItem {
  id: string;
  pinned: boolean;
}

export interface DashboardAlert {
  projectCode: string;
  projectName: string;
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  value: string;
}
