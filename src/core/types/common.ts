// Common Shared Meta Types for NexoraOS™

export interface ColumnMetadata {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}
