/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimentální funkce pro rychlejší navigaci
  experimental: {
    // Povolení View Transitions API
    viewTransitions: true,
    // Aggressive prefetching
    optimizePackageImports: ['lucide-react'],
    // Turbo mode pro rychlejší rebuilding
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Compiler optimalizace
  compiler: {
    // Odstraní console.log v produkci
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Webpack optimalizace
  webpack: (config, { dev, isServer }) => {
    // Optimalizace pro development
    if (dev) {
      config.devtool = 'eval-cheap-module-source-map'
    }

    // Optimalizace bundlu
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
          },
        },
      },
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

  // PWA-like chování
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
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Zrychlení buildu
  typescript: {
    // Ignoruj TypeScript errory při buildu (pouze pro rychlost)
    // ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
