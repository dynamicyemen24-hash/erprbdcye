/**
 * NexoraOS™ Arabic Text Normalization & Intelligent Fuzzy Match Engine
 * Provides sub-millisecond search across Arabic and English enterprise datasets.
 */

export function normalizeArabicText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    // Remove Arabic Tashkeel / Harakat
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove Tatweel / Kashida
    .replace(/\u0640/g, '')
    // Normalize Alif forms (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbuta and Haa (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize Yaa forms (ى, ئ -> ي)
    .replace(/[ىئ]/g, 'ي')
    // Normalize Waw with Hamza (ؤ -> و)
    .replace(/ؤ/g, 'و')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * High-speed fuzzy match check. Returns a score between 0 (no match) and 100 (exact match).
 */
export function fuzzyMatchArabic(query: string, target: string): number {
  if (!query || !target) return 0;
  
  const normQuery = normalizeArabicText(query);
  const normTarget = normalizeArabicText(target);
  
  if (normTarget === normQuery) return 100;
  if (normTarget.startsWith(normQuery)) return 95;
  if (normTarget.includes(normQuery)) return 85;
  
  // Word by word prefix match
  const queryWords = normQuery.split(' ').filter(Boolean);
  const targetWords = normTarget.split(' ').filter(Boolean);
  
  const allWordsMatch = queryWords.every(qw => 
    targetWords.some(tw => tw.startsWith(qw) || tw.includes(qw))
  );
  
  if (allWordsMatch) return 75;
  
  // Character subsequence match for typos (up to length 15)
  if (normQuery.length <= 15) {
    let qIdx = 0;
    for (let tIdx = 0; tIdx < normTarget.length && qIdx < normQuery.length; tIdx++) {
      if (normTarget[tIdx] === normQuery[qIdx]) qIdx++;
    }
    if (qIdx === normQuery.length) return 50;
  }
  
  return 0;
}
