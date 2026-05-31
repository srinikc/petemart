import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'PeteMart - Old Bangalore\'s Pete Markets at Your Doorstep',
  description: 'Shop from 5,000+ traditional merchants across Chickpet, Balepet, Raja Market and more. Buy Now, Enquire on WhatsApp, or Visit Store.',
  keywords: 'Bangalore markets, Chickpet, Balepet, Indian e-commerce, hyperlocal, traditional merchants',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-accent font-inter antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#FFF8EE', border: '1px solid #E0E0E0', color: '#2D2D2D' },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
