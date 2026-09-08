import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonKPI, SkeletonChart } from '../components/Skeleton';

describe('Skeleton', () => {
  it('renders single line by default', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders multiple lines', () => {
    const { container } = render(<Skeleton lines={3} />);
    const children = container.firstChild as HTMLElement;
    expect(children.children.length).toBe(3);
  });

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height={32} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('32px');
  });

  it('renders circular variant', () => {
    const { container } = render(<Skeleton shape="circular" width={40} height={40} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders rectangular variant', () => {
    const { container } = render(<Skeleton shape="rectangular" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders rounded variant', () => {
    const { container } = render(<Skeleton shape="rounded" />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('SkeletonTable', () => {
  it('renders default rows and cols', () => {
    const { container } = render(<SkeletonTable />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders custom rows and cols', () => {
    const { container } = render(<SkeletonTable rows={3} cols={5} />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('SkeletonKPI', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonKPI />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('SkeletonChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonChart />);
    expect(container.firstChild).toBeTruthy();
  });
});
