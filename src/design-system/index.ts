/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — Design System v3.0
 * One Platform. One Organization. One Vision.
 *
 * Adapted from NICYE Global Government Design System architecture
 * for NexoraOS Tailwind CSS styling conventions.
 *
 * Architecture: Tokens → Theme → Runtime → Hooks → Components → Layout
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

// ─── Utilities ─────────────────────────────────────────────
export { cn } from './utils/cn';
export { isRTL, isRTLLocale, getDirection, logicalStart, logicalEnd, mirrorIndex, type Direction } from './utils/rtl';
export { joinAriaIds, getAriaBoolean } from './utils/aria';
export { isArrowKey, isActivationKey, isEscapeKey, isNavigationKey } from './utils/keyboard';

// ─── Theme ─────────────────────────────────────────────────
export { ThemeProvider, useTheme, useDirection, type ThemeMode, type ThemeContextValue, type ThemeProviderProps } from './theme/ThemeContext';

// ─── Hooks (19 reusable hooks) ─────────────────────────────
export { useControllableState, type UseControllableStateOptions } from './hooks/useControllableState';
export { useDisclosure, type UseDisclosureOptions, type UseDisclosureReturn } from './hooks/useDisclosure';
export { useFocusTrap, type UseFocusTrapOptions } from './hooks/useFocusTrap';
export { useClickOutside, type UseClickOutsideOptions } from './hooks/useClickOutside';
export { useEscapeKey } from './hooks/useEscapeKey';
export { useToggle } from './hooks/useToggle';
export { useDebouncedValue } from './hooks/useDebouncedValue';
export { useLockBodyScroll } from './hooks/useLockBodyScroll';
export { useMediaQuery } from './hooks/useMediaQuery';
export { useMounted } from './hooks/useMounted';
export { useReducedMotion } from './hooks/useReducedMotion';
export { useOnlineStatus } from './hooks/useOnlineStatus';
export { useResizeObserver } from './hooks/useResizeObserver';
export { useIntersectionObserver } from './hooks/useIntersectionObserver';
export { useDocumentTitle } from './hooks/useDocumentTitle';
export { useLatest } from './hooks/useLatest';
export { usePrevious } from './hooks/usePrevious';
export { useId } from './hooks/useId';
export { useEvent } from './hooks/useEvent';

// ─── Compound Components ───────────────────────────────────
export { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal, type ModalProps, type ModalSize, type ModalVariant, type ConfirmModalProps } from './components/Modal';
export { Drawer, DrawerHeader, DrawerBody, DrawerFooter, type DrawerProps, type DrawerPosition } from './components/Drawer';
export { Tooltip, TooltipTrigger, TooltipContent, type TooltipProps, type TooltipSide } from './components/Tooltip';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent, type AccordionProps, type AccordionItemProps } from './components/Accordion';
export { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator, MenuGroup, MenuLabel, type MenuProps, type MenuItemProps } from './components/Menu';
export { Popover, PopoverTrigger, PopoverContent, type PopoverProps } from './components/Popover';
export { Stepper, type StepData, type StepperProps } from './components/Stepper';

// ─── Notification System ───────────────────────────────────
export { ToastProvider, useToast, type ToastVariant, type ToastPosition, type ToastData, type AddToastOptions, type ToastContextValue, type ToastProviderProps } from './components/Toast';

// ─── Command Palette ───────────────────────────────────────
// NOTE: single source of truth is UniversalCommandCenter (mounted in App).
// The legacy DS CommandPalette + useCommandPalette were removed (dead code).

// ─── Navigation ────────────────────────────────────────────
export { Breadcrumb, type BreadcrumbProps, type BreadcrumbItem } from './components/Breadcrumb';
export { Pagination, type PaginationProps } from './components/Pagination';

// ─── Data Display ──────────────────────────────────────────
export { Avatar, AvatarGroup, type AvatarProps, type AvatarSize, type AvatarGroupProps, type AvatarGroupItem } from './components/Avatar';
export { DataTable, type DataTableProps, type DataTableColumn, type SortDirection, type SelectionMode, type TableDensity, type ColumnAlign } from './components/DataTable';

// ─── Data Entry ────────────────────────────────────────────
export { DatePicker, type DatePickerProps, type CalendarType } from './components/DatePicker';
export { FileUpload, type FileUploadProps, type FileUploadFile } from './components/FileUpload';

// ─── Feedback ──────────────────────────────────────────────
export { ConfirmDialog, type ConfirmDialogProps } from './components/ConfirmDialog';
export { EmptyState, type EmptyStateProps, type EmptyStateAction, type EmptyStateVariant } from './components/EmptyState';
export { ErrorState, type ErrorStateProps } from './components/ErrorState';

// ─── Layout ────────────────────────────────────────────────
export { Page, PageHeader, PageSection, PageActions, PageGrid, type PageProps, type PageHeaderProps, type PageSectionProps, type PageActionsProps, type PageGridProps } from './components/Page';

// ─── Loading / Progress ────────────────────────────────────
export { Spinner, SpinnerOverlay, type SpinnerProps, type SpinnerSize, type SpinnerVariant, type SpinnerOverlayProps } from './components/Spinner';
export { ProgressRing, type ProgressRingProps, type ProgressRingSize, type ProgressRingVariant } from './components/ProgressRing';
export { Skeleton, SkeletonCard, SkeletonTable, SkeletonKPI, SkeletonChart, type SkeletonProps, type SkeletonVariant, type SkeletonShape } from './components/Skeleton';

// ─── Enterprise Display ─────────────────────────────────────
export { EnterpriseCard, EnterpriseStat, type EnterpriseCardProps, type CardVariant, type CardPadding, type EnterpriseStatProps } from './components/EnterpriseCard';
export { EnterpriseTabs, TabPanel, type EnterpriseTabsProps, type Tab, type TabPanelProps } from './components/EnterpriseTabs';
export { EnterpriseAlert, type EnterpriseAlertProps, type AlertType } from './components/EnterpriseAlert';

// ─── Accessibility & Responsive ────────────────────────────
export { AccessibilityProvider, useAccessibility, type AccessibilityProviderProps, type AccessibilityContextValue } from './components/AccessibilityProvider';
export { MobileLayout, type MobileLayoutProps, type MobileTab } from './components/MobileLayout';
export { PrintLayout, type PrintLayoutProps } from './components/PrintLayout';

// ─── Form Primitives ───────────────────────────────────────
export { FormField, type FormFieldProps } from './components/form/FormField';
export { Input, PasswordInput, type InputProps, type InputSize, type InputVariant, type PasswordInputProps } from './components/form/Input';
export { Textarea, type TextareaProps, type TextareaSize } from './components/form/Textarea';
export { Select, type SelectProps, type SelectOption, type SelectSize } from './components/form/Select';
export { Checkbox, type CheckboxProps } from './components/form/Checkbox';
export { Switch, type SwitchProps, type SwitchSize } from './components/form/Switch';

// ─── i18n / Localization ───────────────────────────────────
export { LocalizationProvider, useLocalization, useTranslation, type Locale, type LocalizationContextValue, type LocalizationProviderProps } from './i18n/LocalizationProvider';
