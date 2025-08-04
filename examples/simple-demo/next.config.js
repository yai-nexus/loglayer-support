/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@yai-loglayer/next'],
}

module.exports = nextConfig
