import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/Header';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, role: null, signOut: vi.fn(), loading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

describe('Header Component', () => {
  it('renders customer variant with navigation links', () => {
    render(<Header variant="customer" />);
    expect(screen.getByText('Pete')).toBeInTheDocument();
    expect(screen.getByText('Mart')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Markets')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<Header variant="customer" />);
    const searchInput = screen.getByPlaceholderText('Search products across Pete stores...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders merchant variant with merchant links', () => {
    render(<Header variant="merchant" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders admin variant with admin links', () => {
    render(<Header variant="admin" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
