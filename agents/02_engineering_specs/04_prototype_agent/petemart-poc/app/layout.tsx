import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PeteMart — Bringing Old Bangalore\'s Pete Markets to Your Doorstep',
  description: 'Discover and shop from 9 pilot merchants across Chickpet and Balepet markets. Direct purchase, WhatsApp enquiry, or visit store.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SiteHeader />
        <main className="min-h-screen">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="bg-pm-surface border-b border-pm-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pm-primary to-pm-secondary flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold" style={{ color: '#C8A45C' }}>PeteMart</span>
          </a>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-sm font-medium text-pm-text hover:text-pm-primary transition-colors">Home</a>
            <div className="relative group">
              <button className="text-sm font-medium text-pm-text hover:text-pm-primary transition-colors flex items-center gap-1">
                Markets
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-pm-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <a href="/?market=chickpet" className="block px-4 py-2 text-sm hover:bg-pm-background rounded-t-lg">Chickpet</a>
                <a href="/?market=balepet" className="block px-4 py-2 text-sm hover:bg-pm-background rounded-b-lg">Balepet</a>
              </div>
            </div>
            <a href="/cart" className="text-sm font-medium text-pm-text hover:text-pm-primary transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              Cart
            </a>
            <a href="/merchant/dashboard" className="text-sm font-medium text-pm-text hover:text-pm-primary transition-colors">Sell</a>
          </nav>

          {/* Auth */}
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 rounded-lg border border-pm-primary text-pm-primary text-sm font-medium hover:bg-pm-primary hover:text-white transition-colors">
              Log In
            </button>
            <a href="/merchant/dashboard" className="px-4 py-2 rounded-lg bg-pm-primary text-white text-sm font-medium hover:bg-pm-primary-dark transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-pm-secondary text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pm-primary to-white flex items-center justify-center">
                <span className="text-pm-secondary font-bold text-xs">P</span>
              </div>
              PeteMart
            </h3>
            <p className="text-sm opacity-80">Bringing Old Bangalore&apos;s Pete Markets to Your Doorstep. Shop from 9 pilot merchants across Chickpet and Balepet.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="/" className="hover:opacity-100">Home</a></li>
              <li><a href="/?market=chickpet" className="hover:opacity-100">Chickpet</a></li>
              <li><a href="/?market=balepet" className="hover:opacity-100">Balepet</a></li>
              <li><a href="/cart" className="hover:opacity-100">Cart</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">For Merchants</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><a href="/merchant/dashboard" className="hover:opacity-100">Seller Dashboard</a></li>
              <li><a href="/merchant/products" className="hover:opacity-100">Manage Products</a></li>
              <li><a href="/merchant/orders" className="hover:opacity-100">Orders</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>support@petemart.com</li>
              <li>Bengaluru, Karnataka</li>
              <li className="flex space-x-2 mt-2">
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs cursor-pointer hover:bg-white/30">IG</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs cursor-pointer hover:bg-white/30">FB</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs cursor-pointer hover:bg-white/30">WA</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm opacity-60">
          &copy; 2026 PeteMart. POC v0.1 — Built for 9 Pilot Merchants. Zero-Cost Infrastructure.
        </div>
      </div>
    </footer>
  );
}
