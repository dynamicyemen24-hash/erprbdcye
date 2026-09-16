import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '../components/DataTable';

vi.mock('../theme/ThemeContext', () => ({
  useDirection: () => ({ direction: 'ltr', isRtl: false }),
}));

const columns = [
  { id: 'sku', header: 'SKU', headerAr: 'رمز المادة', accessor: (r: any) => r.sku, sortable: true },
  {
    id: 'name',
    header: 'Name',
    headerAr: 'الاسم',
    accessor: (r: any) => r.name,
    exportValue: (r: any) => r.name,
  },
  { id: 'qty', header: 'Qty', headerAr: 'الكمية', accessor: (r: any) => r.qty },
];

const data = [
  { id: '1', sku: 'A1', name: 'Widget, deluxe', qty: 10 },
  { id: '2', sku: 'B2', name: 'Gadget "pro"', qty: 5 },
];

describe('DataTable CSV export', () => {
  beforeEach(() => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    (URL as any).revokeObjectURL = vi.fn();
  });

  it('renders an export toolbar and downloads sorted CSV with BOM', () => {
    const clicks: string[] = [];
    const origCreate = document.createElement.bind(document);
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        el.click = (() => {
          clicks.push((el as HTMLAnchorElement).download);
        }) as any;
      }
      return el;
    }) as any);

    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r: any) => r.id}
        lang="en"
        exportable
        exportFilename="items"
      />
    );

    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Export CSV'));
    expect(clicks).toEqual(['items.csv']);

    createSpy.mockRestore();
  });

  it('is hidden when exportable is false', () => {
    render(
      <DataTable columns={columns} data={data} keyExtractor={(r: any) => r.id} lang="en" />
    );
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    expect(screen.queryByText('تصدير CSV')).not.toBeInTheDocument();
  });

  it('exports only selected rows in multi-select mode', async () => {
    let captured = '';
    const origBlob = globalThis.Blob;
    (globalThis as any).Blob = function (parts: any[]) {
      captured = parts.join('');
      return {};
    } as any;

    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r: any) => r.id}
        lang="en"
        exportable
        selectionMode="multi"
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    // First checkbox is select-all; check the first data row (index 1)
    fireEvent.click(checkboxes[1]);
    fireEvent.click(screen.getByText('Export CSV'));

    expect(captured).toContain('A1');
    expect(captured).not.toContain('B2');
    (globalThis as any).Blob = origBlob;
  });
});
