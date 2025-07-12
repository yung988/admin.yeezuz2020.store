import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Experimentální funkce pro rychlejší navigaci
  experimental: {
    // Aggressive prefetching (optimizePackageImports je podporováno v Next.js 15)
    optimizePackageImports: ['lucide-react'],
  },

  // Compiler optimalizace
  compiler: {
    // Odstraní console.log v produkci
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack optimalizace
  webpack: (config, { isServer }) => {
    // Fix pro 'self is not defined' error
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    return config
  },

  // Optimalizace obrázků
  images: {
    // Formáty pro lepší kompresi
    formats: ['image/webp', 'image/avif'],
    // Cache obrázků
    minimumCacheTTL: 86400, // 24 hodin
    // Povolené domény (přidej podle potřeby)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https', 
        hostname: '**.supabase.in',
      },
    ],
  },

  // Security headers
  headers: async () => {
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
          // Cache statické soubory
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Produkční optimalizace
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Build konfigurace pro produkci
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    // Ignoruj TypeScript errory při buildu pouze v produkci
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig
