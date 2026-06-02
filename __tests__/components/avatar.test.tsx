import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

describe('Avatar Component', () => {
  it('renders avatar wrapper with children', () => {
    render(<Avatar data-testid="avatar"><AvatarFallback>JD</AvatarFallback></Avatar>);
    const avatar = screen.getByTestId('avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('rounded-full');
  });

  it('renders fallback with initials', () => {
    render(<Avatar><AvatarFallback>PM</AvatarFallback></Avatar>);
    expect(screen.getByText('PM')).toBeInTheDocument();
    expect(screen.getByText('PM')).toHaveClass('text-pm-gold');
  });

  it('renders image when src provided', () => {
    render(<Avatar><AvatarImage src="/test.jpg" alt="Test User" /></Avatar>);
    const img = screen.getByAltText('Test User');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.jpg');
  });

  it('applies custom className to avatar', () => {
    render(<Avatar className="w-16 h-16" data-testid="avatar"><AvatarFallback>AB</AvatarFallback></Avatar>);
    expect(screen.getByTestId('avatar')).toHaveClass('w-16', 'h-16');
  });

  it('renders fallback when both image and fallback provided', () => {
    render(<Avatar><AvatarImage src="/test.jpg" alt="User" /><AvatarFallback>FK</AvatarFallback></Avatar>);
    expect(screen.getByText('FK')).toBeInTheDocument();
  });
});
