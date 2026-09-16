import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PWAUpdatePrompt from '../PWAUpdatePrompt';

describe('PWAUpdatePrompt', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the install banner on beforeinstallprompt and fires prompt', async () => {
    render(<PWAUpdatePrompt lang="en" />);
    expect(screen.queryByText('Install the app')).not.toBeInTheDocument();

    const prompt = vi.fn().mockResolvedValue(undefined);
    const userChoice = Promise.resolve({ outcome: 'accepted' });
    await act(async () => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), { prompt, userChoice })
      );
    });

    expect(screen.getByText('Install the app')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Install'));
    await act(async () => { await userChoice; });
    expect(prompt).toHaveBeenCalled();
  });

  it('persists dismissal for 30 days', async () => {
    render(<PWAUpdatePrompt lang="en" />);
    await act(async () => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), {
          prompt: vi.fn(),
          userChoice: Promise.resolve({ outcome: 'dismissed' }),
        })
      );
    });
    expect(screen.getByText('Install the app')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Dismiss'));
    await act(async () => {});
    expect(localStorage.getItem('pwa_install_dismissed_at')).toBeTruthy();
    expect(screen.queryByText('Install the app')).not.toBeInTheDocument();
  });

  it('renders nothing when no prompt and no update', () => {
    const { container } = render(<PWAUpdatePrompt lang="ar" />);
    expect(container.firstChild).toBeNull();
  });
});
