// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Required for static export
  // Optional: if you use images
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
