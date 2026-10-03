import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { InstitutionalReportViewer } from '../InstitutionalReportViewer';

const payload = {
  title: 'تقرير الموازنة',
  titleAr: 'تقرير الموازنة',
  titleEn: 'Budget Report',
  lang: 'ar',
  dir: 'rtl',
  header: { orgNameAr: 'جمعية رُحماء', orgNameEn: 'Org', branchCode: 'HQ' },
  totals: { totalAllocated: 1000, totalSpent: 400 },
  lines: [
    { account_code: '6101', allocated: 600 },
    { account_code: '6102', allocated: 400 },
  ],
  compliance: 'IPSAS 24',
  generatedAt: '2026-10-03T10:00:00.000Z',
};

function mockFetch(result: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      status: ok ? 200 : 500,
      json: async () => result,
    }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('InstitutionalReportViewer', () => {
  it('renders the institutional header and data sections', async () => {
    mockFetch(payload);
    render(<InstitutionalReportViewer endpoint="/api/v2/institutional-reports/budget-variance" lang="ar" onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText('جمعية رُحماء')).toBeTruthy());
    expect(screen.getByText('6101')).toBeTruthy();
    expect(screen.getByText(/IPSAS 24/)).toBeTruthy();
  });

  it('shows an error with retry when the API fails', async () => {
    mockFetch({ error: 'x' }, false);
    render(<InstitutionalReportViewer endpoint="/api/x" lang="ar" onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText('إعادة المحاولة')).toBeTruthy());
  });

  it('closes on demand', async () => {
    mockFetch(payload);
    const onClose = vi.fn();
    render(<InstitutionalReportViewer endpoint="/api/x" lang="ar" onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('جمعية رُحماء')).toBeTruthy());
    fireEvent.click(screen.getByLabelText('إغلاق'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
