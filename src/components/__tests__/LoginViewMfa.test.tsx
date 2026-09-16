import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginView from '../LoginView';

describe('LoginView MFA step-up', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  function mockLoginSequence() {
    (globalThis as any).fetch = vi.fn(async (url: string, init?: any) => {
      if (String(url).endsWith('/api/auth/login')) {
        return {
          ok: true,
          json: async () => ({ status: 'mfa_required', mfaToken: 'mfa-test-token' }),
        };
      }
      if (String(url).endsWith('/api/auth/mfa/verify')) {
        const body = JSON.parse(init.body);
        if (body.mfaToken !== 'mfa-test-token' || body.code !== '123456') {
          return { ok: false, json: async () => ({ error: 'Invalid code' }) };
        }
        return {
          ok: true,
          json: async () => ({
            status: 'success',
            token: 'access-123',
            refreshToken: 'refresh-123',
            user: { id: 'u1', email: 'admin@rohamaab.org', name: 'Manager', role: 'Administrator' },
          }),
        };
      }
      throw new Error('unexpected ' + url);
    });
  }

  async function reachMfaScreen() {
    mockLoginSequence();
    const onLoginSuccess = vi.fn();
    render(
      <LoginView users={[]} onLoginSuccess={onLoginSuccess} lang="en" onLanguageToggle={() => {}} />
    );

    fireEvent.click(screen.getByText('Manual Entry'));
    fireEvent.change(screen.getByPlaceholderText('admin@rohamaab.org'), {
      target: { value: 'admin@rohamaab.org' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••••••'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByText('Authenticate & Sign In'));

    await waitFor(() =>
      expect(screen.getByLabelText('6-digit verification code')).toBeInTheDocument()
    );
    return onLoginSuccess;
  }

  it('shows the TOTP screen on mfa_required without local fallback', async () => {
    await reachMfaScreen();
    // Step-down forbidden: no session may exist before the code is verified
    expect(localStorage.getItem('rbd_token')).toBeNull();
    expect(sessionStorage.getItem('rbd_token')).toBeNull();
  });

  it('completes login after a valid code', async () => {
    const onLoginSuccess = await reachMfaScreen();

    fireEvent.change(screen.getByLabelText('6-digit verification code'), {
      target: { value: '123456' },
    });

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1));
    expect(onLoginSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'admin@rohamaab.org' })
    );
    expect(localStorage.getItem('rbd_token')).toBe('access-123');
  });

  it('rejects a wrong code and stays on the MFA screen', async () => {
    const onLoginSuccess = await reachMfaScreen();

    fireEvent.change(screen.getByLabelText('6-digit verification code'), {
      target: { value: '000000' },
    });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onLoginSuccess).not.toHaveBeenCalled();
    expect(localStorage.getItem('rbd_token')).toBeNull();
  });
});
