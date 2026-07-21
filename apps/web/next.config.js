/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone needs symlinks; Windows without Developer Mode hits EPERM.
  // Set FORCE_STANDALONE=1 (or non-Windows) for Docker/production images.
  ...(process.platform === 'win32' && process.env.FORCE_STANDALONE !== '1'
    ? {}
    : { output: 'standalone' }),
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/backend/:path*',
        destination: `${api}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
