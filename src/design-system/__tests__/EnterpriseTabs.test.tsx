import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { EnterpriseTabs, TabPanel } from '../components/EnterpriseTabs';

vi.mock('../theme/ThemeContext', () => ({
  useDirection: () => ({ direction: 'ltr', isRtl: false }),
}));

const tabs = [
  { id: 'tab1', label: 'Tab 1', labelAr: 'علامة التبويب 1' },
  { id: 'tab2', label: 'Tab 2', labelAr: 'علامة التبويب 2' },
  { id: 'tab3', label: 'Tab 3', labelAr: 'علامة التبويب 3', disabled: true },
];

describe('EnterpriseTabs', () => {
  it('renders all tabs', () => {
    render(<EnterpriseTabs tabs={tabs} activeTab="tab1" onTabChange={vi.fn()} lang="en" />);
    expect(screen.getByText('Tab 1')).toBeTruthy();
    expect(screen.getByText('Tab 2')).toBeTruthy();
    expect(screen.getByText('Tab 3')).toBeTruthy();
  });

  it('renders Arabic labels', () => {
    render(<EnterpriseTabs tabs={tabs} activeTab="tab1" onTabChange={vi.fn()} lang="ar" />);
    expect(screen.getByText('علامة التبويب 1')).toBeTruthy();
  });

  it('calls onTabChange when tab clicked', () => {
    const onChange = vi.fn();
    render(<EnterpriseTabs tabs={tabs} activeTab="tab1" onTabChange={onChange} lang="en" />);
    fireEvent.click(screen.getByText('Tab 2'));
    expect(onChange).toHaveBeenCalledWith('tab2');
  });

  it('does not call onTabChange for disabled tab', () => {
    const onChange = vi.fn();
    render(<EnterpriseTabs tabs={tabs} activeTab="tab1" onTabChange={onChange} lang="en" />);
    fireEvent.click(screen.getByText('Tab 3'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders badge', () => {
    const tabsWithBadge = [...tabs, { id: 'tab4', label: 'Tab 4', badge: 5 }];
    render(<EnterpriseTabs tabs={tabsWithBadge} activeTab="tab1" onTabChange={vi.fn()} lang="en" />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('renders pill variant', () => {
    const { container } = render(<EnterpriseTabs tabs={tabs} activeTab="tab1" onTabChange={vi.fn()} variant="pill" lang="en" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders enclosed variant', () => {
    const { container } = render(<EnterpriseTabs tabs={tabs} activeTab="tab1" onTabChange={vi.fn()} variant="enclosed" lang="en" />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('TabPanel', () => {
  it('renders when active', () => {
    render(
      <div>
        <EnterpriseTabs tabs={tabs} activeTab="tab1" onTabChange={vi.fn()} lang="en" />
        <TabPanel tabId="tab1" activeTab="tab1">Panel 1</TabPanel>
        <TabPanel tabId="tab2" activeTab="tab1">Panel 2</TabPanel>
      </div>
    );
    expect(screen.getByText('Panel 1')).toBeTruthy();
    expect(screen.queryByText('Panel 2')).toBeNull();
  });

  it('does not render when inactive', () => {
    render(
      <div>
        <TabPanel tabId="tab1" activeTab="tab2">Panel 1</TabPanel>
      </div>
    );
    expect(screen.queryByText('Panel 1')).toBeNull();
  });
});
