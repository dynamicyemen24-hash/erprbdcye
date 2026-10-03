import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermissionGate, PermissionDeniedNotice } from '../PermissionGate';

function setSession(role: string, security_level = 1) {
  localStorage.setItem(
    'rbd_token',
    `h.${btoa(JSON.stringify({ role, security_level })).replace(/=+$/, '')}.s`
  );
}

describe('PermissionGate', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('renders children when the session holds the permission', () => {
    setSession('ADMIN');
    render(
      <PermissionGate perm="procurement:write">
        <button>Add Vendor</button>
      </PermissionGate>
    );
    expect(screen.getByText('Add Vendor')).toBeTruthy();
  });

  it('hides children when denied (default mode)', () => {
    setSession('VIEWER', 1);
    const { container } = render(
      <PermissionGate perm="procurement:write">
        <button>Add Vendor</button>
      </PermissionGate>
    );
    expect(screen.queryByText('Add Vendor')).toBeNull();
    expect(container.innerHTML).toBe('');
  });

  it('renders dimmed, non-interactive children in disabled mode', () => {
    setSession('VIEWER', 1);
    render(
      <PermissionGate perm="procurement:write" mode="disabled">
        <button>Add Vendor</button>
      </PermissionGate>
    );
    const btn = screen.getByText('Add Vendor').closest('span');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn?.className).toContain('pointer-events-none');
  });

  it('renders the fallback node when denied', () => {
    setSession('VIEWER', 1);
    render(
      <PermissionGate perm="users:manage" mode="fallback" fallback={<span>Not allowed</span>}>
        <button>Manage</button>
      </PermissionGate>
    );
    expect(screen.queryByText('Manage')).toBeNull();
    expect(screen.getByText('Not allowed')).toBeTruthy();
  });

  it('shows the denial notice in Arabic and English', () => {
    const { unmount } = render(<PermissionDeniedNotice lang="ar" />);
    expect(screen.getByRole('alert').textContent).toContain('لا تملك صلاحية');
    unmount();
    render(<PermissionDeniedNotice lang="en" />);
    expect(screen.getByRole('alert').textContent).toContain('do not have permission');
  });
});
