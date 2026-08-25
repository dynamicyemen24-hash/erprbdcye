import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../../core/database';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/rbac/matrix — Load RBAC matrix (roles, permissions, role-permission map)
router.get('/rbac/matrix', authenticateToken, async (req: any, res: any) => {
  try {
    if ((req.user?.security_level ?? 0) < 3) {
      return res.status(403).json({ error: 'Access Denied: RBAC matrix requires security level 3+' });
    }
    const orgId = req.user?.org_id;
    const dbPool = getPool();
    const [rolesRes, permsRes, rpRes] = await Promise.all([
      dbPool.query('SELECT id, code, name_ar, name_en, level, security_level FROM roles WHERE organization_id = $1 ORDER BY level DESC', [orgId]),
      dbPool.query('SELECT id, code, name_ar, name_en, module, description FROM permissions ORDER BY module, code'),
      dbPool.query('SELECT rp.role_id, rp.permission_id FROM role_permissions rp INNER JOIN roles r ON rp.role_id = r.id WHERE r.organization_id = $1', [orgId])
    ]);

    const rolePermsMap: Record<string, string[]> = {};
    rpRes.rows.forEach((r: any) => {
      if (!rolePermsMap[r.role_id]) rolePermsMap[r.role_id] = [];
      rolePermsMap[r.role_id].push(r.permission_id);
    });

    res.json({
      roles: rolesRes.rows,
      permissions: permsRes.rows,
      rolePermissionsMap: rolePermsMap
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load RBAC matrix', ...(process.env.NODE_ENV !== 'production' && { message: err.message }) });
  }
});

// POST /api/rbac/matrix/update — Update role permissions (security level 5 only)
router.post('/rbac/matrix/update', authenticateToken, async (req: any, res) => {
  const callerLevel = req.user?.security_level ?? 0;
  if (callerLevel < 5) {
    return res.status(403).json({ error: 'Access Denied: RBAC matrix modification requires maximum security level (5)' });
  }

  const { role_id, permission_ids } = req.body;
  if (!role_id || !Array.isArray(permission_ids)) {
    return res.status(400).json({ error: 'role_id and permission_ids array are required' });
  }

  const orgId = req.user?.org_id;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const roleCheck = await client.query('SELECT id FROM roles WHERE id = $1 AND organization_id = $2', [role_id, orgId]);
    if (roleCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access Denied: Role does not belong to your organization' });
    }
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [role_id]);

    if (permission_ids.length > 0) {
      const values: any[] = [];
      const placeholders = permission_ids.map((pId: string, i: number) => {
        values.push(role_id, pId);
        return `($${i * 2 + 1}, $${i * 2 + 2})`;
      }).join(', ');
      await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`, values);
    }
    await client.query('COMMIT');
    res.json({ status: 'ok', updatedCount: permission_ids.length });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update role permissions', ...(process.env.NODE_ENV !== 'production' && { message: err.message }) });
  } finally {
    client.release();
  }
});

// POST /api/users/reset-password — Admin password reset
router.post('/users/reset-password', authenticateToken, async (req: any, res) => {
  const { user_id, new_password } = req.body;
  if (!user_id || !new_password) {
    return res.status(400).json({ error: 'user_id and new_password are required' });
  }

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'Invalid user_id format' });
  }

  if (typeof new_password !== 'string' || new_password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const callerLevel = req.user?.security_level ?? 0;
  const callerId = req.user?.id;

  try {
    const dbPool = getPool();
    const targetUser = await dbPool.query('SELECT id, security_level, organization_id FROM users WHERE id = $1 AND deleted_at IS NULL', [user_id]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const target = targetUser.rows[0];
    if (target.organization_id !== req.user?.org_id) {
      return res.status(403).json({ error: 'Access Denied: Cannot reset password for users in another organization' });
    }

    if (callerId !== user_id && callerLevel < 4) {
      return res.status(403).json({ error: 'Access Denied: Only administrators (Level 4+) can reset other users passwords' });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await dbPool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, user_id]);
    res.json({ status: 'ok', message: 'Password reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
