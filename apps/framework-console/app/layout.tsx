import type { Metadata } from 'next';
import '@/styles/globals.css';
import { getPlatformConfig } from '@productforge/shared';

export const dynamic = 'force-dynamic';

const platform = getPlatformConfig();

export const metadata: Metadata = {
  title: `${platform.appName} — ${platform.consoleTitle}`,
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
      <body className="min-h-screen bg-accent font-inter antialiased">{children}</body>
    </html>
  );
}