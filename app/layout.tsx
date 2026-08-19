import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { getPlatformConfig } from '@/lib/platform-config';

const platform = getPlatformConfig();

export const metadata: Metadata = {
  title: `${platform.appName} — ${platform.appTagline}`,
  description: platform.projectDescription,
  keywords: 'agentic pipeline, AI orchestration, product studio, autonomous SDLC, multi-agent framework',
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
