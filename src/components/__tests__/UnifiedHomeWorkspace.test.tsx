import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedHomeWorkspace } from '../dashboard/UnifiedHomeWorkspace';
import { User } from '../../core/types/users';

const okResponse = (data: unknown): Response =>
  ({ ok: true, status: 200, json: async () => data }) as unknown as Response;

const errorResponse = (status: number, message: string): Response =>
  ({ ok: false, status, json: async () => ({ error: message }) }) as unknown as Response;

const baseProps = {
  lang: 'en' as const,
  stats: {
    counts: { programs: 3, projects: 4, beneficiaries: 7, sponsorships: 2 },
    financials: { totalProgramBudget: 500000 }
  },
  currentUser: null,
  programs: [{ id: 'p1', name_en: 'Water Program', code: 'PRG-1' }],
  projects: [{ id: 'j1', name_en: 'Well Construction', status: 'ACTIVE' }],
  beneficiaries: [],
  sponsorships: [],
  approvalRequests: [],
  onNavigate: vi.fn()
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse([])));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('UnifiedHomeWorkspace — live data only', () => {
  it('renders KPI values from live stats without any hardcoded fallback', async () => {
    render(<UnifiedHomeWorkspace {...baseProps} />);
    expect(await screen.findByText('3')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('500,000 YER')).toBeTruthy();
    expect(screen.queryByText('418')).toBeNull();
    expect(screen.queryByText('595')).toBeNull();
    expect(screen.queryByText('74.8%')).toBeNull();
  });

  it('shows an explicit unavailable marker instead of inventing a number when stats are missing', async () => {
    render(<UnifiedHomeWorkspace {...baseProps} stats={null} />);
    expect(await screen.findAllByText('—')).not.toHaveLength(0);
    expect(screen.queryByText('418')).toBeNull();
    expect(screen.queryByText('595')).toBeNull();
    expect(screen.queryByText('1,740,000')).toBeNull();
  });

  it('navigates to the programs screen from the KPI tile', async () => {
    const onNavigate = vi.fn();
    render(<UnifiedHomeWorkspace {...baseProps} onNavigate={onNavigate} />);
    const programsTile = (await screen.findAllByRole('button')).find((el) =>
      el.textContent?.includes('Programs')
    );
    expect(programsTile).toBeTruthy();
    fireEvent.click(programsTile as HTMLElement);
    expect(onNavigate).toHaveBeenCalledWith('programs');
  });

  it('lists only live pending approval requests', async () => {
    render(
      <UnifiedHomeWorkspace
        {...baseProps}
        approvalRequests={[
          { id: 'a1', status: 'pending', title: 'Approve water vendor invoice', amount: '250000' },
          { id: 'a2', status: 'approved', title: 'Already decided' }
        ]}
      />
    );
    expect(await screen.findByText('Approve water vendor invoice')).toBeTruthy();
    expect(screen.queryByText('Already decided')).toBeNull();
    expect(screen.queryByText('CHQ-2026-8819')).toBeNull();
    expect(screen.queryByText('TX-2026-10492')).toBeNull();
  });

  it('shows an honest empty state when no approvals are pending', async () => {
    render(<UnifiedHomeWorkspace {...baseProps} />);
    expect(await screen.findByText('No approvals waiting for you')).toBeTruthy();
    expect(screen.queryByText('CHQ-2026-8819')).toBeNull();
  });

  it('shows an honest empty state when there are no programs', async () => {
    render(<UnifiedHomeWorkspace {...baseProps} programs={[]} />);
    expect(await screen.findByText('No programs yet')).toBeTruthy();
    expect(screen.queryByText('10')).toBeNull();
  });

  it('renders recent transactions from the live tables API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        okResponse([
          {
            id: 't1',
            transaction_number: 'JV-2026-0001',
            transaction_type: 'PAYMENT',
            transaction_date: '2026-10-01',
            total_debit: '150000',
            status: 'POSTED',
            description: 'Water trucking'
          }
        ])
      )
    );
    render(<UnifiedHomeWorkspace {...baseProps} />);
    expect(await screen.findByText('JV-2026-0001')).toBeTruthy();
    expect(screen.getByText('150,000 YER')).toBeTruthy();
    expect(screen.getByText('Water trucking')).toBeTruthy();
  });

  it('reports a truthful error state when the transactions API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errorResponse(500, 'Database query failed')));
    render(<UnifiedHomeWorkspace {...baseProps} />);
    expect(await screen.findByText('Could not load financial operations')).toBeTruthy();
    expect(screen.queryByText('TX-2026-10492')).toBeNull();
    expect(screen.queryByText('1,740,000')).toBeNull();
  });

  it('renders skeletons for KPI tiles while loading', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    const { container } = render(<UnifiedHomeWorkspace {...baseProps} loading />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
    expect(screen.queryByText('418')).toBeNull();
  });

  it('greets the signed-in user by name', async () => {
    const user = { name: 'Sara Ahmed' } as User;
    render(<UnifiedHomeWorkspace {...baseProps} currentUser={user} />);
    expect(await screen.findByText(/Welcome, Sara Ahmed/)).toBeTruthy();
  });

  it('exposes empty projects honestly instead of sample rows', async () => {
    render(<UnifiedHomeWorkspace {...baseProps} projects={[]} />);
    expect(await screen.findByText('No projects yet')).toBeTruthy();
    expect(screen.queryByText('TX-2026-10493')).toBeNull();
  });
});
