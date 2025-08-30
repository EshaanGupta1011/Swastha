/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true, // Add this line to disable image optimization
  },
};

module.exports = nextConfig;
