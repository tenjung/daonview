import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/c/:id',
        destination: '/campaigns/:id',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'whpyftpktolpaspeuocg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.pstatic.net', // Naver Blog Images
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com', // Instagram Images
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google User Images
      },
    ],
  },
};

export default nextConfig;
