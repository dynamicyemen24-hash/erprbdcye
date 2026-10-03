import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CommunicationsView } from '../CommunicationsView';

const liveRow = {
  id: 'c1',
  doc_number: 'MEM-2026-0001',
  subject_ar: 'مذكرة تخصيص ميزانية',
  subject_en: 'Budget Allocation Memo',
  body_ar: 'مذكرة رسمية بخصوص تخصيص الميزانية',
  from_entity: 'المدير المالي',
  status: 'SUBMITTED',
  doc_type: 'MEMO',
  priority: 'URGENT',
  created_at: '2026-10-01T09:00:00.000Z',
};

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('rbd_token', `h.${btoa(JSON.stringify({ role: 'ADMIN', security_level: 5 })).replace(/=+$/, '')}.s`);
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('CommunicationsView — E2E live wiring', () => {
  it('renders permission-scoped live rows from the API with a Live badge', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('overview')) {
        return jsonResponse({ success: true, data: { total: 1, pendingApproval: 1, urgent: 1 } });
      }
      return jsonResponse({ success: true, data: { data: [liveRow] } });
    }));

    render(<CommunicationsView lang="en" />);
    await waitFor(() => expect(screen.getByText('Budget Allocation Memo')).toBeTruthy());
    expect(screen.getByText('Live')).toBeTruthy();

    fireEvent.click(screen.getByText('Notifications'));
    expect(screen.getByText('Documents Pending Approval')).toBeTruthy();
  });

  it('falls back to local seed data when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));

    render(<CommunicationsView lang="en" />);
    await waitFor(() => expect(screen.getByText('Local')).toBeTruthy());
    expect(screen.getByText('Purchase Approval Request')).toBeTruthy();
  });

  it('denies the whole screen without a session (fails closed)', async () => {
    localStorage.clear();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<CommunicationsView lang="en" />);
    expect(screen.getByRole('alert').textContent).toContain('do not have permission');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the denial notice when the API answers 403', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'denied' }, 403)));

    render(<CommunicationsView lang="en" />);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });
});
