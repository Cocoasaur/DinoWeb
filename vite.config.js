import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/DinoWeb/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['dino-icon.webp', 'favicon.svg'],
      manifest: {
        name: 'DinoWeb — Interactive 3D Portfolio',
        short_name: 'DinoWeb',
        description: 'Interactive 3D portfolio',
        theme_color: '#002451',
        background_color: '#002451',
        display: 'standalone',
        start_url: '/DinoWeb/',
        scope: '/DinoWeb/',
        icons: [
          { src: '/DinoWeb/pwa-192x192.webp', sizes: '192x192', type: 'image/webp' },
          { src: '/DinoWeb/pwa-512x512.webp', sizes: '512x512', type: 'image/webp' },
        ],
      },
      workbox: {
        // Precache only the navigation shell. Versioned code and media enter
        // runtime caches when visitors actually request them instead of making
        // every first visit download the full portfolio in the background.
        globPatterns: ['**/*.{html,webmanifest}'],
        navigateFallback: '/DinoWeb/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.(?:js|mjs)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dinoweb-lazy-code',
              expiration: { maxEntries: 24, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\/assets\/.*\.(?:css|woff2|woff|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dinoweb-static-assets',
              expiration: { maxEntries: 48, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\.(webp|pdf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dinoweb-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
    cssTarget: 'chrome61',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Only React's core stays in the entry's cacheable vendor chunk.
          // PDF and Three.js dependencies follow their lazy import boundaries;
          // forcing react-pdf into a manual chunk made Vite preload it at startup.
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/react-dom/')) {
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  }
})
