/**
 * Governance codemod — arbitrary `z-[N]` → the governed z-index scale.
 *
 * WHY THIS EXISTS NOW AND NOT EARLIER
 * eslint.config.js has always forbidden `z-[N]` and pointed at the governed
 * scale, but `z-dialog` / `z-toast` were not real utilities: the Tailwind
 * `@theme` mirror that declares them was missing from index.css. The rule
 * flagged debt it offered no way to repay, and the debt accumulated — 30 sites
 * spread across values that had drifted to 100001, 99999, 9999 and 70, with no
 * ordering relationship between them. A toast at 90 could render beneath a
 * dialog at 110.
 *
 * WHY AN EXPLICIT TABLE AND NOT A HEURISTIC
 * An arbitrary number carries no meaning beyond its magnitude, so no rule can
 * infer intent from it. Every mapping below was read out of the component's own
 * markup and its role in the shell. A name-matching heuristic would have been
 * faster and wrong: `VoucherEntryTab` and `Tooltip` both sat at z-[100] and
 * need different layers.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(process.cwd(), 'src');

/** [file relative to src/, line, from-value, to-token, why] */
const FIXES = [
  // ── Toasts & notifications: outrank every overlay ──
  ['components/enterprise/EnterpriseToastContainer.tsx', 49, 'z-toast', 'notification viewport'],
  ['components/NexoraTopProgressBar.tsx', 123, 'z-toast', 'floating toasts in the progress bar'],
  ['components/PWAUpdatePrompt.tsx', 128, 'z-toast', 'update toast'],
  ['components/common/OfflineSyncTelemetryBar.tsx', 66, 'z-toast', 'sync status toast'],
  ['components/NotificationCenter.tsx', 306, 'z-popover', 'scrim behind the notification panel'],
  ['components/NotificationCenter.tsx', 310, 'z-popover', 'notification panel itself'],

  // ── Always-on-top progress hairlines ──
  ['components/NexoraMicroProgress.tsx', 37, 'z-skip-link', 'always-on-top 2px progress hairline'],
  ['components/NexoraTopProgressBar.tsx', 93, 'z-skip-link', 'full-width progress bar'],

  // ── Dialogs / modals ──
  ['components/common/EnterpriseConfirmDialog.tsx', 80, 'z-dialog', 'confirmation modal'],
  ['components/finance/HighValueDisbursementModal.tsx', 63, 'z-dialog', 'disbursement approval modal'],
  ['components/finance/PrintableOfficialVoucherModal.tsx', 78, 'z-dialog', 'voucher modal'],
  ['components/navigation/EnterpriseExperienceModeModal.tsx', 113, 'z-dialog', 'experience mode modal'],
  ['components/settings/EnvironmentModeSettingsSection.tsx', 93, 'z-dialog', 'environment settings modal'],
  ['components/EnvironmentModeBanner.tsx', 348, 'z-dialog', 'environment banner modal overlay'],
  ['components/shortcuts/CustomizableShortcutsManagerModal.tsx', 239, 'z-dialog', 'shortcuts manager modal'],
  ['components/TenderWorkspaceView.tsx', 280, 'z-dialog', 'tender modal overlay'],
  ['components/KeyboardShortcutsModal.tsx', 51, 'z-command', 'shortcut reference, command tier'],
  ['components/UniversalCommandCenter.tsx', 795, 'z-command', 'command palette'],

  // ── Drawers ──
  ['components/MobileNavigationDrawer.tsx', 37, 'z-drawer', 'mobile navigation drawer'],
  ['components/records/FastRecordRetrievalDrawer.tsx', 237, 'z-drawer', 'record retrieval drawer'],

  // ── Floating clusters, menus, tooltips ──
  ['components/common/InteractiveGlobalMapPicker.tsx', 164, 'z-popover', 'map control cluster above tiles'],
  ['components/HeaderQuickMenu.tsx', 98, 'z-dropdown', 'anchored dropdown menu'],
  ['components/Tooltip.tsx', 110, 'z-tooltip', 'tooltip'],
  ['components/finance/VoucherEntryTab.tsx', 106, 'z-dropdown', 'anchored voucher menu'],
  ['components/finance/VoucherEntryTab.tsx', 262, 'z-dropdown', 'anchored voucher menu'],
];

let applied = 0;
const problems = [];

for (const [rel, line, to, why] of FIXES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    problems.push(`${rel}: file not found`);
    continue;
  }
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  const idx = line - 1;
  if (lines[idx] === undefined) {
    problems.push(`${rel}:${line} out of range`);
    continue;
  }
  const m = lines[idx].match(/z-\[\d+\]/);
  if (!m) {
    problems.push(`${rel}:${line} no z-[N] on this line (${why})`);
    continue;
  }
  lines[idx] = lines[idx].replace(/z-\[\d+\]/, to);
  fs.writeFileSync(abs, lines.join('\n'), 'utf8');
  applied += 1;
}

console.log(`applied ${applied}/${FIXES.length} z-index replacements.`);
if (problems.length) {
  console.log('\nUNRESOLVED (needs a manual look):');
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
