/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep Puppeteer (headless Chrome) external — it must not be bundled by Next.
    serverComponentsExternalPackages: ["puppeteer"],
  },
};

module.exports = nextConfig;
