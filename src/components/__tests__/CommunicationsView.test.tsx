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

  it('shows an honest error with retry (never fabricated rows) when the API is unreachable', async () => {
    const fetchMock = vi.fn(async () => { throw new Error('offline'); });
    vi.stubGlobal('fetch', fetchMock);

    render(<CommunicationsView lang="en" />);
    await waitFor(() => expect(screen.getByText('Could not load communications from the server')).toBeTruthy());
    // No fabricated financial/security content may render as enterprise data:
    expect(screen.queryByText('Purchase Approval Request')).toBeNull();
    expect(screen.queryByText('PO-2024-089')).toBeNull();

    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(2));
  });

  it('denies the whole screen without a session (fails closed)', async () => {    localStorage.clear();
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

  it('creates a real draft through the compose form (POST /api/v2/communications)', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      if (String(url).includes('overview')) {
        return jsonResponse({ success: true, data: { total: 0, pendingApproval: 0, urgent: 0 } });
      }
      if (init?.method === 'POST') {
        return jsonResponse({ success: true, data: { id: 'c9' } }, 201);
      }
      return jsonResponse({ success: true, data: { data: [] } });
    }));

    render(<CommunicationsView lang="en" />);
    await waitFor(() => expect(screen.getByText('No messages')).toBeTruthy());
    fireEvent.click(screen.getByText('New Message'));

    fireEvent.change(screen.getByPlaceholderText('Subject (required) *'), { target: { value: 'Test memo' } });
    fireEvent.change(screen.getByPlaceholderText('Sender (required) *'), { target: { value: 'QA unit' } });
    fireEvent.click(screen.getByText('Save as draft'));

    await waitFor(() => {
      const post = calls.find(c => c.init?.method === 'POST');
      expect(post).toBeTruthy();
      expect(JSON.parse(String(post!.init!.body)).subjectAr).toBe('Test memo');
    });
  });

  it('opens the full record from the API when a row is clicked (GET /:id)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('overview')) {
        return jsonResponse({ success: true, data: { total: 1, pendingApproval: 0, urgent: 0 } });
      }
      if (/communications\/c1$/.test(String(url))) {
        return jsonResponse({ success: true, data: { ...liveRow, body_ar: 'full body text', to_entity: 'HQ', recipients: [] } });
      }
      return jsonResponse({ success: true, data: { data: [liveRow] } });
    }));

    render(<CommunicationsView lang="en" />);
    await waitFor(() => expect(screen.getByText('Budget Allocation Memo')).toBeTruthy());
    fireEvent.click(screen.getByText('Budget Allocation Memo'));
    await waitFor(() => expect(screen.getByText('Document Detail')).toBeTruthy());
    expect(screen.getByText('MEM-2026-0001')).toBeTruthy();
  });
});
