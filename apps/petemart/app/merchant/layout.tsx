import React from 'react';
import { Header } from '@productforge/ui';
import { Footer } from '@productforge/ui';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header variant="merchant" />
      <main className="flex-1 bg-pm-bg">{children}</main>
      <Footer />
    </div>
  );
}
