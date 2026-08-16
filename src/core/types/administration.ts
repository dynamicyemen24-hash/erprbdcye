// Administration, Compliance & Governance Domain Types for NexoraOS™

export interface ApprovalRequest {
  id: string;
  organization_id: string;
  requester_id: string;
  approval_type: string;
  entity_type: 'project' | 'transaction' | 'procurement_requisition' | 'material_issue_request';
  entity_id: string;
  field_name: string | null;
  old_value: any;
  new_value: any;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority_code: 'low' | 'medium' | 'high' | 'urgent';
  notes: string | null;
  metadata: any;
  created_at: string;
  // Dynamic fields fetched or joined
  requester_name?: string;
  entity_code?: string;
  entity_name?: string;
  current_step_name?: string;
}

export interface ApprovalHistory {
  id: string;
  organization_id: string;
  approval_request_id: string;
  action: 'approved' | 'rejected' | 'cancelled' | 'commented';
  approver_id: string;
  approver_role: string;
  comments: string | null;
  attachment_url: string | null;
  created_at: string;
  approver_name?: string;
}

export interface WorkflowDefinition {
  id: string;
  organization_id: string;
  name: string;
  entity_type: string;
  steps: {
    name: string;
    step: number;
    type: string;
    assigned_roles?: string[];
    min_amount?: number;
    require_shariah_approval?: boolean;
    role?: string;
  }[];
  is_active?: boolean;
  security_level?: number;
}
