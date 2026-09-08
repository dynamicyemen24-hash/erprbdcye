import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent, within } from '@testing-library/dom';
import { ConfirmDialog } from '../components/ConfirmDialog';

vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (node: any) => node,
}));

describe('ConfirmDialog', () => {
  it('renders when open', () => {
    render(<ConfirmDialog open={true} onOpenChange={vi.fn()} onConfirm={vi.fn()} title="Confirm" lang="en" />);
    expect(screen.getAllByText('Confirm').length).toBeGreaterThan(0);
  });

  it('does not render when closed', () => {
    render(<ConfirmDialog open={false} onOpenChange={vi.fn()} onConfirm={vi.fn()} title="Confirm" lang="en" />);
    expect(screen.queryByText('Confirm')).toBeNull();
  });

  it('calls onConfirm when confirm clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Delete?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        lang="en"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onOpenChange(false) when cancel clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog open={true} onOpenChange={onOpenChange} onConfirm={vi.fn()} title="Confirm" lang="en" />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders destructive variant', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        variant="destructive"
        title="Delete"
        onConfirm={vi.fn()}
        lang="en"
      />
    );
    expect(screen.getAllByText('Delete').length).toBeGreaterThan(0);
  });

  it('renders Arabic title', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        titleAr="تأكيد"
        lang="ar"
      />
    );
    expect(screen.getAllByText('تأكيد').length).toBeGreaterThan(0);
  });

  it('renders custom confirm label', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Proceed?"
        confirmLabel="Yes, proceed"
        lang="en"
      />
    );
    expect(screen.getByRole('button', { name: 'Yes, proceed' })).toBeDefined();
  });

  it('calls onCancel when provided', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        onCancel={onCancel}
        lang="en"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders description in body', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        description="Are you sure?"
        lang="en"
      />
    );
    const descriptions = screen.getAllByText('Are you sure?');
    expect(descriptions.length).toBeGreaterThanOrEqual(1);
  });
});
