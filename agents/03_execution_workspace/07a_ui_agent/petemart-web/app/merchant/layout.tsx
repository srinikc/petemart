'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  Settings, QrCode, Store, ChevronLeft, LogOut,
  Menu, X, Bell, Star, MessageCircle
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/merchant/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/merchant/products', icon: Package },
  { label: 'Orders', href: '/merchant/orders', icon: ShoppingCart },
  { label: 'Analytics', href: '/merchant/analytics', icon: BarChart3 },
  { label: 'QR Code', href: '/merchant/qr', icon: QrCode },
  { label: 'Settings', href: '/merchant/settings', icon: Settings },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-pm-border transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-pm-border">
            <Link href="/merchant/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-pm-md bg-pm-gold flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="text-lg font-bold text-pm-burgundy">
                Pete<span className="text-pm-gold">Mart</span>
              </span>
            </Link>
            <p className="text-pm-tiny text-pm-text-secondary mt-1">Merchant Panel</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-pm-md text-pm-small transition-colors',
                    isActive
                      ? 'bg-pm-gold/10 text-pm-gold font-medium'
                      : 'text-pm-text-secondary hover:bg-muted hover:text-pm-text'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-pm-border">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-pm-md text-pm-small text-pm-text-secondary hover:bg-muted transition-colors">
                <Store className="w-5 h-5" />
                View Store (Customer)
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-4 py-3 rounded-pm-md text-pm-small text-pm-error hover:bg-red-50 transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </nav>

          {/* User */}
          {user && (
            <div className="p-4 border-t border-pm-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-pm-gold/10 text-pm-gold text-pm-small">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-pm-small font-medium truncate">{user.name}</p>
                  <p className="text-pm-tiny text-pm-text-secondary truncate">{user.phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-pm-border px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-pm-md hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-pm-text-secondary" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-pm-error rounded-full" />
            </button>
            <div className="flex items-center gap-2 text-pm-small text-pm-text-secondary">
              <Store className="w-4 h-4 text-pm-gold" />
              <span className="hidden sm:inline">Samskruti Silks</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
