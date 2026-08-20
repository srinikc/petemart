import React from 'react';
import { Header } from '@productforge/ui';
import { Footer } from '@productforge/ui';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header variant="customer" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
