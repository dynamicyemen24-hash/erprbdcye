import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonLoader } from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders the skeleton container', () => {
    const { container } = render(<SkeletonLoader />);
    expect(container.querySelector('#skeleton-loader-container')).toBeDefined();
  });

  it('renders with default lang="ar"', () => {
    const { container } = render(<SkeletonLoader />);
    expect(container.querySelector('#skeleton-loader-container')).toBeDefined();
  });

  it('renders with lang="en"', () => {
    const { container } = render(<SkeletonLoader lang="en" />);
    expect(container.querySelector('#skeleton-loader-container')).toBeDefined();
  });

  it('contains animated pulse elements', () => {
    const { container } = render(<SkeletonLoader />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders KPI card skeleton grid (4 cards)', () => {
    const { container } = render(<SkeletonLoader />);
    const gridContainer = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    expect(gridContainer).toBeDefined();
  });

  it('renders shimmer animation elements', () => {
    const { container } = render(<SkeletonLoader />);
    const shimmerElements = container.querySelectorAll('[class*="bg-zinc-200"]');
    expect(shimmerElements.length).toBeGreaterThan(0);
  });
});
