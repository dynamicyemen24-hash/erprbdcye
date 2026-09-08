import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { EnterpriseAlert } from '../components/EnterpriseAlert';

describe('EnterpriseAlert', () => {
  it('renders with message', () => {
    render(<EnterpriseAlert type="info" message="Test alert" lang="en" />);
    expect(screen.getByText('Test alert')).toBeTruthy();
  });

  it('renders with title and message', () => {
    render(<EnterpriseAlert type="success" title="Success" message="Operation completed" lang="en" />);
    expect(screen.getByText('Success')).toBeTruthy();
    expect(screen.getByText('Operation completed')).toBeTruthy();
  });

  it('renders Arabic text', () => {
    render(<EnterpriseAlert type="warning" title="Warning" titleAr="تحذير" message="Be careful" messageAr="انتبه" lang="ar" />);
    expect(screen.getByText('تحذير')).toBeTruthy();
    expect(screen.getByText('انتبه')).toBeTruthy();
  });

  it('dismisses when close button clicked', () => {
    const onDismiss = vi.fn();
    render(<EnterpriseAlert type="info" message="Dismissible" onDismiss={onDismiss} lang="en" />);
    const closeBtn = screen.getByRole('alert').querySelector('button');
    if (closeBtn) fireEvent.click(closeBtn);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders action buttons', () => {
    const onClick = vi.fn();
    render(
      <EnterpriseAlert
        type="danger"
        message="Error"
        actions={[{ label: 'Retry', onClick }]}
        lang="en"
      />
    );
    fireEvent.click(screen.getByText('Retry'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders all 4 types without crashing', () => {
    (['success', 'warning', 'danger', 'info'] as const).forEach(type => {
      const { unmount } = render(<EnterpriseAlert type={type} message="Test" lang="en" />);
      unmount();
    });
  });

  it('accepts autoDismiss prop without crashing', () => {
    const { unmount } = render(<EnterpriseAlert type="info" message="Auto dismiss" autoDismiss={5000} lang="en" />);
    expect(screen.getByText('Auto dismiss')).toBeTruthy();
    unmount();
  });
});
