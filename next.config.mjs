// Load environment variables (more flexible than dotenv-safe)
import dotenv from 'dotenv'
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' })
}
import withBundleAnalyzer from '@next/bundle-analyzer'

/*
<ai_context>
Configures Next.js for the app.
</ai_context>
*/

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "localhost" },
      { hostname: "www.youtube.com" },
      { hostname: "i.ytimg.com" },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year cache for static images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable static exports for better performance (if applicable)
  // trailingSlash: true,
  // output: 'export', // Only if you want static export
  
  // Optimize chunks and reduce bundle size
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Compress images and optimize assets
  compress: true,
  
  // Exclude mobile app directory from compilation
  webpack: (config, { isServer }) => {
    // Ignore mobile app directory during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/MeetMeHalfwayMobile/**', '**/node_modules/**'],
    };
    return config;
  },
}

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default bundleAnalyzer(nextConfig)
