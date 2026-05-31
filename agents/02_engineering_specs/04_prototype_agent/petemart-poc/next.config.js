/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['petemart-poc.vercel.app'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
