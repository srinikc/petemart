'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials } from '@/lib/utils';
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  LayoutDashboard,
  LogOut,
  MapPin,
  ChevronDown,
  Store,
  Settings,
  BarChart3,
} from 'lucide-react';

interface HeaderProps {
  variant?: 'customer' | 'merchant' | 'admin';
}

export function Header({ variant = 'customer' }: HeaderProps) {
  const { user, isAuthenticated, signOut, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const customerLinks = [
    { label: 'Home', href: '/' },
    { label: 'Markets', href: '/markets/chickpet' },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, badge: 4 },
    { label: 'My Orders', href: '/orders' },
  ];

  const merchantLinks = [
    { label: 'Dashboard', href: '/merchant/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/merchant/products' },
    { label: 'Orders', href: '/merchant/orders' },
    { label: 'Analytics', href: '/merchant/analytics' },
    { label: 'Settings', href: '/merchant/settings' },
  ];

  const adminLinks = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Merchants', href: '/admin/merchants' },
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Analytics', href: '/admin/analytics' },
    { label: 'Config', href: '/admin/config' },
  ];

  const currentLinks = variant === 'customer' ? customerLinks
    : variant === 'merchant' ? merchantLinks
    : adminLinks;

  const navLabel = variant === 'customer' ? 'nav.home'
    : variant === 'merchant' ? 'Merchant Dashboard'
    : 'Admin';

  const roleLabel = role === 'customer' ? 'Customer'
    : role === 'merchant' ? 'Merchant'
    : role === 'admin' ? 'Admin' : 'Guest';

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-pm-border shadow-pm-sm">
      <div className="section-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={variant === 'customer' ? '/' : `/${variant}/dashboard`} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-pm-md bg-pm-gold flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="text-xl font-bold text-pm-burgundy hidden sm:block">
              Pete<span className="text-pm-gold">Mart</span>
            </span>
          </Link>

          {/* City Selector */}
          <div className="hidden md:flex items-center gap-1 text-pm-small text-pm-text-secondary">
            <MapPin className="w-4 h-4 text-pm-gold" />
            <span>Bangalore</span>
            <ChevronDown className="w-3 h-3" />
          </div>

          {/* Search Bar (customer only) */}
          {variant === 'customer' && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
                <Input
                  placeholder="Search products across Pete stores..."
                  className="pl-10 bg-pm-cream border-pm-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {variant === 'customer' ? (
              <>
                <Link href="/" className="px-3 py-2 text-pm-small text-pm-text-secondary hover:text-pm-gold transition-colors rounded-pm-md hover:bg-pm-gold/5">
                  Home
                </Link>
                <Link href="/markets/chickpet" className="px-3 py-2 text-pm-small text-pm-text-secondary hover:text-pm-gold transition-colors rounded-pm-md hover:bg-pm-gold/5">
                  Markets
                </Link>
                <Link href="/cart" className="px-3 py-2 text-pm-small text-pm-text-secondary hover:text-pm-gold transition-colors rounded-pm-md hover:bg-pm-gold/5 relative">
                  <ShoppingCart className="w-5 h-5" />
                  <Badge variant="default" className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] min-w-[18px] h-[18px]">
                    4
                  </Badge>
                </Link>
                <Link href="/orders" className="px-3 py-2 text-pm-small text-pm-text-secondary hover:text-pm-gold transition-colors rounded-pm-md hover:bg-pm-gold/5">
                  My Orders
                </Link>
              </>
            ) : (
              currentLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-pm-small text-pm-text-secondary hover:text-pm-gold transition-colors rounded-pm-md hover:bg-pm-gold/5"
                >
                  {link.label}
                </Link>
              ))
            )}

            {/* Auth / Profile */}
            {isAuthenticated && user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-pm-md hover:bg-muted transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-pm-gold/20 text-pm-gold text-pm-tiny">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
                    <p className="text-pm-small font-medium text-pm-text">{user.name}</p>
                    <p className="text-pm-tiny text-pm-text-secondary">{roleLabel}</p>
                  </div>
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-pm-lg border border-pm-border shadow-pm-lg z-20 py-2 animate-fade-in">
                      <div className="px-4 py-2 border-b border-pm-border">
                        <p className="text-pm-small font-medium">{user.name}</p>
                        <p className="text-pm-tiny text-pm-text-secondary">{user.phone}</p>
                      </div>
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-pm-small text-pm-text-secondary hover:bg-muted transition-colors" onClick={() => setProfileOpen(false)}>
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      {variant === 'customer' && role !== 'merchant' && (
                        <Link href="/merchant/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-pm-small text-pm-text-secondary hover:bg-muted transition-colors" onClick={() => setProfileOpen(false)}>
                          <Store className="w-4 h-4" /> Merchant Dashboard
                        </Link>
                      )}
                      {role === 'admin' && (
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-pm-small text-pm-text-secondary hover:bg-muted transition-colors" onClick={() => setProfileOpen(false)}>
                          <Settings className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => { setProfileOpen(false); signOut(); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-pm-small text-pm-error hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/auth">
                <Button variant="default" size="sm" className="ml-2">
                  Login / Register
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-pm-md hover:bg-muted"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-pm-border animate-slide-up">
          <div className="section-container py-4 space-y-3">
            {variant === 'customer' && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
                <Input placeholder="Search products..." className="pl-10 bg-pm-cream" />
              </div>
            )}
            {currentLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 text-pm-body text-pm-text-secondary hover:text-pm-gold rounded-pm-md hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon && <link.icon className="w-5 h-5" />}
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 text-pm-body text-pm-error w-full"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            ) : (
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="default" className="w-full">Login / Register</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
