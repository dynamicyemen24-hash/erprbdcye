const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

const ESCAPE_REGEX = /[&<>"']/g;

export function escapeHtml(str: string): string {
  return str.replace(ESCAPE_REGEX, (ch) => ESCAPE_MAP[ch]);
}

const STRIP_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_CONTENT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = /\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URI_REGEX = /javascript\s*:/gi;
const VBSCRIPT_URI_REGEX = /vbscript\s*:/gi;
const DATA_URI_SCRIPT_REGEX = /data\s*:\s*text\/html/gi;

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let clean = html;
  clean = SCRIPT_CONTENT_REGEX.test(clean)
    ? clean.replace(SCRIPT_CONTENT_REGEX, '')
    : clean;
  clean = clean.replace(EVENT_HANDLER_REGEX, '');
  clean = clean.replace(JAVASCRIPT_URI_REGEX, '');
  clean = clean.replace(VBSCRIPT_URI_REGEX, '');
  clean = clean.replace(DATA_URI_SCRIPT_REGEX, '');

  return clean;
}

export function stripAllHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html.replace(STRIP_TAG_REGEX, '').trim();
}
