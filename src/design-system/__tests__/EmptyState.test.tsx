import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { EmptyState } from '../components/EmptyState';

describe('EmptyState', () => {
  it('renders with default empty variant', () => {
    render(<EmptyState title="No data" lang="en" />);
    expect(screen.getByText('No data')).toBeDefined();
  });

  it('renders Arabic text when lang=ar', () => {
    render(<EmptyState title="No data" titleAr="لا توجد بيانات" lang="ar" />);
    expect(screen.getByText('لا توجد بيانات')).toBeDefined();
  });

  it('renders action button', () => {
    const onClick = vi.fn();
    render(<EmptyState title="Empty" actions={[{ label: 'Create', onClick }]} lang="en" />);
    const btn = screen.getByText('Create');
    expect(btn).toBeDefined();
    btn.click();
    expect(onClick).toHaveBeenCalled();
  });

  it('renders error variant', () => {
    render(<EmptyState variant="error" title="Error" lang="en" />);
    expect(screen.getByText('Error')).toBeDefined();
  });

  it('renders all 6 variants without crashing', () => {
    const variants = ['empty', 'error', 'offline', 'permission', 'search', 'maintenance'] as const;
    variants.forEach((v) => {
      const { unmount } = render(<EmptyState variant={v} title="Test" lang="en" />);
      unmount();
    });
  });

  it('renders default description', () => {
    render(<EmptyState title="No data" lang="en" />);
    expect(screen.getByText('No data')).toBeDefined();
    expect(screen.getByText(/No results found/)).toBeDefined();
  });

  it('renders custom description', () => {
    render(<EmptyState title="Empty" description="Nothing here" lang="en" />);
    expect(screen.getByText('Nothing here')).toBeDefined();
  });

  it('renders Arabic description', () => {
    render(
      <EmptyState
        title="Empty"
        titleAr="فارغ"
        description="Nothing here"
        descriptionAr="لا شيء هنا"
        lang="ar"
      />
    );
    expect(screen.getByText('فارغ')).toBeDefined();
    expect(screen.getByText('لا شيء هنا')).toBeDefined();
  });

  it('renders multiple action buttons', () => {
    const onClick1 = vi.fn();
    const onClick2 = vi.fn();
    render(
      <EmptyState
        title="Empty"
        actions={[
          { label: 'Primary', onClick: onClick1 },
          { label: 'Secondary', onClick: onClick2, variant: 'secondary' },
        ]}
        lang="en"
      />
    );
    screen.getByText('Primary').click();
    screen.getByText('Secondary').click();
    expect(onClick1).toHaveBeenCalled();
    expect(onClick2).toHaveBeenCalled();
  });

  it('renders action with Arabic label', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Empty"
        actions={[{ label: 'Create', labelAr: 'إنشاء', onClick }]}
        lang="ar"
      />
    );
    expect(screen.getByText('إنشاء')).toBeDefined();
  });
});
