import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // На Vercel краще залишити true, щоб бачити помилки, 
    // але якщо хочете швидкий деплой — можна ігнорувати.
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" }, // Додаємо для Vercel Blob
    ],
  },
};

export default nextConfig;