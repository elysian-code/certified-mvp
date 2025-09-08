/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    unoptimized: true, // Added unoptimized option
  },

  // Compression
  compress: true,

  // Power by header removal
  poweredByHeader: false,

  // Redirects for common routes
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/employee',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'user_role',
            value: 'employee',
          },
        ],
      },
      {
        source: '/dashboard',
        destination: '/dashboard/organization',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'user_role',
            value: 'organization_admin',
          },
        ],
      },
    ]
  },

  // ESLint and TypeScript configurations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
