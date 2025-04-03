/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/triangle-centers-explorer' : '',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/triangle-centers-explorer/' : ''
}

module.exports = nextConfig 