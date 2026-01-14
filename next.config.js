/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [
    '@nextui-org/react',
    '@nextui-org/system',
    '@nextui-org/theme',
    '@nextui-org/button',
    '@nextui-org/input',
    '@nextui-org/select',
  ],
}

module.exports = nextConfig
