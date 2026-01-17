/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async redirects() {
    return [
      {
        source: '/a/:slug*',
        destination: '/api/a/:slug*',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig