/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // El sw.js generado por workbox no trae handlers de push por
  // defecto. next-pwa busca un archivo worker/index.js (esta
  // opción indica la carpeta) y lo importa dentro del sw.js
  // generado — ahí vive el addEventListener('push', ...).
  customWorkerDir: 'worker',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/ifjzittwvoggstjlmaph\.supabase\.co/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 }
      }
    }
  ]
})

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ifjzittwvoggstjlmaph.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
}

module.exports = withPWA(nextConfig)
