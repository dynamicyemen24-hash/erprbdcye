import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TOTPSecuritySettingsView from '../TOTPSecuritySettingsView';

const user = { email: 'admin@rohamaab.org', name: 'Manager', role: 'admin' };

function mockFetch(impl: (url: string, init?: any) => any) {
  (globalThis as any).fetch = vi.fn(impl);
}

describe('TOTPSecuritySettingsView (real /mfa API)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads disabled status from the server', async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ status: 'success', enabled: false }) }));
    render(<TOTPSecuritySettingsView lang="en" currentUser={user} />);
    await waitFor(() => expect(screen.getByText('OFF')).toBeInTheDocument());
    expect(screen.getByText('Enable two-step verification')).toBeInTheDocument();
  });

  it('completes setup → QR → enable flow', async () => {
    let enabled = false;
    mockFetch(async (url: string, init?: any) => {
      if (url.endsWith('/mfa/status')) {
        return { ok: true, json: async () => ({ status: 'success', enabled }) };
      }
      if (url.endsWith('/mfa/setup')) {
        return {
          ok: true,
          json: async () => ({ secret: 'JBSWY3DPEHPK3PXP', otpauth_url: 'otpauth://totp/x?secret=JBSWY3DPEHPK3PXP' }),
        };
      }
      if (url.endsWith('/mfa/enable')) {
        const body = JSON.parse(init.body);
        if (body.code !== '123456') return { ok: false, json: async () => ({ error: 'Invalid code' }) };
        enabled = true;
        return { ok: true, json: async () => ({ status: 'success' }) };
      }
      throw new Error('unexpected ' + url);
    });

    render(<TOTPSecuritySettingsView lang="en" currentUser={user} />);
    await waitFor(() => expect(screen.getByText('Enable two-step verification')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Enable two-step verification'));
    await waitFor(() => expect(screen.getByText('Confirm enable')).toBeInTheDocument());

    // QR + manual key rendered from the server secret
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('6-digit verification code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Confirm enable'));

    await waitFor(() => expect(screen.getByText('ON')).toBeInTheDocument());
    expect(screen.getByText('Two-step verification enabled')).toBeInTheDocument();
  });

  it('disables with password confirmation', async () => {
    mockFetch(async (url: string, init?: any) => {
      if (url.endsWith('/mfa/status')) {
        return { ok: true, json: async () => ({ status: 'success', enabled: true }) };
      }
      if (url.endsWith('/mfa/disable')) {
        const body = JSON.parse(init.body);
        if (!body.password) return { ok: false, json: async () => ({ error: 'Password required' }) };
        return { ok: true, json: async () => ({ status: 'success' }) };
      }
      throw new Error('unexpected ' + url);
    });

    // Second status call (after disable) reports off
    let calls = 0;
    (globalThis as any).fetch = vi.fn(async (url: string, init?: any) => {
      if (url.endsWith('/mfa/status')) {
        calls++;
        return { ok: true, json: async () => ({ status: 'success', enabled: calls < 2 }) };
      }
      return { ok: true, json: async () => ({ status: 'success' }) };
    });

    render(<TOTPSecuritySettingsView lang="en" currentUser={user} />);
    await waitFor(() => expect(screen.getByText('ON')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Disable two-step verification'));
    fireEvent.change(screen.getByPlaceholderText('Current password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByText('Confirm disable'));

    await waitFor(() => expect(screen.getByText('OFF')).toBeInTheDocument());
  });
});
