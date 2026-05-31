'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import {
  LayoutDashboard, Store, ShoppingCart, BarChart3,
  Settings, Users, LogOut, Menu, Shield, Bell,
  CheckSquare, Tag
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Merchant Approvals', href: '/admin/merchants/approvals', icon: CheckSquare },
  { label: 'All Merchants', href: '/admin/merchants', icon: Store },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'System Config', href: '/admin/config', icon: Settings },
  { label: 'Promo Codes', href: '/admin/promos', icon: Tag },
  { label: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-800">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-pm-md bg-pm-gold flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="text-lg font-bold text-white">
                Pete<span className="text-pm-gold">Mart</span>
              </span>
            </Link>
            <p className="text-pm-tiny text-gray-500 mt-1">Admin Panel</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-pm-md text-pm-small transition-colors',
                    isActive
                      ? 'bg-pm-gold/10 text-pm-gold font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-gray-800">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-pm-md text-pm-small text-gray-400 hover:bg-gray-800 transition-colors">
                <Shield className="w-5 h-5" />
                View Public Site
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-4 py-3 rounded-pm-md text-pm-small text-pm-error hover:bg-red-900/20 transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </nav>

          {user && (
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-pm-gold/10 text-pm-gold text-pm-small">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-pm-small font-medium text-white truncate">{user.name}</p>
                  <p className="text-pm-tiny text-gray-500 truncate">Admin</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-gray-800 border-b border-gray-700 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-pm-md hover:bg-gray-700">
            <Menu className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 rounded-full hover:bg-gray-700 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-pm-error rounded-full" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 bg-gray-900 text-white">
          {children}
        </main>
      </div>
    </div>
  );
}
