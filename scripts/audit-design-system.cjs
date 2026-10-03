/**
 * Design System maturity audit.
 *
 * Compares the shipped primitives against the set every mature design system
 * converges on (MUI, Chakra, Ant Design, Carbon, Fluent 2, SAP Fiori, Radix).
 * The point is to make the *gaps* explicit: a component that is missing is a
 * component every screen reinvents by hand, which is how 863 raw <button>
 * elements appear in the first place.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DS = path.join(ROOT, 'src', 'design-system');

const names = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.tsx'))
        .map((f) => path.basename(f, '.tsx'))
    : [];

/** Primitives a mature system is expected to ship, grouped by concern. */
const BASELINE = {
  'Actions': ['Button', 'IconButton', 'Toggle', 'ToggleGroup', 'Menu', 'Dropdown'],
  'Forms': [
    'Input',
    'NumberInput',
    'Select',
    'Combobox',
    'Checkbox',
    'RadioGroup',
    'Switch',
    'Slider',
    'Textarea',
    'DatePicker',
    'FileUpload',
    'FormField',
    'Form',
  ],
  'Navigation': ['Tabs', 'Breadcrumb', 'Pagination', 'Stepper', 'Tree', 'CommandPalette'],
  'Overlay': ['Modal', 'Drawer', 'Popover', 'Tooltip', 'Menu', 'ConfirmDialog'],
  'Feedback': ['Toast', 'Alert', 'EmptyState', 'ErrorState', 'Spinner', 'Skeleton', 'Progress'],
  'Data display': ['DataTable', 'Card', 'Badge', 'Avatar', 'Timeline', 'Accordion', 'DescriptionList'],
  'Layout': ['Page', 'Card', 'Separator', 'ScrollArea', 'Splitter', 'Masonry'],
  'Utilities': ['VisuallyHidden', 'Portal', 'RovingFocus', 'useMediaQuery', 'useFocusTrap'],
};

const shipped = new Set([
  ...names(path.join(DS, 'components')),
  ...names(path.join(DS, 'components', 'form')),
  ...fs
    .readdirSync(path.join(DS, 'hooks'))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => path.basename(f, '.ts').replace(/^use/, 'use')),
]);

let present = 0;
let total = 0;
const missing = [];

for (const [group, items] of Object.entries(BASELINE)) {
  const have = [];
  const lack = [];
  for (const item of items) {
    total += 1;
    if (shipped.has(item)) {
      present += 1;
      have.push(item);
    } else {
      lack.push(item);
      missing.push(`${group}/${item}`);
    }
  }
  console.log(`\n${group}`);
  console.log(`  have  : ${have.join(', ') || '—'}`);
  console.log(`  MISSING: ${lack.join(', ') || '—'}`);
}

console.log('\n' + '='.repeat(70));
console.log(`  ${present}/${total} baseline primitives present`);

// Raw primitives in the view layer: the symptom the baseline is meant to prevent.
const compDir = path.join(ROOT, 'src', 'components');
let buttons = 0;
let inputs = 0;
let labels = 0;
for (const f of fs.readdirSync(compDir)) {
  if (!f.endsWith('.tsx')) continue;
  const t = fs.readFileSync(path.join(compDir, f), 'utf8');
  buttons += (t.match(/<button\b/g) || []).length;
  inputs += (t.match(/<(input|select|textarea)\b/g) || []).length;
  labels += (t.match(/<label\b/g) || []).length;
}
console.log(`\n  raw <button> in views      : ${buttons}`);
console.log(`  raw form controls in views: ${inputs}`);
console.log(`  raw <label> in views      : ${labels}`);
