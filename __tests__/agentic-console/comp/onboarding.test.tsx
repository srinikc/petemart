import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EnterpriseOnboardingCockpit from '@/app/agentic-console/onboarding/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/agentic-console/onboarding',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe('EnterpriseOnboardingCockpit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders 3-step wizard stepper on initial load (step 1)', () => {
    render(<EnterpriseOnboardingCockpit />);
    expect(screen.getByText('Concept')).toBeInTheDocument();
    expect(screen.getByText('Integration')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Describe your product idea')).toBeInTheDocument();
  });

  it('step 1: validates that textarea is required before proceeding', () => {
    render(<EnterpriseOnboardingCockpit />);
    const button = screen.getByRole('button', { name: /Build Strategy/ });
    expect(button).toBeDisabled();
  });

  it('step 1: enables proceed button when idea text is entered', () => {
    render(<EnterpriseOnboardingCockpit />);
    const textarea = screen.getByPlaceholderText(/multi-tenant B2B marketplace/);
    act(() => { fireEvent.change(textarea, { target: { value: 'My new product idea' } }); });
    const button = screen.getByText('Build Strategy');
    expect(button).not.toBeDisabled();
  });

  it('step 2: shows billing model selection after progressing from step 1', () => {
    render(<EnterpriseOnboardingCockpit />);
    const textarea = screen.getByPlaceholderText(/multi-tenant B2B marketplace/);
    act(() => { fireEvent.change(textarea, { target: { value: 'My idea' } }); });
    act(() => { fireEvent.click(screen.getByText('Build Strategy')); });
    expect(screen.getByText('Infrastructure & Governance')).toBeInTheDocument();
    expect(screen.getByText('Enterprise BYOK')).toBeInTheDocument();
    expect(screen.getByText('Managed SaaS')).toBeInTheDocument();
  });

  it('step 4: shows completion state with live logs after form submission', () => {
    render(<EnterpriseOnboardingCockpit />);
    // Fill step 1 and proceed
    const textarea = screen.getByPlaceholderText(/multi-tenant B2B marketplace/);
    act(() => { fireEvent.change(textarea, { target: { value: 'My idea' } }); });
    act(() => { fireEvent.click(screen.getByText('Build Strategy')); });

    // Step 2 → proceed to step 3
    act(() => { fireEvent.click(screen.getByText('Review Pipeline')); });

    // Step 3 → launch
    act(() => { fireEvent.click(screen.getByText('DISPATCH AUTONOMOUS PIPELINE')); });

    // Fast-forward past loading
    act(() => { vi.advanceTimersByTime(2500); });

    expect(screen.getByText('PIPELINE LIVE')).toBeInTheDocument();
    expect(screen.getByText(/Silk Road Marketplace/)).toBeInTheDocument();
  });
});
