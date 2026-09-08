import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { EnterpriseCard, EnterpriseStat } from '../components/EnterpriseCard';

describe('EnterpriseCard', () => {
  it('renders children', () => {
    render(<EnterpriseCard><p>Content</p></EnterpriseCard>);
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('renders with header', () => {
    render(<EnterpriseCard header={<h3>Title</h3>}><p>Body</p></EnterpriseCard>);
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('renders with footer', () => {
    render(<EnterpriseCard footer={<span>Footer</span>}>Content</EnterpriseCard>);
    expect(screen.getByText('Footer')).toBeTruthy();
  });

  it('handles click', () => {
    const onClick = vi.fn();
    render(<EnterpriseCard onClick={onClick}>Clickable</EnterpriseCard>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders elevated variant', () => {
    const { container } = render(<EnterpriseCard variant="elevated">Elevated</EnterpriseCard>);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders glass variant', () => {
    const { container } = render(<EnterpriseCard variant="glass">Glass</EnterpriseCard>);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with status indicator', () => {
    const { container } = render(<EnterpriseCard status="success">Status</EnterpriseCard>);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('EnterpriseStat', () => {
  it('renders label and value', () => {
    render(<EnterpriseStat label="Revenue" value="1,234,567" lang="en" />);
    expect(screen.getByText('Revenue')).toBeTruthy();
    expect(screen.getByText('1,234,567')).toBeTruthy();
  });

  it('renders Arabic label', () => {
    render(<EnterpriseStat label="Revenue" labelAr="الإيرادات" value="1.2M" lang="ar" />);
    expect(screen.getByText('الإيرادات')).toBeTruthy();
  });

  it('renders trend indicator', () => {
    render(<EnterpriseStat label="Growth" value="25%" trend={{ value: 12, isPositive: true }} lang="en" />);
    expect(screen.getByText('12%')).toBeTruthy();
  });

  it('renders negative trend', () => {
    render(<EnterpriseStat label="Loss" value="-5%" trend={{ value: 5, isPositive: false }} lang="en" />);
    expect(screen.getByText('5%')).toBeTruthy();
  });

  it('renders suffix', () => {
    render(<EnterpriseStat label="Users" value="1.2K" suffix="users" lang="en" />);
    expect(screen.getByText('users')).toBeTruthy();
  });

  it('renders icon', () => {
    render(<EnterpriseStat label="Count" value="42" icon={<span>📊</span>} lang="en" />);
    expect(screen.getByText('📊')).toBeTruthy();
  });
});
