/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/a/:handle*",
        destination: "/api/a/:handle*",
      },
    ];
  },
};

module.exports = nextConfig;
