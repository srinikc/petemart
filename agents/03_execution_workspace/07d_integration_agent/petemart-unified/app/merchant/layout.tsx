import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header variant="merchant" />
      <main className="flex-1 bg-pm-bg">{children}</main>
      <Footer />
    </div>
  );
}
