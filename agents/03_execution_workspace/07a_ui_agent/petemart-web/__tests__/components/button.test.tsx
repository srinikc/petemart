import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with default variant', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-pm-gold');
  });

  it('renders with mode variants', () => {
    const { rerender } = render(<Button variant="mode-buy">Buy Now</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-mode-buy');

    rerender(<Button variant="mode-whatsapp">WhatsApp</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-mode-whatsapp');

    rerender(<Button variant="mode-visit">Visit Store</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-mode-visit');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12');

    rerender(<Button size="xl">XLarge</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-14');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
