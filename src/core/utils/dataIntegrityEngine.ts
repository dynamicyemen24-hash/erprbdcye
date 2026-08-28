// Enterprise Data Integrity, Anti-Duplication & Normalization Engine
// UAMEX ERP™ - High Speed, Zero Friction Data Quality Guard

import { UniversalBeneficiary, BeneficiaryArchetype } from '../data/universalBeneficiaryTypes';

/**
 * Normalizes Arabic text for high-precision search and deduplication.
 * Removes tashkeel (diacritics), unifies hamzas (أ, إ, آ -> ا), unifies ta marbuta (ة -> ه) and yaa (ى -> ي).
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Unify Alif variants
    .replace(/[أإآء]/g, 'ا')
    // Unify Ta Marbuta & Ha
    .replace(/ة/g, 'ه')
    // Unify Alif Maksura & Yaa
    .replace(/ى/g, 'ي')
    // Collapse consecutive whitespaces
    .replace(/\s+/g, ' ');
}

/**
 * Normalizes local phone numbers to a unified format.
 * Strips non-digit chars, handles 967 country code, 00967, +967.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('967') && digits.length === 12) {
    return '0' + digits.slice(3);
  }
  if (digits.startsWith('00967') && digits.length === 14) {
    return '0' + digits.slice(5);
  }
  return digits;
}

/**
 * Validates Yemeni National ID (11 digits numeric format).
 */
export function validateYemeniNationalId(nationalId?: string): { isValid: boolean; messageAr?: string } {
  if (!nationalId || nationalId.trim() === '') {
    return { isValid: true }; // optional if not provided
  }
  const clean = nationalId.trim().replace(/\D/g, '');
  if (clean.length !== 11) {
    return {
      isValid: false,
      messageAr: 'الرقم الوطني اليمني يتكون من 11 رقماً دقيقاً'
    };
  }
  return { isValid: true };
}

/**
 * Calculates Levenshtein similarity ratio between two normalized strings (0 to 1).
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeArabicText(s1);
  const norm2 = normalizeArabicText(s2);
  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const len1 = norm1.length;
  const len2 = norm2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

export interface DuplicateCheckResult {
  hasExactDuplicate: boolean;
  hasWarningDuplicate: boolean;
  reasonAr?: string;
  matchedBeneficiaryId?: string;
  matchedBeneficiaryCode?: string;
  matchedBeneficiaryName?: string;
}

/**
 * Real-time instant duplicate checker.
 * Zero friction: Strict duplicates (National ID) block to prevent data corruption.
 * Near matches (similar name in same district) warn with non-blocking feedback.
 */
export function checkBeneficiaryDuplicates(
  candidate: {
    id?: string;
    archetype: BeneficiaryArchetype;
    full_name_ar: string;
    phone_primary?: string;
    national_id?: string;
    governorate?: string;
    district?: string;
    gps_lat?: number;
    gps_lng?: number;
  },
  existingList: any[]
): DuplicateCheckResult {
  const candidateNormName = normalizeArabicText(candidate.full_name_ar);
  const candidateNormPhone = normalizePhoneNumber(candidate.phone_primary || '');
  const candidateNationalId = (candidate.national_id || '').replace(/\D/g, '');

  for (const item of existingList) {
    if (candidate.id && item.id === candidate.id) {
      continue; // skip self when editing
    }

    // 1. Exact National ID match (Definite Duplicate)
    const itemNationalId = (
      item.individual_details?.national_id ||
      item.family_details?.head_national_id ||
      item.national_id ||
      ''
    ).replace(/\D/g, '');

    if (candidateNationalId && itemNationalId && candidateNationalId === itemNationalId) {
      return {
        hasExactDuplicate: true,
        hasWarningDuplicate: false,
        reasonAr: `تطابق مؤكد بالرقم الوطني (${candidateNationalId}) مع المستفيد: ${item.full_name_ar || item.name}`,
        matchedBeneficiaryId: item.id,
        matchedBeneficiaryCode: item.beneficiary_code,
        matchedBeneficiaryName: item.full_name_ar || item.name
      };
    }

    // 2. Exact Phone match for Individual records (Definite Duplicate if same name or close)
    const itemPhone = normalizePhoneNumber(item.phone_primary || item.phone || '');
    if (
      candidateNormPhone &&
      itemPhone &&
      candidateNormPhone === itemPhone &&
      candidate.archetype === 'INDIVIDUAL' &&
      candidateNormPhone.length >= 8
    ) {
      const nameSim = calculateStringSimilarity(candidateNormName, item.full_name_ar || item.name || '');
      if (nameSim >= 0.7) {
        return {
          hasExactDuplicate: true,
          hasWarningDuplicate: false,
          reasonAr: `تطابق تام برقم الهاتف (${candidate.phone_primary}) مع السجل: ${item.full_name_ar || item.name}`,
          matchedBeneficiaryId: item.id,
          matchedBeneficiaryCode: item.beneficiary_code,
          matchedBeneficiaryName: item.full_name_ar || item.name
        };
      }
    }

    // 3. Name Similarity in the same District (Warning Match — Non-blocking)
    if (
      candidate.district &&
      item.district &&
      candidate.district === item.district &&
      candidateNormName.length >= 6
    ) {
      const nameSim = calculateStringSimilarity(candidateNormName, item.full_name_ar || item.name || '');
      if (nameSim >= 0.88) {
        return {
          hasExactDuplicate: false,
          hasWarningDuplicate: true,
          reasonAr: `تشابه قوي في الاسم (${Math.round(nameSim * 100)}%) بنفس المديرية (${candidate.district}) مع: ${item.full_name_ar || item.name}`,
          matchedBeneficiaryId: item.id,
          matchedBeneficiaryCode: item.beneficiary_code,
          matchedBeneficiaryName: item.full_name_ar || item.name
        };
      }
    }

    // 4. GPS Geographic Proximity for Water Wells and Mosques (Warning if within 100 meters)
    if (
      candidate.archetype === 'COMMUNITY_ENTITY' &&
      candidate.gps_lat &&
      candidate.gps_lng &&
      item.community_entity_details?.gps_latitude &&
      item.community_entity_details?.gps_longitude
    ) {
      const latDiff = Math.abs(candidate.gps_lat - item.community_entity_details.gps_latitude);
      const lngDiff = Math.abs(candidate.gps_lng - item.community_entity_details.gps_longitude);
      // Roughly within ~100m (0.001 degrees is approx 111m)
      if (latDiff < 0.001 && lngDiff < 0.001) {
        return {
          hasExactDuplicate: false,
          hasWarningDuplicate: true,
          reasonAr: `إحداثيات جغرافية متطابقة أو قريبة جداً مع مرفق مسجل سابقاً: ${item.full_name_ar || item.name}`,
          matchedBeneficiaryId: item.id,
          matchedBeneficiaryCode: item.beneficiary_code,
          matchedBeneficiaryName: item.full_name_ar || item.name
        };
      }
    }
  }

  return {
    hasExactDuplicate: false,
    hasWarningDuplicate: false
  };
}
