/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://apex-health-ai-backend.vercel.app/api/:path*'
      }
    ];
  }
};

module.exports = nextConfig;
