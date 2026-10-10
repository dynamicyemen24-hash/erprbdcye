/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NEB-05 — Inventory & Warehouse domain entry point
 * (DEBT PAID: this domain was types-without-a-view)
 *
 * Canonical view : `InventoryManagementView` (`src/components/…`)
 * Domain types   : `./inventoryTypes` (movements, transitions, role matrix)
 * Tables (live)  : `warehouses`, `inventory_items`  →  `/api/tables/*`
 * Permissions    : `inventory:read` (view) / `inventory:write` (movements)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export { InventoryManagementView } from '../../components/InventoryManagementView';
export * from './inventoryTypes';
