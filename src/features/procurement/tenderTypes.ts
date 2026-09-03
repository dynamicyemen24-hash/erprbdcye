/**
 * UAMEX ERP™ — NEB-14: Procurement & Tenders OS
 * Tender & Auction Domain Types
 *
 * Organization: جمعية رُحماء بينهم للعمل الإنساني والتنمية
 * System: UAMEX ERP™ Intelligent Enterprise Operating System
 */

// ─── Tender Types ──────────────────────────────────────────

export type TenderType =
  | 'WORKS'
  | 'SUPPLIES'
  | 'SERVICES'
  | 'MANPOWER'
  | 'DESIGN'
  | 'COMBINED';

export type TenderProcessType =
  | 'OPEN'
  | 'RESTRICTED'
  | 'NEGOTIATED'
  | 'COMPETITIVE_DIALOGUE'
  | 'FRAMEWORK';

export type TenderStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'BID_SUBMISSION'
  | 'CLARIFICATIONS'
  | 'EVALUATION_TECH'
  | 'EVALUATION_FIN'
  | 'AWARD_PENDING'
  | 'AWARDED'
  | 'CONTRACTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CHALLENGED';

export type TenderSource =
  | 'GOVERNMENT'
  | 'DONOR'
  | 'INTERNAL'
  | 'PRIVATE_SECTOR';

export type AuctionType =
  | 'FORWARD'
  | 'DUTCH'
  | 'VICKREY'
  | 'COMBINATORIAL';

export type AuctionStatus =
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type BidStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'WITHDRAWN'
  | 'EVALUATED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'AWARDED';

export type EvaluationCriterionType = 'TECHNICAL' | 'FINANCIAL' | 'COMPLIANCE' | 'SOCIAL';
