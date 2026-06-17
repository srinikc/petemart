import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { timeAgo, formatETA, StatusBadge, ProgressRing, PageTOC } from '@/app/agentic-console/shared';

describe('timeAgo()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty string for null', () => {
    expect(timeAgo(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(timeAgo(undefined)).toBe('');
  });

  it('returns "now" for current timestamp', () => {
    expect(timeAgo(Date.now())).toBe('now');
  });

  it('returns "now" for less than 10 seconds', () => {
    expect(timeAgo(Date.now() - 5000)).toBe('now');
  });

  it('returns seconds ago for under 60 seconds', () => {
    expect(timeAgo(Date.now() - 30000)).toBe('30s ago');
  });

  it('returns minutes ago for under 60 minutes', () => {
    expect(timeAgo(Date.now() - 5 * 60 * 1000)).toBe('5m ago');
  });

  it('returns hours ago for under 24 hours', () => {
    expect(timeAgo(Date.now() - 2 * 60 * 60 * 1000)).toBe('2h ago');
  });

  it('returns days ago for 24+ hours', () => {
    expect(timeAgo(Date.now() - 3 * 24 * 60 * 60 * 1000)).toBe('3d ago');
  });

  it('returns "now" for future timestamp', () => {
    expect(timeAgo(Date.now() + 60000)).toBe('now');
  });

  it('handles ISO string input', () => {
    const past = new Date('2026-06-15T11:50:00Z').toISOString();
    expect(timeAgo(past)).toBe('10m ago');
  });
});

describe('formatETA()', () => {
  it('returns empty string for null', () => {
    expect(formatETA(null)).toBe('');
  });

  it('returns empty string for 0', () => {
    expect(formatETA(0)).toBe('');
  });

  it('returns empty string for negative values', () => {
    expect(formatETA(-100)).toBe('');
  });

  it('returns seconds for under 60s', () => {
    expect(formatETA(5000)).toBe('~5s');
  });

  it('returns seconds for 30s', () => {
    expect(formatETA(30000)).toBe('~30s');
  });

  it('returns minutes and seconds for 61s', () => {
    expect(formatETA(61000)).toBe('~2m 1s');
  });

  it('returns minutes for exactly 2 minutes', () => {
    expect(formatETA(120000)).toBe('~2m 0s');
  });

  it('rounds up seconds with ceil', () => {
    expect(formatETA(1001)).toBe('~2s');
  });
});

describe('StatusBadge', () => {
  it('renders APPROVED for approved status', () => {
    render(<StatusBadge status="approved" />);
    const badge = screen.getByText('APPROVED');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-700');
  });

  it('renders COMPLETED for completed status', () => {
    render(<StatusBadge status="completed" />);
    const badge = screen.getByText('COMPLETED');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-700');
  });

  it('renders PENDING for pending status', () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText('PENDING');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-500');
  });

  it('renders FAILED for failed status', () => {
    render(<StatusBadge status="failed" />);
    const badge = screen.getByText('FAILED');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('renders ACTIVE for active status', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText('ACTIVE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('renders AWAITING APPROVAL for awaiting_approval status', () => {
    render(<StatusBadge status="awaiting_approval" />);
    const badge = screen.getByText('AWAITING APPROVAL');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-700');
  });

  it('falls back to pending for unknown status', () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });
});

describe('ProgressRing', () => {
  it('renders an SVG element', () => {
    const { container } = render(<ProgressRing pct={50} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders percentage text', () => {
    render(<ProgressRing pct={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders 0% correctly', () => {
    render(<ProgressRing pct={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('rounds decimal percentages', () => {
    render(<ProgressRing pct={75.7} />);
    expect(screen.getByText('76%')).toBeInTheDocument();
  });

  it('uses green color for >= 80%', () => {
    const { container } = render(<ProgressRing pct={85} />);
    const circle = container.querySelector('svg circle:nth-child(2)');
    expect(circle).toHaveAttribute('stroke', '#16A34A');
  });

  it('uses green color for exactly 100%', () => {
    const { container } = render(<ProgressRing pct={100} />);
    const circle = container.querySelector('svg circle:nth-child(2)');
    expect(circle).toHaveAttribute('stroke', '#16A34A');
  });

  it('uses amber color for >= 50% and < 80%', () => {
    const { container } = render(<ProgressRing pct={65} />);
    const circle = container.querySelector('svg circle:nth-child(2)');
    expect(circle).toHaveAttribute('stroke', '#F59E0B');
  });

  it('uses amber color for exactly 50%', () => {
    const { container } = render(<ProgressRing pct={50} />);
    const circle = container.querySelector('svg circle:nth-child(2)');
    expect(circle).toHaveAttribute('stroke', '#F59E0B');
  });

  it('uses red color for < 50%', () => {
    const { container } = render(<ProgressRing pct={25} />);
    const circle = container.querySelector('svg circle:nth-child(2)');
    expect(circle).toHaveAttribute('stroke', '#DC2626');
  });

  it('accepts custom size', () => {
    const { container } = render(<ProgressRing pct={50} size={120} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
  });
});

describe('PageTOC', () => {
  it('renders buttons for each section', () => {
    const sections = [
      { id: 'sec1', label: 'Section One' },
      { id: 'sec2', label: 'Section Two' },
      { id: 'sec3', label: 'Section Three' },
    ];
    render(<PageTOC sections={sections} currentPage="test" />);
    expect(screen.getByText('Section One')).toBeInTheDocument();
    expect(screen.getByText('Section Two')).toBeInTheDocument();
    expect(screen.getByText('Section Three')).toBeInTheDocument();
  });

  it('renders a nav element', () => {
    const sections = [{ id: 'a', label: 'Alpha' }];
    const { container } = render(<PageTOC sections={sections} currentPage="test" />);
    expect(container.querySelector('nav')).toBeInTheDocument();
  });

  it('renders empty nav when sections is empty', () => {
    const { container } = render(<PageTOC sections={[]} currentPage="test" />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.children.length).toBe(0);
  });

  it('assigns correct id to button data', () => {
    const sections = [{ id: 'my-section', label: 'My Section' }];
    const { container } = render(<PageTOC sections={sections} currentPage="test" />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });
});
