/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/a/:slug*",
        destination: "/api/a/:slug*",
      },
    ];
  },
};

module.exports = nextConfig;
