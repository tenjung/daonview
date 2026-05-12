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
    minimumCacheTTL: 604800,
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
      {
        protocol: 'https',
        hostname: 'i.ytimg.com', // YouTube thumbnails
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com', // YouTube profile / channel images
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net', // Instagram / Facebook CDN images
      },
    ],
  },
};

export default nextConfig;
