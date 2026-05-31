'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const merchantNav = [
  { href: '/merchant/dashboard', label: 'Dashboard' },
  { href: '/merchant/products', label: 'Products' },
  { href: '/merchant/orders', label: 'Orders' },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-pm-text">Merchant Dashboard</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-pm-primary/10 text-pm-primary font-medium">Pilot Access</span>
      </div>
      <nav className="flex gap-1 mb-8 border-b border-pm-border overflow-x-auto">
        {merchantNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              pathname === item.href
                ? 'border-pm-primary text-pm-primary'
                : 'border-transparent text-pm-text-secondary hover:text-pm-text'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
