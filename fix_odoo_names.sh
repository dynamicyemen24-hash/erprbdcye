#!/bin/bash
find src -type f -name "*.tsx" -exec sed -i 's/OdooERPLauncherModal/AppMatrixLauncherModal/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/Odoo\/SAP Launcher Matrix/App Launcher Matrix/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/أودو وساب ERP/التطبيقات المؤسسية/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/Odoo\/SAP ERP App Matrix/Enterprise App Matrix/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/Odoo & SAP Style Enterprise App Launcher/Enterprise App Matrix Launcher/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/لوحة تطبيقات مصفوفة أودو وساب NexoraOS™/لوحة تطبيقات مصفوفة NexoraOS™/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/متوافق مع معايير Odoo & SAP ERP/منصة تشغيل مؤسسية موحدة/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/Odoo & SAP ERP Compliant/Unified Enterprise Platform/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/Odoo\/SAP Matrix Style/Enterprise Matrix Style/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/SAP Fiori & Odoo Style/NexoraOS Style/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/Odoo & SAP Style App Launcher Matrix/App Launcher Matrix/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/showOdooLauncherModal/showAppLauncherModal/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/setShowOdooLauncherModal/setShowAppLauncherModal/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/Odoo\/SAP Fiori Style/Enterprise App Style/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/Odoo\/SAP Blueprint Flow/Enterprise Blueprint Flow/g' {} +
find src -type f -name "*.tsx" -exec sed -i 's/SAP\/Odoo structures/Enterprise standards/g' {} +
