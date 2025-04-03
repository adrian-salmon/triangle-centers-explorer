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
  assetPrefix: '/triangle-centers-explorer/'
}

module.exports = nextConfig 