/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/triangle-centers-explorer',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true
  },
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH
}

module.exports = nextConfig 