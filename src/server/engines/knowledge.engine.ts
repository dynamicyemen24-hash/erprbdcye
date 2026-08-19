/**
 * NexoraOS™ — NEB-11: Knowledge & Document Engine
 * Knowledge Articles, Document Management, Search, Tags
 */

import { query, queryOne, queryMany, transaction } from '../core/database';
import { PaginationParams, PaginatedResult } from '../core/types';
import { paginatedQuery, requireField, optionalString, auditLog, AuthContext } from '../core/helpers';

export class KnowledgeArticleEngine {
  static async list(orgId: string, pagination: PaginationParams = {}, filters?: {
    category?: string;
    status?: string;
    search?: string;
    tags?: string[];
  }): Promise<PaginatedResult<any>> {
    const conditions = ['ka.organization_id = $1'];
    const params: any[] = [orgId]; let idx = 2;
    if (filters?.category) { conditions.push(`ka.category = $${idx++}`); params.push(filters.category); }
    if (filters?.status) { conditions.push(`ka.status = $${idx++}`); params.push(filters.status); }
    if (filters?.search) {
      conditions.push(`(ka.title_ar ILIKE $${idx} OR ka.title_en ILIKE $${idx} OR ka.content_ar ILIKE $${idx})`);
      params.push(`%${filters.search}%`); idx++;
    }
    if (filters?.tags && filters.tags.length > 0) {
      conditions.push(`ka.tags @> $${idx++}::jsonb`);
      params.push(JSON.stringify(filters.tags));
    }
    const where = conditions.join(' AND ');
    return paginatedQuery(
      `SELECT ka.*, u.name as author_name
       FROM knowledge_articles ka
       LEFT JOIN users u ON u.id = ka.author_id
       WHERE ${where}`,
      `SELECT COUNT(*) FROM knowledge_articles ka WHERE ${where}`,
      params, pagination
    );
  }

  static async getById(articleId: string) {
    return queryOne(
      `SELECT ka.*, u.name as author_name
       FROM knowledge_articles ka LEFT JOIN users u ON u.id = ka.author_id
       WHERE ka.id = $1`, [articleId]
    );
  }

  static async create(data: {
    organizationId: string; titleAr: string; titleEn?: string;
    category?: string; contentAr?: string; contentEn?: string;
    authorName?: string; tags?: string[];
  }, auth: AuthContext) {
    return await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO knowledge_articles (organization_id, title_ar, title_en, category,
          content_ar, content_en, author_name, author_id, tags, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PUBLISHED') RETURNING *`,
        [data.organizationId, requireField(data.titleAr, 'titleAr'), optionalString(data.titleEn),
         optionalString(data.category), optionalString(data.contentAr), optionalString(data.contentEn),
         optionalString(data.authorName) || auth.email, auth.userId,
         JSON.stringify(data.tags || [])]
      );
      await auditLog({ organizationId: data.organizationId, userId: auth.userId, action: 'CREATE', tableName: 'knowledge_articles', recordId: result.rows[0].id });
      return result.rows[0];
    });
  }

  static async update(articleId: string, data: Partial<{
    titleAr: string; titleEn: string; category: string;
    contentAr: string; contentEn: string; tags: string[]; status: string;
  }>) {
    const sets: string[] = []; const values: any[] = []; let idx = 1;
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined) {
        const col = key === 'tags' ? 'tags' : key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(`${col} = $${idx++}`);
        values.push(key === 'tags' ? JSON.stringify(val) : val);
      }
    });
    sets.push('updated_at = NOW()');
    values.push(articleId);
    if (sets.length === 1) return null;
    return queryOne(`UPDATE knowledge_articles SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  }

  static async delete(articleId: string) {
    await query('DELETE FROM knowledge_articles WHERE id = $1', [articleId]);
  }

  /**
   * Full-text search
   */
  static async search(orgId: string, searchTerm: string) {
    return queryMany(
      `SELECT ka.*, ts_rank(to_tsvector('english', COALESCE(title_ar,'') || ' ' || COALESCE(content_ar,'')), plainto_tsquery('english', $2)) as rank
       FROM knowledge_articles ka
       WHERE ka.organization_id = $1 AND ka.status = 'PUBLISHED'
         AND (to_tsvector('english', COALESCE(title_ar,'') || ' ' || COALESCE(content_ar,'')) @@ plainto_tsquery('english', $2)
              OR title_ar ILIKE '%' || $2 || '%' OR content_ar ILIKE '%' || $2 || '%')
       ORDER BY rank DESC LIMIT 20`,
      [orgId, searchTerm]
    );
  }

  /**
   * Get articles by tag
   */
  static async getByTag(orgId: string, tag: string) {
    return queryMany(
      `SELECT * FROM knowledge_articles
       WHERE organization_id = $1 AND status = 'PUBLISHED' AND tags @> $2::jsonb
       ORDER BY created_at DESC`,
      [orgId, JSON.stringify([tag])]
    );
  }

  /**
   * Get categories with counts
   */
  static async getCategories(orgId: string) {
    return queryMany(
      `SELECT category, COUNT(*) as count
       FROM knowledge_articles WHERE organization_id = $1 AND category IS NOT NULL
       GROUP BY category ORDER BY count DESC`, [orgId]
    );
  }
}
