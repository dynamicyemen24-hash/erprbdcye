/**
 * UAMEX ERP™ — Zero-dependency CSV utilities (RFC 4180 subset)
 * parse: quoted fields, embedded commas/newlines, CRLF, BOM, auto-delimiter (, or ;).
 * Used by CSVImportWizard and covered by unit tests.
 */

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  delimiter: ',' | ';';
}

function stripBOM(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function detectDelimiter(sample: string): ',' | ';' {
  const firstLine = sample.split(/\r?\n/, 1)[0] || '';
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  // Excel-Arabic locales export with ';' — pick the dominant separator
  if (semis > commas) return ';';
  return ',';
}

export function parseCSV(text: string): ParsedCSV {
  const clean = stripBOM(text);
  if (!clean.trim()) return { headers: [], rows: [], delimiter: ',' };
  const delimiter = detectDelimiter(clean);

  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(field);
        field = '';
      } else if (ch === '\r') {
        // skip — handled with \n
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  // Trailing content without newline
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-empty rows (trailing blank lines)
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (nonEmpty.length === 0) return { headers: [], rows: [], delimiter };
  const [headers, ...data] = nonEmpty;
  return {
    headers: headers.map((h) => h.trim()),
    rows: data,
    delimiter,
  };
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

/**
 * Auto-match CSV headers to target fields by normalized key/label (ar+en).
 * Returns map: csvColumnIndex -> fieldKey | null (unmapped).
 */
export function autoMapColumns(
  headers: string[],
  fields: { key: string; label: string; labelAr?: string }[]
): (string | null)[] {
  const candidates = new Map<string, string>();
  for (const f of fields) {
    candidates.set(normalizeHeader(f.key), f.key);
    candidates.set(normalizeHeader(f.label), f.key);
    if (f.labelAr) candidates.set(normalizeHeader(f.labelAr), f.key);
  }
  return headers.map((h) => candidates.get(normalizeHeader(h)) || null);
}

export type FieldType = 'string' | 'number' | 'email' | 'date';

export interface ImportFieldDef {
  key: string;
  label: string;
  labelAr?: string;
  required?: boolean;
  type?: FieldType;
  validate?: (value: string) => string | null;
  transform?: (value: string) => unknown;
}

export interface ValidatedRow {
  index: number; // 1-based data row number (excluding header)
  values: Record<string, string>;
  errors: string[];
  mapped: Record<string, unknown>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRows(
  headers: string[],
  rows: string[][],
  mapping: (string | null)[],
  fields: ImportFieldDef[],
  lang: 'ar' | 'en' = 'ar'
): ValidatedRow[] {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  return rows.map((cells, i) => {
    const values: Record<string, string> = {};
    headers.forEach((_, colIdx) => {
      const fieldKey = mapping[colIdx];
      if (fieldKey) values[fieldKey] = (cells[colIdx] ?? '').trim();
    });

    const errors: string[] = [];
    const mapped: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = values[f.key] ?? '';
      if (f.required && !raw) {
        errors.push(
          lang === 'ar' ? `الحقل «${f.labelAr || f.label}» مطلوب` : `Field "${f.label}" is required`
        );
        continue;
      }
      if (!raw) continue;
      if (f.type === 'number') {
        const n = Number(raw.replace(/,/g, ''));
        if (!Number.isFinite(n)) {
          errors.push(
            lang === 'ar'
              ? `«${f.labelAr || f.label}» يجب أن يكون رقماً (صف ${i + 1})`
              : `"${f.label}" must be a number (row ${i + 1})`
          );
          continue;
        }
        mapped[f.key] = n;
      } else if (f.type === 'email') {
        if (!EMAIL_RE.test(raw)) {
          errors.push(
            lang === 'ar' ? `بريد إلكتروني غير صالح (صف ${i + 1})` : `Invalid email (row ${i + 1})`
          );
          continue;
        }
        mapped[f.key] = raw;
      } else if (f.type === 'date') {
        const t = Date.parse(raw);
        if (Number.isNaN(t)) {
          errors.push(
            lang === 'ar' ? `تاريخ غير صالح (صف ${i + 1})` : `Invalid date (row ${i + 1})`
          );
          continue;
        }
        mapped[f.key] = new Date(t).toISOString().split('T')[0];
      } else {
        mapped[f.key] = f.transform ? f.transform(raw) : raw;
      }
      if (f.validate) {
        const custom = f.validate(raw);
        if (custom) errors.push(custom);
      }
    }
    return { index: i + 1, values, errors, mapped };
  });
}

/** Download a UTF-8 BOM CSV template (Excel-Arabic safe). */
export function downloadCsvTemplate(filename: string, headers: string[]): void {
  const csv = '\uFEFF' + headers.join(',') + '\r\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
