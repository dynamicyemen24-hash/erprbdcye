import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CashFlowReport } from '../CashFlowReport';
import { ProfitabilityReport } from '../ProfitabilityReport';

/**
 * Financial reporting — currency and translation integrity.
 *
 * THE DEFECT THIS LOCKS DOWN
 * Both reports printed a hardcoded `€` (`CashFlowReport.tsx`: three cells per
 * row; `ProfitabilityReport.tsx`: two cells) while every KPI tile on the same
 * screen rendered YER through `formatCurrency`. A board reading the dashboard
 * saw "€ 12,400" beside "12,400 ر.ي" in the same viewport — two different
 * currencies for the same books, in a system whose constitution mandates
 * IPSAS-compliant multi-currency records. That is a misrepresentation of
 * financial data, not a formatting preference.
 *
 * A second defect rode along: `ProfitabilityReport` was mounted from the home
 * workspace with `revenue={null} expenses={null} netMargin={null}`, so its
 * `if (!hasData) return null` fired on every render — the section heading
 * promised a profitability table that could never appear.
 */

const periods = [{ period: '2026-01', income: 1200, expenses: 300, balance: 900 }];

describe('CashFlowReport', () => {
  it('renders the ledger currency, never a hardcoded euro symbol', () => {
    const { container } = render(<CashFlowReport periods={periods} lang="en" currency="YER" />);
    expect(container.textContent).not.toContain('€');
    expect(container.textContent).toContain('YER');
  });

  it('honours a different reporting currency', () => {
    const { container } = render(<CashFlowReport periods={periods} lang="en" currency="USD" />);
    expect(container.textContent).toContain('USD');
    expect(container.textContent).not.toContain('€');
  });

  it('renders nothing for an empty series rather than a zeroed table', () => {
    const { container } = render(<CashFlowReport periods={[]} lang="en" />);
    expect(container.querySelector('table')).toBeNull();
  });

  it('names the table and scopes its headers (WCAG 1.3.1)', () => {
    render(<CashFlowReport periods={periods} lang="en" />);
    expect(screen.getByRole('table')).toBeTruthy();
    for (const th of screen.getAllByRole('columnheader')) {
      expect(th.getAttribute('scope')).toBe('col');
    }
  });

  it('translates headers instead of shipping English in an Arabic session', () => {
    render(<CashFlowReport periods={periods} lang="ar" />);
    expect(screen.getByText('الوارد')).toBeTruthy();
    expect(screen.queryByText('Income')).toBeNull();
  });
});

describe('ProfitabilityReport', () => {
  it('renders the ledger currency, never a hardcoded euro symbol', () => {
    const { container } = render(
      <ProfitabilityReport revenue={5000} expenses={2000} netMargin={60} lang="en" currency="YER" />
    );
    expect(container.textContent).not.toContain('€');
    expect(container.textContent).toContain('YER');
  });

  it('shows an explicit dash — not a zero — when a figure is missing', () => {
    const { container } = render(
      <ProfitabilityReport revenue={5000} expenses={null} netMargin={null} lang="en" currency="YER" />
    );
    expect(container.textContent).toContain('—');
  });

  it('renders nothing when every figure is absent', () => {
    const { container } = render(
      <ProfitabilityReport revenue={null} expenses={null} netMargin={null} lang="en" />
    );
    expect(container.querySelector('h3')).toBeNull();
  });

  it('translates labels for an Arabic session', () => {
    render(<ProfitabilityReport revenue={5000} expenses={2000} netMargin={60} lang="ar" />);
    expect(screen.getByText('نظرة على الربحية')).toBeTruthy();
    expect(screen.queryByText('Profitability Overview')).toBeNull();
  });
});