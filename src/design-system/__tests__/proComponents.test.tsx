import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricTile } from '../pro/MetricTile';
import { FilterBar } from '../pro/FilterBar';
import { DraftActionBar } from '../pro/DraftActionBar';
import { PrintDocument } from '../pro/PrintDocument';

describe('MetricTile', () => {
  it('renders label, value and unit with an accessible name', () => {
    render(<MetricTile label="المصروفات" labelEn="Expenses" value="1,250,000" unit="YER" lang="en" />);
    const tile = screen.getByRole('group');
    expect(tile.getAttribute('aria-label')).toContain('Expenses');
    expect(screen.getByText('1,250,000')).toBeTruthy();
    expect(screen.getByText('YER')).toBeTruthy();
  });

  it('formats numeric values', () => {
    render(<MetricTile label="Count" value={1234567} />);
    expect(screen.getByText('1,234,567')).toBeTruthy();
  });

  it('shows a positive delta as good when goodDirection=up', () => {
    render(<MetricTile label="Income" value="100" delta={12} goodDirection="up" />);
    const delta = screen.getByTestId('metric-delta');
    expect(delta.className).toContain('text-emerald-600');
    expect(delta.textContent).toContain('12%');
  });

  it('shows a rise as bad when goodDirection=down (costs)', () => {
    render(<MetricTile label="Costs" value="100" delta={12} goodDirection="down" />);
    expect(screen.getByTestId('metric-delta').className).toContain('text-red-600');
  });

  it('renders a sparkline for trend series', () => {
    const { container } = render(<MetricTile label="Trend" value="5" trend={[1, 3, 2, 5, 4]} />);
    const spark = screen.getByTestId('metric-sparkline');
    const polylines = spark.querySelectorAll('polyline');
    expect(polylines.length).toBe(2);
    expect(container).toBeTruthy();
  });

  it('shows a skeleton instead of values while loading', () => {
    const { container } = render(<MetricTile label="Loading" value="999" loading />);
    expect(screen.queryByText('999')).toBeNull();
    expect(container.querySelector('[data-slot="skeleton"], .animate-pulse')).toBeTruthy();
  });

  it('is clickable only when onClick is provided', () => {
    const onClick = vi.fn();
    const { rerender } = render(<MetricTile label="A" value="1" />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<MetricTile label="A" value="1" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('announces freshness state', () => {
    render(<MetricTile label="Live metric" value="1" freshness="live" />);
    const dotTitle = screen.getByTitle('محدّث مباشرة');
    expect(dotTitle.className).toContain('bg-emerald-500');
  });
});

describe('FilterBar', () => {
  it('reports search input changes', () => {
    const onChange = vi.fn();
    render(<FilterBar searchValue="" onSearchChange={onChange} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'po' } });
    expect(onChange).toHaveBeenCalledWith('po');
  });

  it('shows an aria-live result count', () => {
    render(<FilterBar searchValue="" onSearchChange={() => {}} resultCount={42} resultLabel="نتيجة" />);
    const count = screen.getByText(/42/);
    expect(count.getAttribute('aria-live')).toBe('polite');
    expect(count.textContent).toContain('نتيجة');
  });

  it('offers a clear control only when there is a query', () => {
    const onClear = vi.fn();
    const { rerender } = render(<FilterBar searchValue="" onSearchChange={() => {}} onClear={onClear} />);
    expect(screen.queryByRole('button', { name: /مسح البحث/ })).toBeNull();
    rerender(<FilterBar searchValue="x" onSearchChange={() => {}} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: /مسح البحث/ }));
    expect(onClear).toHaveBeenCalled();
  });

  it('slots caller filter controls', () => {
    render(
      <FilterBar searchValue="" onSearchChange={() => {}}>
        <button type="button">الفرع</button>
      </FilterBar>
    );
    expect(screen.getByText('الفرع')).toBeTruthy();
  });
});

describe('DraftActionBar', () => {
  it('disables submit until the form is dirty', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<DraftActionBar onSubmit={onSubmit} dirty={false} />);
    const btn = screen.getByRole('button', { name: 'حفظ' });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    rerender(<DraftActionBar onSubmit={onSubmit} dirty={true} />);
    const enabled = screen.getByRole('button', { name: 'حفظ' }) as HTMLButtonElement;
    expect(enabled.disabled).toBe(false);
    fireEvent.click(enabled);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('announces autosave progress and draft persistence', () => {
    const { rerender } = render(<DraftActionBar dirty isSaving />);
    expect(screen.getByText('جارٍ الحفظ التلقائي…')).toBeTruthy();
    rerender(<DraftActionBar dirty={false} hasDraft lastSavedTime={new Date('2026-10-04T09:30:00')} />);
    expect(screen.getByText(/مسودة محفوظة/)).toBeTruthy();
  });

  it('wires cancel', () => {
    const onCancel = vi.fn();
    render(<DraftActionBar dirty onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('PrintDocument', () => {
  beforeEach(() => {
    (window as any).print = vi.fn();
  });

  it('renders title, organization and meta pairs', () => {
    render(
      <PrintDocument
        title="سند صرف"
        organizationName="جمعية اختبار"
        meta={[{ label: 'الرقم', value: 'PV-1' }]}
      >
        <p>body</p>
      </PrintDocument>
    );
    expect(screen.getByRole('heading', { name: 'سند صرف' })).toBeTruthy();
    // Organization name renders in both header and footer by design.
    expect(screen.getAllByText('جمعية اختبار').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('PV-1')).toBeTruthy();
    expect(screen.getByText('body')).toBeTruthy();
  });

  it('prints via the default action', () => {
    render(<PrintDocument title="T">x</PrintDocument>);
    fireEvent.click(screen.getByRole('button', { name: 'طباعة' }));
    expect((window as any).print).toHaveBeenCalled();
  });

  it('accepts a custom action slot', () => {
    render(<PrintDocument title="T" actions={<button type="button">Export</button>}>x</PrintDocument>);
    expect(screen.queryByRole('button', { name: 'طباعة' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Export' })).toBeTruthy();
  });
});
