/**
 * NexoraOS™ — Webhook Manager
 * CRUD operations for webhook subscriptions and delivery history
 */

import crypto from 'crypto';
import { getPool } from '../../core/database';
import { logger } from '../../core/logger';
import {
  Webhook, CreateWebhookInput, UpdateWebhookInput,
  Delivery, TestResult, WebhookEvent,
} from './types';

class WebhookManager {
  async createWebhook(orgId: string, data: CreateWebhookInput): Promise<Webhook> {
    const id = `wh_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const secret = data.secret || process.env.WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO webhooks (id, organization_id, url, secret, events, active, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, $6, $7, $7)
       RETURNING *`,
      [id, orgId, data.url, secret, data.events, data.description || null, now]
    );

    logger.info(`[Webhooks] Created webhook: ${id} for org: ${orgId}`);
    return result.rows[0];
  }

  async updateWebhook(id: string, data: UpdateWebhookInput): Promise<Webhook | null> {
    const pool = getPool();
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.url !== undefined) { sets.push(`url = $${idx++}`); values.push(data.url); }
    if (data.events !== undefined) { sets.push(`events = $${idx++}`); values.push(data.events); }
    if (data.description !== undefined) { sets.push(`description = $${idx++}`); values.push(data.description); }

    if (sets.length === 0) return null;

    sets.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE webhooks SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteWebhook(id: string): Promise<void> {
    const pool = getPool();
    await pool.query('DELETE FROM webhooks WHERE id = $1', [id]);
    logger.info(`[Webhooks] Deleted webhook: ${id}`);
  }

  async listWebhooks(orgId: string): Promise<Webhook[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM webhooks WHERE organization_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    return result.rows;
  }

  async getWebhookById(id: string): Promise<Webhook | null> {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM webhooks WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async pauseWebhook(id: string): Promise<void> {
    const pool = getPool();
    await pool.query('UPDATE webhooks SET active = false, updated_at = NOW() WHERE id = $1', [id]);
    logger.info(`[Webhooks] Paused webhook: ${id}`);
  }

  async resumeWebhook(id: string): Promise<void> {
    const pool = getPool();
    await pool.query('UPDATE webhooks SET active = true, updated_at = NOW() WHERE id = $1', [id]);
    logger.info(`[Webhooks] Resumed webhook: ${id}`);
  }

  async testWebhook(id: string): Promise<TestResult> {
    const webhook = await this.getWebhookById(id);
    if (!webhook) {
      return { success: false, response_time_ms: 0, message: 'Webhook not found' };
    }

    const testPayload = {
      event: 'webhook.test' as WebhookEvent,
      entity_type: 'system',
      entity_id: 'test',
      organization_id: webhook.organization_id,
      user_id: 'system',
      data: { message: 'This is a test webhook delivery', webhook_id: id },
      metadata: { test: true },
      timestamp: new Date().toISOString(),
      idempotency_key: `test_${Date.now()}`,
    };

    const start = Date.now();
    try {
      const { webhookDeliverer } = await import('./deliverer');
      const result = await webhookDeliverer.deliver(webhook, testPayload);
      const elapsed = Date.now() - start;

      return {
        success: result.success,
        status_code: result.status_code,
        response_time_ms: elapsed,
        message: result.success ? `Test delivery succeeded (HTTP ${result.status_code})` : 'Test delivery failed',
      };
    } catch (err: any) {
      return { success: false, response_time_ms: Date.now() - start, message: err.message };
    }
  }

  async getDeliveries(webhookId: string, limit: number = 50): Promise<Delivery[]> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM webhook_deliveries WHERE webhook_id = $1 ORDER BY created_at DESC LIMIT $2',
      [webhookId, limit]
    );
    return result.rows;
  }
}

export const webhookManager = new WebhookManager();
