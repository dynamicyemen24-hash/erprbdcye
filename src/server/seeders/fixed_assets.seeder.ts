/**
 * NexoraOS™ — Fixed Assets Seeder
 * Seeds 4 realistic assets for Rohama'a Baynahum Foundation.
 */

import pg from 'pg';
import logger from '../core/logger';

export async function seedFixedAssetsIfEmpty(pool: pg.Pool): Promise<void> {
  const checkRes = await pool.query("SELECT COUNT(*) FROM fixed_assets");
  const count = parseInt(checkRes.rows[0].count);
  if (count > 0) return;

  const query = `
    INSERT INTO fixed_assets (
      organization_id, asset_code, name_en, name_ar, category, serial_number,
      purchase_date, purchase_cost, current_value, depreciation_rate, accumulated_depreciation, 
      useful_life_months, residual_value, supplier_name, supplier_contact, warranty_expiry_date,
      location_name, warehouse_id, project_id, project_name, activity_id,
      assigned_custodian_hr, condition_code, status_code, last_maintenance_date, next_maintenance_date, security_level
    ) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'AST-2026-0001', 'Toyota Hilux 4WD Operations Vehicle', 'سيارة تويوتا هايلوكس دبل كابين 4WD', 'VEHICLE', 'SN-TH-998241', '2025-01-15', 45000000, 38000000, 10, 7000000, 60, 5000000, 'شركة وكالة التيسير للسيارات', '+967-771234567', '2027-01-15', 'المستودع المركزي - مأرب الرئيسي', 'wh-1', 'prj-101', 'مشروع السلال الغذائية والأمن الغذائي مأرب', 'ACT-LOGISTICS-01', 'م. أحمد سالم باثواب (مسؤول اللوجستيات)', 'USED_GOOD', 'MAPPED_TO_PROJECT', '2026-06-10', '2026-12-10', 3),
    ('00000000-0000-0000-0000-000000000001', 'AST-2026-0002', 'Nexora Enterprise Server Node', 'خوادم معالجة البيانات المركزية Nexora', 'IT_EQUIPMENT', 'SN-NX-774012', '2025-06-10', 12000000, 9500000, 15, 2500000, 36, 1000000, 'الشركة اليمنية للحلول الرقمية', '+967-733445566', '2028-06-10', 'غرفة الخوادم الرئيسية - الإدارة العامة', 'wh-1', 'prj-103', 'مشروع التحول الرقمي والأثر الميداني', 'ACT-IT-CORE', 'د. عبدالكريم الحمداني (مدير النظم والمعلومات)', 'NEW', 'ACTIVE', '2026-05-01', '2026-11-01', 3),
    ('00000000-0000-0000-0000-000000000001', 'AST-2026-0003', 'Coastal Borehole Drilling Rig', 'حفار آبار المياه الجوفية التكتيكي الثقيل', 'HEAVY_MACHINERY', 'SN-DRILL-88391', '2024-03-20', 180000000, 140000000, 8, 40000000, 120, 20000000, 'المؤسسة العربية للمعدات الثقيلة', '+967-711889900', '2026-03-20', 'موقع الحفر الميداني - الحديدة', 'wh-2', 'prj-102', 'مشروع الاستجابة الطارئة والمياه - الساحل الغربي', 'ACT-WATER-RIG', 'م. ناصر سعيد المعمري (مهندس حفر الآبار)', 'UNDER_MAINTENANCE', 'UNDER_MAINTENANCE', '2026-07-15', '2026-08-15', 3),
    ('00000000-0000-0000-0000-000000000001', 'AST-2026-0004', 'Solar Water Pump System', 'منظومة ضخ مياه بالطاقة الشمسية المتكاملة', 'EQUIPMENT', 'SN-SOLAR-3321', '2025-09-01', 35000000, 32000000, 12, 3000000, 84, 3000000, 'شركة طاقة المستقبل اليمنية', '+967-775511223', '2030-09-01', 'مستودع الساحل الغربي - الحديدة', 'wh-2', 'prj-102', 'مشروع الاستجابة الطارئة والمياه - الساحل الغربي', 'ACT-SOLAR-02', 'م. خالد عبدالرحيم (أخصائي الطاقة البديلة)', 'USED_GOOD', 'MAPPED_TO_PROJECT', '2026-04-10', '2026-10-10', 3)
  `;
  await pool.query(query);
  logger.info('[SEEDER] fixed_assets seeded', { context: 'seeder' });
}
