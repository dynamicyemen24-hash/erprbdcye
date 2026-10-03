import { getDatabasePool, withTransaction } from './db.service';

export interface DimensionAssignment {
  dimensionCode: string;
  valueCode: string;
}

export interface SoDConflict {
  roleA: string;
  roleB: string;
  severity: string;
  descriptionAr: string | null;
  isBlocking: boolean;
}

export function formatDocumentNumber(prefix: string, nextNumber: number, minDigits: number): string {
  const safeDigits = Math.min(20, Math.max(1, Math.floor(minDigits) || 1));
  return `${prefix}${String(Math.max(1, Math.floor(nextNumber))).padStart(safeDigits, '0')}`;
}

export async function allocateDocumentNumber(orgId: string, seriesCode: string): Promise<string> {
  return withTransaction(async (client) => {
    const locked = await client.query(
      `SELECT prefix, next_number, increment_by, min_digits
         FROM document_number_series
        WHERE organization_id = $1 AND series_code = $2 AND is_active = true
        FOR UPDATE`,
      [orgId, seriesCode]
    );
    const row = locked.rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error(`Number series not found: ${seriesCode}`);
    const formatted = formatDocumentNumber(String(row.prefix ?? ''), Number(row.next_number), Number(row.min_digits ?? 6));
    await client.query(
      `UPDATE document_number_series
          SET next_number = next_number + $3, updated_at = NOW()
        WHERE organization_id = $1 AND series_code = $2`,
      [orgId, seriesCode, Number((row.increment_by as number) ?? 1)]
    );
    return formatted;
  });
}

export async function resolvePostingRule(
  orgId: string,
  sourceTable: string,
  eventCode: string
): Promise<Record<string, unknown> | null> {
  const res = await getDatabasePool().query(
    `SELECT id, debit_account_id, credit_account_id, priority
       FROM posting_rules
      WHERE organization_id = $1 AND source_table = $2 AND event_code = $3 AND is_active = true
      ORDER BY priority DESC
      LIMIT 1`,
    [orgId, sourceTable, eventCode]
  );
  return (res.rows[0] as Record<string, unknown> | undefined) ?? null;
}

export async function validateDimensionValues(
  orgId: string,
  dims: DimensionAssignment[]
): Promise<{ valid: boolean; missing: string[] }> {
  const pool = getDatabasePool();
  const missing: string[] = [];
  for (const d of dims) {
    const res = await pool.query(
      `SELECT dv.id
         FROM dimension_values dv
         JOIN dimensions dd ON dd.id = dv.dimension_id
        WHERE dd.organization_id = $1 AND dd.dimension_code = $2
          AND dv.value_code = $3 AND dd.is_active = true AND dv.is_active = true
        LIMIT 1`,
      [orgId, d.dimensionCode, d.valueCode]
    );
    if (res.rows.length === 0) missing.push(`${d.dimensionCode}:${d.valueCode}`);
  }
  return { valid: missing.length === 0, missing };
}

export async function checkSoDConflict(roleA: string, roleB: string, orgId?: string): Promise<SoDConflict | null> {
  const res = await getDatabasePool().query(
    `SELECT role_a, role_b, severity, description_ar, is_blocking
       FROM sod_conflict_matrix
      WHERE ((role_a = $1 AND role_b = $2) OR (role_a = $2 AND role_b = $1))
        AND is_active = true
        AND (organization_id IS NULL OR ($3::uuid IS NOT NULL AND organization_id = $3::uuid))
      LIMIT 1`,
    [roleA, roleB, orgId ?? null]
  );
  const row = res.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    roleA: String(row.role_a),
    roleB: String(row.role_b),
    severity: String(row.severity),
    descriptionAr: row.description_ar == null ? null : String(row.description_ar),
    isBlocking: Boolean(row.is_blocking),
  };
}

const STANDARD_DIMENSIONS: Array<{ code: string; nameAr: string; nameEn: string }> = [
  { code: 'COST_CENTER', nameAr: 'مركز التكلفة', nameEn: 'Cost Center' },
  { code: 'PROJECT', nameAr: 'المشروع', nameEn: 'Project' },
  { code: 'FUND', nameAr: 'الصندوق', nameEn: 'Fund' },
  { code: 'DONOR', nameAr: 'المانح', nameEn: 'Donor' },
];

const STANDARD_SOD: Array<{ a: string; b: string; severity: string; descAr: string }> = [
  { a: 'AP_CLERK', b: 'PAYMENT_APPROVER', severity: 'CRITICAL', descAr: 'منشئ الدفع لا يعتمده' },
  { a: 'PROCUREMENT_OFFICER', b: 'PAYMENT_APPROVER', severity: 'HIGH', descAr: 'المشتريات منفصلة عن اعتماد الدفع' },
  { a: 'HR_OFFICER', b: 'PAYROLL_APPROVER', severity: 'HIGH', descAr: 'الموارد البشرية منفصلة عن اعتماد الرواتب' },
  { a: 'WAREHOUSE_KEEPER', b: 'INVENTORY_AUDITOR', severity: 'MEDIUM', descAr: 'أمين المخزن لا يدقق جرده' },
];

export async function ensureControlDefaults(orgId: string): Promise<void> {
  const pool = getDatabasePool();
  for (const d of STANDARD_DIMENSIONS) {
    await pool.query(
      `INSERT INTO dimensions (organization_id, dimension_code, name_ar, name_en)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id, dimension_code) DO NOTHING`,
      [orgId, d.code, d.nameAr, d.nameEn]
    );
  }
  for (const s of STANDARD_SOD) {
    await pool.query(
      `INSERT INTO sod_conflict_matrix (organization_id, role_a, role_b, severity, description_ar, is_blocking)
       VALUES (NULL, $1, $2, $3, $4, true)
       ON CONFLICT (role_a, role_b) DO NOTHING`,
      [s.a, s.b, s.severity, s.descAr]
    );
  }
}
