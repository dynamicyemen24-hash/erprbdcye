import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstitutionalReportHeader } from '../InstitutionalReportHeader';

const header = {
  orgNameAr: 'جمعية رُحماء بينهم',
  orgNameEn: "Rohama'a Baynahum",
  licenseNo: 'YE-NGO-2024-8891',
  hqCity: 'تعز',
  branchCode: 'TAIZ',
};

describe('InstitutionalReportHeader', () => {
  it('renders Arabic title with rtl in Arabic mode', () => {
    const { container } = render(
      <InstitutionalReportHeader title="تقرير" titleSecondary="Report" lang="ar" dir="rtl" header={header} />
    );
    expect(container.querySelector('header')?.getAttribute('dir')).toBe('rtl');
    expect(screen.getByRole('heading', { name: 'تقرير' })).toBeTruthy();
    expect(screen.getByText('جمعية رُحماء بينهم')).toBeTruthy();
  });

  it('renders English title with ltr in English mode', () => {
    const { container } = render(
      <InstitutionalReportHeader title="Report" titleSecondary="تقرير" lang="en" dir="ltr" header={header} />
    );
    expect(container.querySelector('header')?.getAttribute('dir')).toBe('ltr');
    expect(screen.getByRole('heading', { name: 'Report' })).toBeTruthy();
  });

  it('shows monogram fallback when no logo is configured', () => {
    const { container } = render(
      <InstitutionalReportHeader title="تقرير" lang="ar" dir="rtl" header={header} />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('ج')).toBeTruthy();
  });

  it('renders the logo image when configured', () => {
    render(
      <InstitutionalReportHeader title="تقرير" lang="ar" dir="rtl" header={{ ...header, logoUrl: 'https://x/logo.png' }} />
    );
    const img = screen.getByAltText('جمعية رُحماء بينهم') as HTMLImageElement;
    expect(img.src).toContain('logo.png');
  });

  it('exposes license and branch metadata', () => {
    render(<InstitutionalReportHeader title="تقرير" lang="ar" dir="rtl" header={header} />);
    expect(screen.getByText(/YE-NGO-2024-8891/)).toBeTruthy();
    expect(screen.getByText(/TAIZ/)).toBeTruthy();
  });
});
