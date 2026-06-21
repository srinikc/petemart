import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Ignore runtime state/agent directories from hot-reload watching.
      // The daemon writes STATE_MATRIX.json every 2s which triggers
      // full Webpack recompilation and locks the dev server.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/00_state_ledger/**',
          '**/agents/**',
          '**/logs/**',
          '**/oldartifacts/**',
          '**/context_lake/**',
        ],
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
};

export default nextConfig;
