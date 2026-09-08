import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { ErrorState } from '../components/ErrorState';

describe('ErrorState', () => {
  it('renders default error message', () => {
    render(<ErrorState lang="en" />);
    expect(screen.getByText('An unexpected error occurred')).toBeDefined();
  });

  it('renders Arabic by default', () => {
    render(<ErrorState lang="ar" />);
    expect(screen.getByText('حدث خطأ غير متوقع')).toBeDefined();
  });

  it('calls onRetry when retry button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} lang="en" />);
    fireEvent.click(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows stack trace when expanded', () => {
    render(<ErrorState stack="Error at line 1" lang="en" />);
    fireEvent.click(screen.getByText('Technical details'));
    expect(screen.getByText('Error at line 1')).toBeDefined();
  });

  it('hides stack trace after second click', () => {
    render(<ErrorState stack="Error at line 1" lang="en" />);
    const btn = screen.getByText('Technical details');
    fireEvent.click(btn);
    expect(screen.getByText('Error at line 1')).toBeDefined();
    fireEvent.click(btn);
    expect(screen.queryByText('Error at line 1')).toBeNull();
  });

  it('renders custom title', () => {
    render(<ErrorState title="Custom Error" lang="en" />);
    expect(screen.getByText('Custom Error')).toBeDefined();
  });

  it('renders Arabic custom title', () => {
    render(<ErrorState title="Custom Error" titleAr="خطأ مخصص" lang="ar" />);
    expect(screen.getByText('خطأ مخصص')).toBeDefined();
  });

  it('renders error code', () => {
    render(<ErrorState code="404" lang="en" />);
    expect(screen.getByText('404')).toBeDefined();
  });

  it('renders report button when onReport provided', () => {
    const onReport = vi.fn();
    render(<ErrorState onReport={onReport} lang="en" />);
    fireEvent.click(screen.getByText('Report issue'));
    expect(onReport).toHaveBeenCalled();
  });

  it('renders custom retry label', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} retryLabel="Reload" lang="en" />);
    expect(screen.getByText('Reload')).toBeDefined();
  });

  it('renders custom message', () => {
    render(<ErrorState message="Server unavailable" lang="en" />);
    expect(screen.getByText('Server unavailable')).toBeDefined();
  });
});
