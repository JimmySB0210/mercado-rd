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
  // next-pwa@5.6.0 es anterior al App Router de Next 13+ y no conoce
  // app-build-manifest.json: lo mete igual en el precache de Workbox
  // porque webpack lo emite en .next/, pero Next.js nunca lo sirve en
  // /_next/app-build-manifest.json (404). Eso hacía fallar el evento
  // "install" del SW completo (installing -> redundant sin activarse
  // nunca), que era la causa real de "Service Worker no disponible".
  buildExcludes: [/app-build-manifest\.json$/],
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
