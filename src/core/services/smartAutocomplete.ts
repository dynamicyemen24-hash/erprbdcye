/**
 * NexoraOS™ Context-Aware Smart Autocomplete Engine
 * Suggests items ranked by Fuzzy Match + Context Affinity + Recency + Frequency with full Explainability.
 */

import { fuzzyMatchArabic, normalizeArabicText } from '../utils/arabicSearch';

export interface AutocompleteSuggestion<T = any> {
  id: string;
  labelAr: string;
  labelEn: string;
  subLabelAr?: string;
  subLabelEn?: string;
  category: string;
  score: number; // 0 to 100
  confidence: number; // 0.0 to 1.0
  reasonAr: string;
  reasonEn: string;
  data: T;
}

export interface AutocompleteContext {
  currentProjectId?: string;
  currentProgramId?: string;
  currentGovernorate?: string;
  currentTab?: string;
  currentRole?: string;
  recentItemIds?: string[];
  frequentItemMap?: Record<string, number>;
}

export function rankAutocompleteSuggestions<T extends Record<string, any>>(
  query: string,
  items: T[],
  extractors: {
    getId: (item: T) => string;
    getLabelAr: (item: T) => string;
    getLabelEn: (item: T) => string;
    getSubLabelAr?: (item: T) => string;
    getSubLabelEn?: (item: T) => string;
    getCategory?: (item: T) => string;
    getProjectId?: (item: T) => string | undefined;
    getGovernorate?: (item: T) => string | undefined;
  },
  context: AutocompleteContext = {},
  maxResults: number = 8
): AutocompleteSuggestion<T>[] {
  const normQuery = normalizeArabicText(query || '');

  const ranked = items.map(item => {
    const id = extractors.getId(item);
    const labelAr = extractors.getLabelAr(item) || '';
    const labelEn = extractors.getLabelEn(item) || '';
    const subLabelAr = extractors.getSubLabelAr?.(item) || '';
    const subLabelEn = extractors.getSubLabelEn?.(item) || '';
    const category = extractors.getCategory?.(item) || 'GENERAL';
    const itemProjId = extractors.getProjectId?.(item);
    const itemGov = extractors.getGovernorate?.(item);

    let matchScore = 0;
    if (normQuery) {
      const arScore = fuzzyMatchArabic(normQuery, labelAr + ' ' + subLabelAr);
      const enScore = fuzzyMatchArabic(normQuery, labelEn + ' ' + subLabelEn);
      matchScore = Math.max(arScore, enScore);
    } else {
      matchScore = 50; // Base score for empty query (context browsing)
    }

    if (matchScore === 0 && normQuery) {
      return null;
    }

    // Context Boosts
    let contextBoost = 0;
    const reasonsAr: string[] = [];
    const reasonsEn: string[] = [];

    // 1. Current Project Match Boost (+25 pts)
    if (context.currentProjectId && itemProjId === context.currentProjectId) {
      contextBoost += 25;
      reasonsAr.push('مرتبط بالمشروع النشط الحالي');
      reasonsEn.push('Linked to active project');
    }

    // 2. Current Governorate Match Boost (+15 pts)
    if (context.currentGovernorate && itemGov && normalizeArabicText(itemGov) === normalizeArabicText(context.currentGovernorate)) {
      contextBoost += 15;
      reasonsAr.push('نفس النطاق الجغرافي');
      reasonsEn.push('Same geographic area');
    }

    // 3. Frequency Boost (Up to +20 pts)
    if (context.frequentItemMap && context.frequentItemMap[id]) {
      const count = context.frequentItemMap[id];
      const freqBoost = Math.min(20, count * 3);
      contextBoost += freqBoost;
      reasonsAr.push(`تم استخدامه ${count} مرات مؤخراً`);
      reasonsEn.push(`Used ${count} times recently`);
    }

    // 4. Recency Boost (+15 pts)
    if (context.recentItemIds && context.recentItemIds.includes(id)) {
      contextBoost += 15;
      if (reasonsAr.length === 0) {
        reasonsAr.push('من أحدث العمليات المستخدمة');
        reasonsEn.push('Recently used');
      }
    }

    if (reasonsAr.length === 0) {
      reasonsAr.push('مطابقة معيارية للبحث');
      reasonsEn.push('Standard search match');
    }

    const totalScore = Math.min(100, matchScore + contextBoost);
    const confidence = parseFloat((totalScore / 100).toFixed(2));

    const suggestion: AutocompleteSuggestion<T> = {
      id,
      labelAr,
      labelEn,
      subLabelAr,
      subLabelEn,
      category,
      score: totalScore,
      confidence,
      reasonAr: reasonsAr.join(' • '),
      reasonEn: reasonsEn.join(' • '),
      data: item
    };

    return suggestion;
  }).filter(Boolean) as AutocompleteSuggestion<T>[];

  return ranked.sort((a, b) => b.score - a.score).slice(0, maxResults);
}
