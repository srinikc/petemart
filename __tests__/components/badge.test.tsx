import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-pm-gold');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText('Secondary')).toHaveClass('bg-pm-cream');
  });

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('bg-pm-error');
  });

  it('renders with outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toHaveClass('border-pm-border');
  });

  it('renders with buy variant', () => {
    render(<Badge variant="buy">Buy Now</Badge>);
    expect(screen.getByText('Buy Now')).toHaveClass('bg-green-100');
  });

  it('renders with whatsapp variant', () => {
    render(<Badge variant="whatsapp">WhatsApp</Badge>);
    expect(screen.getByText('WhatsApp')).toHaveClass('bg-green-50');
  });

  it('renders with visit variant', () => {
    render(<Badge variant="visit">Visit Store</Badge>);
    expect(screen.getByText('Visit Store')).toHaveClass('bg-blue-100');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });
});
