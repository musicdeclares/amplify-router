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
  async redirects() {
    return [
      {
        source: "/admin/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/admin/forgot-password",
        destination: "/forgot-password",
        permanent: true,
      },
      {
        source: "/admin/reset-password",
        destination: "/reset-password",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
