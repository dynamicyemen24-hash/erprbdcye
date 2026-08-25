/**
 * NexoraOS™ — Shared Constants
 * Centralizes magic numbers and configuration values used across the application.
 */

// ─── Animation Durations (ms) ──────────────────────────
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
} as const;

// ─── Intervals ─────────────────────────────────────────
export const INTERVALS = {
  AUTO_THEME_EVAL: 15000,
  SESSION_CHECK: 60000,
  HEARTBEAT: 30000,
  TOAST_DURATION: 5000,
  TOAST_AUTO_DISMISS: 8000,
} as const;

// ─── Pagination ────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  SMALL_PAGE_SIZE: 10,
  LARGE_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
} as const;

// ─── Chart Colors ──────────────────────────────────────
export const CHART_COLORS = {
  PRIMARY: '#059669',
  ACCENT: '#d97706',
  DANGER: '#ef4444',
  INFO: '#3b82f6',
  MUTED: '#94a3b8',
  SERIES: ['#059669', '#d97706', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'],
} as const;

// ─── Z-Index Layers ────────────────────────────────────
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 40,
  STICKY: 50,
  OVERLAY: 60,
  MODAL: 70,
  POPOVER: 75,
  TOAST: 80,
} as const;

// ─── Date Formats ──────────────────────────────────────
export const DATE_FORMATS = {
  AR: 'ar-YE',
  EN: 'en-US',
  SHORT: { hour: '2-digit', minute: '2-digit' } as const,
  FULL: { hour: '2-digit', minute: '2-digit', second: '2-digit' } as const,
} as const;

// ─── API ───────────────────────────────────────────────
export const API = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// ─── Storage Keys ──────────────────────────────────────
export const STORAGE_KEYS = {
  THEME: 'rbd_theme',
  ORG_NAME: 'rbd_org_name',
  LANGUAGE: 'rbd_lang',
  DENSITY: 'rbd_density',
  SESSION: 'nexora_session',
  DASHBOARD_PRESETS: 'nexora_dashboard_presets',
} as const;

// ─── Layout ────────────────────────────────────────────
export const LAYOUT = {
  SIDEBAR_EXPANDED: 256,
  SIDEBAR_COLLAPSED: 64,
  HEADER_HEIGHT: 108,
  MOBILE_BOTTOM_NAV: 64,
  MAX_MOBILE_WIDTH: 85,
} as const;
