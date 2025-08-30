/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true, // Required because Netlify can't run image optimization
  },
};

export default nextConfig;
