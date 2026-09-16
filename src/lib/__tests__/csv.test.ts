import { describe, it, expect, vi } from 'vitest';
import { parseCSV, autoMapColumns, validateRows, downloadCsvTemplate } from '../csv';

describe('parseCSV', () => {
  it('parses a simple file with headers', () => {
    const { headers, rows, delimiter } = parseCSV('sku,name,qty\nA1,Widget,10\nB2,Gadget,5\n');
    expect(delimiter).toBe(',');
    expect(headers).toEqual(['sku', 'name', 'qty']);
    expect(rows).toEqual([
      ['A1', 'Widget', '10'],
      ['B2', 'Gadget', '5'],
    ]);
  });

  it('handles quoted fields with commas and escaped quotes', () => {
    const { headers, rows } = parseCSV('name,note\n"Acme, Inc","said ""hi"""\n');
    expect(headers).toEqual(['name', 'note']);
    expect(rows).toEqual([['Acme, Inc', 'said "hi"']]);
  });

  it('handles CRLF, embedded newlines, and BOM', () => {
    const { headers, rows } = parseCSV('﻿a,b\r\n"line1\nline2",x\r\n');
    expect(headers).toEqual(['a', 'b']);
    expect(rows).toEqual([['line1\nline2', 'x']]);
  });

  it('auto-detects semicolon delimiters (Excel-Arabic locale)', () => {
    const { headers, rows, delimiter } = parseCSV('sku;name;qty\nA1;صنف;10\n');
    expect(delimiter).toBe(';');
    expect(headers).toEqual(['sku', 'name', 'qty']);
    expect(rows).toEqual([['A1', 'صنف', '10']]);
  });

  it('returns empty for blank input', () => {
    expect(parseCSV('   \n  ')).toEqual({ headers: [], rows: [], delimiter: ',' });
  });
});

describe('autoMapColumns', () => {
  const fields = [
    { key: 'sku', label: 'SKU', labelAr: 'رمز المادة' },
    { key: 'name_ar', label: 'Name (AR)', labelAr: 'اسم المادة' },
    { key: 'qty', label: 'Quantity', labelAr: 'الكمية' },
  ];

  it('matches by key, label, and Arabic label', () => {
    expect(autoMapColumns(['sku', 'اسم المادة', 'Quantity', 'ignored'], fields)).toEqual([
      'sku',
      'name_ar',
      'qty',
      null,
    ]);
  });

  it('normalizes case, spaces, and separators', () => {
    expect(autoMapColumns([' SKU ', 'name-ar', 'QUANTITY'], fields)).toEqual(['sku', 'name_ar', 'qty']);
  });
});

describe('validateRows', () => {
  const fields = [
    { key: 'sku', label: 'SKU', labelAr: 'رمز المادة', required: true },
    { key: 'qty', label: 'Quantity', labelAr: 'الكمية', type: 'number' as const },
    { key: 'email', label: 'Email', labelAr: 'البريد', type: 'email' as const },
  ];

  it('flags missing required fields and bad numbers/emails', () => {
    const out = validateRows(
      ['sku', 'qty', 'email'],
      [['A1', 'ten', 'bad'], ['', '5', 'a@b.c']],
      ['sku', 'qty', 'email'],
      fields,
      'en'
    );
    expect(out[0].errors.length).toBeGreaterThanOrEqual(2);
    expect(out[0].mapped.qty).toBeUndefined();
    expect(out[1].errors.some((e) => e.includes('required'))).toBe(true);
    expect(out[1].mapped.qty).toBe(5);
  });

  it('transforms valid rows with typed values', () => {
    const out = validateRows(
      ['sku', 'qty', 'email'],
      [['A1', '10', 'a@b.co']],
      ['sku', 'qty', 'email'],
      fields,
      'en'
    );
    expect(out[0].errors).toEqual([]);
    expect(out[0].mapped).toMatchObject({ sku: 'A1', qty: 10, email: 'a@b.co' });
  });
});

describe('downloadCsvTemplate', () => {
  it('triggers a download with the given headers', () => {
    if (typeof document === 'undefined') return;
    const createSpy = vi.fn(() => 'blob:mock');
    const revokeSpy = vi.fn();
    (URL as any).createObjectURL = createSpy;
    (URL as any).revokeObjectURL = revokeSpy;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadCsvTemplate('items.csv', ['sku', 'name_ar']);
    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
