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
    remotePatterns: [{ hostname: "localhost" }]
  }
}

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default bundleAnalyzer(nextConfig)
