/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Docker (apps/web/Dockerfile): gom server + đúng phần node_modules cần chạy vào .next/standalone
  output: 'standalone',
}

module.exports = nextConfig
