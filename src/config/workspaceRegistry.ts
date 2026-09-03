export const WORKSPACE_ROLE_KEYS = [
  'strategy',
  'programs',
  'operations',
  'field_tasks',
  'beneficiaries',
  'finance',
  'procurement',
  'inventory',
  'sales',
  'hr',
  'meal',
  'admin'
] as const;

export type WorkspaceRoleKey = typeof WORKSPACE_ROLE_KEYS[number];

export const isWorkspaceRoleKey = (value: string | null | undefined): value is WorkspaceRoleKey =>
  value !== null && value !== undefined && (WORKSPACE_ROLE_KEYS as readonly string[]).includes(value);

export const WORKSPACE_STORAGE_KEYS = {
  active: 'uamex_active_workspace',
  favorites: 'uamex_workspace_favorites'
} as const;
