import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div>Child rendered successfully</div>;
};

const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear();
    (window.location.reload as ReturnType<typeof vi.fn>).mockClear();
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Child rendered successfully')).toBeDefined();
  });

  it('catches errors and renders fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Unexpected Domain Error Isolated|عزل خطأ تشغيلي/)).toBeDefined();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback UI</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback UI')).toBeDefined();
  });

  it('shows domain name in error UI', () => {
    render(
      <ErrorBoundary domainName="Finance Module">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Finance Module/)).toBeDefined();
  });

  it('renders reset button', () => {
    render(
      <ErrorBoundary lang="en">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /Reset Domain State/ })).toBeDefined();
  });

  it('renders reload button', () => {
    render(
      <ErrorBoundary lang="en">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /Reload Full System/ })).toBeDefined();
  });

  it('renders copy error details button', () => {
    render(
      <ErrorBoundary lang="en">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /Copy Error Details/ })).toBeDefined();
  });

  it('shows error details when toggle is clicked', () => {
    render(
      <ErrorBoundary lang="en">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    const toggleBtn = screen.getByRole('button', { name: /Show Technical Details/ });
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Diagnostic|Stack Trace/)).toBeDefined();
  });

  it('calls window.location.reload when reload button is clicked', () => {
    render(
      <ErrorBoundary lang="en">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    const reloadBtn = screen.getByRole('button', { name: /Reload Full System/ });
    fireEvent.click(reloadBtn);
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('resets error state when reset button is clicked', () => {
    const { unmount } = render(
      <ErrorBoundary lang="en">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Unexpected Domain Error Isolated/)).toBeDefined();

    const resetBtn = screen.getByRole('button', { name: /Reset Domain State/ });
    fireEvent.click(resetBtn);

    unmount();

    render(
      <ErrorBoundary lang="en">
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Child rendered successfully')).toBeDefined();
  });

  it('renders Arabic UI when lang="ar"', () => {
    render(
      <ErrorBoundary lang="ar">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /إعادة تشغيل النطاق/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /إعادة تحميل النظام/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /نسخ تقرير الخطأ/ })).toBeDefined();
  });

  it('renders English UI when lang="en"', () => {
    render(
      <ErrorBoundary lang="en">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /Reset Domain State/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Reload Full System/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Copy Error Details/ })).toBeDefined();
  });

  it('copies error details to clipboard when copy button is clicked', async () => {
    render(
      <ErrorBoundary lang="en" domainName="Test Domain">
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    const copyBtn = screen.getByRole('button', { name: /Copy Error Details/ });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
