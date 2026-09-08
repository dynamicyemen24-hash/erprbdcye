import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import React from 'react';

vi.mock('../../design-system/theme/ThemeContext', () => ({
  useDirection: () => ({ direction: 'ltr', isRtl: false }),
}));

const columns: DataTableColumn[] = [
  { id: 'name', header: 'Name', accessor: (row: any) => row.name, sortable: true },
  { id: 'value', header: 'Value', accessor: (row: any) => row.value },
];

const data = [
  { id: '1', name: 'Alpha', value: 100 },
  { id: '2', name: 'Beta', value: 200 },
];

describe('DataTable', () => {
  it('renders columns and rows', () => {
    render(<DataTable columns={columns} data={data} keyExtractor={(r) => r.id} lang="en" />);
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Beta')).toBeDefined();
  });

  it('renders empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} keyExtractor={(r) => r.id} lang="en" />);
    expect(screen.getByText('No data')).toBeDefined();
  });

  it('handles row click', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} onRowClick={onRowClick} lang="en" />
    );
    fireEvent.click(screen.getByText('Alpha'));
    expect(onRowClick).toHaveBeenCalledWith(data[0], 0);
  });

  it('handles sort click', () => {
    const onSortChange = vi.fn();
    render(
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} onSortChange={onSortChange} lang="en" />
    );
    fireEvent.click(screen.getByText('Name'));
    expect(onSortChange).toHaveBeenCalledWith('name', 'asc');
  });

  it('renders loading skeleton', () => {
    render(<DataTable columns={columns} data={[]} keyExtractor={(r) => r.id} loading lang="en" />);
    expect(screen.queryByText('No data')).toBeNull();
  });

  it('renders all column values', () => {
    render(<DataTable columns={columns} data={data} keyExtractor={(r) => r.id} lang="en" />);
    expect(screen.getByText('Value')).toBeDefined();
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText('200')).toBeDefined();
  });

  it('renders custom empty title', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
        emptyTitle="Nothing here"
        lang="en"
      />
    );
    expect(screen.getByText('Nothing here')).toBeDefined();
  });

  it('renders Arabic empty title', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
        emptyTitle="No data"
        emptyTitleAr="لا توجد بيانات"
        lang="ar"
      />
    );
    expect(screen.getByText('لا توجد بيانات')).toBeDefined();
  });
});
