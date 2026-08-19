/**
 * NexoraOS™ — Optimistic Locking & Data Accuracy
 * Prevents lost updates with version-based concurrency control
 */

import { queryOne, query, transaction } from './database';
import logger from './logger';

// ─── Optimistic Lock Manager ───────────────────────────

export class OptimisticLock {
  /**
   * Fetch a record with its version for editing
   */
  static async acquire(table: string, id: string, versionColumn: string = 'version'): Promise<{
    record: Record<string, any> | null;
    version: number;
  }> {
    const record = await queryOne(`SELECT *, ${versionColumn} as _version FROM ${table} WHERE id = $1`, [id]);
    if (!record) return { record: null, version: 0 };
    return { record, version: Number(record._version || record[versionColumn] || 0) };
  }

  /**
   * Update with version check (throws if version mismatch)
   */
  static async update(
    table: string,
    id: string,
    data: Record<string, any>,
    expectedVersion: number,
    versionColumn: string = 'version'
  ): Promise<{ success: boolean; record?: Record<string, any>; error?: string }> {
    return await transaction(async (client) => {
      // Add version to WHERE clause
      const sets: string[] = [];
      const values: any[] = [];
      let idx = 1;

      // Increment version
      sets.push(`${versionColumn} = ${versionColumn} + 1`);

      for (const [col, val] of Object.entries(data)) {
        if (col === versionColumn || col === 'id' || col === 'created_at') continue;
        sets.push(`${col} = $${idx++}`);
        values.push(val);
      }

      sets.push(`updated_at = NOW()`);
      values.push(id, expectedVersion);

      const result = await client.query(
        `UPDATE ${table}
         SET ${sets.join(', ')}
         WHERE id = $${idx++} AND ${versionColumn} = $${idx}
         RETURNING *`,
        values
      );

      if (result.rowCount === 0) {
        // Check if record exists
        const existing = await client.query(`SELECT id, ${versionColumn} FROM ${table} WHERE id = $1`, [id]);
        if (existing.rows.length === 0) {
          return { success: false, error: 'Record not found' };
        }
        return {
          success: false,
          error: `Concurrency conflict: record was modified by another user (expected version ${expectedVersion}, current version ${existing.rows[0][versionColumn]})`,
        };
      }

      return { success: true, record: result.rows[0] };
    });
  }
}

// ─── Pessimistic Lock (for critical operations) ────────

export class PessimisticLock {
  private static locks = new Map<string, { userId: string; acquiredAt: number; ttlMs: number }>();

  static tryAcquire(resourceId: string, userId: string, ttlMs: number = 300000): boolean {
    const existing = this.locks.get(resourceId);
    if (existing) {
      if (Date.now() - existing.acquiredAt > existing.ttlMs) {
        this.locks.delete(resourceId);
      } else if (existing.userId !== userId) {
        return false;
      }
    }
    this.locks.set(resourceId, { userId, acquiredAt: Date.now(), ttlMs });
    return true;
  }

  static release(resourceId: string, userId: string): boolean {
    const lock = this.locks.get(resourceId);
    if (lock && lock.userId === userId) {
      this.locks.delete(resourceId);
      return true;
    }
    return false;
  }

  static isLocked(resourceId: string): boolean {
    const lock = this.locks.get(resourceId);
    if (!lock) return false;
    if (Date.now() - lock.acquiredAt > lock.ttlMs) {
      this.locks.delete(resourceId);
      return false;
    }
    return true;
  }

  static getLock(resourceId: string): { userId: string; acquiredAt: number } | null {
    const lock = this.locks.get(resourceId);
    if (!lock) return null;
    if (Date.now() - lock.acquiredAt > lock.ttlMs) {
      this.locks.delete(resourceId);
      return null;
    }
    return { userId: lock.userId, acquiredAt: lock.acquiredAt };
  }

  static cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, lock] of this.locks.entries()) {
      if (now - lock.acquiredAt > lock.ttlMs) {
        this.locks.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

// ─── Data Validation Helpers ───────────────────────────

export function validateAmount(amount: any, fieldName: string = 'amount'): void {
  const num = Number(amount);
  if (isNaN(num)) throw new Error(`${fieldName} must be a number`);
  if (num < 0) throw new Error(`${fieldName} cannot be negative`);
  if (num > 999999999999) throw new Error(`${fieldName} exceeds maximum allowed value`);
}

export function validateDate(dateStr: any, fieldName: string = 'date'): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) throw new Error(`${fieldName} is not a valid date`);
  return date;
}

export function validateRequiredFields(data: Record<string, any>, fields: string[]): void {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`Field '${field}' is required`);
    }
  }
}

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return regex.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^\+?[0-9]{7,15}$/.test(cleaned);
}

export function validateNationalId(id: string): boolean {
  return /^[0-9]{7,20}$/.test(id.replace(/\s/g, ''));
}

// ─── Data Consistency Checker ──────────────────────────

export class ConsistencyChecker {
  /**
   * Verify trial balance is balanced
   */
  static async verifyTrialBalance(orgId: string): Promise<{ balanced: boolean; variance: number }> {
    const result = await queryOne(
      `SELECT
        COALESCE(SUM(CASE WHEN account_type IN ('ASSET', 'EXPENSE') THEN current_balance ELSE 0 END), 0) as debit_total,
        COALESCE(SUM(CASE WHEN account_type IN ('LIABILITY', 'EQUITY', 'REVENUE') THEN ABS(current_balance) ELSE 0 END), 0) as credit_total
       FROM chart_of_accounts
       WHERE organization_id = $1 AND is_header = false AND deleted_at IS NULL`,
      [orgId]
    );

    const debit = Number(result?.debit_total || 0);
    const credit = Number(result?.credit_total || 0);
    const variance = Math.abs(debit - credit);

    return { balanced: variance < 0.01, variance };
  }

  /**
   * Verify budget not exceeded
   */
  static async verifyBudgetCompliance(orgId: string, projectId: string, accountId: string, amount: number): Promise<{
    compliant: boolean;
    allocated: number;
    spent: number;
    remaining: number;
  }> {
    const budget = await queryOne(
      `SELECT allocated_budget, spent_amount
       FROM budget_lines
       WHERE organization_id = $1 AND project_id = $2 AND account_id = $3`,
      [orgId, projectId, accountId]
    );

    const allocated = Number(budget?.allocated_budget || 0);
    const spent = Number(budget?.spent_amount || 0);
    const remaining = allocated - spent;

    return {
      compliant: remaining >= amount,
      allocated,
      spent,
      remaining,
    };
  }

  /**
   * Verify 3-way match (PO, Receipt, Invoice)
   */
  static async verifyThreeWayMatch(purchaseOrderId: string): Promise<{
    matched: boolean;
    poAmount: number;
    receivedAmount: number;
    invoicedAmount: number;
    variance: number;
  }> {
    const po = await queryOne(
      `SELECT total_amount FROM purchase_orders WHERE id = $1`,
      [purchaseOrderId]
    );
    const receipt = await queryOne(
      `SELECT COALESCE(SUM(quantity_received * unit_cost), 0) as total_received
       FROM goods_receipts WHERE purchase_order_id = $1`,
      [purchaseOrderId]
    );
    const invoice = await queryOne(
      `SELECT COALESCE(SUM(total_amount), 0) as total_invoiced
       FROM vendor_invoices WHERE purchase_order_id = $1`,
      [purchaseOrderId]
    );

    const poAmount = Number(po?.total_amount || 0);
    const receivedAmount = Number(receipt?.total_received || 0);
    const invoicedAmount = Number(invoice?.total_invoiced || 0);
    const variance = Math.abs(poAmount - Math.min(receivedAmount, invoicedAmount));

    return { matched: variance < 0.01, poAmount, receivedAmount, invoicedAmount, variance };
  }
}

// ─── Export ────────────────────────────────────────────

export default { OptimisticLock, PessimisticLock, ConsistencyChecker };
